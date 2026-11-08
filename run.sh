#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  run.sh — Unified Service Manager for Google Antigravity Academy
#           & Mission Control Studio
#
#  Usage:
#     ./run.sh            -> Start the full-stack server in foreground (Ctrl+C to stop)
#     ./run.sh bg         -> Start in background + health-check + logs in data/server.log
#     ./run.sh stop       -> Stop the running server instance
#     ./run.sh restart    -> Restart the background server instance
#     ./run.sh status     -> Check server process status and health endpoint
#     ./run.sh check      -> Verify prerequisites, environment, and integrity (no start)
#     ./run.sh test       -> Run automated unit, security rules, and domain audit tests
#     ./run.sh build      -> Build production frontend bundle (dist/)
#     ./run.sh help       -> Show usage instructions
#
#  Custom Port:   PORT=3000 ./run.sh
#  Network Bind:  Defaults to all interfaces (0.0.0.0) for LAN/container access;
#                 Localhost only: HOST=127.0.0.1 ./run.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

# Port sanitization: invalid, empty, or zero values default to 3000
PORT="${PORT:-3000}"
case "$PORT" in ''|0|*[!0-9]*) PORT=3000 ;; esac
export PORT

HOST="${HOST:-0.0.0.0}"
export HOST

MODE="${1:-run}"

GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
OFF='\033[0m'

step() { printf "\n${BLUE}▶ %s${OFF}\n" "$1"; }
ok()   { printf "  ${GREEN}✓${OFF} %s\n" "$1"; }
warn() { printf "  ${YELLOW}⚠${OFF} %s\n" "$1"; }
die()  { printf "  ${RED}✗ %s${OFF}\n" "$1" >&2; exit 1; }

PID_FILE="data/server.pid"
LOG_FILE="data/server.log"

# Load environment variables from .env if present (existing env vars take precedence)
if [ -f .env ]; then
  if [ -z "${GEMINI_API_KEY:-}" ]; then
    GEMINI_API_KEY="$(grep -E '^GEMINI_API_KEY=' .env | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'" || true)"
    export GEMINI_API_KEY
  fi
  if [ -z "${APP_URL:-}" ]; then
    APP_URL="$(grep -E '^APP_URL=' .env | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'" || true)"
    export APP_URL
  fi
fi

# ─────────────────────────── Step 1: Environment & Prerequisites ─────────────
check_env() {
  step "1/3  Checking prerequisites and preparing runtime environment"

  # Locate Node.js directly or via nvm / fnm / volta
  NODE_BIN="$(command -v node || true)"
  if [ -z "$NODE_BIN" ] && [ -s "$HOME/.nvm/nvm.sh" ]; then
    # shellcheck disable=SC1091
    . "$HOME/.nvm/nvm.sh" 2>/dev/null || true
    nvm use --silent >/dev/null 2>&1 || true
    NODE_BIN="$(command -v node || true)"
  fi
  if [ -z "$NODE_BIN" ] && [ -d "$HOME/.local/share/fnm" ]; then
    eval "$(fnm env 2>/dev/null)" 2>/dev/null || true
    NODE_BIN="$(command -v node || true)"
  fi
  [ -n "$NODE_BIN" ] || die "Node.js not found. Please install Node.js 20 or newer: https://nodejs.org"

  NODE_MAJOR="$("$NODE_BIN" -p 'process.versions.node.split(".")[0]')"
  [ "$NODE_MAJOR" -ge 20 ] || die "Node.js version must be 20 or higher (current: $("$NODE_BIN" -v))."
  ok "Node.js $("$NODE_BIN" -v)"

  if command -v npm >/dev/null 2>&1; then
    ok "npm $(npm -v)"
  else
    die "npm not found. Please ensure npm is installed alongside Node.js."
  fi

  # Verify essential project files
  for f in package.json server.ts index.html vite.config.ts tsconfig.json firestore.rules src/App.tsx src/main.tsx src/index.css; do
    [ -f "$f" ] || die "Required file '$f' is missing — repository structure is incomplete."
  done
  ok "Core project files verified"

  # Install dependencies automatically if node_modules is missing or incomplete
  if [ ! -d node_modules ] || [ ! -f node_modules/.package-lock.json ]; then
    warn "node_modules not found or incomplete — running 'npm install'..."
    npm install --no-audit --no-fund
  fi
  ok "Dependencies installed and ready"

  # Ensure runtime data directory exists for PID and log files
  mkdir -p data
  ok "Runtime directory 'data/' ready"

  if [ -n "${GEMINI_API_KEY:-}" ]; then
    ok "GEMINI_API_KEY configured (live AI endpoints enabled with deterministic fallback)"
  else
    warn "GEMINI_API_KEY not set — server will use deterministic architectural fallback responses"
  fi
}

