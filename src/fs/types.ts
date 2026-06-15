export type NodeType = 'file' | 'folder'

/** A node in the virtual filesystem. `path` is the absolute, unique key. */
export interface VFSNode {
  path: string
  parentPath: string
  name: string
  type: NodeType
  /** Text content for text files, or a Blob for binary files (images, archives). */
  content?: string | Blob
  mimeType?: string
  size: number
  createdAt: number
  updatedAt: number
}
