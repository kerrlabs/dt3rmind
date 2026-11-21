package main

import (
	"bufio"
	"context"
	"io"
	"io/fs"
	"net"
	"net/http"
	"net/http/httptest"
	"os"
	"strconv"
	"strings"
	"sync/atomic"
	"testing"
	"testing/fstest"
	"time"

	"pgregory.net/rapid"
)

const indexBody = "<!doctype html><title>x</title>"

func baseFS() fstest.MapFS {
	return fstest.MapFS{
		"index.html":             {Data: []byte(indexBody)},
		"assets/app-abcdef12.js": {Data: []byte("console.log(1)")},
	}
}

func do(h http.Handler, method, path string) *httptest.ResponseRecorder {
	r := httptest.NewRequest(method, "/", nil)
	r.URL.Path = path
	w := httptest.NewRecorder()
	h.ServeHTTP(w, r)
	return w
}

// Feature: containerize-application, Property 1: Valid port round trip and loopback address
// **Validates: Requirements 1.1**
func TestProperty1ValidPort(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		p := rapid.IntRange(1025, 65535).Draw(t, "p")
		got, err := ParsePort(strconv.Itoa(p))
		if err != nil || got != p {
			t.Fatalf("ParsePort(%d) = %d, %v", p, got, err)
		}
		if ListenAddr(p) != "127.0.0.1:"+strconv.Itoa(p) {
			t.Fatalf("bad addr %s", ListenAddr(p))
		}
	})
}

// Feature: containerize-application, Property 2: Invalid port rejection
// **Validates: Requirements 1.2**
func TestProperty2InvalidPort(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		s := rapid.OneOf(
			rapid.String(),
			rapid.StringMatching(`[ +\-.0-9a-z]{0,8}`),
			rapid.Map(rapid.IntRange(-100000, 1024), strconv.Itoa),
			rapid.Map(rapid.IntRange(65536, 10000000), strconv.Itoa),
			rapid.Map(rapid.IntRange(1025, 65535), func(i int) string { return "0" + strconv.Itoa(i) }),
			rapid.Map(rapid.IntRange(1025, 65535), func(i int) string { return strconv.Itoa(i) + " " }),
		).Draw(t, "s")
		if n, err := strconv.Atoi(s); err == nil && strconv.Itoa(n) == s && n >= 1025 && n <= 65535 {
			t.Skip()
		}
		_, err := ParsePort(s)
		if err == nil {
			t.Fatalf("ParsePort(%q) accepted", s)
		}
		m := err.Error()
		if !strings.Contains(m, "APP_PORT") || !strings.Contains(m, "1025") || !strings.Contains(m, "65535") {
			t.Fatalf("bad message %q", m)
		}
	})
}

type toggleFS struct {
	fs.FS
	readable atomic.Bool
}

func (f *toggleFS) Open(name string) (fs.File, error) {
	if name == indexFile && !f.readable.Load() {
		return nil, fs.ErrPermission
	}
	return f.FS.Open(name)
}

// Feature: containerize-application, Property 3: Health status tracks file readability
// **Validates: Requirements 4.4**
func TestProperty3Health(t *testing.T) {
	tf := &toggleFS{FS: baseFS()}
	h := NewHandler(tf)
	rapid.Check(t, func(t *rapid.T) {
		for _, ok := range rapid.SliceOfN(rapid.Bool(), 1, 20).Draw(t, "states") {
			tf.readable.Store(ok)
			code := do(h, "GET", healthPath).Code
			if ok != (code == 200) {
				t.Fatalf("readable=%v code=%d", ok, code)
			}
		}
	})
}

