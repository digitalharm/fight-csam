// evidencevaultd is the EvidenceVault daemon binary.
//
// Scaffold stage: boots an in-memory vault and prints a startup banner.
// The HTTP API surface lands once counsel review of
// packages/evidencevault/docs/counsel-scope-brief.md completes.
package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/digitalharm/digitalharm-oss/packages/evidencevault/internal/vault"
)

func main() {
	v := vault.NewInMemoryVault(time.Now)
	_ = v // wire HTTP server here once counsel scope is approved

	log.Println("evidencevaultd: scaffold stage. HTTP server not yet wired.")
	log.Println("evidencevaultd: see docs/roadmap.md for status; docs/counsel-scope-brief.md for the gating review.")

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	<-sigCh

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_ = ctx
	log.Println("evidencevaultd: shutdown")
}
