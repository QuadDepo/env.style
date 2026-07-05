<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/header/transparent.svg?title=env.style&subtitle=Environment-tinted+favicons+for+Next.js+and+Vite&align=left&border=false&font=geist-mono&mode=dark" />
  <img alt="env.style — Environment-tinted favicons for Next.js and Vite" src="https://shieldcn.dev/header/transparent.svg?title=env.style&subtitle=Environment-tinted+favicons+for+Next.js+and+Vite&align=left&border=false&font=geist-mono&mode=light" />
</picture>

<p align="center">
  <a href="https://github.com/QuadDepo/env.style/stargazers"><img alt="GitHub stars" src="https://shieldcn.dev/github/stars/QuadDepo/env.style.svg?variant=secondary&size=xs" /></a>
  <a href="https://github.com/QuadDepo/env.style/blob/main/LICENSE"><img alt="License" src="https://shieldcn.dev/github/license/QuadDepo/env.style.svg?variant=secondary&size=xs" /></a>
  <a href="https://github.com/QuadDepo/env.style/commits/main"><img alt="Last commit" src="https://shieldcn.dev/github/last-commit/QuadDepo/env.style.svg?variant=secondary&size=xs" /></a>
  <a href="https://env.style"><img alt="Website" src="https://shieldcn.dev/badge/visit-env.style.svg?variant=secondary&size=xs&logo=lu:Globe&color=000000" /></a>
</p>

Five browser tabs, all the same favicon: dev, preview, production.. and you keep
editing the wrong one. **env.style** tints your existing favicon per environment at build
time, Vercel-style: same mark, different color. Production is never touched.

<p align="center">
  <strong><a href="https://env.style">env.style</a> · <a href="./examples">Examples</a></strong>
</p>

## Install

```bash
pnpm add env.style
# or: npm install env.style
```

## Usage

### Next.js

```ts
// next.config.ts
import { withEnvStyles } from 'env.style'

export default withEnvStyles(nextConfig)
```

That's the only change needed. No layout edits, no manual favicon files.

### Vite

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { envStyle } from 'env.style/vite'

export default defineConfig({
  plugins: [react(), envStyle()],
})
```

## Default colors

| environment   | color              |
|---------------|--------------------|
| development   | `#3b82f6` blue     |
| preview       | `#f59e0b` amber    |
| anything else | `#6b7280` gray     |
| production    | never touched      |

Environment names are plain strings: whatever detection yields (e.g.
`ENV_STYLES_ENV=staging`, or a Vercel custom environment via `VERCEL_TARGET_ENV`) is
used as the `color` key. Any env without a color gets the gray fallback — except
`production`, which is never touched.

## Options

- `favicon?: boolean` — kill switch for the whole tool. Default `true`.
- `color?: Partial<Record<string, string>>` — override the tint color per environment.
- `environment?: string` — force the environment instead of detecting it.
- `excludeColors?: string[]` — keep pixels near these colors untinted (e.g. white
  backgrounds or marks in an icon that shouldn't shift).
- `icon?: string | Partial<Record<string, string>>` — path to a ready-made icon, or a
  per-environment map of paths (e.g. `{ staging: 'staging-icon.png' }`), served as-is
  for styled environments. Tinting and `excludeColors` are skipped entirely. An env
  missing from the map falls back to normal tinting.

```ts
export default withEnvStyles(nextConfig, {
  color: { staging: '#ff00ff' },
  excludeColors: ['#fff'],
})
```

## How it works

- Detects the environment: `environment` option → `ENV_STYLES_ENV` → `VERCEL_TARGET_ENV`
  → `VERCEL_ENV`. If none is set, Next.js falls back to `NODE_ENV`; Vite falls back to
  the command (dev server = development, `vite build` = production — set
  `ENV_STYLES_ENV` to tint a build).
- Tints your existing favicon with `sharp` and writes it to `public/__envstyle/`, which
  self-gitignores.
- Next.js: serves the tinted icon at your normal favicon URLs via `beforeFiles`
  rewrites, with `Cache-Control: no-store` so stale icons don't linger after switching
  envs.
- Vite: rewrites `<link rel="icon">` tags in `index.html` to point at the tinted icon
  (injecting one if none exists) and serves it with `no-store` from dev-server
  middleware.

## Known limits

- Environment is resolved at build time — a single build promoted across environments
  won't restyle.
- CDN-only favicons aren't intercepted; on Next.js, custom metadata `icons` paths
  aren't either.
- Icon source changes need a dev server or build restart to pick up.

## Development

- `pnpm test` — unit tests (vitest); `pnpm typecheck` — TypeScript.
- `pnpm test:visual` — fetches real brand favicons and writes a before/after tint
  gallery to `.tmp/visual/index.html` (needs network; Node >= 22.18 to run the `.ts`
  script directly).
- Runnable examples: `cd examples/nextjs && pnpm install && pnpm dev` (same for
  `examples/vite-react`) — the tab favicon should render tinted green.

<p align="center">
  <a href="https://github.com/QuadDepo/env.style/stargazers">
    <img alt="Star history" src="https://shieldcn.dev/chart/github/stars/QuadDepo/env.style.svg?bg=transparent&border=false&height=120" />
  </a>
</p>

<p align="center">
  <a href="https://github.com/QuadDepo/env.style/graphs/contributors">
    <img alt="Contributors" src="https://shieldcn.dev/contributors/QuadDepo/env.style.svg?limit=12&theme=zinc&bg=transparent&border=false" />
  </a>
</p>

## License

MIT
