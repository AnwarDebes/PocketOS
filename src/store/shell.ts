import { create } from 'zustand'

/** Session-only shell state. Not persisted: the OS starts locked on every load. */
interface ShellState {
  locked: boolean
  launcherOpen: boolean
  switcherOpen: boolean

  lock: () => void
  unlock: () => void
  setLauncher: (open: boolean) => void
  toggleLauncher: () => void
  setSwitcher: (open: boolean) => void
  toggleSwitcher: () => void
}

export const useShell = create<ShellState>((set, get) => ({
  locked: true,
  launcherOpen: false,
  switcherOpen: false,

  lock: () => set({ locked: true, launcherOpen: false, switcherOpen: false }),
  unlock: () => set({ locked: false }),
  setLauncher: (launcherOpen) => set({ launcherOpen, switcherOpen: false }),
  toggleLauncher: () => set({ launcherOpen: !get().launcherOpen, switcherOpen: false }),
  setSwitcher: (switcherOpen) => set({ switcherOpen, launcherOpen: false }),
  toggleSwitcher: () => set({ switcherOpen: !get().switcherOpen, launcherOpen: false }),
}))
