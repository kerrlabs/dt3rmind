# Requirements Document

## Introduction

Dt3rmind is a gamified course. Its shipped product is a fully client-side Vite + React 18 + TypeScript single-page application (built with `npm run build` into `dist/`, using `HashRouter` and `base: './'`). Progress is stored in browser `localStorage`. No backend is wired into the SPA today.

The repository also contains a Python/FastAPI harness (`app/`) with OpenAI, Bedrock and mock LLM providers and a seeded sales dataset (`data/`). The README states the harness is not imported by the React app. The `app/` directory currently holds only compiled `.pyc` files (CPython 3.13); no `.py` sources are present in the working tree or in git. A second prebuilt frontend bundle lives in `frontend-dist/`. It is committed to git, and its relationship to the SPA in `dist/` is unconfirmed.

This feature packages the application as a container image that meets the seven-point contract in `docs/early-adopter-onboarding 1.md` for the Internal App Vending Machine platform (Okta-authenticated, scale-to-zero, ARM64 on AWS Graviton, no database, no persistent local disk).

Scope decision recorded here: the container serves the React SPA. Including the Python harness is conditional on its source being available (see Requirement 10). The container needs no database and no login code. The SPA contains no backend calls, so the waking-503 wrapper applies only to any backend call that is added or enabled.

## Glossary

- **Container_Image**: The OCI image built from the repository's Dockerfile that packages the application for the Platform.
- **Platform**: The Internal App Vending Machine described in `docs/early-adopter-onboarding 1.md`, including its load balancer, Okta authentication, and sidecar.
- **App_Server**: The process inside the Container_Image that listens for HTTP requests and serves the SPA (and any enabled backend routes).
- **SPA**: The Vite + React single-page application built into `dist/` by `npm run build`.
- **Harness**: The Python/FastAPI package in `app/` that provides the LLM agent comparison API, with the seeded sales dataset in `data/`.
- **Build_Stage**: The Dockerfile stage that installs dependencies and produces the SPA build output.
- **Runtime_Stage**: The final Dockerfile stage whose filesystem becomes the Container_Image.
- **APP_PORT**: The environment variable holding the TCP port the App_Server must listen on.
- **Health_Endpoint**: The HTTP path `/api/healthz` that returns HTTP 200 when the App_Server is ready to serve requests.
- **Reserved_Prefix**: The URL path prefix `/_iavm/`, which belongs to the Platform.
- **Waking_Response**: An HTTP 503 response with a JSON body containing `{"status": "waking"}`, returned by the Platform when the backend is asleep.
- **API_Fetch_Wrapper**: A frontend function through which every call to the application's own backend is routed, and which reloads the page on a Waking_Response.
- **Build_Context**: The set of repository files sent to the container builder, as filtered by `.dockerignore`.

## Requirements

### Requirement 1: Listen on the configured port

**User Story:** As a platform operator, I want the application to read its port from `APP_PORT`, so that the port number lives in exactly one place.

#### Acceptance Criteria

1. WHEN the Container_Image starts with `APP_PORT` set to a decimal integer from 1025 to 65535 inclusive, THE App_Server SHALL accept TCP connections on that port on 127.0.0.1 within 10 seconds of container start.
2. IF `APP_PORT` is unset, is an empty string, or is not a decimal integer from 1025 to 65535 inclusive (including values with a sign, decimal point, whitespace, or non-digit characters), THEN THE App_Server SHALL write an error message naming `APP_PORT` and stating the accepted range to standard error, SHALL NOT open any listening socket, and SHALL exit with a non-zero status code within 5 seconds of container start.
3. THE Container_Image SHALL contain no literal listening port number in the App_Server start command or configuration, so that changing only the `APP_PORT` value changes the listening port.
4. WHEN `APP_PORT` is set to a valid value, THE App_Server SHALL NOT accept TCP connections on any other port that the App_Server itself opens, including 8080 unless `APP_PORT` is 8080.
5. THE Dockerfile SHALL contain a comment stating that 8080 is the recommended `APP_PORT` value.