# ─────────────────────────── Step 2: Integrity & Health Helpers ──────────────
verify_codebase() {
  step "2/3  Verifying TypeScript types and repository domain compliance"
  npm run lint --silent
  ok "TypeScript compilation check passed (tsc --noEmit)"

  npm run audit:domain --silent
  ok "Repository domain whitelist audit passed"
}

find_port_pid() {
  local pid=""
  if command -v lsof >/dev/null 2>&1; then
    pid="$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null | head -1 || true)"
  elif command -v fuser >/dev/null 2>&1; then
    pid="$(fuser "${PORT}/tcp" 2>/dev/null | awk '{print $1}' || true)"
  elif command -v ss >/dev/null 2>&1; then
    pid="$(ss -lptn "sport = :$PORT" 2>/dev/null | sed -n 's/.*pid=\([0-9]*\).*/\1/p' | head -1 || true)"
  fi
  printf "%s" "$pid"
}

is_running() {
  if [ -f "$PID_FILE" ]; then
    local pid
    pid="$(cat "$PID_FILE" 2>/dev/null || true)"
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      return 0
    fi
  fi
  return 1
}

wait_for_health() {
  local retries="${1:-30}"
  local url="http://127.0.0.1:${PORT}/api/meta"
  local i=1
  while [ "$i" -le "$retries" ]; do
    if command -v curl >/dev/null 2>&1; then
      if curl -fsS "$url" >/dev/null 2>&1; then
        return 0
      fi
    elif "$NODE_BIN" -e "fetch('$url').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" 2>/dev/null; then
      return 0
    fi
    sleep 0.5
    i=$((i + 1))
  done
  return 1
}

stop_service() {
  step "Stopping Google Antigravity Academy service"
  local stopped=0

  if [ -f "$PID_FILE" ]; then
    local pid
    pid="$(cat "$PID_FILE" 2>/dev/null || true)"
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
      for _ in 1 2 3 4 5 6; do
        kill -0 "$pid" 2>/dev/null || break
        sleep 0.3
      done
      if kill -0 "$pid" 2>/dev/null; then
        kill -9 "$pid" 2>/dev/null || true
      fi
      ok "Stopped server process (PID: $pid)"
      stopped=1
    fi
    rm -f "$PID_FILE"
  fi

  local port_pid
  port_pid="$(find_port_pid)"
  if [ -n "$port_pid" ] && kill -0 "$port_pid" 2>/dev/null; then
    kill "$port_pid" 2>/dev/null || true
    sleep 0.5
    kill -9 "$port_pid" 2>/dev/null || true
    ok "Released port $PORT (PID: $port_pid)"
    stopped=1
  fi

  if [ "$stopped" -eq 0 ]; then
    warn "No active server instance found on port $PORT."
  fi
}

# ─────────────────────────── Step 3: Execution Modes ─────────────────────────
run_foreground() {
  check_env
  verify_codebase

  if is_running; then
    local existing_pid
    existing_pid="$(cat "$PID_FILE")"
    warn "Background server is already running (PID: $existing_pid). Stopping it before foreground launch..."
    stop_service
  fi

  step "3/3  Starting full-stack server in foreground on http://${HOST}:${PORT}"
  printf "  ${CYAN}Local URL:${OFF}   http://localhost:%s\n" "$PORT"
  printf "  ${CYAN}Health API:${OFF}  http://localhost:%s/api/meta\n" "$PORT"
  printf "  ${CYAN}Stop:${OFF}        Press Ctrl+C to stop the server\n\n"

  exec npx tsx server.ts
}

