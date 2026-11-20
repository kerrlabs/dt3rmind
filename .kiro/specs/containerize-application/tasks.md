# Implementation Plan: Containerize Application

## Overview

The plan builds the Go static App_Server first (pure functions, then handler and lifecycle), then the TypeScript `apiFetch` wrapper, then the Docker build, verification tooling, and README handoff. The design uses Go and TypeScript, so no language question is needed. Property 11 (harness provider validation) is conditional on harness sources that do not exist, so it has no task. Requirements 10.3, 10.4, 12.2, 12.4, 12.5 and 13.8 are likewise deferred.

## Tasks

- [x] 1. Create the Go App_Server module and pure functions
  - [x] 1.1 Initialize `server/` module and implement pure functions
    - Create `server/go.mod` (add `pgregory.net/rapid` as a test dependency) and `server/main.go` with `ParsePort`, `ListenAddr`, `IsReserved`, `CacheControl`, `ContentType`, `RedactedLogLine`
    - `ParsePort` accepts only canonical decimal strings for 1025 to 65535 and returns an error naming `APP_PORT` and the range
    - `CacheControl` returns `public, max-age=31536000, immutable` for hashed files under `assets/`, otherwise `no-cache`
    - `RedactedLogLine` takes method, path, status and duration only
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 5.1, 9.2, 9.3, 9.4, 12.3_

  - [ ]* 1.2 Write property test for valid port round trip and loopback address
    - **Property 1: Valid port round trip and loopback address**
    - **Validates: Requirements 1.1, 2.1**

  - [ ]* 1.3 Write property test for invalid port rejection
    - **Property 2: Invalid port rejection**
    - Include unit cases `"0001025"`, `"+8080"`, `"8080 "`, `"65536"`, `"1024"`, empty string
    - **Validates: Requirements 1.2**

  - [ ]* 1.4 Write property test for hashed assets being immutable
    - **Property 6: Hashed assets are immutable**
    - **Validates: Requirements 9.3**

  - [ ]* 1.5 Write property test for log lines excluding identity header values
    - **Property 10: Log lines never contain identity header values**
    - **Validates: Requirements 12.3**

