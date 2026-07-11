# Development

## Repository structure

```
env.style/
├── packages/env.style/    # The npm package (source, tests, build config)
├── apps/web/              # Documentation website (Next.js + Tailwind)
├── examples/              # Runnable example projects
│   ├── nextjs/
│   ├── sveltekit/
│   ├── tanstack-start/
│   └── vite-react/
├── .github/workflows/     # CI + Release pipelines
├── pnpm-workspace.yaml    # Workspace config
└── biome.json             # Shared linter/formatter config
```

## Setup

```bash
pnpm install
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm typecheck` | TypeScript type checking |
| `pnpm test` | Unit tests (vitest) |
| `pnpm lint` | Lint (biome) |
| `pnpm format` | Format (biome) |
| `pnpm build` | Build the package (tsup) |

## Visual test

Fetches real brand favicons and writes a before/after tint gallery to
`.tmp/visual/index.html`. Requires network access and Node >= 22.18.

```bash
pnpm test:visual
```

## Examples

Runnable example projects are in the `examples/` directory:

```bash
cd examples/nextjs && pnpm install && pnpm dev
cd examples/sveltekit && pnpm install && pnpm dev
cd examples/tanstack-start && pnpm install && pnpm dev
cd examples/vite-react && pnpm install && pnpm dev
```

The tab favicon should render tinted in the development color.
