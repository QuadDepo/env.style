import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { Plugin } from 'vite'
import { detectEnv, type EnvStylesOptions } from './env'
import { DEFAULT_COLORS, FALLBACK_COLOR, findSourceIcons, parseHex, tintIcon, toPngBase } from './tint'

export type { EnvStylesOptions } from './env'

const OUT_DIR = '__envstyle'
const ICON_PATH = `/${OUT_DIR}/icon.png`
const VITE_ICON_NAMES = ['favicon.ico', 'favicon.svg', 'favicon.png', 'icon.svg', 'icon.png']

export function envStyle(options: EnvStylesOptions = {}): Plugin {
  for (const value of Object.values(options.color ?? {})) {
    if (value !== undefined) parseHex(value)
  }
  for (const value of options.excludeColors ?? []) parseHex(value)

  let active = false
  let png: Buffer | null = null

  return {
    name: 'env-style',
    async configResolved(config) {
      const env = detectEnv(options.environment, () =>
        config.command === 'serve' ? 'development' : 'production'
      )
      active = options.favicon !== false && env !== 'production'
      if (!active) return

      const color = options.color?.[env] ?? DEFAULT_COLORS[env] ?? FALLBACK_COLOR
      const publicDir = path.resolve(config.root, config.publicDir)
      try {
        const icons = findSourceIcons(config.root, viteIconCandidates(config.root, publicDir))
        png =
          (await customIconPng(config.root, options.icon)) ??
          (await tintIcon(icons[0] ?? null, color, options.excludeColors ?? []))
        const outDir = path.join(publicDir, OUT_DIR)
        await mkdir(outDir, { recursive: true })
        await writeFile(path.join(outDir, 'icon.png'), png)
        await writeFile(path.join(outDir, '.gitignore'), '*\n')
      } catch (err) {
        active = false
        png = null
        console.warn(`env.style: favicon tinting skipped — ${err instanceof Error ? err.message : err}`)
      }
    },
    transformIndexHtml(html) {
      return active ? rewriteIconLinks(html) : html
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0]
        if (!active || !png || req.method !== 'GET' || (url !== '/favicon.ico' && url !== ICON_PATH)) {
          return next()
        }
        res.statusCode = 200
        res.setHeader('Content-Type', 'image/png')
        res.setHeader('Cache-Control', 'no-store')
        res.end(png)
      })
    },
  }
}

function viteIconCandidates(root: string, publicDir: string): string[] {
  return VITE_ICON_NAMES.map((name) => path.relative(root, path.join(publicDir, name)))
}

async function customIconPng(root: string, customIcon?: string): Promise<Buffer | null> {
  if (!customIcon) return null
  const resolved = path.resolve(root, customIcon)
  const png = existsSync(resolved) ? await toPngBase(resolved) : null
  if (!png) console.warn(`env.style: icon "${customIcon}" not readable — falling back to auto-discovery`)
  return png
}

function rewriteIconLinks(html: string): string {
  let found = false
  const out = html.replace(/<link\b[^>]*>/gi, (tag) => {
    const rel = /\brel=(["'])(.*?)\1/i.exec(tag)?.[2].toLowerCase().split(/\s+/) ?? []
    if (!rel.includes('icon')) return tag
    found = true
    if (/\bhref=(["'])[^"']*\1/i.test(tag)) {
      return tag.replace(/\bhref=(["'])[^"']*\1/i, (_match, quote: string) => `href=${quote}${ICON_PATH}${quote}`)
    }
    return tag.replace(/\s*\/?>$/, ` href="${ICON_PATH}">`)
  })
  if (found) return out
  const link = `<link rel="icon" href="${ICON_PATH}">`
  return /<\/head>/i.test(out) ? out.replace(/<\/head>/i, `  ${link}\n</head>`) : `${link}\n${out}`
}
