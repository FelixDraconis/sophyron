#!/bin/zsh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="${1:-8000}"
URL="http://localhost:${PORT}/"

cd "$ROOT_DIR"

echo "Starting local server for Sophyron at ${URL}"
echo "Press Ctrl+C to stop."

python3 -m http.server "$PORT" >/tmp/sophyron-local-server.log 2>&1 &
SERVER_PID=$!

cleanup() {
  if kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

sleep 1
open "$URL"

wait "$SERVER_PID"
