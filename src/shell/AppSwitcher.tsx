import { AnimatePresence, motion, type PanInfo } from 'framer-motion'
import { Home, SplitSquareVertical, X } from 'lucide-react'
import { getApp } from '@/apps/registry'
import { useWindowStore } from '@/store/windows'
import { useShell } from '@/store/shell'
import { IconTile } from '@/components/IconTile'

/** Mobile recent-apps view. Tap a card to switch, swipe a card up to close it. */
export function AppSwitcher() {
  const open = useShell((s) => s.switcherOpen)
  const setSwitcher = useShell((s) => s.setSwitcher)
  const windows = useWindowStore((s) => s.windows)
  const focusWindow = useWindowStore((s) => s.focusWindow)
  const closeWindow = useWindowStore((s) => s.closeWindow)
  const toggleSplit = useWindowStore((s) => s.toggleSplit)
  const split = useWindowStore((s) => s.splitView)

  const recents = [...windows].sort((a, b) => b.zIndex - a.zIndex)
  const focus = (id: string) => {
    focusWindow(id)
    setSwitcher(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-50 flex flex-col bg-black/55 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex items-center justify-between px-5 pt-safe">
            <span className="pt-3 text-sm font-medium text-white/90">Recent apps</span>
            <div className="flex items-center gap-2 pt-3">
              {windows.filter((w) => w.state !== 'minimized').length >= 2 && (
                <button
                  type="button"
                  onClick={() => {
                    toggleSplit()
                    setSwitcher(false)
                  }}
                  className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs text-white/90"
                >
                  <SplitSquareVertical size={14} />
                  {split ? 'Exit split' : 'Split top two'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setSwitcher(false)}
                aria-label="Close"
                className="text-white/70"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex flex-1 items-center overflow-x-auto px-5 py-4">
            {recents.length === 0 ? (
              <p className="w-full text-center text-sm text-white/60">No open apps</p>
            ) : (
              <div className="flex gap-4">
                {recents.map((w) => {
                  const app = getApp(w.appId)
                  return (
                    <motion.div
                      key={w.id}
                      drag="y"
                      dragConstraints={{ top: 0, bottom: 0 }}
                      dragElastic={{ top: 0.7, bottom: 0 }}
                      onDragEnd={(_: unknown, info: PanInfo) => {
                        if (info.offset.y < -110) closeWindow(w.id)
                      }}
                      className="flex w-52 shrink-0 cursor-grab flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface shadow-window active:cursor-grabbing"
                    >
                      <div className="flex items-center gap-2 border-b border-line px-3 py-2">
                        {app && (
                          <IconTile icon={app.icon} tile={app.tile} size={22} rounded="rounded-md" />
                        )}
                        <span className="flex-1 truncate text-xs font-medium">{w.title}</span>
                        <button
                          type="button"
                          onClick={() => closeWindow(w.id)}
                          aria-label="Close app"
                          className="text-muted hover:text-fg"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => focus(w.id)}
                        className="grid h-40 place-items-center bg-gradient-to-br from-elevated to-surface"
                      >
                        {app && <IconTile icon={app.icon} tile={app.tile} size={48} />}
                      </button>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex justify-center pb-safe">
            <button
              type="button"
              onClick={() => setSwitcher(false)}
              className="mb-4 flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/90"
            >
              <Home size={16} />
              Home
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
