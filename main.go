package main

import (
	"context"
	"flag"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"github.com/antiartificial/contextdb/pkg/client"
	"github.com/antiartificial/context-kitchen-sink/internal/api"
	"github.com/antiartificial/context-kitchen-sink/internal/seed"
)

func main() {
	var (
		dev      = flag.Bool("dev", false, "Run in development mode (frontend served separately)")
		addr     = flag.String("addr", ":8080", "Server address")
		password = flag.String("password", os.Getenv("PLAYGROUND_PASSWORD"), "API password")
	)
	flag.Parse()

	if *password == "" {
		*password = "contextdb"
	}

	log.Println("Opening embedded contextdb...")
	db := client.MustOpen(client.Options{VectorDimensions: 128})
	defer db.Close()

	log.Println("Seeding database...")
	if err := seed.SeedAll(db); err != nil {
		log.Fatalf("Seed error: %v\n", err)
	}

	log.Println("Setting up API router...")
	router := api.NewRouter(db, *password)

	var handler http.Handler
	if *dev {
		log.Println("Running in DEVELOPMENT mode (frontend served by Vite)")
		handler = router
	} else {
		log.Println("Running in PRODUCTION mode (serving bundled frontend)")
		handler = withStaticFiles(router)
	}

	server := &http.Server{
		Addr:    *addr,
		Handler: handler,
	}

	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer cancel()

	go func() {
		log.Printf("Server listening on %s\n", *addr)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v\n", err)
		}
	}()

	<-ctx.Done()
	log.Println("Shutting down gracefully...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Printf("Shutdown error: %v\n", err)
	}
	log.Println("Server stopped")
}

func withStaticFiles(apiRouter http.Handler) http.Handler {
	distDir := "./frontend/dist"
	fs := http.FileServer(http.Dir(distDir))

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api" || len(r.URL.Path) > 4 && r.URL.Path[:5] == "/api/" {
			apiRouter.ServeHTTP(w, r)
			return
		}

		// HTML pages: no cache. Hashed assets (JS/CSS): immutable cache.
		if r.URL.Path == "/" || r.URL.Path == "/index.html" {
			w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
			http.ServeFile(w, r, filepath.Join(distDir, "index.html"))
			return
		}

		path := filepath.Join(distDir, r.URL.Path)
		if _, err := os.Stat(path); os.IsNotExist(err) {
			w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
			http.ServeFile(w, r, filepath.Join(distDir, "index.html"))
			return
		}
		fs.ServeHTTP(w, r)
	})
}