// Feature: containerize-application, Property 4: Reserved prefix is never served
// **Validates: Requirements 5.1**
func TestProperty4Reserved(t *testing.T) {
	h := NewHandler(baseFS())
	rapid.Check(t, func(t *rapid.T) {
		m := rapid.SampledFrom([]string{"GET", "HEAD", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"}).Draw(t, "m")
		p := reservedPrefix
		if rapid.Bool().Draw(t, "suffix") {
			p += "/" + rapid.String().Draw(t, "s")
		}
		w := do(h, m, p)
		if w.Code != 404 || strings.Contains(w.Body.String(), indexBody) {
			t.Fatalf("%s %q -> %d", m, p, w.Code)
		}
	})
}

// Feature: containerize-application, Property 5: Existing files are served with correct content type
// **Validates: Requirements 9.2**
func TestProperty5ServeFiles(t *testing.T) {
	exts := []string{".html", ".js", ".css", ".svg", ".json", ".png", ".txt"}
	rapid.Check(t, func(t *rapid.T) {
		tree := baseFS()
		n := rapid.IntRange(1, 6).Draw(t, "n")
		files := map[string][]byte{}
		for i := 0; i < n; i++ {
			dir := rapid.SampledFrom([]string{"", "assets/", "a/b/"}).Draw(t, "dir")
			name := dir + rapid.StringMatching(`[a-z]{1,8}`).Draw(t, "name") + rapid.SampledFrom(exts).Draw(t, "ext")
			if name == "index.html" {
				continue
			}
			data := rapid.SliceOf(rapid.Byte()).Draw(t, "data")
			tree[name] = &fstest.MapFile{Data: data}
			files[name] = data
		}
		h1, h2 := NewHandler(tree), NewHandler(tree)
		for name, data := range files {
			w := do(h1, "GET", "/"+name)
			if w.Code != 200 || w.Body.String() != string(data) {
				t.Fatalf("%s: code %d", name, w.Code)
			}
			if got, want := w.Header().Get("Content-Type"), ContentType(name); got != want {
				t.Fatalf("%s: type %q want %q", name, got, want)
			}
			w2 := do(h2, "GET", "/"+name)
			if w2.Code != w.Code || w2.Body.String() != w.Body.String() || w2.Header().Get("Content-Type") != w.Header().Get("Content-Type") || w2.Header().Get("Cache-Control") != w.Header().Get("Cache-Control") {
				t.Fatalf("%s: handlers differ", name)
			}
		}
	})
}

// Feature: containerize-application, Property 6: Hashed assets are immutable
// **Validates: Requirements 9.3**
func TestProperty6HashedImmutable(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		stem := rapid.StringMatching(`[a-z]{1,8}`).Draw(t, "stem")
		hash := rapid.StringMatching(`[A-Za-z0-9_]{8,12}`).Draw(t, "hash")
		ext := rapid.SampledFrom([]string{".js", ".css", ".svg"}).Draw(t, "ext")
		name := "assets/" + stem + "-" + hash + ext
		cc := CacheControl(name)
		if !strings.Contains(cc, "immutable") || !strings.Contains(cc, "max-age=31536000") {
			t.Fatalf("CacheControl(%q)=%q", name, cc)
		}
		tree := baseFS()
		tree[name] = &fstest.MapFile{Data: []byte("x")}
		w := do(NewHandler(tree), "GET", "/"+name)
		if w.Code != 200 || w.Header().Get("Cache-Control") != cc {
			t.Fatalf("%s: %d %q", name, w.Code, w.Header().Get("Cache-Control"))
		}
	})
}

// Feature: containerize-application, Property 7: Unmatched paths return 404 without fallback or immutability
// **Validates: Requirements 9.5**
func TestProperty7Unmatched(t *testing.T) {
	h := NewHandler(baseFS())
	rapid.Check(t, func(t *rapid.T) {
		prefix := rapid.SampledFrom([]string{"/", "/assets/", "/api/", "/a/b/"}).Draw(t, "prefix")
		p := prefix + "nope-" + rapid.StringMatching(`[a-z0-9./_-]{0,12}`).Draw(t, "rest")
		w := do(h, "GET", p)
		if w.Code != 404 || strings.Contains(w.Body.String(), indexBody) || strings.Contains(w.Header().Get("Cache-Control"), "immutable") {
			t.Fatalf("%q -> %d %q", p, w.Code, w.Header().Get("Cache-Control"))
		}
	})
}

