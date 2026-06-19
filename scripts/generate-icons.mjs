import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const iconsDir = join(root, 'public', 'icons')

const sources = [
  { file: 'app-icon.svg', outputs: ['apple-touch-icon.png', 'icon-192.png', 'icon-512.png'] },
  { file: 'app-icon-maskable.svg', outputs: ['icon-512-maskable.png'] },
]

const sizes = {
  'apple-touch-icon.png': 180,
  'icon-192.png': 192,
  'icon-512.png': 512,
  'icon-512-maskable.png': 512,
}

await mkdir(iconsDir, { recursive: true })

for (const { file, outputs } of sources) {
  const svg = await readFile(join(root, 'public', file))

  for (const name of outputs) {
    const size = sizes[name]
    const png = await sharp(svg).resize(size, size).png().toBuffer()
    await writeFile(join(root, 'public', name), png)
    await writeFile(join(iconsDir, name), png)
  }
}

const faviconSvg = await readFile(join(root, 'public', 'favicon.svg'))
const faviconPng = await sharp(faviconSvg).resize(32, 32).png().toBuffer()
await writeFile(join(root, 'public', 'favicon.png'), faviconPng)

console.log('Generated PWA icons')
