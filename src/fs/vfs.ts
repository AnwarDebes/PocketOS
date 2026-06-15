import { db } from './db'
import type { VFSNode } from './types'
import { basename, dirname, isInside, join, normalize, ROOT } from '@/lib/paths'
import { guessMime } from '@/lib/mime'

const now = () => Date.now()

function sizeOf(content: string | Blob | undefined): number {
  if (!content) return 0
  return typeof content === 'string' ? content.length : content.size
}

export async function stat(path: string): Promise<VFSNode | undefined> {
  const p = normalize(path)
  if (p === ROOT) {
    return { path: ROOT, parentPath: ROOT, name: '', type: 'folder', size: 0, createdAt: 0, updatedAt: 0 }
  }
  return db.files.get(p)
}

export async function exists(path: string): Promise<boolean> {
  return !!(await stat(path))
}

export async function listDir(path: string): Promise<VFSNode[]> {
  const p = normalize(path)
  const items = await db.files.where('parentPath').equals(p).toArray()
  return items.sort((a, b) =>
    a.type !== b.type ? (a.type === 'folder' ? -1 : 1) : a.name.localeCompare(b.name),
  )
}

export async function readText(path: string): Promise<string> {
  const node = await db.files.get(normalize(path))
  if (!node || node.type !== 'file') throw new Error(`Not a file: ${path}`)
  if (typeof node.content === 'string') return node.content
  if (node.content instanceof Blob) return node.content.text()
  return ''
}

export async function readBlob(path: string): Promise<Blob | null> {
  const node = await db.files.get(normalize(path))
  if (!node || node.type !== 'file') return null
  if (node.content instanceof Blob) return node.content
  if (typeof node.content === 'string') {
    return new Blob([node.content], { type: node.mimeType ?? 'text/plain' })
  }
  return null
}

export async function writeFile(
  path: string,
  content: string | Blob,
  mimeType?: string,
): Promise<VFSNode> {
  const p = normalize(path)
  if (p === ROOT) throw new Error('Cannot write to the root')
  const parent = dirname(p)
  if (parent !== ROOT && !(await exists(parent))) throw new Error(`No such directory: ${parent}`)
  const existing = await db.files.get(p)
  if (existing?.type === 'folder') throw new Error(`Is a directory: ${path}`)
  const node: VFSNode = {
    path: p,
    parentPath: parent,
    name: basename(p),
    type: 'file',
    content,
    mimeType: mimeType ?? existing?.mimeType ?? guessMime(p),
    size: sizeOf(content),
    createdAt: existing?.createdAt ?? now(),
    updatedAt: now(),
  }
  await db.files.put(node)
  return node
}

export async function createFolder(path: string): Promise<VFSNode> {
  const p = normalize(path)
  if (p === ROOT) throw new Error('Root already exists')
  if (await exists(p)) throw new Error(`Already exists: ${path}`)
  const parent = dirname(p)
  if (parent !== ROOT && !(await exists(parent))) throw new Error(`No such directory: ${parent}`)
  const node: VFSNode = {
    path: p,
    parentPath: parent,
    name: basename(p),
    type: 'folder',
    size: 0,
    createdAt: now(),
    updatedAt: now(),
  }
  await db.files.put(node)
  return node
}

/** mkdir -p */
export async function ensureFolder(path: string): Promise<void> {
  const p = normalize(path)
  if (p === ROOT || (await exists(p))) return
  await ensureFolder(dirname(p))
  await createFolder(p)
}

export async function remove(path: string, recursive = false): Promise<void> {
  const p = normalize(path)
  if (p === ROOT) throw new Error('Cannot remove the root')
  const node = await db.files.get(p)
  if (!node) throw new Error(`No such file or directory: ${path}`)
  if (node.type === 'folder') {
    const descendants = await db.files.where('path').startsWith(`${p}/`).toArray()
    if (descendants.length && !recursive) throw new Error(`Directory not empty: ${path}`)
    await db.transaction('rw', db.files, async () => {
      await db.files.bulkDelete(descendants.map((d) => d.path))
      await db.files.delete(p)
    })
  } else {
    await db.files.delete(p)
  }
}