func captureStdout(t interface{ Fatal(args ...any) }, f func()) string {
	old := os.Stdout
	r, w, err := os.Pipe()
	if err != nil {
		t.Fatal(err)
	}
	os.Stdout = w
	done := make(chan string)
	go func() { b, _ := io.ReadAll(r); done <- string(b) }()
	f()
	w.Close()
	os.Stdout = old
	return <-done
}

// Feature: containerize-application, Property 10: Log lines never contain identity header values
// **Validates: Requirements 12.3**
func TestProperty10LogRedaction(t *testing.T) {
	h := NewHandler(baseFS())
	rapid.Check(t, func(t *rapid.T) {
		id := "IDMARK" + rapid.StringMatching(`[A-Za-z0-9]{4,16}`).Draw(t, "id")
		data := "DATAMARK" + rapid.StringMatching(`[A-Za-z0-9.=_-]{4,40}`).Draw(t, "data")
		p := rapid.SampledFrom([]string{"/", "/index.html", "/missing", "/_iavm/x", healthPath}).Draw(t, "p")
		out := captureStdout(t, func() {
			r := httptest.NewRequest("GET", "/", nil)
			r.URL.Path = p
			r.Header.Set("x-amzn-oidc-identity", id)
			r.Header.Set("x-amzn-oidc-data", data)
			h.ServeHTTP(httptest.NewRecorder(), r)
		})
		if out == "" || strings.Contains(out, id) || strings.Contains(out, data) {
			t.Fatalf("bad log %q", out)
		}
	})
}

// ---- unit tests ----

func TestParsePortEdgeCases(t *testing.T) {
	for _, s := range []string{"0001025", "+8080", "8080 ", "65536", "1024", ""} {
		if _, err := ParsePort(s); err == nil {
			t.Errorf("%q accepted", s)
		}
	}
	for _, s := range []string{"1025", "8080", "65535"} {
		if _, err := ParsePort(s); err != nil {
			t.Errorf("%q rejected: %v", s, err)
		}
	}
}

func TestRootServesIndex(t *testing.T) {
	h := NewHandler(baseFS())
	for _, p := range []string{"/", "/index.html"} {
		w := do(h, "GET", p)
		if w.Code != 200 || !strings.HasPrefix(w.Header().Get("Content-Type"), "text/html") || w.Header().Get("Cache-Control") != "no-cache" {
			t.Errorf("%s: %d %v", p, w.Code, w.Header())
		}
	}
}

func TestMethodNotAllowed(t *testing.T) {
	w := do(NewHandler(baseFS()), "POST", "/")
	if w.Code != 405 || w.Header().Get("Allow") == "" {
		t.Fatalf("got %d", w.Code)
	}
}

