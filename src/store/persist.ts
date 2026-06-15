import type { StateStorage } from 'zustand/middleware'
import { db } from '@/fs/db'

/**
 * Zustand persistence backed by IndexedDB (via the same Dexie database as the VFS),
 * so all persistent state lives in one place. Async by nature; stores expose a
 * `hydrated` flag and the shell waits for it before rendering.
 */
export const dexieStorage: StateStorage = {
  getItem: async (name) => (await db.kv.get(name))?.value ?? null,
  setItem: async (name, value) => {
    await db.kv.put({ key: name, value })
  },
  removeItem: async (name) => {
    await db.kv.delete(name)
  },
}
