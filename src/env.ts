import { parseHex } from './tint'

export interface EnvStylesOptions {
  /** Kill switch for the whole tool. Default true. */
  favicon?: boolean
  /** Per-environment tint color override, e.g. { staging: '#ff00ff' }. */
  color?: Partial<Record<string, string>>
  /** Force the environment instead of detecting it. */
  environment?: string
  /** Keep pixels near these colors untinted. */
  excludeColors?: string[]
  /**
   * Path to a ready-made icon, relative to the project root (absolute also allowed).
   * Served as-is for styled envs — tinting and excludeColors are skipped entirely.
   */
  icon?: string
}

export const DEFAULT_COLORS: Record<string, string> = {
  development: '#3b82f6',
  preview: '#f59e0b',
}
export const FALLBACK_COLOR = '#6b7280'

export function detectEnv(override: string | undefined, frameworkDefault: () => string): string {
  return (
    override ??
    process.env.VERCEL_TARGET_ENV ??
    process.env.VERCEL_ENV ??
    process.env.ENV_STYLES_ENV ??
    frameworkDefault()
  )
}

/** Fail loudly on a bad config value, not mid-build. */
export function validateColorOptions(options: EnvStylesOptions): void {
  for (const value of Object.values(options.color ?? {})) {
    if (value !== undefined) parseHex(value)
  }
  for (const value of options.excludeColors ?? []) parseHex(value)
}

export function resolveColor(env: string, overrides: EnvStylesOptions['color']): string {
  return overrides?.[env] ?? DEFAULT_COLORS[env] ?? FALLBACK_COLOR
}