### Requirement 2: Bind to the loopback interface

**User Story:** As a platform operator, I want the application bound to the loopback interface, so that only the sidecar in the same network namespace can reach it.

#### Acceptance Criteria

1. WHEN the App_Server starts, THE App_Server SHALL bind its listening socket to the IPv4 address `127.0.0.1` on the configured port and to no other network interface or address.
2. WHEN a host outside the task's network namespace attempts to open a connection to the App_Server's port, THE App_Server SHALL receive no connection from that host, and the attempt SHALL fail with a connection refusal or timeout at the client.
3. WHILE the App_Server is running, THE App_Server SHALL accept connections from the sidecar in the same network namespace via `127.0.0.1` and SHALL respond to a request from it within 5 seconds.
4. IF the App_Server cannot bind to `127.0.0.1` on the configured port (for example, the port is in use), THEN THE App_Server SHALL exit within 10 seconds with a non-zero exit status and write an error indication stating that the bind failed, and THE App_Server SHALL NOT fall back to binding any other address.

### Requirement 3: Run as a non-root user

**User Story:** As a platform operator, I want the container to run as UID 10001, so that the image meets the Platform's security contract.

#### Acceptance Criteria

1. THE Runtime_Stage SHALL set `USER 10001:10001` as the final user instruction, so that the Container_Image metadata reports user 10001:10001 and group 10001 when inspected.
2. WHEN the Container_Image starts without a user override, THE App_Server process SHALL run with effective UID 10001 and effective GID 10001, and no process in the container SHALL run with effective UID 0.
3. THE Runtime_Stage SHALL make every file and directory that the App_Server serves readable by UID 10001, and every served directory traversable by UID 10001.
4. THE Runtime_Stage SHALL make every file and directory that the App_Server serves non-writable by UID 10001, with no write permission granted through owner, group, or other permission bits.
5. IF the App_Server attempts to write to a served file or directory as UID 10001, THEN THE Container_Image SHALL reject the write with a permission-denied failure and leave the file content unchanged.
6. IF UID 10001 cannot read a file that the App_Server serves, THEN THE Runtime_Stage build SHALL fail with a non-zero exit status and an error naming the unreadable path.

### Requirement 4: Health check

**User Story:** As a platform operator, I want a health endpoint that reports readiness truthfully, so that the Platform does not route users to an app that is not ready.

#### Acceptance Criteria

1. WHEN a GET request for `/api/healthz` arrives and the App_Server has finished loading the SPA files it serves, THE App_Server SHALL respond with HTTP 200 within 500 milliseconds, measured with no other requests in progress.
2. WHILE the App_Server has not finished loading the SPA files it serves, THE App_Server SHALL accept no connections on the configured port.
3. IF the SPA files the App_Server serves are missing or unreadable at startup, THEN THE App_Server SHALL exit with a non-zero status code within 10 seconds of process start and SHALL NOT accept connections on the configured port.
4. IF the SPA files the App_Server serves become missing or unreadable after startup, THEN THE App_Server SHALL respond to each GET request for `/api/healthz` with a non-200 status within 500 milliseconds, and SHALL return to HTTP 200 on the next request after the files are readable again.
5. WHEN a GET request for `/api/healthz` arrives, THE App_Server SHALL NOT require authentication and SHALL NOT modify any stored application data.

### Requirement 5: Keep the Platform's URL prefix free

**User Story:** As a platform operator, I want the application to serve nothing under `/_iavm/`, so that platform health checking and sleep behavior keep working.

#### Acceptance Criteria

