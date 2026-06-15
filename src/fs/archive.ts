import { db } from './db'
import { clearAll } from './vfs'
import type { NodeType, VFSNode } from './types'

interface ArchivedNode {
  path: string
  parentPath: string
  name: string
  type: NodeType
  mimeType?: string
  encoding: 'none' | 'text' | 'dataurl'
  data?: string
  size: number
  createdAt: number
  updatedAt: number
}

interface Archive {
  app: 'PocketOS'
  version: 1
  exportedAt: number
  nodes: ArchivedNode[]
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

/** Serialize the whole VFS to a JSON string (binary files are inlined as data URLs). */
export async function exportArchive(): Promise<string> {
  const files = await db.files.toArray()
  const nodes: ArchivedNode[] = []
  for (const f of files) {
    const base = {
      path: f.path,
      parentPath: f.parentPath,
      name: f.name,
      type: f.type,
      mimeType: f.mimeType,
      size: f.size,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
    }
    if (f.type === 'folder') nodes.push({ ...base, encoding: 'none' })
    else if (typeof f.content === 'string') nodes.push({ ...base, encoding: 'text', data: f.content })
    else if (f.content instanceof Blob)
      nodes.push({ ...base, encoding: 'dataurl', data: await blobToDataUrl(f.content) })
    else nodes.push({ ...base, encoding: 'text', data: '' })
  }
  const archive: Archive = { app: 'PocketOS', version: 1, exportedAt: Date.now(), nodes }
  return JSON.stringify(archive)
}

/** Replace the entire VFS with the contents of an exported archive. Returns the node count. */
export async function importArchive(json: string): Promise<number> {
  const parsed = JSON.parse(json) as Partial<Archive>
  if (parsed.app !== 'PocketOS' || !Array.isArray(parsed.nodes)) {
    throw new Error('This is not a PocketOS backup file')
  }
  const rows: VFSNode[] = []
  for (const n of parsed.nodes) {
    let content: string | Blob | undefined
    if (n.type === 'folder') content = undefined
    else if (n.encoding === 'dataurl' && n.data) content = await (await fetch(n.data)).blob()
    else content = n.data ?? ''
    rows.push({
      path: n.path,
      parentPath: n.parentPath,
      name: n.name,
      type: n.type,
      mimeType: n.mimeType,
      content,
      size: n.size,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    })
  }
  await clearAll()
  await db.files.bulkPut(rows)
  return rows.length
}
