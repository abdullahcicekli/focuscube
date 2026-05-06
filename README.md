<p align="center">
  <img src="apps/web/public/icon.png" alt="focuscube" width="60" height="60" />
</p>

<h1 align="center">focuscube</h1>

<p align="center">
  A minimal focus timer built around the <strong>Atomic Habits 1% rule</strong> and the <strong>pomodoro technique</strong>.
</p>

---

Pick a 5, 25, or 60-minute session — or 14 minutes 24 seconds, exactly **1% of your day** — and disappear into deep work.

The interface is a single 3D cube you can roll between modes. Sign in with Google or GitHub to track stats and a daily streak. A soft chime closes each session.

## Modes

| Mode | Duration | Idea |
| --- | --- | --- |
| 5 | 5 min | A short reset |
| 1% | 14 min 24 sec | 1% of a 24-hour day |
| 25 | 25 min | Classic pomodoro |
| 60 | 60 min | Deep work / full flow |

## Monorepo layout

```
focuscube/
├─ apps/
│  ├─ web/        # React + Vite frontend → focuscube.app (Cloudflare Pages)
│  └─ api/        # Hono on Cloudflare Workers → api.focuscube.app (D1-backed)
├─ .github/workflows/
│  ├─ deploy-web.yml
│  └─ deploy-api.yml
└─ package.json   # npm workspaces root
```

## Stack

- **Web**: React 19, TypeScript, Vite, Tailwind 4, Three.js (`@react-three/fiber` + `drei`), Radix UI / shadcn, TBJ Serial Port Monospace.
- **API**: Hono on Cloudflare Workers, D1 (SQLite at the edge), session cookies, OAuth (Google + GitHub) — auth wires up in Phase 2.
- **Infra**: Cloudflare Pages (web) + Workers (api), GitHub Actions auto-deploy on push to `main`.

## Run locally

From the repo root:

```bash
npm install                 # installs both workspaces

npm run dev                 # web → http://localhost:5173
npm run dev:api             # api → http://localhost:8787 (Wrangler dev)
```

## Build & deploy

CI handles deploys on push to `main` (see workflows). Manual deploys:

```bash
npm run deploy:web          # build + wrangler pages deploy
npm run deploy:api          # wrangler deploy (Worker)
```

## D1 setup (one-time)

```bash
# 1. Create the D1 database
npm run db:create --workspace=@focuscube/api
# → copy the printed `database_id` into apps/api/wrangler.toml

# 2. Apply migrations locally (for `npm run dev:api`)
npm run db:migrate:local --workspace=@focuscube/api

# 3. Apply migrations to the real D1 (CI does this automatically on every deploy)
npm run db:migrate:remote --workspace=@focuscube/api
```

## Required GitHub Actions secrets

| Secret | Where to get it |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Cloudflare dashboard → My Profile → API Tokens → Create Token (template: *Edit Cloudflare Workers* + *D1: Edit* + *Pages: Edit*). |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard → Workers & Pages → right sidebar. |

## Worker secrets (set after first deploy)

```bash
cd apps/api
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET
wrangler secret put SESSION_SECRET   # any 32+ char random string
```

## License

MIT — see [LICENSE](LICENSE).
