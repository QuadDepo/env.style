import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { NextConfig } from 'next'
import { detectEnv, type EnvStylesOptions } from './env'
import { DEFAULT_COLORS, FALLBACK_COLOR, findSourceIcons, iconUrl, parseHex, tintIcon, toPngBase } from './tint'

export type { EnvStylesOptions } from './env'

type PhaseCtx = { defaultConfig: NextConfig }
type NextConfigFn = (phase: string, ctx: PhaseCtx) => NextConfig | Promise<NextConfig>
export type NextConfigInput = NextConfig | NextConfigFn

const OUT_DIR = '__envstyle'

export function withEnvStyles(
  nextConfig: NextConfigInput = {},
  options: EnvStylesOptions = {},
): NextConfigInput {
  const env = detectEnv(options.environment, () =>
    process.env.NODE_ENV === 'development' ? 'development' : 'production'
  )
  // fail loudly on a bad config value, not mid-build
  for (const value of Object.values(options.color ?? {})) {
    if (value !== undefined) parseHex(value)
  }
  for (const value of options.excludeColors ?? []) parseHex(value)
  if (options.favicon === false || env === 'production') return nextConfig // zero footprint

  const color = options.color?.[env] ?? DEFAULT_COLORS[env] ?? FALLBACK_COLOR

  return async (phase, ctx) => {
    const config = typeof nextConfig === 'function' ? await nextConfig(phase, ctx) : nextConfig
    return decorate(config, color, options.excludeColors ?? [], options.icon)
  }
}

async function decorate(config: NextConfig, color: string, excludeColors: string[], customIcon?: string): Promise<NextConfig> {
  const root = process.cwd()
  const icons = findSourceIcons(root)
  const sources = [...new Set(['/favicon.ico', ...icons.map(iconUrl)])]
  const destination = `/${OUT_DIR}/icon.png`

  try {
    const png =
      (await customIconPng(root, customIcon)) ?? (await tintIcon(icons[0] ?? null, color, excludeColors))
    const outDir = path.join(root, 'public', OUT_DIR)
    await mkdir(outDir, { recursive: true })
    await writeFile(path.join(outDir, 'icon.png'), png)
    await writeFile(path.join(outDir, '.gitignore'), '*\n')
  } catch (err) {
    console.warn(`env.style: favicon tinting skipped — ${err instanceof Error ? err.message : err}`)
    return config
  }

  return {
    ...config,
    rewrites: mergeRewrites(config.rewrites, sources.map((source) => ({ source, destination }))),
    headers: mergeHeaders(config.headers, [...sources, destination]),
  }
}

/** A custom icon is the user's own env styling — serve it untouched. */
async function customIconPng(root: string, customIcon?: string): Promise<Buffer | null> {
  if (!customIcon) return null
  const resolved = path.resolve(root, customIcon)
  const png = existsSync(resolved) ? await toPngBase(resolved) : null
  if (!png) console.warn(`env.style: icon "${customIcon}" not readable — falling back to auto-discovery`)
  return png
}

type OurRewrite = { source: string; destination: string }

function mergeRewrites(user: NextConfig['rewrites'], ours: OurRewrite[]): NextConfig['rewrites'] {
  return async () => {
    const existing = user ? await user() : []
    if (Array.isArray(existing)) {
      // plain-array user rewrites have afterFiles semantics
      return { beforeFiles: ours, afterFiles: existing, fallback: [] }
    }
    return { ...existing, beforeFiles: [...ours, ...(existing.beforeFiles ?? [])] }
  }
}

function mergeHeaders(user: NextConfig['headers'], paths: string[]): NextConfig['headers'] {
  // favicons are cached aggressively; a stale one after an env switch reads as broken
  const ours = paths.map((source) => ({
    source,
    headers: [{ key: 'Cache-Control', value: 'no-store' }],
  }))
  return async () => [...(user ? await user() : []), ...ours]
}
