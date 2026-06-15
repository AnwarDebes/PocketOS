import { create } from 'zustand'
import { getApp } from '@/apps/registry'
import { uid } from '@/lib/id'
import type {
  AppLaunchPayload,
  DragHint,
  Rect,
  SnapZone,
  ViewportMode,
  WindowInstance,
} from '@/kernel/types'

interface WindowsState {
  windows: WindowInstance[]
  focusedId: string | null
  mode: ViewportMode
  topZ: number
  /** Transient: the snap target shown while a window is being dragged. */
  dragHint: DragHint
  /** Mobile split view: [top, bottom] window ids, or null. */
  splitView: [string, string] | null

  setMode: (mode: ViewportMode) => void
  setDragHint: (hint: DragHint) => void
  cycleFocus: (dir: 1 | -1) => void
  toggleSplit: () => void
  clearSplit: () => void
  openApp: (appId: string, payload?: AppLaunchPayload) => string | null
  closeWindow: (id: string) => void
  focusWindow: (id: string) => void
  minimizeWindow: (id: string) => void
  toggleMaximize: (id: string) => void
  /** Update floating geometry (used during drag/resize). */
  setBounds: (id: string, rect: Partial<Rect>) => void
  /** Convert a maximized/snapped window back to a floating window at `rect` and focus it. */
  beginFloat: (id: string, rect: Rect) => void
  snapWindow: (id: string, zone: SnapZone) => void
  setTitle: (id: string, title: string) => void
  /** Minimize everything to reveal the desktop. */
  showDesktop: () => void
}

function topMost(windows: WindowInstance[]): WindowInstance | undefined {
  return windows.filter((w) => w.state !== 'minimized').sort((a, b) => b.zIndex - a.zIndex)[0]
}

export const useWindowStore = create<WindowsState>((set, get) => ({
  windows: [],
  focusedId: null,
  mode: window.innerWidth < 768 ? 'mobile' : 'desktop',
  topZ: 10,
  dragHint: null,
  splitView: null,

  setMode: (mode) => {
    if (get().mode === mode) return
    set({ mode })
  },

  setDragHint: (dragHint) => set({ dragHint }),

  cycleFocus: (dir) => {
    const s = get()
    const visible = s.windows
      .filter((w) => w.state !== 'minimized')
      .sort((a, b) => a.createdAt - b.createdAt)
    if (visible.length < 2) return
    const idx = visible.findIndex((w) => w.id === s.focusedId)
    const next = visible[(idx + dir + visible.length) % visible.length]
    get().focusWindow(next.id)
  },

  toggleSplit: () => {
    const s = get()
    if (s.splitView) {
      set({ splitView: null })
      return
    }
    const visible = s.windows
      .filter((w) => w.state !== 'minimized')
      .sort((a, b) => b.zIndex - a.zIndex)
    if (visible.length >= 2) set({ splitView: [visible[0].id, visible[1].id] })
  },

  clearSplit: () => set({ splitView: null }),

  openApp: (appId, payload) => {
    const app = getApp(appId)
    if (!app) return null
    const s = get()

    // Single-instance apps focus the existing window instead of opening another.
    if (app.singleInstance) {
      const existing = s.windows.find((w) => w.appId === appId)
      if (existing) {
        get().focusWindow(existing.id)
        if (payload) {
          set((st) => ({
            windows: st.windows.map((w) => (w.id === existing.id ? { ...w, payload } : w)),
          }))
        }
        return existing.id
      }
    }

    const z = s.topZ + 1
    const vw = window.innerWidth
    const vh = window.innerHeight
    const width = Math.min(app.defaultSize.width, Math.max(280, vw - 40))
    const height = Math.min(app.defaultSize.height, Math.max(320, vh - 140))
    const cascade = (s.windows.length % 6) * 26
    const x = Math.max(16, Math.round((vw - width) / 2 - 80) + cascade)
    const y = Math.max(16, Math.round((vh - height) / 2 - 60) + cascade)

    const win: WindowInstance = {
      id: uid('win'),
      appId,
      title: app.name,
      x,
      y,
      width,
      height,
      zIndex: z,
      state: s.mode === 'mobile' ? 'maximized' : 'normal',
      snap: null,
      payload,
      createdAt: Date.now(),
    }
    set((st) => ({ windows: [...st.windows, win], focusedId: win.id, topZ: z, splitView: null }))
    return win.id
  },

  closeWindow: (id) =>
    set((s) => {
      const windows = s.windows.filter((w) => w.id !== id)
      const focusedId = s.focusedId === id ? (topMost(windows)?.id ?? null) : s.focusedId
      const splitView = s.splitView?.includes(id) ? null : s.splitView
      return { windows, focusedId, splitView }
    }),

  focusWindow: (id) =>
    set((s) => {
      const z = s.topZ + 1
      return {
        focusedId: id,
        topZ: z,
        windows: s.windows.map((w) =>
          w.id === id ? { ...w, zIndex: z, state: w.state === 'minimized' ? 'normal' : w.state } : w,
        ),
      }
    }),

  minimizeWindow: (id) =>
    set((s) => {
      const windows = s.windows.map((w) =>
        w.id === id ? { ...w, state: 'minimized' as const } : w,
      )
      const focusedId = s.focusedId === id ? (topMost(windows)?.id ?? null) : s.focusedId
      const splitView = s.splitView?.includes(id) ? null : s.splitView
      return { windows, focusedId, splitView }
    }),

  toggleMaximize: (id) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id
          ? { ...w, state: w.state === 'maximized' ? 'normal' : 'maximized', snap: null }
          : w,
      ),
    })),

  setBounds: (id, rect) =>
    set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, ...rect } : w)) })),

  beginFloat: (id, rect) =>
    set((s) => ({
      focusedId: id,
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, ...rect, state: 'normal' as const, snap: null } : w,
      ),
    })),

  snapWindow: (id, zone) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, snap: zone, state: 'normal' as const } : w,
      ),
    })),

  setTitle: (id, title) =>
    set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, title } : w)) })),

  showDesktop: () =>
    set((s) => ({
      windows: s.windows.map((w) => ({ ...w, state: 'minimized' as const })),
      focusedId: null,
    })),
}))
