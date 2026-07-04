import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { beforeEach, describe, expect, it } from 'vitest'
import { findSourceIcons, iconUrl, tintIcon, SIZE } from './tint'

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47])

let dir: string
beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'envstyle-tint-'))
})

async function whiteSquarePng(): Promise<Buffer> {
  return sharp({
    create: { width: 32, height: 32, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  })
    .png()
    .toBuffer()
}

async function redSquarePng(): Promise<Buffer> {
  return sharp({
    create: { width: 32, height: 32, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 1 } },
  })
    .png()
    .toBuffer()
}

/** Minimal valid .ico containing a single PNG-compressed 64x64 entry. */
function buildIco(png: Buffer): Buffer {
  const header = Buffer.alloc(6 + 16)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(1, 4) // count
  header.writeUInt8(64, 6) // width
  header.writeUInt8(64, 7) // height
  header.writeUInt16LE(1, 10) // planes
  header.writeUInt16LE(32, 12) // bpp
  header.writeUInt32LE(png.length, 14) // size
  header.writeUInt32LE(22, 18) // offset
  return Buffer.concat([header, png])
}

async function centerPixel(png: Buffer): Promise<{ r: number; g: number; b: number; a: number }> {
  const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true })
  const i = (Math.floor(info.height / 2) * info.width + Math.floor(info.width / 2)) * info.channels
  return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] }
}

describe('tintIcon', () => {
  it('renders a plain colored circle when there is no icon', async () => {
    const out = await tintIcon(null, '#3b82f6')
    expect(out.subarray(0, 4).equals(PNG_MAGIC)).toBe(true)
    const meta = await sharp(out).metadata()
    expect([meta.width, meta.height]).toEqual([SIZE, SIZE])
    const center = await centerPixel(out)
    expect(center.b).toBeGreaterThan(200) // blue fill
    expect(center.r).toBeLessThan(100)
    const { data, info } = await sharp(out).raw().toBuffer({ resolveWithObject: true })
    expect(data[3]).toBe(0) // corner outside the circle is transparent
    expect(info.channels).toBe(4)
  })

  it('tints a png toward the env color, preserving opacity', async () => {
    const src = path.join(dir, 'icon.png')
    await writeFile(src, await whiteSquarePng())
    const out = await tintIcon(src, '#ff0000')
    const center = await centerPixel(out)
    expect(center.r).toBeGreaterThan(200) // white shifted to red
    expect(center.g).toBeLessThan(100)
    expect(center.a).toBe(255)
  })

  it('leaves excluded white pixels near-white', async () => {
    const src = path.join(dir, 'icon.png')
    await writeFile(src, await whiteSquarePng())
    const out = await tintIcon(src, '#3b82f6', ['#fff'])
    const center = await centerPixel(out)
    expect(center.r).toBeGreaterThan(230)
    expect(center.g).toBeGreaterThan(230)
    expect(center.b).toBeGreaterThan(230)
    expect(center.a).toBe(255)
  })

  it('tints non-excluded pixels', async () => {
    const src = path.join(dir, 'icon.png')
    await writeFile(src, await redSquarePng())
    const out = await tintIcon(src, '#3b82f6', ['#fff'])
    const center = await centerPixel(out)
    expect(center.b).toBeGreaterThan(100)
    expect(center.a).toBe(255)
  })

  it('tints the largest frame of an .ico', async () => {
    const src = path.join(dir, 'favicon.ico')
    const png = await sharp({
      create: { width: 64, height: 64, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
    })
      .png()
      .toBuffer()
    await writeFile(src, buildIco(png))
    const out = await tintIcon(src, '#ff0000')
    expect(out.subarray(0, 4).equals(PNG_MAGIC)).toBe(true)
    const center = await centerPixel(out)
    expect(center.r).toBeGreaterThan(200)
  })

  it('rasterizes and tints an svg', async () => {
    const src = path.join(dir, 'icon.svg')
    await writeFile(src, '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#fff"/></svg>')
    const out = await tintIcon(src, '#ff0000')
    const center = await centerPixel(out)
    expect(center.r).toBeGreaterThan(200)
    expect(center.g).toBeLessThan(100)
  })

  it('falls back to the circle for an unreadable icon', async () => {
    const src = path.join(dir, 'favicon.ico')
    await writeFile(src, 'not an image')
    const out = await tintIcon(src, '#3b82f6')
    const center = await centerPixel(out)
    expect(center.b).toBeGreaterThan(200)
  })

  it('rejects a non-hex color', async () => {
    await expect(tintIcon(null, 'red')).rejects.toThrow(/invalid color/)
  })
})

describe('findSourceIcons', () => {
  it('returns icons in priority order', async () => {
    await mkdir(path.join(dir, 'app'), { recursive: true })
    await mkdir(path.join(dir, 'public'), { recursive: true })
    await writeFile(path.join(dir, 'app/favicon.ico'), '')
    await writeFile(path.join(dir, 'app/icon.png'), '')
    await writeFile(path.join(dir, 'public/favicon.png'), '')
    expect(findSourceIcons(dir)).toEqual([
      path.join(dir, 'app/favicon.ico'),
      path.join(dir, 'app/icon.png'),
      path.join(dir, 'public/favicon.png'),
    ])
  })

  it('finds icons under src/', async () => {
    await mkdir(path.join(dir, 'src/app'), { recursive: true })
    await writeFile(path.join(dir, 'src/app/icon.png'), '')
    expect(findSourceIcons(dir)).toEqual([path.join(dir, 'src/app/icon.png')])
  })

  it('returns an empty array when nothing exists', () => {
    expect(findSourceIcons(dir)).toEqual([])
  })
})

describe('iconUrl', () => {
  it('maps a source path to its conventional URL', () => {
    expect(iconUrl('/x/app/icon.png')).toBe('/icon.png')
    expect(iconUrl('/x/public/favicon.ico')).toBe('/favicon.ico')
  })
})
