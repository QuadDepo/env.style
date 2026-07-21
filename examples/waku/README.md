# env.style — Waku example

```bash
pnpm install
pnpm dev
```

The example wires `envStyle()` into `waku.config.ts` through Waku's `vite.plugins`
field and renders `<EnvStyle />` in `src/pages/_layout.tsx`. The tab favicon should
be green in development and untouched in production.
