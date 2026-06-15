import { getApps, getPinnedApps } from '@/apps/registry'
import { useWindowStore } from '@/store/windows'
import { useViewportMode } from '@/hooks/useViewportMode'
import { IconTile } from '@/components/IconTile'

/** Desktop shortcuts (a column on desktop) and the home-screen grid on mobile. */
export function DesktopIcons() {
  const mode = useViewportMode()
  const openApp = useWindowStore((s) => s.openApp)

  if (mode === 'mobile') {
    return (
      <div className="absolute inset-0 overflow-y-auto px-6 pb-4 pt-6">
        <div className="grid grid-cols-4 gap-x-3 gap-y-5">
          {getApps().map((app) => (
            <button
              key={app.id}
              type="button"
              onClick={() => openApp(app.id)}
              className="flex flex-col items-center gap-1.5"
            >
              <IconTile icon={app.icon} tile={app.tile} size={56} />
              <span className="max-w-full truncate text-[11px] text-white/90 drop-shadow-sm">
                {app.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="absolute left-2 top-2 flex max-h-full flex-col flex-wrap gap-0.5">
      {getPinnedApps().map((app) => (
        <button
          key={app.id}
          type="button"
          onDoubleClick={() => openApp(app.id)}
          className="flex w-[76px] flex-col items-center gap-1 rounded-lg p-2 hover:bg-white/10"
        >
          <IconTile icon={app.icon} tile={app.tile} size={48} />
          <span className="max-w-full truncate text-[11px] text-white/90 drop-shadow-sm">
            {app.name}
          </span>
        </button>
      ))}
    </div>
  )
}
