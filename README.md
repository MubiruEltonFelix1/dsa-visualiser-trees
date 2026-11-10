# TreeViz (DSA Visualiser)

An interactive data structure visualiser. It renders general trees, binary search trees,
AVL balancing, 2-3 trees and Red-Black trees on a single canvas, with step-by-step
operation timelines you can rewind, and live invariant checks for the state currently on
screen.

The repository is named `dsa-visualiser`; the product name shown in the UI is **TreeViz**.

- **Stateless by design.** Every tree lives in React state in the browser. There is no
  database, no authentication, no file storage, and no third-party API. Nothing needs
  provisioning before the app runs.
- **Server-rendered.** TanStack Start renders HTML on the server so metadata and social
  previews work correctly, and the build output is a plain Node HTTP server.

## Contents

- [What the app does](#what-the-app-does)
- [Technology stack](#technology-stack)
- [Requirements](#requirements)
- [Local development](#local-development)
- [Environment variables](#environment-variables)
- [Production build](#production-build)
- [Deploy to Vercel](#deploy-to-vercel)
- [Deployment with Docker](#deployment-with-docker)
- [Deployment on a VPS](#deployment-on-a-vps)
- [Reverse proxy and HTTPS](#reverse-proxy-and-https)
- [Custom domain](#custom-domain)
- [Backup and restore](#backup-and-restore)
- [Troubleshooting](#troubleshooting)
- [Security notes](#security-notes)
- [License and attribution](#license-and-attribution)
- [Project layout](#project-layout)

## What the app does

| Mode               | Description                                                              |
| ------------------ | ------------------------------------------------------------------------ |
| General Tree       | Arbitrary node degree, editable tree, selectable nodes                   |
| Binary Search Tree | Build from a list, insert, delete, traversal visualisation               |
| AVL Balancing Lab  | Balance an existing BST and replay every rotation as immutable snapshots |
| 2-3 Tree           | Insert/delete with split and merge fix-ups                               |
| Red-Black Tree     | Insert/delete with recolouring and rotation fix-ups                      |

Shared across modes: statistics panel (node count, height, leaves, min/max), pre-order /
in-order / post-order / level-order traversals with playback speed control, invariant
checks with violation highlighting, and per-mode state that is preserved when you switch
tabs.

## Technology stack

| Concern         | Choice                                                      |
| --------------- | ----------------------------------------------------------- |
| UI framework    | React 19                                                    |
| Meta-framework  | TanStack Start 1.168 (SSR)                                  |
| Routing         | TanStack Router (file-based, `src/routes`)                  |
| Build tool      | Vite 8 (Rolldown)                                           |
| Server runtime  | Node 20.19+ via Nitro `node-server` (Vercel also supported) |
| Styling         | Tailwind CSS v4 + shadcn/ui (Radix primitives)              |
| Data fetching   | TanStack Query (provider only; the app fetches nothing)     |
| Tests           | Vitest + Testing Library (jsdom)                            |
| Package manager | Bun (lockfile: `bun.lock`)                                  |

There is no ORM, no database driver, and no auth library, because the app has no backend
data model.

## Requirements

- **Node.js 20.19 or newer** (or 22.12+). Node 22 LTS recommended.
- **Bun 1.3+** for dependency installation, matching the committed `bun.lock`.
  `npm install` also works if you prefer, but it will resolve from `package.json` instead
  of the lockfile.
- On Windows, no WSL is required; the toolchain is pure Node.

## Local development

```sh
git clone https://github.com/MubiruEltonFelix1/dsa-visualiser.git
cd dsa-visualiser
bun install
bun run dev
```

The dev server listens on <http://localhost:8080>.

Useful scripts:

| Command             | Purpose                                    |
| ------------------- | ------------------------------------------ |
| `bun run dev`       | Vite dev server with HMR on port 8080      |
| `bun run build`     | Production build into `.output/`           |
| `bun run start`     | Run the built server (needs `build` first) |
| `bun run preview`   | Alias of `start`                           |
| `bun run lint`      | ESLint                                     |
| `bun run typecheck` | `tsc --noEmit`                             |
| `bun run test`      | Vitest (single run)                        |
| `bun run format`    | Prettier write                             |

`preview` is deliberately **not** `vite preview`. TanStack Start's preview plugin imports
`dist/server/server.js`, which a Nitro build never writes, so `vite preview` answers every
request with a 500 `ERR_MODULE_NOT_FOUND`. Both `start` and `preview` boot the real build
output at `.output/server/index.mjs`.

## Environment variables

Copy the template and edit it:

```sh
cp .env.example .env
```

| Variable               | Scope                | Required    | Default   | Purpose                                                                                                                             |
| ---------------------- | -------------------- | ----------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_PUBLIC_SITE_URL` | Build time, public   | Recommended | empty     | Absolute origin used for canonical links, `og:url` and the social image URL, e.g. `https://treeviz.example.com`. No trailing slash. |
| `PORT`                 | Runtime, server only | No          | `3000`    | Port the production Node server binds.                                                                                              |
| `HOST`                 | Runtime, server only | No          | `0.0.0.0` | Interface the server binds. Keep `0.0.0.0` inside Docker.                                                                           |
| `APP_PORT`             | Docker Compose only  | No          | `3000`    | Host port published by `compose.yaml`.                                                                                              |

Notes:

- Anything prefixed with `VITE_` is **inlined into the browser bundle at build time**. It
  is public by definition. Changing it requires a rebuild, not a restart.
- Variables without the `VITE_` prefix are read at runtime by the Node server and never
  reach the browser.
- There are no secrets in this project. Do not add any to `.env`; nothing is server-side
  stateful enough to need one.
- `.env` is git-ignored. Only `.env.example` is committed.

## Production build

```sh
bun install --frozen-lockfile
VITE_PUBLIC_SITE_URL=https://your.domain bun run build
bun run start
```

`bun run build` writes:

```
.output/
  public/            static assets (client bundle, favicon, og-image, robots.txt)
  server/index.mjs   Node HTTP server, serves both the app and /api/health
```

Health check:

```sh
curl -fsS http://localhost:3000/api/health
# {"status":"ok","service":"treeviz","uptime":12.3,"timestamp":"..."}
```

`vite.config.ts` passes `nitro({ defaultPreset: "node-server" })`. That is a fallback
rather than a hard pin: known hosts are auto-detected (Vercel sets `VERCEL=1`), and
`NITRO_PRESET` overrides it explicitly, for example `NITRO_PRESET=vercel bun run build`.

## Deploy to Vercel

The project builds to Vercel's Build Output API with no extra configuration. Verified with
the pinned Nitro version:

```sh
NITRO_PRESET=vercel bun run build
# .vercel/output/config.json            Build Output API v3 routes
# .vercel/output/functions/__server.func streaming SSR function
# .vercel/output/static                 client bundle, favicon, og-image
```

Steps:

1. Push the repository to GitHub and import it at <https://vercel.com/new>.
2. Keep **Root Directory** at the repo root. Vercel detects Bun from `bun.lock` and runs
   `bun install`; the build command is `bun run build`.
3. Leave **Output Directory** empty. Vercel consumes `.vercel/output` automatically. Do not
   point it at `dist/` or `public/`.
4. Add `VITE_PUBLIC_SITE_URL` under **Settings -> Environment Variables** for Production
   (and Preview), set to the absolute origin.
5. Deploy, then check `https://your-app.vercel.app/api/health`.

Notes:

- You do not need `NITRO_PRESET` on Vercel; Nitro detects the platform from `VERCEL=1`. Use
  the variable only to reproduce the build locally or in CI.
- `PORT` and `HOST` are ignored on Vercel. Serverless functions manage their own lifecycle,
  and the app is stateless, so there is nothing to persist between invocations.
- Nitro's Vercel documentation warns that its `/api` directory convention differs from
  Nitro's own. That does not apply here: `/api/health` is a TanStack Start server route, and
  it is registered in the generated route config and the output's catch-all route.
- `VITE_PUBLIC_SITE_URL` is baked in at build time, so preview deployments carry the
  production canonical URL unless you set a separate value for the Preview environment.

## Deployment with Docker

Two stages: Bun builds the app, then the artifacts are copied onto a slim Node image and
run as the unprivileged `node` user.

```sh
cp .env.example .env          # set VITE_PUBLIC_SITE_URL to your real origin
docker compose up -d --build
curl -fsS http://localhost:3000/api/health
```

Without Compose:

```sh
docker build --build-arg VITE_PUBLIC_SITE_URL=https://your.domain -t treeviz:latest .
docker run -d --name treeviz -p 3000:3000 --restart unless-stopped treeviz:latest
```

Notes:

- `VITE_PUBLIC_SITE_URL` is a **build arg**, not a runtime variable, because it is baked
  into the client bundle. Rebuild the image when it changes.
- No volumes are declared: the container holds no state. Restarting or recreating it
  loses nothing, because all tree data lives in the visitor's browser.
- The Compose service runs with a read-only root filesystem, a small `/tmp` tmpfs, and
  `no-new-privileges`.
- Logs: `docker compose logs -f treeviz`.

## Deployment on a VPS

Any Linux host with Node 20.19+ works. Example for Debian/Ubuntu with a dedicated user:

```sh
# 1. Install Node 22 from NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs nginx

# 2. Create a service user and deploy the code
sudo useradd --system --create-home --shell /usr/sbin/nologin treeviz
sudo -u treeviz git clone https://github.com/MubiruEltonFelix1/dsa-visualiser.git /home/treeviz/app
cd /home/treeviz/app

# 3. Install Bun as the service user, then build
sudo -u treeviz bash -c 'curl -fsSL https://bun.sh/install | bash'
sudo -u treeviz bash -c 'cd /home/treeviz/app && /home/treeviz/.bun/bin/bun install --frozen-lockfile'
sudo -u treeviz sh -c 'cd /home/treeviz/app && VITE_PUBLIC_SITE_URL=https://your.domain /home/treeviz/.bun/bin/bun run build'
```

Create `/etc/systemd/system/treeviz.service`:

```ini
[Unit]
Description=TreeViz web app
After=network.target

[Service]
Type=simple
User=treeviz
WorkingDirectory=/home/treeviz/app
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=HOST=127.0.0.1
ExecStart=/usr/bin/node .output/server/index.mjs
Restart=always
RestartSec=5
# Hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=read-only
ReadWritePaths=/home/treeviz/app/.output

[Install]
WantedBy=multi-user.target
```

```sh
sudo systemctl daemon-reload
sudo systemctl enable --now treeviz
sudo systemctl status treeviz
curl -fsS http://127.0.0.1:3000/api/health
```

Binding to `127.0.0.1` keeps the Node process private; the reverse proxy is the only
thing exposed.

## Reverse proxy and HTTPS

### Nginx

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name treeviz.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name treeviz.example.com;

    ssl_certificate     /etc/letsencrypt/live/treeviz.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/treeviz.example.com/privkey.pem;

    # Static assets are content-hashed, so cache them hard.
    location /assets/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Everything else, including /api/health and every route, goes to Node.
    # Because the app renders on the server, a hard refresh on any route returns
    # 200 instead of 404 - no try_files fallback is needed.
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Obtain the certificate with `sudo certbot --nginx -d treeviz.example.com`.

### Caddy

Caddy obtains and renews certificates automatically:

```caddyfile
treeviz.example.com {
    encode zstd gzip
    reverse_proxy 127.0.0.1:3000
}
```

## Custom domain

1. Point an `A` (and `AAAA` if you have IPv6) record at the server's IP.
2. Set `VITE_PUBLIC_SITE_URL=https://your.domain` and rebuild, so canonical and Open
   Graph URLs use the real origin.
3. Configure the reverse proxy `server_name` / site address for that domain.
4. Issue the certificate (`certbot` or Caddy's automatic HTTPS).
5. Verify:

```sh
curl -sS https://your.domain/api/health
curl -sS https://your.domain/ | grep -o '<title>[^<]*</title>'
curl -sSI https://your.domain/some/deep/link   # expect 200, not 404
```

## Backup and restore

The application stores nothing on the server. There is no database, no uploads directory,
and no session store, so there is no runtime data to back up.

What is worth keeping:

| Item                   | Why                                         | How                                                                       |
| ---------------------- | ------------------------------------------- | ------------------------------------------------------------------------- |
| Git repository         | Source of truth                             | Push to GitHub; `git bundle create repo.bundle --all` for an offline copy |
| `.env` (if customised) | Build inputs such as `VITE_PUBLIC_SITE_URL` | Store in your password manager or a secret store                          |
| Built image            | Fast rollback                               | `docker save treeviz:latest -o treeviz-$(date +%F).tar`                   |

Restore is therefore a redeploy: clone the repository, restore `.env`, rebuild, restart.

## Troubleshooting

**`bun: command not found`.** Install Bun (`curl -fsSL https://bun.sh/install | bash`) or
use `npm install` instead.

**Port 8080 already in use in dev.** Change `server.port` in `vite.config.ts`.

**`bun run start` fails with "Cannot find module .output/server/index.mjs".** Run
`bun run build` first; `.output/` is generated and git-ignored.

**`vite preview` returns 500 with `ERR_MODULE_NOT_FOUND` for `dist/server/server.js`.** That
command cannot serve a Nitro build. TanStack Start's preview plugin imports
`dist/server/server.js`, while this build writes `.output/`, so every request fails on the
import. Use `bun run preview` (an alias of `bun run start`). The
`[nitro] You can preview this build using vite preview` hint printed after a build is
generic and does not apply to a TanStack Start project.

**Refresh returns 404 behind Nginx.** Every request must reach Node, including deep
paths. Do not serve the app with a plain `root`/`try_files` static config; proxy to the
Node process instead.

**Social preview shows no image.** `VITE_PUBLIC_SITE_URL` must be set to the absolute
public origin at build time. Crawlers do not resolve relative `og:image` URLs.

**Fonts do not load on an air-gapped network.** Space Grotesk and JetBrains Mono are
fetched from Google Fonts in `src/routes/__root.tsx`. Vendor them locally if the
deployment has no outbound internet access.

**Build fails with EPERM/EBUSY on Windows.** A dev server is holding `.output/` or the
Vite cache. Stop `bun run dev`, then rebuild.

**Typecheck fails in `vitest.config.ts` / `vite.config.ts`.** Those files use Node APIs;
`tsconfig.json` includes `"node"` in `types` for that reason. Re-run `bun install` if
`@types/node` is missing.

## Security notes

- No secrets exist in the repository, and none are needed at runtime.
- Only `VITE_*` variables reach the browser. Do not put anything private behind that
  prefix.
- Server functions are protected by TanStack Start's CSRF middleware
  (`src/start.ts`), which filters on `handlerType === "serverFn"`.
- Client code cannot import server modules: `vite.config.ts` enables `importProtection`,
  so such an import fails the build instead of leaking server code.
- The Docker image runs as a non-root user with a read-only root filesystem. The systemd
  unit above applies `NoNewPrivileges`, `ProtectSystem=strict` and a read-only home.
- Terminate TLS at the reverse proxy and keep Node bound to `127.0.0.1` on a VPS.

## License and attribution

No `LICENSE` file exists in this repository yet. Before distributing the project you
should add one, since the absence of a license means the default "all rights reserved"
applies.

Third-party components keep their own licenses. All runtime and build dependencies are
declared in `package.json` with their original license metadata intact; inspect them with:

```sh
bun pm ls            # or: npm ls --all
npx license-checker --summary
```

Notable attributions:

- shadcn/ui components under `src/components/ui` are distributed under the MIT license and
  were copied into this repository rather than installed as a dependency.
- Radix UI primitives, Tailwind CSS, TanStack (Router, Start, Query), React, and Lucide
  icons are all MIT licensed.
- Space Grotesk and JetBrains Mono are served from Google Fonts under the SIL Open Font
  License.

Do not remove copyright or license headers from vendored files.

## Project layout

```
src/
  routes/
    __root.tsx         app shell, global metadata, error and 404 pages
    index.tsx          the whole visualiser page
    api/health.ts      health check endpoint
  components/
    treeviz/           canvas, controls, labs, panels
    ui/                shadcn/ui primitives
  lib/
    bst.ts general.ts  tree models
    avl.ts two-three.ts red-black.ts   algorithms returning immutable snapshots
    traversal.ts       traversal algorithms and stats
    layout.ts          node positioning
    invariants.ts      read-only invariant checks
    site.ts            branding and shareable metadata
    error-capture.ts error-page.ts     SSR error reporting
  server.ts            SSR entry wrapper
  start.ts             request middleware (error handling, CSRF)
  styles.css           Tailwind v4 theme tokens
public/                favicon, apple-touch-icon, og-image, robots.txt
Dockerfile compose.yaml .env.example    self-hosting setup
DEPLOYMENT.md          step-by-step deployment checklist
```