- [x] 2. Implement the HTTP handler and server lifecycle
  - [x] 2.1 Implement `NewHandler(root fs.FS)`
    - GET and HEAD only, 405 otherwise
    - Reserved prefix check first, returning 404 plain text
    - `/api/healthz` reads one byte of `index.html` per request and returns 200 or 503
    - Clean path, reject `..`, map `/` to `index.html`, set `Content-Type` and `Cache-Control`
    - Unmatched paths return 404 with no SPA fallback and no `immutable`
    - Log through `RedactedLogLine` to stdout
    - _Requirements: 4.1, 4.4, 4.5, 5.1, 5.2, 8.1, 8.6, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 12.1, 12.3_

  - [ ]* 2.2 Write property test for health status tracking file readability
    - **Property 3: Health status tracks file readability**
    - Use a wrapper `fs.FS` with toggleable readability
    - **Validates: Requirements 4.4**

  - [ ]* 2.3 Write property test for reserved prefix never served
    - **Property 4: Reserved prefix is never served**
    - **Validates: Requirements 5.1, 5.2**

  - [ ]* 2.4 Write property test for existing files served with correct content type
    - **Property 5: Existing files are served with correct content type**
    - Include the identical-tree determinism check
    - **Validates: Requirements 9.2, 8.7**

  - [ ]* 2.5 Write property test for unmatched paths returning 404
    - **Property 7: Unmatched paths return 404 without fallback or immutability**
    - **Validates: Requirements 9.5, 9.6**

  - [x] 2.6 Implement `main` startup and graceful shutdown
    - Order: `ParsePort(os.Getenv("APP_PORT"))` (stderr message and exit 2 on failure), open `index.html` (exit 1 on failure), `net.Listen("tcp4", ListenAddr(port))` (print `bind failed`, exit 1, no fallback)
    - Serve from `/srv` (root path configurable for tests), single listener only
    - On SIGTERM or SIGINT call `Shutdown` with an injectable 20 s deadline; exit 0 when drained, 1 on timeout after `Close()`
    - _Requirements: 1.1, 1.2, 1.4, 2.1, 2.4, 4.2, 4.3, 6.1, 6.2, 6.3, 6.4, 8.2, 8.4_

  - [ ]* 2.7 Write unit tests for startup, routing and shutdown
    - `GET /` and `/index.html` return 200, `text/html`, `Cache-Control: no-cache`
    - Missing `index.html` exits non-zero without listening; occupied port exits non-zero
    - Slow in-flight request completes after shutdown starts and new connections are refused; request outliving a short injected deadline yields exit code 1
    - _Requirements: 2.4, 4.3, 6.1, 6.3, 6.4, 9.1, 9.4_

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement the API fetch wrapper
  - [x] 4.1 Add `fast-check` dev dependency and implement `src/lib/apiFetch.ts`
    - Update `package.json` and `package-lock.json` with `fast-check`
    - Implement `apiFetch(path, options?, deps?)`: network errors propagate, non-503 returned unchanged, 503 parsed from `res.clone().json()`, waking calls `reload()` once and returns `null`, other 503 and unparseable 503 returned with body readable
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

  - [ ]* 4.2 Write property test for waking responses reloading exactly once
    - **Property 8: Waking responses reload exactly once**
    - **Validates: Requirements 11.2**

  - [ ]* 4.3 Write property test for non-waking pass-through
    - **Property 9: Non-waking responses pass through unchanged**
    - **Validates: Requirements 11.3, 11.4, 11.5, 11.6**

  - [ ]* 4.4 Write unit tests for the five named cases and the no-bypass scan
    - Cases: waking, non-waking 503, malformed-body 503, non-503, network error; assert return value or error and whether `reload` was called
    - Scan `src/` and fail if any file other than `apiFetch.ts` calls `fetch(` directly
    - _Requirements: 11.1, 11.7_

- [ ] 5. Verify level packets are bundled
  - [ ]* 5.1 Write a Vitest test that checks every level identifier is in the built bundle
    - Enumerate the 31 files in `content/levels/` and assert each level identifier appears in `dist/assets/*.js`
    - _Requirements: 9.8_

- [x] 6. Build, guard and verification tooling
  - [x] 6.1 Create `.dockerignore`
    - Exclude `.env`, `.env.*`, `.git`, `node_modules`, `dist`, `frontend-dist`, `docs`, `tests`, `*.tsbuildinfo`, `**/__pycache__`, `**/*.pyc`, `data`
    - _Requirements: 10.1, 10.2, 13.1, 14.2_

  - [x] 6.2 Create `scripts/guard-dist.sh`
    - Fail non-zero naming each file under `dist/` whose URL path begins `/_iavm/` and each file containing `/_iavm/`
    - Fail naming files unreadable by others (`find dist ! -perm -o=r`) and when `dist/index.html` is missing
    - _Requirements: 3.6, 5.3, 5.4, 5.5, 14.4_

  - [x] 6.3 Create the multi-stage `Dockerfile`
    - `harness-probe` stage prints `Harness skipped: no .py sources in build context` when `app/` has no `.py` files and exits 0
    - `spa-build` stage on `node:22-alpine`: `npm ci`, copy sources and `content/`, `npm run build`, then run the guard script
    - `server-build` stage on `golang:1.23-alpine` with `CGO_ENABLED=0 GOOS=linux GOARCH=arm64`
    - `runtime` stage `FROM scratch`: copy binary and `dist/` to `/srv` with files `0444` and directories `0555`, root-owned, `ENTRYPOINT ["/server"]` in exec form, `USER 10001:10001` as the last instruction
    - Include the comment `# Recommended APP_PORT: 8080` and no literal port in `ENTRYPOINT`, `CMD`, `EXPOSE`
    - _Requirements: 1.3, 1.5, 3.1, 3.3, 3.4, 6.5, 7.1, 7.2, 7.5, 8.3, 9.7, 10.7, 10.8, 13.5, 13.6, 13.7, 14.1, 14.5_

  - [x] 6.4 Create `scripts/build.sh`
    - Run `docker buildx build --platform linux/arm64 -t dt3rmind:release --load .`
    - Use `Dockerfile.harness` only when `.py` sources exist and that file exists
    - _Requirements: 7.1, 7.6, 10.3_

  - [x] 6.5 Create `scripts/verify-image.sh`
    - Build the image, assert architecture `arm64` and OS `linux`, run with `-e APP_PORT=8080`
    - Poll `/api/healthz` every second for 60 s, assert `/` is 200 and `/_iavm/anything` is 404, assert PID 1 UID is 10001
    - Send SIGTERM and assert exit status 0 within 25 s
    - On any failure print the failing step, remove the container, exit non-zero; on success remove the container, print a success message, exit 0
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8_

  - [ ]* 6.6 Write guard script tests
    - Run `scripts/guard-dist.sh` against fixtures containing a `/_iavm/` file, a `/_iavm/` reference, an unreadable file, and a clean tree; assert exit codes and named offenders
    - _Requirements: 5.5, 3.6_