1. THE App_Server SHALL define no route whose URL path equals the Reserved_Prefix or begins with the Reserved_Prefix followed by any further path segment, for any HTTP method.
2. WHEN the App_Server receives a request whose URL path equals the Reserved_Prefix or begins with the Reserved_Prefix, THE App_Server SHALL respond with HTTP 404 and SHALL NOT return the SPA fallback page.
3. THE SPA build output SHALL contain no file whose served URL path equals the Reserved_Prefix or begins with the Reserved_Prefix.
4. THE SPA SHALL reference no asset URL, in HTML, CSS, or JavaScript output, whose path equals the Reserved_Prefix or begins with the Reserved_Prefix.
5. IF the build output contains a file whose served URL path begins with the Reserved_Prefix or the SPA references an asset URL beginning with the Reserved_Prefix, THEN THE build process SHALL fail with a nonzero exit status and an error naming each offending file or reference, and SHALL NOT publish the build output.

### Requirement 6: Graceful shutdown

**User Story:** As a platform operator, I want the application to drain and exit on SIGTERM, so that requests are not cut off when the app sleeps.

#### Acceptance Criteria

1. WHEN the App_Server receives SIGTERM, THE App_Server SHALL stop accepting new connections within 1 second and continue processing each request that was in flight at the moment SIGTERM was received until its response is fully sent.
2. WHEN the App_Server receives SIGTERM and all in-flight requests have completed within 20 seconds, THE App_Server SHALL exit with status code 0.
3. IF in-flight requests remain 20 seconds after the App_Server received SIGTERM, THEN THE App_Server SHALL terminate those requests and exit with a non-zero status code.
4. WHEN a new connection attempt is made after SIGTERM has been received, THE App_Server SHALL refuse the connection.
5. THE Container_Image SHALL run the App_Server as the container's main process (PID 1) or under an init process that forwards SIGTERM to the App_Server within 1 second of receipt.

### Requirement 7: ARM64 build

**User Story:** As a platform operator, I want an ARM64 image, so that it runs on AWS Graviton.

#### Acceptance Criteria

1. WHEN the image is built with `--platform linux/arm64` on an x86-64 or ARM64 build host, THE Container_Image build SHALL complete with exit code 0 and produce an image tagged for the `linux/arm64` platform.
2. IF the build fails on any step, THEN THE Container_Image build SHALL exit with a non-zero exit code, print the failing step and its error output to the build log, and produce no image tagged as the release image.
3. THE Container_Image SHALL report `arm64` as the architecture value in its image metadata, and SHALL report `linux` as the operating system value.
4. WHEN the Container_Image is started on an ARM64 host, THE Container_Image SHALL start its main process and keep it running for at least 30 seconds without an architecture mismatch error such as `exec format error`.
5. THE Dockerfile SHALL use only base images, for every build stage, that publish a `linux/arm64` manifest entry in their registry.
6. THE repository README SHALL document the full build command, including `--platform linux/arm64`, as a copy-pasteable command that a user can run unchanged from the repository root.

### Requirement 8: Stateless, start-from-nothing operation

**User Story:** As a platform operator, I want the application to need no persistent disk, database, or warm-up, so that it survives scale-to-zero.

#### Acceptance Criteria

1. THE App_Server SHALL write zero bytes of application data (learner data, session data, cache files, and logs) to the container filesystem at runtime.
2. WHEN the Container_Image starts from a fresh filesystem with no mounted volume, THE App_Server SHALL reach the ready state with no one-time setup step (no migration, seeding, or manual command) and with no operator input after the start command.
3. THE Container_Image SHALL contain no scheduled job, cron daemon, or background timer that runs application logic.
4. WHEN the Container_Image starts on a host limited to 0.5 vCPU, THE App_Server SHALL answer its first health check with a success response within 10 seconds of container start.
5. IF the App_Server receives a request while the container filesystem is read-only, THEN THE App_Server SHALL serve the request with the same result as when the filesystem is writable.
6. THE SPA SHALL persist learner progress only in browser `localStorage`, and THE App_Server SHALL receive and store no learner progress.
7. WHEN the App_Server is stopped and a new Container_Image instance is started, THE new instance SHALL serve the same content and responses as the stopped instance, because no state carries over between instances.

