import { LayoutGrid, Layers } from 'lucide-react'
import { getApps, getPinnedApps } from '@/apps/registry'
import { useWindowStore } from '@/store/windows'
import { useShell } from '@/store/shell'
import { useViewportMode } from '@/hooks/useViewportMode'
import { IconTile } from '@/components/IconTile'

export function Dock() {
  const mode = useViewportMode()
  const windows = useWindowStore((s) => s.windows)
  const focusedId = useWindowStore((s) => s.focusedId)
  const openApp = useWindowStore((s) => s.openApp)
  const focusWindow = useWindowStore((s) => s.focusWindow)
  const minimizeWindow = useWindowStore((s) => s.minimizeWindow)
  const toggleLauncher = useShell((s) => s.toggleLauncher)
  const toggleSwitcher = useShell((s) => s.toggleSwitcher)

  const runningIds = new Set(windows.map((w) => w.appId))
  const dockApps = [...getPinnedApps(), ...getApps().filter((a) => runningIds.has(a.id) && !a.pinned)]

  const onAppClick = (appId: string) => {
    const wins = windows.filter((w) => w.appId === appId)
    if (wins.length === 0) {
      openApp(appId)
      return
    }
    const activeHere = wins.some((w) => w.id === focusedId && w.state !== 'minimized')
    if (activeHere && focusedId) {
      minimizeWindow(focusedId)
    } else {
      const top = [...wins].sort((a, b) => b.zIndex - a.zIndex)[0]
      focusWindow(top.id)
    }
  }

  return (
    <div className="pointer-events-none relative z-40 flex shrink-0 justify-center px-2 pb-safe">
      <div className="pointer-events-auto mb-2 flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl border border-line/70 bg-surface/70 px-2 py-2 shadow-dock backdrop-blur-xl">
        <button
          type="button"
          aria-label="Open launcher"
          onClick={toggleLauncher}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-fg hover:bg-white/10"
        >
          <LayoutGrid size={22} />
        </button>
        <div className="mx-0.5 h-8 w-px shrink-0 bg-line" />

        {dockApps.map((app) => (
          <button
            key={app.id}
            type="button"
            onClick={() => onAppClick(app.id)}
            aria-label={app.name}
            title={app.name}
            className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl hover:bg-white/10"
          >
            <IconTile icon={app.icon} tile={app.tile} size={36} rounded="rounded-xl" />
            {runningIds.has(app.id) && (
              <span className="absolute bottom-0 h-1 w-1 rounded-full bg-accent" />
            )}
          </button>
        ))}

        {mode === 'mobile' && windows.length > 0 && (
          <>
            <div className="mx-0.5 h-8 w-px shrink-0 bg-line" />
            <button
              type="button"
              aria-label="Recent apps"
              onClick={toggleSwitcher}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-fg hover:bg-white/10"
            >
              <Layers size={22} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
