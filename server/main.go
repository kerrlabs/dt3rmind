// Command server is the static App_Server for the Dt3rmind SPA.
package main

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"os/signal"
	"path"
	"regexp"
	"strconv"
	"strings"
	"syscall"
	"time"
)

const (
	minPort        = 1025
	maxPort        = 65535
	reservedPrefix = "/_iavm"
	immutableCache = "public, max-age=31536000, immutable"
	noCache        = "no-cache"
)

// hashedName matches a file stem ending in "-" plus 8 or more hash characters
// (Vite's default content-hash format).
var hashedName = regexp.MustCompile(`-[A-Za-z0-9_]{8,}$`)

// ParsePort accepts exactly the canonical decimal strings "1025".."65535":
// ASCII digits only, no sign, whitespace, decimal point, or leading zeros.
func ParsePort(s string) (int, error) {
	fail := func() (int, error) {
		return 0, fmt.Errorf("APP_PORT must be a decimal integer from %d to %d", minPort, maxPort)
	}
	if len(s) < 4 || len(s) > 5 || s[0] == '0' {
		return fail()
	}
	for i := 0; i < len(s); i++ {
		if s[i] < '0' || s[i] > '9' {
			return fail()
		}
	}
	p, err := strconv.Atoi(s)
	if err != nil || p < minPort || p > maxPort {
		return fail()
	}
	return p, nil
}

// ListenAddr returns "127.0.0.1:<port>". It is the only address the server binds.
func ListenAddr(port int) string {
	return "127.0.0.1:" + strconv.Itoa(port)
}

// IsReserved reports whether a URL path is "/_iavm" or begins with "/_iavm/".
func IsReserved(urlPath string) bool {
	return urlPath == reservedPrefix || strings.HasPrefix(urlPath, reservedPrefix+"/")
}

// CacheControl returns the Cache-Control value for a served file path
// (relative, slash-separated). Hashed files under assets/ are immutable;
// everything else is no-cache.
func CacheControl(rel string) string {
	rel = strings.TrimPrefix(rel, "/")
	if !strings.HasPrefix(rel, "assets/") {
		return noCache
	}
	base := path.Base(rel)
	stem := strings.TrimSuffix(base, path.Ext(base))
	if hashedName.MatchString(stem) {
		return immutableCache
	}
	return noCache
}

// ContentType returns the MIME type for a file by extension.
func ContentType(rel string) string {
	switch strings.ToLower(path.Ext(rel)) {
	case ".html":
		return "text/html; charset=utf-8"
	case ".js":
		return "text/javascript"
	case ".css":
		return "text/css"
	case ".svg":
		return "image/svg+xml"
	case ".json":
		return "application/json"
	default:
		return "application/octet-stream"
	}
}

// RedactedLogLine formats a request log entry from method, path, status and
// duration only. It takes no headers, so identity header values cannot appear.
func RedactedLogLine(method, path string, status int, d time.Duration) string {
	return fmt.Sprintf("%s %s %d %s", method, path, status, d)
}

const (
	servRoot        = "/srv"
	shutdownTimeout = 20 * time.Second
)

// run starts the server and blocks until ctx is cancelled (signal) or serving
// fails. It returns the process exit code: 2 for an invalid APP_PORT, 1 for a
// missing index.html, bind failure or drain timeout, 0 after a clean drain.
// onListen, if non-nil, is called with the bound address once listening.
func run(ctx context.Context, appPort, root string, deadline time.Duration, stderr io.Writer, onListen func(net.Addr)) int {
	port, err := ParsePort(appPort)
	if err != nil {
		fmt.Fprintln(stderr, err)
		return 2
	}

	rootFS := os.DirFS(root)
	f, err := rootFS.Open(indexFile)
	if err != nil {
		fmt.Fprintf(stderr, "cannot open %s/%s: %v\n", root, indexFile, err)
		return 1
	}
	f.Close()

	// Single listener, loopback only, no fallback address.
	ln, err := net.Listen("tcp4", ListenAddr(port))
	if err != nil {
		fmt.Fprintf(stderr, "bind failed: %v\n", err)
		return 1
	}
	if onListen != nil {
		onListen(ln.Addr())
	}

	srv := &http.Server{Handler: NewHandler(rootFS)}
	serveErr := make(chan error, 1)
	go func() { serveErr <- srv.Serve(ln) }()

	select {
	case err := <-serveErr:
		if err != nil && !errors.Is(err, http.ErrServerClosed) {
			fmt.Fprintf(stderr, "serve failed: %v\n", err)
			return 1
		}
		return 0
	case <-ctx.Done():
	}

	// Shutdown closes the listener at once, then waits for in-flight requests.
	sctx, cancel := context.WithTimeout(context.Background(), deadline)
	defer cancel()
	if err := srv.Shutdown(sctx); err != nil {
		_ = srv.Close()
		fmt.Fprintf(stderr, "shutdown timed out: %v\n", err)
		return 1
	}
	return 0
}

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGTERM, syscall.SIGINT)
	defer stop()
	code := run(ctx, os.Getenv("APP_PORT"), servRoot, shutdownTimeout, os.Stderr, nil)
	stop()
	os.Exit(code)
}
