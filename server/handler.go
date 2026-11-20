package main

import (
	"fmt"
	"io/fs"
	"net/http"
	"os"
	"path"
	"strconv"
	"strings"
	"time"
)

const (
	indexFile  = "index.html"
	healthPath = "/api/healthz"
)

// statusRecorder captures the status code written to the client.
type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (s *statusRecorder) WriteHeader(code int) {
	s.status = code
	s.ResponseWriter.WriteHeader(code)
}

// NewHandler returns the http.Handler serving root (an fs.FS). It accepts GET
// and HEAD only, answers 404 for the reserved prefix before any other routing,
// serves /api/healthz from a one-byte read of index.html, and never falls back
// to index.html for unmatched paths.
func NewHandler(root fs.FS) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
		serve(rec, r, root)
		fmt.Fprintln(os.Stdout, RedactedLogLine(r.Method, r.URL.EscapedPath(), rec.status, time.Since(start)))
	})
}

func plain(w http.ResponseWriter, code int, msg string) {
	h := w.Header()
	h.Set("Content-Type", "text/plain; charset=utf-8")
	h.Set("Cache-Control", noCache)
	h.Set("X-Content-Type-Options", "nosniff")
	w.WriteHeader(code)
	_, _ = w.Write([]byte(msg + "\n"))
}

func notFound(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodHead {
		h := w.Header()
		h.Set("Content-Type", "text/plain; charset=utf-8")
		h.Set("Cache-Control", noCache)
		w.WriteHeader(http.StatusNotFound)
		return
	}
	plain(w, http.StatusNotFound, "not found")
}

func serve(w http.ResponseWriter, r *http.Request, root fs.FS) {
	urlPath := r.URL.Path

	// Reserved prefix is checked first, for every method.
	if IsReserved(urlPath) {
		notFound(w, r)
		return
	}

	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		w.Header().Set("Allow", "GET, HEAD")
		plain(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	if urlPath == healthPath {
		health(w, r, root)
		return
	}

	// Reject traversal before cleaning so ".." can never be resolved away.
	if strings.Contains(urlPath, "..") || strings.ContainsRune(urlPath, 0) || strings.Contains(urlPath, "\\") {
		notFound(w, r)
		return
	}
	clean := path.Clean("/" + urlPath)
	if IsReserved(clean) {
		notFound(w, r)
		return
	}
	rel := strings.TrimPrefix(clean, "/")
	if rel == "" {
		rel = indexFile
	}
	if !fs.ValidPath(rel) {
		notFound(w, r)
		return
	}

	info, err := fs.Stat(root, rel)
	if err != nil || info.IsDir() {
		notFound(w, r)
		return
	}
	data, err := fs.ReadFile(root, rel)
	if err != nil {
		notFound(w, r)
		return
	}

	h := w.Header()
	h.Set("Content-Type", ContentType(rel))
	h.Set("Cache-Control", CacheControl(rel))
	h.Set("X-Content-Type-Options", "nosniff")
	h.Set("Content-Length", strconv.Itoa(len(data)))
	w.WriteHeader(http.StatusOK)
	if r.Method != http.MethodHead {
		_, _ = w.Write(data)
	}
}

// health reads one byte of index.html on every request: 200 if readable, else 503.
func health(w http.ResponseWriter, r *http.Request, root fs.FS) {
	f, err := root.Open(indexFile)
	if err == nil {
		defer f.Close()
		buf := make([]byte, 1)
		var n int
		n, err = f.Read(buf)
		if n == 1 {
			err = nil
		}
	}
	if err != nil {
		plain(w, http.StatusServiceUnavailable, "unavailable")
		return
	}
	plain(w, http.StatusOK, "ok")
}
