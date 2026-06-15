import { db } from './db'
import { ensureFolder, writeFile } from './vfs'
import { HOME } from '@/lib/paths'

const WELCOME = `# Welcome to PocketOS

This is a desktop environment running entirely in your browser. Everything you
see is offline and stored on your device.

Things to try:

- Open the Files app and browse this folder
- Edit this note in the Text Editor and save it
- Open the Terminal and run: ls, cd Documents, cat welcome.md
- Drag windows around, resize them, or snap one to the left and another to the right
- On a narrow screen, apps go full screen and you switch with the recent-apps view

Have a look around.
`

const TODO = `PocketOS to-do

[x] Boot to a desktop
[x] Open and arrange windows
[ ] Write my first note
[ ] Upload a file from my device
[ ] Pick a new wallpaper in Settings
`

const README = `# Home

Your home folder. Files you create live here and persist across reloads.

- Documents: notes and text
- Projects: code and config
- Pictures: images
`

const HELLO_JS = `// A tiny sample to open in the Code editor.
function greet(name) {
  return \`Hello, \${name}, from PocketOS\`
}

const people = ['Ada', 'Alan', 'Grace']
for (const p of people) {
  console.log(greet(p))
}
`

const STYLES_CSS = `:root {
  --brand: #6366f1;
}

.button {
  background: var(--brand);
  color: white;
  border-radius: 10px;
  padding: 8px 14px;
}
`

const CONFIG_JSON = `{
  "name": "pocketos-demo",
  "version": "1.0.0",
  "features": ["windows", "files", "terminal"],
  "offline": true
}
`

const LOGO_SVG = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6366F1"/><stop offset="1" stop-color="#8B5CF6"/></linearGradient></defs>
  <rect width="512" height="512" rx="116" fill="url(#g)"/>
  <rect x="186" y="150" width="196" height="150" rx="20" fill="#fff" fill-opacity="0.32"/>
  <rect x="138" y="196" width="236" height="178" rx="22" fill="#fff"/>
</svg>
`

/** Populates a starter filesystem the first time PocketOS runs. */
export async function seedIfEmpty(): Promise<void> {
  const count = await db.files.count()
  if (count > 0) return
  await ensureFolder(`${HOME}/Documents`)
  await ensureFolder(`${HOME}/Projects`)
  await ensureFolder(`${HOME}/Pictures`)
  await writeFile(`${HOME}/readme.md`, README)
  await writeFile(`${HOME}/Documents/welcome.md`, WELCOME)
  await writeFile(`${HOME}/Documents/todo.txt`, TODO)
  await writeFile(`${HOME}/Projects/hello.js`, HELLO_JS)
  await writeFile(`${HOME}/Projects/styles.css`, STYLES_CSS)
  await writeFile(`${HOME}/Projects/config.json`, CONFIG_JSON)
  await writeFile(`${HOME}/Pictures/pocketos.svg`, LOGO_SVG, 'image/svg+xml')
}
