#!/usr/bin/env bash
# deploy.sh — Build and deploy pasta on the server.
# Run from the project root (or let CI run it via ssh).
#
# Local usage:   bash scripts/deploy.sh
# Remote CI:     ssh user@host "cd /opt/pasta && git pull && bash scripts/deploy.sh"
#
# Assumes:
#   - Node.js is installed
#   - /etc/pasta.env contains env vars (written by install.sh)
#   - systemd service 'pasta' is already registered

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICE_NAME="pasta"

# ── colours ──────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[deploy]${NC} $*"; }
step()  { echo -e "${YELLOW}[deploy]${NC} $*"; }

cd "$APP_DIR"
info "Working directory: $APP_DIR"

# ── 1. pull latest code ───────────────────────────────────────────────────────
if [[ "${SKIP_PULL:-0}" != "1" ]]; then
  step "Pulling latest code..."
  git pull --ff-only
else
  info "SKIP_PULL=1 — skipping git pull."
fi

# ── 2. install dependencies ───────────────────────────────────────────────────
step "Installing npm dependencies..."
npm ci --prefer-offline

# ── 3. build ──────────────────────────────────────────────────────────────────
step "Building Next.js app..."
npm run build

# ── 4. copy static assets into standalone bundle ──────────────────────────────
step "Copying static assets into standalone bundle..."
cp -r .next/static  .next/standalone/.next/static
cp -r public        .next/standalone/public

# ── 5. ensure runtime directories exist ───────────────────────────────────────
# These must live in APP_DIR (the project root), NOT inside .next/standalone/.
# Next.js standalone server.js calls process.chdir(__dirname), which would
# place data/ and files/ inside .next/standalone/ — wiping them on every build.
# APP_DIR is set in /etc/pasta.env and used by db.ts / files.ts at runtime.
mkdir -p data files

# ── 6. reload service ────────────────────────────────────────────────────────
if systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
  step "Restarting $SERVICE_NAME service..."
  systemctl restart "$SERVICE_NAME"
  info "Service restarted."
elif systemctl is-enabled --quiet "$SERVICE_NAME" 2>/dev/null; then
  step "Starting $SERVICE_NAME service (was not running)..."
  systemctl start "$SERVICE_NAME"
  info "Service started."
else
  info "Systemd service '$SERVICE_NAME' not found — skipping restart."
  info "Start manually: node .next/standalone/server.js"
fi

# ── 7. smoke test ─────────────────────────────────────────────────────────────
step "Waiting for app to come up..."
sleep 2

PORT="${PORT:-3000}"
HEALTH_URL="http://localhost:${PORT}/api/health"

for i in 1 2 3 4 5; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" || true)
  if [[ "$STATUS" == "200" ]]; then
    info "Health check passed (HTTP 200)."
    break
  fi
  if [[ $i -eq 5 ]]; then
    echo ""
    echo "[deploy] Health check failed after 5 attempts (last status: $STATUS)."
    echo "[deploy] Check logs: journalctl -u $SERVICE_NAME -n 50"
    exit 1
  fi
  sleep 2
done

# ── done ──────────────────────────────────────────────────────────────────────
echo ""
info "Deploy complete."
echo ""
