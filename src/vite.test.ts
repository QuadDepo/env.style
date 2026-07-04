import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import type { ResolvedConfig } from 'vite'
import { envStyle, type EnvStylesOptions } from './vite'

let dir: string
beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'envstyle-vite-'))
})

type TestPlugin = {
  configResolved(config: ResolvedConfig): void | Promise<void>
  transformIndexHtml(html: string): string | Promise<string>
}

function plugin(options: EnvStylesOptions = {}): TestPlugin {
  return envStyle(options) as unknown as TestPlugin
}

function config(command: 'serve' | 'build' = 'serve'): ResolvedConfig {
  return {
    root: dir,
    publicDir: path.join(dir, 'public'),
    command,
    mode: command === 'serve' ? 'development' : 'production',
  } as ResolvedConfig
}

async function writeSvg() {
  await mkdir(path.join(dir, 'public'), { recursive: true })
  await writeFile(
    path.join(dir, 'public/favicon.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#111"/><text x="24" y="42" fill="#fff">V</text></svg>',
  )
}

describe('envStyle', () => {
  it('leaves production inert', async () => {
    const p = plugin({ environment: 'production' })
    await p.configResolved(config('build'))
    const html = '<html><head><link rel="icon" href="/favicon.svg"></head><body></body></html>'
    expect(await p.transformIndexHtml(html)).toBe(html)
    expect(existsSync(path.join(dir, 'public/__envstyle/icon.png'))).toBe(false)
  })

  it('styles development by writing and rewriting Vite favicon links', async () => {
    await writeSvg()
    const p = plugin({ environment: 'development', color: { development: '#00ff00' } })
    await p.configResolved(config())

    const png = await readFile(path.join(dir, 'public/__envstyle/icon.png'))
    expect(png.subarray(0, 4)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47]))
    expect(await readFile(path.join(dir, 'public/__envstyle/.gitignore'), 'utf8')).toBe('*\n')

    const linked = await p.transformIndexHtml('<html><head><link rel="icon" href="/favicon.svg"></head></html>')
    expect(linked).toContain('<link rel="icon" href="/__envstyle/icon.png">')

    const injected = await p.transformIndexHtml('<html><head></head><body></body></html>')
    expect(injected).toContain('<link rel="icon" href="/__envstyle/icon.png">')
  })

  it('throws immediately on invalid colors', () => {
    expect(() => envStyle({ color: { development: 'green' } })).toThrow(/invalid color/)
    expect(() => envStyle({ excludeColors: ['white'] })).toThrow(/invalid color/)
  })
})