run_background() {
  check_env
  verify_codebase

  if is_running; then
    local existing_pid
    existing_pid="$(cat "$PID_FILE")"
    ok "Server is already running in background (PID: $existing_pid, Port: $PORT)"
    return 0
  fi

  local port_pid
  port_pid="$(find_port_pid)"
  if [ -n "$port_pid" ]; then
    warn "Port $PORT is currently in use by PID $port_pid. Stopping existing process..."
    stop_service
  fi

  step "3/3  Starting full-stack server in background on http://${HOST}:${PORT}"
  nohup npx tsx server.ts >"$LOG_FILE" 2>&1 &
  local bg_pid=$!
  echo "$bg_pid" >"$PID_FILE"

  if wait_for_health 40; then
    ok "Server started and passed health check (PID: $bg_pid)"
    ok "Local URL:   http://localhost:${PORT}"
    ok "Health URL:  http://localhost:${PORT}/api/meta"
    ok "Log File:    ${LOG_FILE}"
  else
    warn "Server did not respond on /api/meta within timeout. Last log lines:"
    tail -n 25 "$LOG_FILE" >&2 || true
    die "Background server startup failed."
  fi
}

show_status() {
  step "Checking Google Antigravity Academy service status"
  if is_running; then
    local pid
    pid="$(cat "$PID_FILE")"
    ok "Process running (PID: $pid) from $PID_FILE"
  else
    local port_pid
    port_pid="$(find_port_pid)"
    if [ -n "$port_pid" ]; then
      ok "Process listening on port $PORT (PID: $port_pid)"
    else
      warn "Service is currently stopped (Port: $PORT)"
      return 0
    fi
  fi

  if wait_for_health 4; then
    ok "Health endpoint http://127.0.0.1:${PORT}/api/meta is healthy"
  else
    warn "Process exists, but health endpoint http://127.0.0.1:${PORT}/api/meta is not responding"
  fi
}

run_tests() {
  check_env
  step "2/3  Running unit, generator, and Firestore security rule tests"
  npm test
  ok "All automated test suites passed"

  step "3/3  Running TypeScript verification and domain compliance audit"
  npm run lint
  npm run audit:domain
  ok "All verification and audit checks passed"
}

run_build() {
  check_env
  verify_codebase
  step "3/3  Building production frontend bundle"
  npm run build
  ok "Production bundle built successfully in dist/"
}

show_help() {
  cat <<EOF
Google Antigravity Academy & Mission Control Studio — Service Manager (run.sh)

Usage:
  ./run.sh              Start full-stack server in foreground (default)
  ./run.sh bg           Start server in background with health check & logging
  ./run.sh stop         Stop running server instance
  ./run.sh restart      Restart background server instance
  ./run.sh status       Show server status and health endpoint response
  ./run.sh check        Verify Node.js, dependencies, TypeScript, and repository audit
  ./run.sh test         Execute automated unit tests, security rule tests, and audits
  ./run.sh build        Build production assets into dist/
  ./run.sh help         Display this help message

Environment Variables:
  PORT                  HTTP port to bind (default: 3000)
  HOST                  Network interface to bind (default: 0.0.0.0)
  GEMINI_API_KEY        Optional Gemini API key (configured via .env or environment)
EOF
}

case "$MODE" in
  run|fg|foreground)
    run_foreground
    ;;
  bg|start|daemon)
    run_background
    ;;
  stop|kill)
    stop_service
    ;;
  restart|reload)
    stop_service
    run_background
    ;;
  status)
    show_status
    ;;
  check|doctor)
    check_env
    verify_codebase
    step "3/3  Environment and codebase verification complete"
    ok "System is ready to run (execute './run.sh' or './run.sh bg')"
    ;;
  test|tests)
    run_tests
    ;;
  build)
    run_build
    ;;
  help|-h|--help)
    show_help
    ;;
  *)
    die "Unknown command: '$MODE'. Run './run.sh help' for usage options."
    ;;
esac
