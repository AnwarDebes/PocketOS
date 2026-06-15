// Generates the PWA PNG icons from the same vector mark used in the app and favicon.
// Run with: npm run icons
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const PUBLIC = join(here, '..', 'public')

const defs = `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6366F1"/><stop offset="1" stop-color="#8B5CF6"/></linearGradient></defs>`

const windows = `
  <rect x="186" y="150" width="196" height="150" rx="20" fill="#FFFFFF" fill-opacity="0.32"/>
  <rect x="138" y="196" width="236" height="178" rx="22" fill="#FFFFFF"/>
  <circle cx="170" cy="226" r="9" fill="#6366F1" fill-opacity="0.9"/>
  <circle cx="198" cy="226" r="9" fill="#6366F1" fill-opacity="0.5"/>
  <circle cx="226" cy="226" r="9" fill="#6366F1" fill-opacity="0.3"/>`

// Rounded tile with transparent corners, for the standard "any" icon.
const regular = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">${defs}<rect width="512" height="512" rx="116" fill="url(#g)"/>${windows}</svg>`

// Full-bleed opaque background with the glyph pulled into the maskable safe zone.
// Used for the maskable icon and the (opaque) apple-touch-icon.
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">${defs}<rect width="512" height="512" fill="url(#g)"/><g transform="translate(256 256) scale(0.78) translate(-256 -256)">${windows}</g></svg>`

async function render(svg, size, name) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(join(PUBLIC, name))
  console.log(`  ${name}  ${size}x${size}`)
}

console.log('Generating PocketOS icons into public/ ...')
await render(regular, 192, 'icon-192.png')
await render(regular, 512, 'icon-512.png')
await render(maskable, 512, 'icon-maskable-512.png')
await render(maskable, 180, 'apple-touch-icon-180.png')
console.log('Done.')