### Requirement 9: Serve the SPA correctly

**User Story:** As a learner, I want the course to load and work from the container, so that I can play the levels at the Platform URL.

#### Acceptance Criteria

1. WHEN a GET request for `/` arrives, THE App_Server SHALL respond with HTTP 200, a `Content-Type` header of `text/html`, and the SPA `index.html` as the body.
2. WHEN a GET request arrives for an existing built asset under `/assets/`, THE App_Server SHALL respond with HTTP 200, the asset contents, and a `Content-Type` header matching the file type (`text/javascript` for `.js`, `text/css` for `.css`, `image/svg+xml` for `.svg`).
3. WHEN a GET request arrives for a built asset under `/assets/` whose file name contains a content hash, THE App_Server SHALL include a `Cache-Control` header with `max-age` of at least 31536000 seconds and the `immutable` directive.
4. WHEN a GET request for `/` or `/index.html` arrives, THE App_Server SHALL include a `Cache-Control: no-cache` header.
5. IF a GET request arrives for a path that matches no file and is not under `/api/`, THEN THE App_Server SHALL respond with HTTP 404 and SHALL NOT return the SPA `index.html` as the body.
6. IF a GET request arrives for a path under `/assets/` that matches no file, THEN THE App_Server SHALL respond with HTTP 404 and SHALL NOT include the `immutable` directive in `Cache-Control`.
7. WHEN the Container_Image is built, THE Container_Image SHALL contain the SPA output of `npm run build` run from the same commit as the Dockerfile, and the build SHALL fail if `npm run build` exits with a non-zero status.
8. FOR ALL 31 level packets in `content/levels/`, THE SPA build inside the Container_Image SHALL include the packet in the served JavaScript bundle, such that the packet's level identifier appears in the bundle content served from `/assets/`.

### Requirement 10: Harness inclusion

**User Story:** As a maintainer, I want an explicit decision about the Python harness, so that the image does not ship broken or empty code.

#### Acceptance Criteria

1. THE Container_Image SHALL exclude the `app/__pycache__/` directory and all files with the `.pyc` extension, at any directory depth, in every build.
2. IF the Harness is not included in the Container_Image, THEN THE Container_Image SHALL exclude `data/sales.db` and `data/sales.csv`.
3. WHERE the Harness `.py` sources exist in the repository, THE Container_Image SHALL include the Harness `.py` sources, the `data/` directory (including `data/sales.db` and `data/sales.csv`), and a Python 3.13 runtime.
4. WHERE the Harness is included, THE App_Server SHALL serve Harness routes under the `/api/` path prefix.
5. WHERE the Harness is included, THE Harness SHALL read its LLM provider setting from an environment variable, and THE Harness SHALL accept only the values `bedrock` and `mock`.
6. IF the LLM provider environment variable is unset or has a value other than `bedrock` or `mock`, THEN THE Harness SHALL fail to start, exit with a non-zero exit code, and write an error message to standard error that names the variable and lists the accepted values.
7. WHERE the Harness is not included, THE Container_Image SHALL contain no Python runtime and no `.py` files.
8. IF no Harness `.py` source files exist in the Build_Context, THEN THE build SHALL complete successfully with exit code 0, produce an SPA-only Container_Image, and print a message to standard output stating that the Harness was skipped.

### Requirement 11: Waking-state handling for backend calls

**User Story:** As a learner with a tab left open overnight, I want the page to reload when the backend slept, so that I see the app rather than an error.

#### Acceptance Criteria

