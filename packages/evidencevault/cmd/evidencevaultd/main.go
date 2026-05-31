// evidencevaultd is the EvidenceVault daemon binary.
//
// v0.5: serves the custody/retention lifecycle over HTTP, backed by either an
// in-memory store (CI, small deployments) or a disk store that persists each
// evidence package as <store_dir>/<id>.json and survives restarts. Encryption
// is operator-supplied via the KMS seam; v0.5 ships a noop-KMS that stores the
// operator's ciphertext as given (see README).
//
// IMPORTANT: retention schedules are QUERYABLE but NOT ENFORCED. There is no
// automatic timer-driven destruction — GET /expired reports what *would* be
// eligible, and destruction is an explicit, audited DELETE. Timer enforcement
// is gated on counsel review (docs/counsel-scope-brief.md).
package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/digitalharm/digitalharm-oss/packages/evidencevault/internal/vault"
)

func main() {
	if err := run(os.Args[1:]); err != nil {
		log.Fatalf("evidencevaultd: %v", err)
	}
}

func run(args []string) error {
	// Subcommand dispatch. "serve" is the only verb today; bare invocation
	// prints usage so operators discover it.
	if len(args) == 0 {
		usage()
		return nil
	}
	switch args[0] {
	case "serve":
		return runServe(args[1:])
	case "-h", "--help", "help":
		usage()
		return nil
	default:
		usage()
		return fmt.Errorf("unknown command %q", args[0])
	}
}

func usage() {
	fmt.Fprintf(os.Stderr, `evidencevaultd — EvidenceVault daemon

Usage:
  evidencevaultd serve [--store=<spec>] [--addr=<host:port>]

Flags:
  --store   storage backend. One of:
              memory::            in-memory (non-persistent; CI / dev)
              disk:/path/to/dir   file-backed, one JSON file per package
            (default: memory::)
  --addr    listen address (default: 127.0.0.1:8080)

Retention schedules are queryable but NOT enforced in this build; timer-driven
destruction is gated on counsel review. See the README.
`)
}

func runServe(args []string) error {
	fs := flag.NewFlagSet("serve", flag.ContinueOnError)
	storeSpec := fs.String("store", "memory::", "storage backend: memory:: or disk:/path")
	addr := fs.String("addr", "127.0.0.1:8080", "listen address host:port")
	if err := fs.Parse(args); err != nil {
		return err
	}

	v, desc, err := openVault(*storeSpec)
	if err != nil {
		return err
	}

	srv := newServer(v, time.Now)
	httpSrv := &http.Server{
		Addr:              *addr,
		Handler:           srv.routes(),
		ReadHeaderTimeout: 10 * time.Second,
	}

	// Graceful shutdown on SIGINT/SIGTERM.
	idleClosed := make(chan struct{})
	go func() {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
		<-sigCh
		log.Println("evidencevaultd: shutting down")
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := httpSrv.Shutdown(ctx); err != nil {
			log.Printf("evidencevaultd: shutdown error: %v", err)
		}
		close(idleClosed)
	}()

	log.Printf("evidencevaultd: serving %s on http://%s", desc, *addr)
	log.Printf("evidencevaultd: retention schedules are QUERYABLE but NOT ENFORCED (counsel review pending)")
	if err := httpSrv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		return err
	}
	<-idleClosed
	log.Println("evidencevaultd: stopped")
	return nil
}

// openVault parses a --store spec and returns the corresponding Vault plus a
// human-readable description for the startup banner.
//
// Specs:
//
//	memory::         -> in-memory vault
//	disk:/some/path  -> disk vault rooted at /some/path
func openVault(spec string) (vault.Vault, string, error) {
	scheme, target, found := strings.Cut(spec, ":")
	if !found {
		return nil, "", fmt.Errorf("invalid --store %q: expected memory:: or disk:/path", spec)
	}
	switch scheme {
	case "memory":
		return vault.NewInMemoryVault(time.Now), "in-memory store", nil
	case "disk":
		// target is everything after "disk:"; for "disk:/var/x" that's "/var/x",
		// and the leading "/" is preserved. A leading ":" (disk::/x) is tolerated.
		dir := strings.TrimPrefix(target, ":")
		if dir == "" {
			return nil, "", errors.New("disk store requires a path, e.g. --store=disk:/var/lib/evidencevault")
		}
		dv, err := vault.NewDiskVault(dir, time.Now)
		if err != nil {
			return nil, "", err
		}
		return dv, fmt.Sprintf("disk store at %s", dir), nil
	default:
		return nil, "", fmt.Errorf("unknown store scheme %q (want memory or disk)", scheme)
	}
}
