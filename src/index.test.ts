import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextConfig } from 'next'
import { withEnvStyles, type NextConfigInput } from './index'

let dir: string
let prevCwd: string

beforeEach(async () => {
  prevCwd = process.cwd()
  dir = await mkdtemp(path.join(tmpdir(), 'envstyle-'))
  process.chdir(dir)
})

afterEach(() => {
  process.chdir(prevCwd)
  vi.unstubAllEnvs()
})

const DEV = { environment: 'development' }

/** Run the wrapper's returned function form and hand back the final config. */
async function resolve(result: NextConfigInput): Promise<NextConfig> {
  expect(typeof result).toBe('function')
  return (result as (phase: string, ctx: { defaultConfig: NextConfig }) => Promise<NextConfig>)(
    'phase-test',
    { defaultConfig: {} },
  )
}

async function beforeFiles(config: NextConfig) {
  const rewrites = await config.rewrites!()
  expect(Array.isArray(rewrites)).toBe(false)
  const grouped = rewrites as Exclude<Awaited<ReturnType<NonNullable<NextConfig["rewrites"]>>>, unknown[]>
  return { ...grouped, beforeFiles: grouped.beforeFiles ?? [] }
}

describe('withEnvStyles', () => {
  it('returns the config untouched in production', () => {
    // vitest runs with NODE_ENV=test → detected env is production
    const config = { reactStrictMode: true }
    expect(withEnvStyles(config)).toBe(config)
  })

  it('returns the config untouched when favicon is disabled', () => {
    const config = {}
    expect(withEnvStyles(config, { ...DEV, favicon: false })).toBe(config)
  })

  it('styles a dev env: writes tinted icon, self-ignoring folder, rewrites and headers', async () => {
    const config = await resolve(withEnvStyles({}, DEV))

    const png = await readFile(path.join(dir, 'public/__envstyle/icon.png'))
    expect(png.subarray(0, 4)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47]))
    expect(await readFile(path.join(dir, 'public/__envstyle/.gitignore'), 'utf8')).toBe('*\n')

    const { beforeFiles: ours } = await beforeFiles(config)
    expect(ours).toEqual([{ source: '/favicon.ico', destination: '/__envstyle/icon.png' }])

    const headers = await config.headers!()
    expect(headers).toContainEqual({
      source: '/favicon.ico',
      headers: [{ key: 'Cache-Control', value: 'no-store' }],
    })
  })

  it('intercepts every existing candidate icon URL', async () => {
    await mkdir(path.join(dir, 'app'), { recursive: true })
    await writeFile(path.join(dir, 'app/favicon.ico'), '')
    const icon = await sharp({
      create: { width: 32, height: 32, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 1 } },
    })
      .png()
      .toBuffer()
    await writeFile(path.join(dir, 'app/icon.png'), icon)

    const config = await resolve(withEnvStyles({}, DEV))
    const { beforeFiles: ours } = await beforeFiles(config)
    expect(ours.map((r: { source: string }) => r.source)).toEqual(['/favicon.ico', '/icon.png'])
  })

  it('preserves array-form user rewrites as afterFiles', async () => {
    const user = { source: '/a', destination: '/b' }
    const config = await resolve(withEnvStyles({ rewrites: async () => [user] }, DEV))
    const rewrites = await beforeFiles(config)
    expect(rewrites.afterFiles).toEqual([user])
    expect(rewrites.beforeFiles[0].source).toBe('/favicon.ico')
  })

  it('prepends to object-form user rewrites, preserving the rest', async () => {
    const user = {
      beforeFiles: [{ source: '/u', destination: '/v' }],
      afterFiles: [{ source: '/w', destination: '/x' }],
      fallback: [],
    }
    const config = await resolve(withEnvStyles({ rewrites: async () => user }, DEV))
    const rewrites = await beforeFiles(config)
    expect(rewrites.beforeFiles.map((r: { source: string }) => r.source)).toEqual(['/favicon.ico', '/u'])
    expect(rewrites.afterFiles).toEqual(user.afterFiles)
  })

  it('appends our headers after user headers', async () => {
    const user = { source: '/api/:path*', headers: [{ key: 'X-Custom', value: '1' }] }
    const config = await resolve(withEnvStyles({ headers: async () => [user] }, DEV))
    const headers = await config.headers!()
    expect(headers[0]).toEqual(user)
    expect(headers.length).toBeGreaterThan(1)
  })

  it('supports function-form configs, passing phase and ctx through', async () => {
    const userFn = vi.fn(async (phase: string) => ({ env: { PHASE: phase } }))
    const config = await resolve(withEnvStyles(userFn, DEV))
    expect(userFn).toHaveBeenCalledWith('phase-test', { defaultConfig: {} })
    expect(config.env).toEqual({ PHASE: 'phase-test' })
    expect(config.rewrites).toBeDefined()
  })

  it('throws immediately on an invalid color', () => {
    expect(() => withEnvStyles({}, { ...DEV, color: { development: 'red' } })).toThrow(/invalid color/)
  })

  it('throws immediately on an invalid inactive color', () => {
    expect(() => withEnvStyles({}, { ...DEV, color: { staging: 'purple' } })).toThrow(/invalid color/)
  })

  describe('env detection precedence', () => {
    it('environment option beats ENV_STYLES_ENV', () => {
      vi.stubEnv('ENV_STYLES_ENV', 'development')
      const config = {}
      expect(withEnvStyles(config, { environment: 'production' })).toBe(config)
    })

    it('ENV_STYLES_ENV beats VERCEL_ENV', () => {
      vi.stubEnv('ENV_STYLES_ENV', 'production')
      vi.stubEnv('VERCEL_ENV', 'preview')
      const config = {}
      expect(withEnvStyles(config)).toBe(config)
    })

    it('VERCEL_TARGET_ENV beats VERCEL_ENV', () => {
      vi.stubEnv('VERCEL_TARGET_ENV', 'production')
      vi.stubEnv('VERCEL_ENV', 'preview')
      const config = {}
      expect(withEnvStyles(config)).toBe(config)
    })

    it('VERCEL_ENV styles the build when set to a non-production env', () => {
      vi.stubEnv('VERCEL_ENV', 'preview')
      expect(typeof withEnvStyles({})).toBe('function')
    })

    it('custom env names are styled with the fallback color', async () => {
      vi.stubEnv('VERCEL_TARGET_ENV', 'qa')
      const config = await resolve(withEnvStyles({}))
      expect(config.rewrites).toBeDefined()
    })
  })
})
