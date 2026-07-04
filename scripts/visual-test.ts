import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { tintIcon, DEFAULT_COLORS } from '../src/tint.ts'

const brands = [
  'github.com',
  'google.com',
  'apple.com',
  'amazon.com',
  'wikipedia.org',
  'vercel.com',
  'stripe.com',
  'netflix.com',
]

const userAgent =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
const outDir = path.resolve('.tmp/visual')
const envs = Object.entries(DEFAULT_COLORS)

async function fetchIcon(domain: string) {
  const res = await fetch(`https://${domain}/favicon.ico`, {
    headers: { 'user-agent': userAgent },
  })
  if (!res.ok) {
    console.warn(`Skipping ${domain}: ${res.status} ${res.statusText}`)
    return null
  }
  return Buffer.from(await res.arrayBuffer())
}

async function main() {
  await rm(outDir, { recursive: true, force: true })
  await mkdir(outDir, { recursive: true })

  const rows = []
  const fetched = []
  const skipped = []

  for (const domain of brands) {
    const name = domain.split('.')[0]
    let icon
    try {
      icon = await fetchIcon(domain)
    } catch (error) {
      console.warn(`Skipping ${domain}: ${error instanceof Error ? error.message : String(error)}`)
      skipped.push(domain)
      continue
    }
    if (!icon) {
      skipped.push(domain)
      continue
    }

    const sourceFile = `${name}.ico`
    const sourcePath = path.join(outDir, sourceFile)
    await writeFile(sourcePath, icon)

    const excludePng = await tintIcon(sourcePath, DEFAULT_COLORS.development, ['#ffffff'])
    const excludeFile = `${name}.exclude-white.png`
    await writeFile(path.join(outDir, excludeFile), excludePng)

    const cells = [
      name,
      `<img src="${sourceFile}" alt="${name} original">`,
      `<img src="${excludeFile}" alt="${name} exclude white">`,
    ]
    for (const [env, color] of envs) {
      const png = await tintIcon(sourcePath, color)
      const file = `${name}.${env}.png`
      await writeFile(path.join(outDir, file), png)
      cells.push(`<img src="${file}" alt="${name} ${env}">`)
    }

    fetched.push(domain)
    rows.push(`<tr>${cells.map((cell) => `<td>${cell}</td>`).join('')}</tr>`)
  }

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>env.style visual test</title>
<style>
body { font: 14px system-ui, sans-serif; margin: 24px; color: #111827; }
table { border-collapse: collapse; }
th, td { border: 1px solid #d1d5db; padding: 10px 12px; text-align: center; }
th:first-child, td:first-child { text-align: left; }
img { width: 64px; height: 64px; object-fit: contain; background-color: #fff; background-image: linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%); background-position: 0 0, 0 8px, 8px -8px, -8px 0; background-size: 16px 16px; }
</style>
</head>
<body>
<table>
<thead><tr><th>brand</th><th>original</th><th>exclude white</th><th>development</th><th>preview</th></tr></thead>
<tbody>
${rows.join('\n')}
</tbody>
</table>
</body>
</html>
`
  const indexPath = path.join(outDir, 'index.html')
  await writeFile(indexPath, html)
  console.log(`Visual gallery: ${indexPath}`)
  console.log(`Fetched: ${fetched.join(', ') || 'none'}`)
  console.log(`Skipped: ${skipped.join(', ') || 'none'}`)
}

await main()
