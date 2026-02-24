# pasta

A self-hosted pastebin / file editor. Upload or create code and text files, view them with syntax highlighting, and share them via a short URL. Markdown files render as a rich document. Write operations are protected by a single password.

## Stack

- **Next.js 16** (App Router, standalone output)
- **@libsql/client** — SQLite, file at `data/pasta.db`
- **CodeMirror 6** — syntax-highlighted editor/viewer
- **jose** — JWT auth via httpOnly cookie
- **Tailwind CSS v4**
- **Caddy** — TLS termination + reverse proxy

---

## Development

```bash
cp .env.local.example .env.local   # fill in values
npm install
npm run dev
```

Open http://localhost:3000 — you'll see the login form.

### Environment variables

| Variable | Description |
|----------|-------------|
| `AUTH_PASSWORD` | Password to log in |
| `JWT_SECRET` | Random secret for signing JWTs — generate with `openssl rand -hex 32` |
| `PORT` | Port Next.js listens on (default `3000`) |
| `NODE_ENV` | `development` or `production` |

Create `.env.local` in the project root (gitignored):

```
AUTH_PASSWORD=your-strong-password
JWT_SECRET=<openssl rand -hex 32>
PORT=3000
NODE_ENV=development
```

---

## Production deployment

### Quick deploy (scripts)

Two scripts in `scripts/` handle first-time setup and every subsequent deploy:

| Script | Purpose |
|--------|---------|
| `scripts/install.sh` | First-time: installs Node.js, systemd service, env file (Caddy managed separately) |
| `scripts/deploy.sh` | Every deploy: pull → build → copy assets → restart service → health check |

```bash
# First time — run on server as root
sudo bash scripts/install.sh

# Every deploy — run as app user (or from CI via ssh)
bash scripts/deploy.sh

# Skip git pull (e.g. CI already checked out the code)
SKIP_PULL=1 bash scripts/deploy.sh
```

---

### Manual deployment steps

### 1. Build

```bash
npm run build
```

This produces `.next/standalone/` — a self-contained Node server.

### 2. Copy runtime files

The standalone build does **not** include `public/`, `static assets`, or `.env.local`. Copy them manually after each build:

```bash
# Run from the project root on the server
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
```

### 3. Environment variables

**Do not rely on `.env.local` in production** — it is gitignored and not copied into the standalone bundle.

Set variables via your process manager instead.

**PM2 (recommended)** — create `ecosystem.config.js` in the project root:

```js
module.exports = {
  apps: [{
    name: 'pasta',
    script: '.next/standalone/server.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      AUTH_PASSWORD: 'your-strong-password',
      JWT_SECRET: 'your-32-byte-hex-secret',
    },
  }],
}
```

Then:

```bash
pm2 start ecosystem.config.js
pm2 save          # persist across reboots
pm2 startup       # generate systemd/launchd hook
```

**systemd alternative** — add to the `[Service]` section:

```ini
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=AUTH_PASSWORD=your-strong-password
Environment=JWT_SECRET=your-32-byte-hex-secret
ExecStart=/usr/bin/node /app/.next/standalone/server.js
```

### 4. Data directories

Create these on the server before first run (they are gitignored):

```bash
mkdir -p data files
```

- `data/pasta.db` — SQLite database (auto-created on first request)
- `files/` — uploaded file contents

### 5. Caddy

```caddyfile
pasta.example.com {
    reverse_proxy localhost:3000 {
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }
    header {
        Strict-Transport-Security "max-age=31536000"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
    }
}
```

```bash
caddy reload
```

---

## Updating

```bash
git pull
npm install
npm run build
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
pm2 restart pasta
```

---

## Backup

Everything lives in two places:

```bash
# Database
cp data/pasta.db data/pasta.db.bak

# File contents
tar -czf files-backup.tar.gz files/
```

For automated backups, back up both `data/` and `files/` together — they must stay in sync (a DB row without its file, or vice versa, will cause errors).

---

## Health check

```
GET /api/health
→ { "ok": true, "ts": "2026-01-01T00:00:00.000Z" }
```
