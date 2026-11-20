#!/bin/sh
# Guard the built SPA before it is copied into the runtime image.
# Usage: guard-dist.sh [DIST_DIR]   (default: dist)
# POSIX sh + busybox tools only.
set -u

DIST="${1:-dist}"
fail=0

if [ ! -d "$DIST" ]; then
  echo "guard-dist: directory not found: $DIST" >&2
  exit 1
fi

# dist/index.html must exist (3.6, 14.4)
if [ ! -f "$DIST/index.html" ]; then
  echo "guard-dist: missing $DIST/index.html" >&2
  fail=1
fi

# Files whose URL path begins /_iavm/ (5.3)
if [ -e "$DIST/_iavm" ]; then
  find "$DIST/_iavm" -type f | while IFS= read -r f; do
    echo "guard-dist: file under reserved prefix /_iavm/: $f" >&2
  done
  fail=1
fi

# Files containing the string /_iavm/ (5.4, 5.5)
hits=$(grep -rlF '/_iavm/' "$DIST" 2>/dev/null)
if [ -n "$hits" ]; then
  echo "$hits" | while IFS= read -r f; do
    echo "guard-dist: file references /_iavm/: $f" >&2
  done
  fail=1
fi

# Files not readable by others (3.6)
unreadable=$(find "$DIST" ! -perm -o=r 2>/dev/null)
if [ -n "$unreadable" ]; then
  echo "$unreadable" | while IFS= read -r f; do
    echo "guard-dist: not readable by others: $f" >&2
  done
  fail=1
fi

if [ "$fail" -ne 0 ]; then
  echo "guard-dist: FAILED" >&2
  exit 1
fi

echo "guard-dist: OK ($DIST)"
exit 0
