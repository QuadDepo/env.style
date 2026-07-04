import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { Sharp } from 'sharp'
import decodeIco from 'decode-ico'

export const DEFAULT_COLORS: Record<string, string> = {
  development: '#3b82f6',
  preview: '#f59e0b',
}
export const FALLBACK_COLOR = '#6b7280'

export const SIZE = 64
const TINT_ALPHA = 0.75
const TOLERANCE = 48 // prototype threshold for near-identical brand colors
const RAMP = 32 // soft edge avoids halos around antialiased pixels

type Rgb = { r: number; g: number; b: number }

const ICON_CANDIDATES = [
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

export function findSourceIcons(root: string): string[] {
  return ICON_CANDIDATES.map((rel) => path.join(root, rel)).filter((abs) => existsSync(abs))
}

/** URL the found icon is conventionally served at, e.g. app/icon.png → /icon.png. */
export function iconUrl(iconPath: string): string {
  return '/' + path.basename(iconPath)
}

export function parseHex(color: string): Rgb {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color)
  if (!m) throw new Error(`env.style: invalid color "${color}" — expected #rgb or #rrggbb`)
  let hex = m[1]
  if (hex.length === 3) hex = [...hex].map((c) => c + c).join('')
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  }
}

/**
 * Tint the icon at iconPath toward the env color (color atop the icon's opaque
 * pixels, alpha preserved). No icon → plain colored circle.
 */
export async function tintIcon(iconPath: string | null, color: string, excludeColors: string[] = []): Promise<Buffer> {
  const rgba = parseHex(color)
  const { default: sharp } = await import('sharp')
  const base = iconPath ? await toPngBase(iconPath) : null
  if (!base) {
    const r = SIZE / 2
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}"><circle cx="${r}" cy="${r}" r="${r - 2}" fill="${color}"/></svg>`
    return sharp(Buffer.from(svg)).png().toBuffer()
  }
  if (excludeColors.length > 0) return tintWithExcludeMask(base, rgba, excludeColors.map(parseHex))
  const overlay = await sharp({
    create: { width: SIZE, height: SIZE, channels: 4, background: { ...rgba, alpha: TINT_ALPHA } },
  })
    .png()
    .toBuffer()
  return sharp(base).composite([{ input: overlay, blend: 'atop' }]).png().toBuffer()
}

function redmeanDistance(a: Rgb, b: Rgb): number {
  const rMean = (a.r + b.r) / 2
  const dr = a.r - b.r
  const dg = a.g - b.g
  const db = a.b - b.b
  return Math.sqrt((2 + rMean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rMean) / 256) * db * db)
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

async function tintWithExcludeMask(base: Buffer, tint: Rgb, excludeColors: Rgb[]): Promise<Buffer> {
  const { default: sharp } = await import('sharp')
  const { data, info } = await sharp(base).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const out = Buffer.from(data)

  for (let i = 0; i < out.length; i += 4) {
    if (out[i + 3] === 0) continue
    const original = { r: out[i], g: out[i + 1], b: out[i + 2] }
    let distance = Infinity
    for (const excluded of excludeColors) distance = Math.min(distance, redmeanDistance(original, excluded))
    const alpha = TINT_ALPHA * smoothstep(TOLERANCE, TOLERANCE + RAMP, distance)
    out[i] = Math.round(tint.r * alpha + original.r * (1 - alpha))
    out[i + 1] = Math.round(tint.g * alpha + original.g * (1 - alpha))
    out[i + 2] = Math.round(tint.b * alpha + original.b * (1 - alpha))
  }

  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer()
}

/** Decode any supported icon (ico/png/jpg/svg) to a 64px PNG, untinted. */
export async function toPngBase(iconPath: string): Promise<Buffer | null> {
  try {
    const { default: sharp } = await import('sharp')
    const raw = await readFile(iconPath)
    let img: Sharp
    if (iconPath.endsWith('.ico')) {
      const frames = decodeIco(raw)
      const best = frames.reduce((a, b) => (b.width > a.width ? b : a))
      img =
        best.type === 'png'
          ? sharp(best.data)
          : sharp(best.data, { raw: { width: best.width, height: best.height, channels: 4 } })
    } else {
      img = sharp(raw) // png / jpg / svg
    }
    return await img
      .resize(SIZE, SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer()
  } catch {
    return null // unreadable icon → caller falls back to the circle
  }
}