async function moveNode(src: string, dest: string): Promise<void> {
  if (src === dest) return
  if (isInside(src, dest)) throw new Error('Cannot move a folder into itself')
  const node = await db.files.get(src)
  if (!node) throw new Error(`No such file or directory: ${src}`)
  if (await exists(dest)) throw new Error(`Already exists: ${dest}`)
  const destParent = dirname(dest)
  if (destParent !== ROOT && !(await exists(destParent))) {
    throw new Error(`No such directory: ${destParent}`)
  }

  await db.transaction('rw', db.files, async () => {
    if (node.type === 'folder') {
      const descendants = await db.files.where('path').startsWith(`${src}/`).toArray()
      const moved = descendants.map((d) => {
        const newPath = dest + d.path.slice(src.length)
        return { ...d, path: newPath, parentPath: dirname(newPath), updatedAt: now() }
      })
      await db.files.bulkDelete(descendants.map((d) => d.path))
      await db.files.bulkPut(moved)
    }
    await db.files.delete(src)
    await db.files.put({
      ...node,
      path: dest,
      parentPath: dirname(dest),
      name: basename(dest),
      updatedAt: now(),
    })
  })
}

export async function rename(path: string, newName: string): Promise<string> {
  const p = normalize(path)
  const dest = join(dirname(p), newName)
  await moveNode(p, dest)
  return dest
}

export async function move(srcPath: string, destDir: string): Promise<string> {
  const src = normalize(srcPath)
  const dest = join(normalize(destDir), basename(src))
  await moveNode(src, dest)
  return dest
}

/** Move or rename a node to an explicit destination path. */
export async function moveTo(src: string, dest: string): Promise<void> {
  await moveNode(normalize(src), normalize(dest))
}

export async function copy(srcPath: string, destDir: string): Promise<string> {
  const src = normalize(srcPath)
  const node = await db.files.get(src)
  if (!node) throw new Error(`No such file or directory: ${src}`)
  const dest = await uniquePath(normalize(destDir), basename(src))

  await db.transaction('rw', db.files, async () => {
    const clones: VFSNode[] = [
      { ...node, path: dest, parentPath: dirname(dest), name: basename(dest), createdAt: now(), updatedAt: now() },
    ]
    if (node.type === 'folder') {
      const descendants = await db.files.where('path').startsWith(`${src}/`).toArray()
      for (const d of descendants) {
        const newPath = dest + d.path.slice(src.length)
        clones.push({ ...d, path: newPath, parentPath: dirname(newPath), createdAt: now(), updatedAt: now() })
      }
    }
    await db.files.bulkPut(clones)
  })
  return dest
}

/** Returns a path in `dir` that does not collide, appending " (n)" before the extension. */
export async function uniquePath(dir: string, name: string): Promise<string> {
  const dot = name.lastIndexOf('.')
  const ext = dot > 0 ? name.slice(dot) : ''
  const stem = dot > 0 ? name.slice(0, dot) : name
  let candidate = join(dir, name)
  let i = 1
  while (await exists(candidate)) {
    candidate = join(dir, `${stem} (${i})${ext}`)
    i += 1
  }
  return candidate
}

export interface Usage {
  bytes: number
  files: number
  folders: number
}

export async function usage(): Promise<Usage> {
  const all = await db.files.toArray()
  return all.reduce<Usage>(
    (acc, n) => {
      if (n.type === 'folder') acc.folders += 1
      else {
        acc.files += 1
        acc.bytes += n.size
      }
      return acc
    },
    { bytes: 0, files: 0, folders: 0 },
  )
}

export async function clearAll(): Promise<void> {
  await db.files.clear()
}
