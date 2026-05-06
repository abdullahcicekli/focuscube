<p align="center">
  <img src="public/icon.png" alt="focuscube" width="60" height="60" />
</p>

<h1 align="center">focuscube</h1>

<p align="center">
  A minimal focus timer built around the <strong>Atomic Habits 1% rule</strong> and the <strong>pomodoro technique</strong>.
</p>

---

Pick a 5, 25, or 60-minute session — or 14 minutes 24 seconds, exactly **1% of your day** — and disappear into deep work.

The interface is a single 3D cube you can roll between modes. No notifications, no streaks, no nudges. Just a soft chime when the time is up.

## Modes

| Mode | Duration | Idea |
| --- | --- | --- |
| 5 | 5 min | A short reset |
| 1% | 14 min 24 sec | 1% of a 24-hour day |
| 25 | 25 min | Classic pomodoro |
| 60 | 60 min | Deep work / full flow |

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS 4
- Three.js via `@react-three/fiber` and `@react-three/drei`
- Radix UI primitives + shadcn-style components
- TBJ Serial Port Monospace for the pixel display
- Cloudflare Pages

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
```

## Build & deploy

```bash
npm run build      # tsc + vite build → dist/
npm run preview    # serve the production build locally
npm run deploy     # wrangler pages deploy dist
```

First-time deploy needs `npx wrangler login`. Pages project name lives in `wrangler.toml`.

## Project layout

```
src/
  App.tsx                  # timer UI
  components/
    FocusCube3D.tsx        # three.js cube (fiber + drei)
    Navbar.tsx
    LoginModal.tsx
    ui/                    # shadcn-style primitives
  lib/
    chime.ts               # WebAudio chime
    screenTexture.ts       # pixel digit canvas texture
    utils.ts
  index.css                # Tailwind v4 + tokens
public/
  fonts/                   # TBJ Serial Port Monospace
  og-image.png
  robots.txt
  sitemap.xml
  site.webmanifest
  _headers
  _redirects
```

## License

MIT — see [LICENSE](LICENSE).
