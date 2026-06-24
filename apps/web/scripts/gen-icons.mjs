// Generate the PWA / favicon icon set from one on-brand SVG emblem — a gold "tongue of fire"
// (the Spirit) on the game's dark field. Run on demand; outputs are committed to public/:
//   npm run gen:icons --workspace @bible/web
// This file is excluded from tsc/lint (scripts/**, *.mjs), so it never touches typecheck/CI.
import sharp from 'sharp'
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const BG = '#11140f' // --bg
const GOLD = '#d8b962' // --gold
const GOLD_BRIGHT = '#f4e7a1' // --gold-bright

const OUT = new URL('../public/', import.meta.url)
const outPath = (name) => fileURLToPath(new URL(name, OUT))

// Flame silhouette + inner cut, authored in a 0..100 local space (pointed top, rounded bulb).
const FLAME =
  'M50 10 C 64 34, 76 44, 76 64 C 76 84, 64 92, 50 92 C 36 92, 24 84, 24 64 C 24 47, 35 41, 44 29 C 47 25, 49 18, 50 10 Z'
const FLAME_INNER =
  'M50 40 C 58 52, 63 58, 63 68 C 63 80, 57 86, 50 86 C 43 86, 37 80, 37 68 C 37 60, 42 56, 46 49 C 48 46, 50 43, 50 40 Z'

/**
 * Build a 512×512 emblem SVG.
 * - any: rounded-square dark field + subtle gold ring, flame fills ~the disc.
 * - maskable: full-bleed dark field, flame shrunk into the inner safe zone (well within 80%).
 */
function buildSvg({ maskable }) {
  const S = 512
  const bg = maskable
    ? `<rect width="${S}" height="${S}" fill="${BG}"/>`
    : `<rect width="${S}" height="${S}" rx="104" ry="104" fill="${BG}"/>` +
      `<circle cx="256" cy="256" r="232" fill="none" stroke="${GOLD}" stroke-opacity="0.38" stroke-width="8"/>`
  const scale = maskable ? 3.05 : 4.02 // flame height ≈ 250 (maskable) / 330 (any)
  const tx = 256 - 50 * scale
  const ty = 256 - 51 * scale
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <defs>
    <linearGradient id="flame" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${GOLD_BRIGHT}"/>
      <stop offset="1" stop-color="${GOLD}"/>
    </linearGradient>
  </defs>
  ${bg}
  <g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale})">
    <path d="${FLAME}" fill="url(#flame)"/>
    <path d="${FLAME_INNER}" fill="${BG}" fill-opacity="0.5"/>
  </g>
</svg>`
}

async function renderPng(svg, size) {
  return sharp(Buffer.from(svg)).resize(size, size).png().toBuffer()
}

// Wrap a PNG in a single-image .ico container (Vista+ accepts PNG-compressed entries).
function pngToIco(pngBuf, size) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(1, 4) // image count
  const dir = Buffer.alloc(16)
  dir.writeUInt8(size >= 256 ? 0 : size, 0) // width (0 ⇒ 256)
  dir.writeUInt8(size >= 256 ? 0 : size, 1) // height
  dir.writeUInt8(0, 2) // palette
  dir.writeUInt8(0, 3) // reserved
  dir.writeUInt16LE(1, 4) // color planes
  dir.writeUInt16LE(32, 6) // bits per pixel
  dir.writeUInt32LE(pngBuf.length, 8) // bytes in image
  dir.writeUInt32LE(22, 12) // offset (6 + 16)
  return Buffer.concat([header, dir, pngBuf])
}

async function write(name, buf) {
  await writeFile(outPath(name), buf)
  console.log('  wrote', name, `(${buf.length} bytes)`)
}

const anySvg = buildSvg({ maskable: false })
const maskableSvg = buildSvg({ maskable: true })

console.log('Generating PWA icons → apps/web/public/')
await write('pwa-192.png', await renderPng(anySvg, 192))
await write('pwa-512.png', await renderPng(anySvg, 512))
await write('maskable-512.png', await renderPng(maskableSvg, 512))
await write('apple-touch-icon.png', await renderPng(anySvg, 180))
const fav32 = await renderPng(anySvg, 32)
await write('favicon-32.png', fav32)
await write('favicon.ico', pngToIco(fav32, 32))
console.log('Done.')
