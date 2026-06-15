import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { dexieStorage } from './persist'

export type ThemeMode = 'dark' | 'light'

export interface SettingsState {
  /** False until IndexedDB has rehydrated the persisted settings. */
  hydrated: boolean
  theme: ThemeMode
  /** Accent as an "R G B" triplet so it can drive the --c-accent CSS variable. */
  accent: string
  wallpaperId: string
  customWallpaper: string | null
  userName: string
  reduceMotion: boolean
  passcodeEnabled: boolean

  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
  setAccent: (accent: string) => void
  setWallpaper: (id: string) => void
  setCustomWallpaper: (dataUrl: string | null) => void
  setUserName: (name: string) => void
  setReduceMotion: (value: boolean) => void
  setPasscodeEnabled: (value: boolean) => void
  reset: () => void
}

export const DEFAULT_ACCENT = '99 102 241'

const initial = {
  theme: 'dark' as ThemeMode,
  accent: DEFAULT_ACCENT,
  wallpaperId: 'aurora',
  customWallpaper: null as string | null,
  userName: 'You',
  reduceMotion: false,
  passcodeEnabled: false,
}

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      ...initial,

      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),
      setAccent: (accent) => set({ accent }),
      setWallpaper: (wallpaperId) => set({ wallpaperId }),
      setCustomWallpaper: (customWallpaper) =>
        set({ customWallpaper, wallpaperId: customWallpaper ? 'custom' : 'aurora' }),
      setUserName: (userName) => set({ userName: userName.trim() || 'You' }),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
      setPasscodeEnabled: (passcodeEnabled) => set({ passcodeEnabled }),
      reset: () => set({ ...initial }),
    }),
    {
      name: 'pocketos:settings',
      storage: createJSONStorage(() => dexieStorage),
      partialize: (s) => ({
        theme: s.theme,
        accent: s.accent,
        wallpaperId: s.wallpaperId,
        customWallpaper: s.customWallpaper,
        userName: s.userName,
        reduceMotion: s.reduceMotion,
        passcodeEnabled: s.passcodeEnabled,
      }),
      onRehydrateStorage: () => () => {
        useSettings.setState({ hydrated: true })
      },
    },
  ),
)
