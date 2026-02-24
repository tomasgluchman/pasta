#!/usr/bin/env bash
# install.sh — First-time setup for the pasta service on Ubuntu.
# Installs Node.js, registers the systemd service, and writes the env file.
# Caddy is assumed to already be installed and managed separately.
#
# Usage: sudo bash scripts/install.sh

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICE_NAME="pasta"

# ── colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[info]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[warn]${NC}  $*"; }
error() { echo -e "${RED}[error]${NC} $*" >&2; exit 1; }

# ── root check ───────────────────────────────────────────────────────────────
[[ $EUID -ne 0 ]] && error "Run this script as root or with sudo."

# ── collect env vars ─────────────────────────────────────────────────────────
echo ""
echo "=== pasta installer ==="
echo ""

read -rp "PORT [default: 3000]: " NODE_PORT; echo
NODE_PORT="${NODE_PORT:-3000}"
[[ "$NODE_PORT" =~ ^[0-9]+$ ]] || error "PORT must be a number."

read -rsp "AUTH_PASSWORD (login password for pasta): " AUTH_PASSWORD; echo
[[ -z "$AUTH_PASSWORD" ]] && error "AUTH_PASSWORD cannot be empty."

DEFAULT_JWT_SECRET=$(openssl rand -hex 32)
read -rsp "JWT_SECRET [leave blank to auto-generate]: " JWT_SECRET; echo
JWT_SECRET="${JWT_SECRET:-$DEFAULT_JWT_SECRET}"

# ── Node.js ───────────────────────────────────────────────────────────────────

if ! command -v node &>/dev/null; then
  apt-get update -q
  apt-get install -y -q curl git
  info "Installing Node.js 22..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y -q nodejs
else
  info "Node.js $(node -v) already installed."
fi

# ── app directory ─────────────────────────────────────────────────────────────
info "Setting up app directory at $APP_DIR..."
mkdir -p "$APP_DIR"

if [[ ! -d "$APP_DIR/.git" ]]; then
  warn "$APP_DIR has no git repo. Clone your app there, then run deploy.sh."
  warn "Tip: git clone <your-repo> $APP_DIR"
fi

mkdir -p "$APP_DIR/data" "$APP_DIR/files"
chmod 711 "$APP_DIR/data" "$APP_DIR/files"

# ── environment file ──────────────────────────────────────────────────────────
info "Writing /etc/pasta.env..."
cat > /etc/pasta.env <<EOF
NODE_ENV=production
PORT=${NODE_PORT}
AUTH_PASSWORD=${AUTH_PASSWORD}
JWT_SECRET=${JWT_SECRET}
EOF
chmod 600 /etc/pasta.env
info "  /etc/pasta.env written (readable only by root)."

# ── systemd service ───────────────────────────────────────────────────────────
info "Installing systemd service: $SERVICE_NAME..."
cat > /etc/systemd/system/${SERVICE_NAME}.service <<EOF
[Unit]
Description=pasta — self-hosted pastebin
After=network.target

[Service]
Type=simple
WorkingDirectory=${APP_DIR}
ExecStart=/usr/bin/node ${APP_DIR}/.next/standalone/server.js
Restart=on-failure
RestartSec=5

EnvironmentFile=/etc/pasta.env

NoNewPrivileges=true
PrivateTmp=true

StandardOutput=journal
StandardError=journal
SyslogIdentifier=pasta

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
info "  Service enabled (will start on boot)."

# ── Caddy snippet ─────────────────────────────────────────────────────────────
echo ""
warn "Add the following block to your Caddyfile and reload Caddy:"
echo ""
cat <<EOF
  <your-domain> {
      reverse_proxy localhost:${NODE_PORT} {
          header_up X-Real-IP {remote_host}
          header_up X-Forwarded-Proto {scheme}
      }
      header {
          Strict-Transport-Security "max-age=31536000"
          X-Content-Type-Options "nosniff"
          X-Frame-Options "DENY"
      }
  }
EOF
echo ""
warn "Then run: caddy reload"

# ── done ──────────────────────────────────────────────────────────────────────
echo ""
info "Installation complete."
echo ""
echo "  Next steps:"
echo "  1. Clone/copy your app to:  $APP_DIR"
echo "  2. Add the Caddy block above and reload Caddy"
echo "  3. Run the first deploy:    sudo bash $APP_DIR/scripts/deploy.sh"
echo "  4. Check logs:              journalctl -u $SERVICE_NAME -f"
echo ""
echo "  To update env vars: sudo nano /etc/pasta.env && sudo systemctl restart $SERVICE_NAME"
echo ""