1. WHEN the SPA issues a request to its own backend, THE API_Fetch_Wrapper SHALL route that request through the API_Fetch_Wrapper, with no direct backend calls bypassing it.
2. WHEN the API_Fetch_Wrapper receives an HTTP 503 response whose JSON body contains `"status": "waking"`, THE API_Fetch_Wrapper SHALL call `location.reload()` exactly once and return `null` to the caller.
3. WHEN the API_Fetch_Wrapper receives an HTTP 503 response whose body is valid JSON and does not contain `"status": "waking"`, THE API_Fetch_Wrapper SHALL return the response unchanged to the caller without calling `location.reload()`.
4. WHEN the API_Fetch_Wrapper receives a response with any HTTP status other than 503, THE API_Fetch_Wrapper SHALL return the response unchanged to the caller without calling `location.reload()`.
5. IF the response body of an HTTP 503 response is not valid JSON, THEN THE API_Fetch_Wrapper SHALL return the response unchanged to the caller without calling `location.reload()`, and the response body SHALL remain readable by the caller.
6. IF the API_Fetch_Wrapper's underlying request fails without producing a response (network error), THEN THE API_Fetch_Wrapper SHALL propagate the original error to the caller without calling `location.reload()`.
7. THE repository tests SHALL verify the API_Fetch_Wrapper for the waking, non-waking 503, malformed-body 503, non-503, and network-error cases, asserting for each case both the return value (or propagated error) and whether `location.reload()` was called.

### Requirement 12: Identity headers

**User Story:** As a maintainer, I want the container to handle Platform identity headers safely, so that no login code is added and no identity data leaks.

#### Acceptance Criteria

1. THE App_Server SHALL contain no code that authenticates users, creates or validates sessions, or accepts, stores, or verifies passwords.
2. WHERE application code records who performed an action, THE application SHALL store the value of the `x-amzn-oidc-identity` header as the actor identifier and SHALL NOT store the user's email address as the actor identifier.
3. WHEN the App_Server writes a log entry for a request, THE App_Server SHALL exclude the values of the `x-amzn-oidc-identity` and `x-amzn-oidc-data` headers from the entry, including in request dumps, error traces, and debug output.
4. IF a request that requires an actor identifier arrives without a non-empty `x-amzn-oidc-identity` header, THEN THE application SHALL reject the action, SHALL NOT record an actor identifier for it, and SHALL return an error indicating that identity is missing.
5. WHERE the application displays an actor identifier to a user, THE application SHALL display only the `x-amzn-oidc-identity` value and SHALL NOT display the contents of `x-amzn-oidc-data`.

### Requirement 13: Build context and secrets hygiene

**User Story:** As a maintainer, I want secrets and dev artifacts kept out of the image, so that credentials never ship.

#### Acceptance Criteria

1. THE Build_Context SHALL exclude `.env`, `.env.*`, `.git`, `node_modules`, `dist`, `frontend-dist` (unless Requirement 14 selects it), `docs`, `tests`, and `*.tsbuildinfo` through a `.dockerignore` file, so that none of these paths appear in the context sent to the image builder.
2. THE Container_Image SHALL contain zero files named `.env` or matching `.env.*`, and zero occurrences of any value defined in the repository `.env` file in any file or image layer.
3. WHEN the Container_Image starts, THE Container_Image SHALL read credentials and provider settings only from environment variables supplied at container start.
4. THE Container_Image SHALL contain zero AWS access key IDs, AWS secret access keys, OpenAI API keys, or other secret values in any layer, including build arguments and image metadata.
5. WHEN the Build_Stage installs dependencies, THE Build_Stage SHALL run `npm ci` and not `npm install`.
6. IF `package-lock.json` is missing or does not match `package.json`, THEN THE Build_Stage SHALL fail with a non-zero exit status, an error indicating the lock file problem, and no Container_Image produced.
7. THE Runtime_Stage SHALL contain no `node_modules` directory and no dev dependency packages.
8. WHERE the Harness is included and a required credential or provider environment variable is missing at start, THE Harness SHALL exit with a non-zero status and write an error naming the missing variable, without writing its value. (The SPA-only image requires no credentials.)

