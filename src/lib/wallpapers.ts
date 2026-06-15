export interface Wallpaper {
  id: string
  name: string
  /** A CSS `background` value (layered gradients). */
  css: string
  /** A representative color for the swatch / theme-color. */
  swatch: string
}

export const WALLPAPERS: Wallpaper[] = [
  {
    id: 'aurora',
    name: 'Aurora',
    swatch: '#6366f1',
    css: 'radial-gradient(1200px 800px at 12% -10%, rgba(99,102,241,0.35), transparent 60%), radial-gradient(1000px 700px at 110% 120%, rgba(139,92,246,0.30), transparent 55%), linear-gradient(160deg, #0b0d12, #0e1320)',
  },
  {
    id: 'dusk',
    name: 'Dusk',
    swatch: '#f472b6',
    css: 'radial-gradient(900px 700px at 90% -10%, rgba(244,114,182,0.28), transparent 55%), radial-gradient(1000px 800px at -10% 110%, rgba(56,189,248,0.22), transparent 55%), linear-gradient(160deg, #0c0a14, #120e1c)',
  },
  {
    id: 'mint',
    name: 'Mint',
    swatch: '#34d399',
    css: 'radial-gradient(1000px 700px at 100% 0%, rgba(52,211,153,0.26), transparent 55%), radial-gradient(900px 800px at 0% 100%, rgba(45,212,191,0.20), transparent 55%), linear-gradient(160deg, #07120f, #0b1a17)',
  },
  {
    id: 'ember',
    name: 'Ember',
    swatch: '#fb923c',
    css: 'radial-gradient(1000px 700px at 10% -10%, rgba(251,146,60,0.28), transparent 55%), radial-gradient(900px 800px at 110% 120%, rgba(239,68,68,0.22), transparent 55%), linear-gradient(160deg, #120c08, #1a1009)',
  },
  {
    id: 'slate',
    name: 'Slate',
    swatch: '#64748b',
    css: 'radial-gradient(1100px 800px at 50% -20%, rgba(148,163,184,0.18), transparent 60%), linear-gradient(160deg, #0a0c10, #0f131b)',
  },
]

export function getWallpaper(id: string): Wallpaper {
  return WALLPAPERS.find((w) => w.id === id) ?? WALLPAPERS[0]
}

/** Resolve a settings wallpaper choice to a CSS background value. */
export function resolveWallpaperCss(wallpaperId: string, custom: string | null): string {
  if (wallpaperId === 'custom' && custom) {
    return `center / cover no-repeat url(${JSON.stringify(custom)})`
  }
  return getWallpaper(wallpaperId).css
}
