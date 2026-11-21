#!/usr/bin/env bash
# Verifies the Dt3rmind container image against the platform contract.
#
# Steps: build, image metadata (arm64/linux), start with APP_PORT=8080,
# poll /api/healthz, check / and /_iavm/anything, check PID 1 UID, SIGTERM drain.
#
# NOTE on networking: the App_Server binds 127.0.0.1 inside the container
# (Requirement 2), so a published port (-p 127.0.0.1:8080:8080) cannot reach it.
# Instead this script starts a short-lived curl sidecar that joins the app
# container's network and PID namespaces (--network/--pid container:<name>),
# which mirrors how the platform sidecar reaches the app. The sidecar image
# must be runnable on the host (curlimages/curl is multi-arch).
#
# Requirements: 15.1 - 15.8
set -u

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE="${IMAGE:-dt3rmind:release}"
APP_PORT=8080
SIDECAR_IMAGE="${SIDECAR_IMAGE:-curlimages/curl:latest}"
SUFFIX="$$-$(date +%s)"
APP="dt3rmind-verify-$SUFFIX"
SIDECAR="dt3rmind-verify-sidecar-$SUFFIX"
APP_STARTED=0

cleanup() {
  docker rm -f "$SIDECAR" >/dev/null 2>&1 || true
  if [ "$APP_STARTED" = 1 ]; then
    docker rm -f "$APP" >/dev/null 2>&1 || true
  fi
}

fail() {
  echo "FAIL [$1]: $2" >&2
  if [ "$APP_STARTED" = 1 ]; then
    echo "--- container logs ---" >&2
    docker logs "$APP" 2>&1 | tail -n 20 >&2 || true
  fi
  cleanup
  exit 1
}

trap 'cleanup' EXIT

command -v docker >/dev/null 2>&1 || fail "prerequisites" "docker not found"

# 1. Build (15.1, 15.7)
echo "==> Step: build image"
if [ -x "$REPO_ROOT/scripts/build.sh" ] || [ -f "$REPO_ROOT/scripts/build.sh" ]; then
  (cd "$REPO_ROOT" && bash scripts/build.sh) || fail "build" "image build failed"
else
  (cd "$REPO_ROOT" && docker buildx build --platform linux/arm64 -t "$IMAGE" --load .) \
    || fail "build" "image build failed"
fi

# 2. Image metadata (15.6, 7.3)
echo "==> Step: image architecture and OS"
ARCH="$(docker image inspect --format '{{.Architecture}}' "$IMAGE" 2>/dev/null)" \
  || fail "image-inspect" "cannot inspect $IMAGE"
OS="$(docker image inspect --format '{{.Os}}' "$IMAGE" 2>/dev/null)"
[ "$ARCH" = "arm64" ] || fail "image-architecture" "expected arm64, got '$ARCH'"
[ "$OS" = "linux" ] || fail "image-os" "expected linux, got '$OS'"

# 3. Start the container (15.1, 15.7)
echo "==> Step: start container with APP_PORT=$APP_PORT"
docker run -d --name "$APP" --platform linux/arm64 -e "APP_PORT=$APP_PORT" "$IMAGE" >/dev/null \
  || fail "container-start" "docker run failed"
APP_STARTED=1
sleep 1
RUNNING="$(docker inspect --format '{{.State.Running}}' "$APP" 2>/dev/null)"
[ "$RUNNING" = "true" ] || fail "container-start" "container is not running after start"

# Sidecar sharing network + PID namespaces with the app container.
docker run -d --name "$SIDECAR" --platform "$(docker version --format '{{.Server.Os}}/{{.Server.Arch}}')" \
  --network "container:$APP" --pid "container:$APP" \
  --entrypoint sleep "$SIDECAR_IMAGE" 3600 >/dev/null \
  || fail "sidecar-start" "cannot start sidecar from $SIDECAR_IMAGE"

http_code() {
  docker exec "$SIDECAR" curl -s -o /dev/null -m 5 -w '%{http_code}' "http://127.0.0.1:$APP_PORT$1" 2>/dev/null
}

# 4. Poll health for up to 60 s at 1 s intervals (15.2, 15.7)
echo "==> Step: poll /api/healthz (up to 60s)"
READY=0
for _ in $(seq 1 60); do
  RUNNING="$(docker inspect --format '{{.State.Running}}' "$APP" 2>/dev/null)"
  [ "$RUNNING" = "true" ] || fail "container-running" "container exited while waiting for health"
  if [ "$(http_code /api/healthz)" = "200" ]; then READY=1; break; fi
  sleep 1
done
[ "$READY" = 1 ] || fail "healthz" "/api/healthz did not return 200 within 60s"

# 5. Route assertions (15.2)
echo "==> Step: assert routes"
CODE="$(http_code /api/healthz)"; [ "$CODE" = "200" ] || fail "assert /api/healthz" "expected 200, got $CODE"
CODE="$(http_code /)";            [ "$CODE" = "200" ] || fail "assert /" "expected 200, got $CODE"
CODE="$(http_code /_iavm/anything)"; [ "$CODE" = "404" ] || fail "assert /_iavm/anything" "expected 404, got $CODE"

# 6. PID 1 runs as UID 10001 (15.3). The sidecar shares the PID namespace.
echo "==> Step: assert PID 1 UID"
UIDLINE="$(docker exec "$SIDECAR" cat /proc/1/status 2>/dev/null | awk '/^Uid:/ {print $2, $3}')"
[ "$UIDLINE" = "10001 10001" ] || fail "assert PID 1 UID" "expected '10001 10001' (real effective), got '$UIDLINE'"

# 7. SIGTERM and exit within 25 s with status 0 (15.4)
echo "==> Step: SIGTERM and wait for exit"
docker rm -f "$SIDECAR" >/dev/null 2>&1 || true
docker kill --signal=SIGTERM "$APP" >/dev/null 2>&1 || fail "sigterm" "cannot send SIGTERM"
START=$SECONDS
EXITED=0
while [ $((SECONDS - START)) -lt 25 ]; do
  RUNNING="$(docker inspect --format '{{.State.Running}}' "$APP" 2>/dev/null)"
  if [ "$RUNNING" != "true" ]; then EXITED=1; break; fi
  sleep 0.5
done
[ "$EXITED" = 1 ] || fail "sigterm-exit" "container did not exit within 25s of SIGTERM"
EXIT_CODE="$(docker inspect --format '{{.State.ExitCode}}' "$APP" 2>/dev/null)"
[ "$EXIT_CODE" = "0" ] || fail "sigterm-exit-status" "expected exit status 0, got $EXIT_CODE"

# 8. Success (15.8)
cleanup
trap - EXIT
echo "SUCCESS: image $IMAGE passed all verification checks"
exit 0
