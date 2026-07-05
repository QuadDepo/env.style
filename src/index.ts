import path from 'node:path'
import type { NextConfig } from 'next'
import { detectEnv, resolveColor, validateColorOptions, type EnvStylesOptions } from './env'
import { customIconPng, findSourceIcons, iconUrl, TINTED_ICON_URL, tintIcon, writeTintedIcon } from './tint'

export type { EnvStylesOptions } from './env'

type PhaseCtx = { defaultConfig: NextConfig }
type NextConfigFn = (phase: string, ctx: PhaseCtx) => NextConfig | Promise<NextConfig>
export type NextConfigInput = NextConfig | NextConfigFn

const NEXT_ICON_CANDIDATES = [
  'app/favicon.ico',
  'src/app/favicon.ico',
  'app/icon.ico',
  'src/app/icon.ico',
  'app/icon.png',
  'app/icon.svg',
  'app/icon.jpg',
  'app/icon.jpeg',
  'src/app/icon.png',
  'src/app/icon.svg',
  'src/app/icon.jpg',
  'src/app/icon.jpeg',
  'public/favicon.ico',
  'public/favicon.png',
  'public/favicon.svg',
]

export function withEnvStyles(
  nextConfig: NextConfigInput = {},
  options: EnvStylesOptions = {},
): NextConfigInput {
  const env = detectEnv(options.environment, () =>
    process.env.NODE_ENV === 'development' ? 'development' : 'production'
  )
  validateColorOptions(options)
  if (options.favicon === false || env === 'production') return nextConfig // zero footprint

  const color = resolveColor(env, options.color)

  return async (phase, ctx) => {
    const config = typeof nextConfig === 'function' ? await nextConfig(phase, ctx) : nextConfig
    return decorate(config, color, options.excludeColors ?? [], options.icon)
  }
}

async function decorate(config: NextConfig, color: string, excludeColors: string[], customIcon?: string): Promise<NextConfig> {
  const root = process.cwd()
  const icons = findSourceIcons(root, NEXT_ICON_CANDIDATES)
  const sources = [...new Set(['/favicon.ico', ...icons.map(iconUrl)])]

  try {
    const png =
      (await customIconPng(root, customIcon)) ?? (await tintIcon(icons[0] ?? null, color, excludeColors))
    await writeTintedIcon(path.join(root, 'public'), png)
  } catch (err) {
    console.warn(`env.style: favicon tinting skipped — ${err instanceof Error ? err.message : err}`)
    return config
  }

  return {
    ...config,
    rewrites: mergeRewrites(config.rewrites, sources.map((source) => ({ source, destination: TINTED_ICON_URL }))),
    headers: mergeHeaders(config.headers, [...sources, TINTED_ICON_URL]),
  }
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