- [x] 7. Write the README handoff
  - [x] 7.1 Add a "For the Platform team" section to `README.md`
    - State `APP_PORT` 8080 and health path `/api/healthz`
    - Separate statements: no database, nothing persisted on local disk, no role or group information needed
    - The full copy-pasteable build command with `--platform linux/arm64`
    - The five "Tell us early" items, each answered "applies" or "does not apply" with a one-sentence reason
    - _Requirements: 7.6, 16.1, 16.2, 16.3, 16.4, 16.5_

- [x] 8. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Follow-up: verify on machines with Go and Docker
  - [ ] 9.1 Generate `server/go.sum`
    - Run `go mod tidy` in `server/` and commit `go.sum`; the Docker `server-build` stage needs it
    - Run `gofmt -l .` and `go vet ./...` in `server/` and fix any findings in `main.go` and `handler.go`
    - _Requirements: 1.1, 1.2, 2.1, 9.1_

  - [ ] 9.2 Run the Go tests
    - Run `go test ./...` in `server/`; if tests 1.2 to 2.7 are still unwritten, write them first
    - _Requirements: 1.1, 1.2, 4.4, 5.1, 9.2, 9.5, 12.3_

  - [ ] 9.3 Run `scripts/verify-image.sh`
    - Run on a machine with Docker (QEMU/binfmt if the host is x86) and fix any failure in the `Dockerfile` or scripts
    - Confirm the `scripts/*.sh` files have LF line endings and the executable bit
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8_

  - [ ] 9.4 Review README wording
    - Confirm the "does not apply" reasons for "waiting a minute for wake-up" and "heavy concurrent use" in the "For the Platform team" section
    - _Requirements: 16.3_
## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties; unit tests cover specific examples and edge cases
- Container-level requirements (arm64 metadata, UID, read-only run, 0.5 vCPU, SIGTERM) are checked by `scripts/verify-image.sh` and manual runs, not by unit tests
- Harness-conditional requirements and Property 11 are deferred until harness `.py` sources exist

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "4.1", "6.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4", "1.5", "2.1", "4.2", "4.3", "4.4", "5.1", "6.2"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "2.5", "2.6", "6.6"] },
    { "id": 3, "tasks": ["2.7", "6.3"] },
    { "id": 4, "tasks": ["6.4", "6.5", "7.1"] },
    { "id": 5, "tasks": ["9.1", "9.4"] },
    { "id": 6, "tasks": ["9.2", "9.3"] }
  ]
}
```
