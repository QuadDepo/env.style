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

export function detectEnv(override: string | undefined, nodeEnvDefault: () => string): string {
  return (
    override ??
    process.env.ENV_STYLES_ENV ??
    process.env.VERCEL_TARGET_ENV ??
    process.env.VERCEL_ENV ??
    nodeEnvDefault()
  )
}
