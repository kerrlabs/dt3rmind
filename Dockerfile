# syntax=docker/dockerfile:1
#
# Dt3rmind image: static Go server + prebuilt Vite SPA, linux/arm64.
# Build: docker buildx build --platform linux/arm64 -t dt3rmind:release --load .
#
# Recommended APP_PORT: 8080
# The port is supplied at run time through the APP_PORT environment variable.

# ---------------------------------------------------------------------------
# harness-probe: report whether Python harness sources exist (Req 10.8).
# Always exits 0. Its output file is consumed by the assemble stage so
# BuildKit cannot skip this stage.
# ---------------------------------------------------------------------------
FROM node:22-alpine AS harness-probe
WORKDIR /probe
COPY app/ /probe/app/
RUN mkdir -p /out; \
    if [ -n "$(find /probe/app -name '*.py' -print -quit)" ]; then \
      echo "Harness sources found (Dockerfile.harness required for the harness)" | tee /out/harness-probe.txt; \
    else \
      echo "Harness skipped: no .py sources in build context" | tee /out/harness-probe.txt; \
    fi; \
    exit 0

# ---------------------------------------------------------------------------
# spa-build: build the SPA from src/ (Req 9.7, 13.5, 13.6, 14.1, 14.5).
# ---------------------------------------------------------------------------
FROM node:22-alpine AS spa-build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts ./
COPY src/ ./src/
COPY content/ ./content/
RUN npm run build
COPY scripts/guard-dist.sh /usr/local/bin/guard-dist.sh
RUN sh /usr/local/bin/guard-dist.sh dist

# ---------------------------------------------------------------------------
# server-build: static linux/arm64 binary (Req 7.1, 7.5, 10.7).
# ---------------------------------------------------------------------------
FROM golang:1.23-alpine AS server-build
ENV CGO_ENABLED=0 GOOS=linux GOARCH=arm64
WORKDIR /src
COPY server/ ./
RUN go build -trimpath -ldflags="-s -w" -o /out/server .

# ---------------------------------------------------------------------------
# assemble: build the final root filesystem with exact ownership and modes
# (files 0444, directories 0555, root-owned; Req 3.3, 3.4). The binary is
# 0555 because it must be executable.
# ---------------------------------------------------------------------------
FROM golang:1.23-alpine AS assemble
COPY --from=server-build /out/server /rootfs/server
COPY --from=spa-build /app/dist /rootfs/srv
COPY --from=harness-probe /out/harness-probe.txt /rootfs/harness-probe.txt
RUN chown -R 0:0 /rootfs \
 && find /rootfs -type d -exec chmod 0555 {} + \
 && find /rootfs -type f -exec chmod 0444 {} + \
 && chmod 0555 /rootfs/server

# ---------------------------------------------------------------------------
# runtime: no shell, no Node, no Python (Req 3.1, 6.5, 10.7, 13.7).
# ---------------------------------------------------------------------------
FROM scratch AS runtime
COPY --from=assemble /rootfs/ /
ENTRYPOINT ["/server"]
USER 10001:10001
