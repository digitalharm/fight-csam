// hashstreamd is the HashStream daemon binary.
//
// Boots the HTTP server backed by the configured storage backend.
// Scaffold stage uses the in-memory store; production binds an
// object-storage backend per operator config.
package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/digitalharm/digitalharm-oss/packages/hashstream/internal/server"
	"github.com/digitalharm/digitalharm-oss/packages/hashstream/internal/store"
)

func main() {
	addr := os.Getenv("HASHSTREAM_ADDR")
	if addr == "" {
		addr = ":8080"
	}

	s := store.NewInMemoryStore()
	handler := server.New(s).Handler()

	httpServer := &http.Server{
		Addr:              addr,
		Handler:           handler,
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      60 * time.Second,
		IdleTimeout:       120 * time.Second,
	}

	go func() {
		log.Printf("hashstreamd listening on %s (in-memory store; scaffold stage)", addr)
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
