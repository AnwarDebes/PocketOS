import Dexie, { type Table } from 'dexie'
import type { VFSNode } from './types'

export interface KVRow {
  key: string
  value: string
}

/**
 * The PocketOS IndexedDB store.
 * - `files`: the virtual filesystem, keyed by absolute path.
 * - `kv`: small key/value rows used by the Zustand persistence adapter (settings).
 */
export class PocketDB extends Dexie {
  files!: Table<VFSNode, string>
  kv!: Table<KVRow, string>

  constructor() {
    super('pocketos')
    this.version(1).stores({
      files: 'path, parentPath, type',
      kv: 'key',
    })
  }
}

export const db = new PocketDB()
