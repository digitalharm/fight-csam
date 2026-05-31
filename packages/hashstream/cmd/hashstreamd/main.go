// hashstreamd is the HashStream daemon binary.
//
// Boots the HTTP server backed by the configured storage backend. The
// in-memory store is sufficient for operator-supplied ("local") snapshots and
// CI; credentialed-upstream deployments swap in a persistent backend.
//
// Flags:
//
//	--addr          listen address (default $HASHSTREAM_ADDR or ":8080")
//	--signing-key   path to an Ed25519 private key (PKCS#8 PEM, raw 64-byte
//	                key, or raw 32-byte seed). When set, every stored snapshot
//	                is signed and its signature is served on GET.
package main

import (
	"context"
	"errors"
	"flag"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/digitalharm/digitalharm-oss/packages/hashstream/internal/server"
	"github.com/digitalharm/digitalharm-oss/packages/hashstream/internal/signing"
	"github.com/digitalharm/digitalharm-oss/packages/hashstream/internal/store"
)

func main() {
	defaultAddr := os.Getenv("HASHSTREAM_ADDR")
	if defaultAddr == "" {
		defaultAddr = ":8080"
	}

	addr := flag.String("addr", defaultAddr, "listen address")
	signingKeyPath := flag.String("signing-key", os.Getenv("HASHSTREAM_SIGNING_KEY"),
		"path to an Ed25519 private key (PEM/raw/seed); when set, snapshots are signed")
	flag.Parse()

	var opts []server.Option
	if *signingKeyPath != "" {
		signer, err := signing.LoadSignerFromFile(*signingKeyPath)
		if err != nil {
			log.Fatalf("hashstream: load signing key: %v", err)
		}
		opts = append(opts, server.WithSigner(signer))
		log.Printf("hashstream: snapshot signing enabled (key id %s)", signer.KeyID())
	}

	s := store.NewInMemoryStore()
	handler := server.New(s, opts...).Handler()

	httpServer := &http.Server{
		Addr:              *addr,
		Handler:           handler,
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      60 * time.Second,
		IdleTimeout:       120 * time.Second,
	}

	go func() {
		log.Printf("hashstreamd listening on %s (in-memory store)", *addr)
		if err := httpServer.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("server: %v", err)
		}
	}()

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	<-sigCh

	log.Println("shutdown initiated")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := httpServer.Shutdown(ctx); err != nil {
		log.Printf("shutdown: %v", err)
	}
}
