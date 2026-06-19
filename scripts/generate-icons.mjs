import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const iconsDir = join(root, 'public', 'icons')

const mainPixels = [
  [4, 0], [24, 0],
  [4, 4], [8, 4], [24, 4],
  [4, 8], [8, 8], [24, 8],
  [4, 12], [12, 12], [24, 12],
  [4, 16], [16, 16], [24, 16],
  [4, 20], [16, 20], [24, 20],
  [4, 24], [20, 24], [24, 24],
  [4, 28], [24, 28],
]

function pixelMark() {
  const shadowRects = mainPixels
    .map(([x, y]) => `<rect x="${x + 4}" y="${y + 4}" width="4" height="4" fill="#444444"/>`)
    .join('\n    ')

  const mainRects = mainPixels
    .map(([x, y]) => {
      const fill = (y / 4) % 2 === 0 ? '#d4d4d4' : '#bcbcbc'
      return `<rect x="${x}" y="${y}" width="4" height="4" fill="${fill}"/>`
    })
    .join('\n    ')

  return `<g id="noxservo-n">\n    ${shadowRects}\n    ${mainRects}\n  </g>`
}

function wrapSvg(body, viewBox = '0 0 32 32') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${body}</svg>`
}

const mark = pixelMark()

const faviconSvg = wrapSvg(`<rect width="32" height="32" fill="#000000"/>${mark}`)
const appIconSvg = wrapSvg(
  `<rect width="512" height="512" rx="112" fill="#000000"/><g transform="translate(144, 120) scale(9.5)">${mark}</g>`,
  '0 0 512 512',
)
const maskableSvg = wrapSvg(
  `<rect width="512" height="512" fill="#000000"/><g transform="translate(168, 152) scale(7.2)">${mark}</g>`,
  '0 0 512 512',
)
const markSvg = wrapSvg(mark)

await writeFile(join(root, 'public', 'noxservo-n.svg'), markSvg)
await writeFile(join(root, 'public', 'favicon.svg'), faviconSvg)
await writeFile(join(root, 'public', 'app-icon.svg'), appIconSvg)
await writeFile(join(root, 'public', 'app-icon-maskable.svg'), maskableSvg)

const sources = [
  { svg: appIconSvg, outputs: ['apple-touch-icon.png', 'icon-192.png', 'icon-512.png'] },
  { svg: maskableSvg, outputs: ['icon-512-maskable.png'] },
]

const sizes = {
  'apple-touch-icon.png': 180,
  'icon-192.png': 192,
  'icon-512.png': 512,
  'icon-512-maskable.png': 512,
}

await mkdir(iconsDir, { recursive: true })

for (const { svg, outputs } of sources) {
  for (const name of outputs) {
    const size = sizes[name]
    const png = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer()
    await writeFile(join(root, 'public', name), png)
    await writeFile(join(iconsDir, name), png)
  }
}

const faviconPng = await sharp(Buffer.from(faviconSvg)).resize(32, 32).png().toBuffer()
await writeFile(join(root, 'public', 'favicon.png'), faviconPng)

console.log('Generated 8-bit Noxservo icons')
