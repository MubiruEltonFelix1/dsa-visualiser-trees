# Deployment checklist

Step-by-step procedure for putting this app on a server. The app is stateless, so there
are no migrations, seeds, or database restores to run.

## 1. Before you deploy

- [ ] Decide the public origin, e.g. `https://treeviz.example.com`.
- [ ] Point DNS: `A` record to the server IPv4, `AAAA` to IPv6 if available.
- [ ] Confirm the server has Node 20.19+ (VPS) or Docker 24+ (container).
- [ ] Have the certificate path ready (`certbot` or Caddy automatic HTTPS).

## 2. Build

On the server or in CI:

```sh
git clone https://github.com/MubiruEltonFelix1/dsa-visualiser.git
cd dsa-visualiser
bun install --frozen-lockfile
cp .env.example .env
# edit .env -> VITE_PUBLIC_SITE_URL=https://treeviz.example.com
set -a && . ./.env && set +a      # export the build-time variable
bun run lint
bun run typecheck
bun run test
bun run build
```

- [ ] `lint`, `typecheck`, `test` and `build` all exit 0.
- [ ] `.output/server/index.mjs` and `.output/public/` exist.
- [ ] `VITE_PUBLIC_SITE_URL` was set **before** the build, not after.

## 3. Smoke test locally before exposing it

```sh
PORT=3000 bun run start
curl -fsS http://127.0.0.1:3000/api/health
curl -sS  http://127.0.0.1:3000/ | grep -o '<title>[^<]*</title>'
```

- [ ] Health endpoint returns `{"status":"ok",...}`.
- [ ] The HTML title is `TreeViz`, with no third-party branding.
- [ ] Opening `/` in a browser renders the tree canvas and the five mode tabs.

## 4. Choose one deployment route

### A. Docker Compose (recommended for a single VPS)

```sh
cp .env.example .env
docker compose build
docker compose up -d
docker compose ps
curl -fsS http://127.0.0.1:3000/api/health
```

- [ ] Container status is `healthy`.
- [ ] `docker compose logs --tail=50 treeviz` shows no startup errors.

### B. systemd + Node (no Docker)

Follow [README.md -> Deployment on a VPS](README.md#deployment-on-a-vps), then:

```sh
sudo systemctl enable --now treeviz
sudo systemctl status treeviz
journalctl -u treeviz -n 50 --no-pager
```

- [ ] Service is `active (running)`.
- [ ] `curl -fsS http://127.0.0.1:3000/api/health` succeeds from the host.

### C. Vercel

```sh
NITRO_PRESET=vercel bun run build      # produces .vercel/output (Build Output API v3)
npx vercel deploy --prebuilt           # or import the repo from the Vercel dashboard
```

Dashboard settings when importing from Git:

| Setting       | Value                                                  |
| ------------- | ------------------------------------------------------ |
| Framework     | auto-detected (Nitro)                                  |
| Build command | `bun run build`                                        |
| Output dir    | leave empty (Vercel reads `.vercel/output`)            |
| Env var       | `VITE_PUBLIC_SITE_URL=https://your.domain` (Prod+Prev) |

- [ ] `NITRO_PRESET=vercel bun run build` creates `.vercel/output/config.json`.
- [ ] Deployment succeeds and `https://<app>.vercel.app/api/health` returns `ok`.
- [ ] Sections 5 onward (reverse proxy, TLS, systemd) are skipped for this route.

## 5. Reverse proxy and TLS

- [ ] Nginx or Caddy site config points the domain at `127.0.0.1:3000`.
- [ ] `nginx -t` passes, then `sudo systemctl reload nginx`.
- [ ] Certificate issued and auto-renewal verified (`sudo certbot renew --dry-run`).
- [ ] HTTP redirects to HTTPS.

## 6. Post-deploy verification

```sh
curl -sSI https://treeviz.example.com/                     # 200
curl -sSI https://treeviz.example.com/any/deep/route        # 200, not 404
curl -fsS  https://treeviz.example.com/api/health           # ok
curl -sS   https://treeviz.example.com/ | grep -c 'lovable'  # expect 0
```

- [ ] Home page returns 200 over HTTPS.
- [ ] A hard refresh on a non-root path returns 200 (SSR handles all routes).
- [ ] `/api/health` is reachable through the proxy.
- [ ] No `lovable` string appears in served HTML.
- [ ] `og:image` resolves to an absolute URL on your domain (paste the page URL into a
      social preview debugger).
- [ ] Favicon in the browser tab is the TreeViz mark, not a third-party logo.
- [ ] Security headers present if you added them at the proxy.

## 7. Rollback

Because there are no migrations, rollback is just "run the previous build".

**Docker:**

```sh
docker image ls treeviz                       # find the previous tag
docker tag treeviz:previous treeviz:latest
docker compose up -d --force-recreate
curl -fsS http://127.0.0.1:3000/api/health
```

To roll back to an older commit instead:

```sh
git checkout <previous-tag-or-sha>
docker compose build && docker compose up -d
```

**systemd + Node:**

```sh
cd /home/treeviz/app
git checkout <previous-tag-or-sha>
sudo -u treeviz sh -c 'VITE_PUBLIC_SITE_URL=https://treeviz.example.com ./.bun/bin/bun run build'
sudo systemctl restart treeviz
curl -fsS http://127.0.0.1:3000/api/health
```

- [ ] Health endpoint returns `ok` after the rollback.
- [ ] The previously broken behaviour is gone.

## 8. Ongoing operations

- [ ] Log rotation in place (`journalctl` or Docker's default json-file driver with
      `max-size`).
- [ ] Uptime monitor pointed at `/api/health`.
- [ ] Renovate or Dependabot watching `package.json` and `bun.lock`.
- [ ] Rebuild scheduled after base image updates (`node:22-slim`, `oven/bun:1-slim`).
- [ ] Re-run `bun run test` and `bun run build` before every deploy.

## Quick reference

| Item              | Value                                                     |
| ----------------- | --------------------------------------------------------- |
| Dev server        | `bun run dev` on port 8080                                |
| Production server | `node .output/server/index.mjs` on `PORT` (default 3000)  |
| Health endpoint   | `GET /api/health`                                         |
| Build output      | `.output/`                                                |
| Runtime data      | none (stateless)                                          |
| Required env vars | `VITE_PUBLIC_SITE_URL` (build), `PORT` / `HOST` (runtime) |
