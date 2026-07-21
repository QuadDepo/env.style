# env.style

Environment-tinted favicons for Next.js, Vite, and Waku. See at a glance whether a tab is dev, preview, staging, or production.

## Install

```bash
pnpm add env.style
# or: npm install env.style
```

## Next.js

```ts
// next.config.ts
import { withEnvStyles } from 'env.style'

export default withEnvStyles(nextConfig)
```

That's the only change needed. No layout edits, no manual favicon files.

## Vite

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { envStyle } from 'env.style/vite'

export default defineConfig({
  plugins: [react(), envStyle()],
})
```

## Waku

Waku exposes Vite plugins through the `vite` field in `waku.config.ts`:

```ts
// waku.config.ts
import { envStyle } from 'env.style/waku'
import { defineConfig } from 'waku/config'

export default defineConfig({
  vite: {
    plugins: [envStyle()],
  },
})
```

Add `EnvStyle` to the root layout. Waku hoists the generated `<link>` elements into
the document head:

```tsx
// src/pages/_layout.tsx
import { EnvStyle } from 'env.style/waku'
import type { ReactNode } from 'react'

export default async function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <>
      <EnvStyle />
      {children}
    </>
  )
}

export const getConfig = async () => ({ render: 'static' } as const)
```

The component is required because Waku creates its document metadata from React
layouts instead of a project `index.html`. It automatically renders nothing for
production and omits the Apple touch icon when `pwa: false` is configured on the
plugin.

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

### `withEnvStyles(nextConfig?, options?): NextConfigInput`

**Next.js only.** Wraps your `next.config.ts` and injects rewrites + headers to serve
the tinted favicon. Works with both plain object and function-form configs.

### `envStyle(options?): Plugin`

**Vite and Waku.** Returns a Vite plugin that tints the favicon. In regular Vite
apps it also rewrites `<link rel="icon">` tags in `index.html`; Waku uses the
`EnvStyle` component instead.

### `EnvStyle(): ReactElement | null`

**Waku only.** Renders the active environment's favicon and Apple touch icon links
for Waku to hoist into the document head. Import it from `env.style/waku` and place
it in `src/pages/_layout.tsx`.

### `EnvStylesOptions`

| Option          | Type                                      | Default     | Description                                                                 |
|-----------------|-------------------------------------------|-------------|-----------------------------------------------------------------------------|
| `enabled`       | `boolean`                                 | `true`      | Kill switch for the whole tool.                                             |
| `color`         | `Partial<Record<string, string>>`         | see above   | Override the tint color per environment (hex string).                       |
| `environment`   | `string`                                  | auto-detect | Force the environment instead of detecting it.                              |
| `excludeColors` | `string[]`                                | `[]`        | Keep pixels near these hex colors untinted (e.g. `['#fff']` for white).    |
| `icon`          | `string \| Partial<Record<string, string>>`| `undefined` | Path to a ready-made icon, or a per-environment map of paths.              |

#### Examples

```ts
// Custom colors
withEnvStyles(nextConfig, {
  color: { staging: '#ff00ff' },
})

// Exclude white pixels from tinting
withEnvStyles(nextConfig, {
  excludeColors: ['#fff'],
})

// Single custom icon for all non-production envs
withEnvStyles(nextConfig, {
  icon: 'custom-dev-icon.png',
})

// Per-environment icons
withEnvStyles(nextConfig, {
  icon: {
    development: 'dev-icon.png',
    staging: 'staging-icon.png',
  },
})
```

When a custom icon is provided for the active environment, it is served as-is — tinting
and `excludeColors` are skipped entirely. An env missing from the map falls back to
normal tinting.

## Environment detection

1. `environment` option (if provided)
2. `ENV_STYLES_ENV` env var
3. `VERCEL_TARGET_ENV` env var
4. `VERCEL_ENV` env var
5. Framework default:
   - **Next.js:** `NODE_ENV === 'development' ? 'development' : 'production'`
   - **Vite:** `command === 'serve' ? 'development' : 'production'`
   - **Waku:** uses the Vite command (`waku dev` is development, `waku build` is production)

## How it works

- Detects the environment (see precedence above).
- Tints your existing favicon with `sharp` and writes it to `public/__envstyle/`, which
  self-gitignores.
- **Next.js:** serves the tinted icon at your normal favicon URLs via `beforeFiles`
  rewrites, with `Cache-Control: no-store` so stale icons don't linger after switching
  envs.
- **Vite:** rewrites `<link rel="icon">` tags in `index.html` to point at the tinted icon
  (injecting one if none exists) and serves it with `no-store` from dev-server
  middleware.
- **Waku:** generates the same assets through Waku's Vite configuration. `EnvStyle`
  emits matching links from the root layout, and Waku copies the generated assets to
  `dist/public` for production builds.

## Known limits

- Environment is resolved at build time — a single build promoted across environments
  won't restyle.
- CDN-only favicons aren't intercepted; on Next.js, custom metadata `icons` paths
  aren't either.
- Icon source changes need a dev server or build restart to pick up.

## License

MIT