### Requirement 14: Resolve the frontend-dist bundle

**User Story:** As a maintainer, I want to know what `frontend-dist/` is, so that the image serves the intended frontend.

#### Acceptance Criteria

1. THE Container_Image SHALL serve the SPA built from `src/` by the Build_Stage as the default frontend, with the SPA entry document (`index.html`) returned for requests to the root path.
2. IF `frontend-dist/` is the build output of a separate frontend whose source is absent from the repository, THEN THE Container_Image SHALL exclude `frontend-dist/` from the image filesystem and THE design document SHALL record the exclusion and the reason for it.
3. WHERE the maintainer designates `frontend-dist/` as the frontend to serve, THE Container_Image SHALL serve the contents of `frontend-dist/` in place of the SPA build output, and the Container_Image SHALL contain no files from the Build_Stage SPA output in the served frontend location.
4. IF `frontend-dist/` is designated as the frontend to serve and `frontend-dist/index.html` is absent at build time, THEN THE Build_Stage SHALL fail with an error message identifying the missing file, and no Container_Image SHALL be produced.
5. IF `src/` is absent or the Build_Stage SPA build exits with a non-zero status, THEN THE Build_Stage SHALL fail with an error message identifying the failing step, and no Container_Image SHALL be produced.

### Requirement 15: Image verification

**User Story:** As a maintainer, I want an automated check of the contract, so that regressions are caught before onboarding.

#### Acceptance Criteria

1. THE repository SHALL provide a verification script that builds the Container_Image and runs it with `APP_PORT=8080`.
2. WHEN the verification script has started the container, THE script SHALL poll `/api/healthz` at intervals of 1 second for up to 60 seconds and SHALL assert that `/api/healthz` returns HTTP 200, `/` returns HTTP 200, and `/_iavm/anything` returns HTTP 404.
3. WHEN the verification script has started the container, THE script SHALL assert that the container's main process (PID 1) runs with UID 10001.
4. WHEN all other assertions have completed, THE verification script SHALL send SIGTERM to the container and SHALL assert that the container exits with status 0 within 25 seconds of the signal.
5. IF any assertion fails, THEN THE verification script SHALL print the failed assertion, SHALL remove the container it started, and SHALL exit with a non-zero status code.
6. WHEN the verification script has built the Container_Image, THE script SHALL assert that the image architecture is `arm64`.
7. IF the image build fails, the container does not start, or `/api/healthz` does not return HTTP 200 within the 60-second polling window, THEN THE verification script SHALL print an error identifying which step failed, SHALL remove any container it started, and SHALL exit with a non-zero status code.
8. WHEN all assertions pass, THE verification script SHALL remove the container it started, print a message indicating success, and exit with status code 0.

### Requirement 16: Onboarding handoff information

**User Story:** As a maintainer, I want a short handoff note, so that the Platform team can onboard the image.

#### Acceptance Criteria

1. THE repository README SHALL state the numeric `APP_PORT` value chosen for the application (an integer from 1025 to 65535) and the Health_Endpoint path, beginning with `/`, that returns HTTP 200 only when the application is ready to serve requests.
2. THE repository README SHALL state each of the following as a separate statement: the application has no database, the application writes nothing to local disk that must survive a restart, and the application requires no role or group information beyond an authenticated staff member.
3. THE repository README SHALL list each of the five items in the onboarding document's "Tell us early if any of these apply" section (store data, reach an existing system, roles or permissions, waiting a minute for wake-up, heavy concurrent use), and each item SHALL be followed by the application's answer, either "applies" or "does not apply", with a one-sentence reason.
4. IF the answer to any "Tell us early" item is "applies", THEN THE repository README SHALL describe the need in that item's answer, so the Platform team can act on it before onboarding.
5. THE repository README SHALL state the handoff note in a single section with a heading addressed to the Platform team, so a reader can find all handoff information under one heading.