func freePort(t *testing.T) string {
	ln, err := net.Listen("tcp4", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer ln.Close()
	return strconv.Itoa(ln.Addr().(*net.TCPAddr).Port)
}

func TestStartupMissingIndex(t *testing.T) {
	var listened bool
	var sb strings.Builder
	code := run(context.Background(), freePort(t), t.TempDir(), time.Second, &sb, func(net.Addr) { listened = true })
	if code != 1 || listened {
		t.Fatalf("code=%d listened=%v", code, listened)
	}
}

func TestStartupInvalidPort(t *testing.T) {
	var sb strings.Builder
	if code := run(context.Background(), "80", t.TempDir(), time.Second, &sb, nil); code != 2 || !strings.Contains(sb.String(), "APP_PORT") {
		t.Fatalf("code=%d msg=%q", code, sb.String())
	}
}

func writeIndex(t *testing.T) string { return writeIndexSized(t, 0) }

// writeIndexSized writes index.html padded to at least size bytes, so a client
// that does not read the response keeps the handler blocked in Write.
func writeIndexSized(t *testing.T, size int) string {
	dir := t.TempDir()
	body := []byte(indexBody + strings.Repeat("x", size))
	if err := os.WriteFile(dir+"/index.html", body, 0o644); err != nil {
		t.Fatal(err)
	}
	return dir
}

func TestStartupOccupiedPort(t *testing.T) {
	ln, err := net.Listen("tcp4", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer ln.Close()
	port := strconv.Itoa(ln.Addr().(*net.TCPAddr).Port)
	var sb strings.Builder
	if code := run(context.Background(), port, writeIndex(t), time.Second, &sb, nil); code != 1 {
		t.Fatalf("code=%d", code)
	}
}

// startServer runs the server and returns its address, cancel func and exit-code channel.
func startServer(t *testing.T, deadline time.Duration, size int) (string, context.CancelFunc, <-chan int) {
	ctx, cancel := context.WithCancel(context.Background())
	addrCh := make(chan string, 1)
	codeCh := make(chan int, 1)
	go func() {
		codeCh <- run(ctx, freePort(t), writeIndexSized(t, size), deadline, io.Discard, func(a net.Addr) { addrCh <- a.String() })
	}()
	select {
	case a := <-addrCh:
		if !strings.HasPrefix(a, "127.0.0.1:") {
			t.Fatalf("bound %s", a)
		}
		return a, cancel, codeCh
	case c := <-codeCh:
		t.Fatalf("exited early: %d", c)
	case <-time.After(5 * time.Second):
		t.Fatal("no listen")
	}
	return "", cancel, codeCh
}

func TestGracefulShutdownDrainsInFlight(t *testing.T) {
	addr, cancel, codeCh := startServer(t, 5*time.Second, 64<<20)
	conn, err := net.Dial("tcp", addr)
	if err != nil {
		t.Fatal(err)
	}
	defer conn.Close()
	// Unread 64 MiB response keeps the handler blocked in Write (in flight).
	io.WriteString(conn, "GET / HTTP/1.1\r\nHost: x\r\nConnection: close\r\n\r\n")
	time.Sleep(100 * time.Millisecond)
	cancel()
	deadline := time.Now().Add(3 * time.Second)
	for {
		c, err := net.DialTimeout("tcp", addr, 200*time.Millisecond)
		if err != nil {
			break
		}
		c.Close()
		if time.Now().After(deadline) {
			t.Fatal("new connections still accepted")
		}
		time.Sleep(20 * time.Millisecond)
	}
	select {
	case c := <-codeCh:
		t.Fatalf("exited before in-flight request finished: %d", c)
	default:
	}
	resp, err := http.ReadResponse(bufio.NewReader(conn), nil)
	if err != nil || resp.StatusCode != 200 {
		t.Fatalf("in-flight request: %v %v", resp, err)
	}
	if n, err := io.Copy(io.Discard, resp.Body); err != nil || n < 64<<20 {
		t.Fatalf("truncated body: %d %v", n, err)
	}
	select {
	case c := <-codeCh:
		if c != 0 {
			t.Fatalf("exit %d", c)
		}
	case <-time.After(5 * time.Second):
		t.Fatal("did not exit")
	}
}

func TestShutdownDeadlineExceeded(t *testing.T) {
	addr, cancel, codeCh := startServer(t, 300*time.Millisecond, 64<<20)
	conn, err := net.Dial("tcp", addr)
	if err != nil {
		t.Fatal(err)
	}
	defer conn.Close()
	io.WriteString(conn, "GET / HTTP/1.1\r\nHost: x\r\nConnection: close\r\n\r\n")
	time.Sleep(100 * time.Millisecond)
	cancel()
	select {
	case c := <-codeCh:
		if c != 1 {
			t.Fatalf("exit %d, want 1", c)
		}
	case <-time.After(5 * time.Second):
		t.Fatal("did not exit")
	}
}
