#!/bin/sh
# Build the linux/arm64 release image. Run from anywhere; builds from the repo root.
# Uses Dockerfile.harness only when .py sources exist under app/ and that file exists.
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT"

FILE=Dockerfile
if [ -d app ] && [ -f Dockerfile.harness ]; then
  if [ -n "$(find app -type f -name '*.py' -print -quit)" ]; then
    FILE=Dockerfile.harness
  fi
fi

echo "build: using $FILE"
exec docker buildx build --platform linux/arm64 -f "$FILE" -t dt3rmind:release --load .
