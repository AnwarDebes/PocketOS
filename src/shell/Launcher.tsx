import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { getApps } from '@/apps/registry'
import { useWindowStore } from '@/store/windows'
import { useShell } from '@/store/shell'
import { IconTile } from '@/components/IconTile'

export function Launcher() {
  const open = useShell((s) => s.launcherOpen)
  const setLauncher = useShell((s) => s.setLauncher)
  const openApp = useWindowStore((s) => s.openApp)
  const [q, setQ] = useState('')

  useEffect(() => {
    if (!open) {
      setQ('')
      return
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLauncher(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setLauncher])

  const apps = getApps().filter((a) => a.name.toLowerCase().includes(q.trim().toLowerCase()))
  const launch = (id: string) => {
    openApp(id)
    setLauncher(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-50 bg-black/40 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) setLauncher(false)
          }}
        >
          <motion.div
            className="mx-auto mt-[11vh] flex w-full max-w-2xl flex-col px-5"
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 18, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 24 }}
          >
            <div className="flex items-center gap-2 rounded-xl border border-line bg-surface/90 px-3 py-2.5 shadow-window">
              <Search size={18} className="text-muted" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search apps"
                className="w-full bg-transparent text-sm text-fg outline-none placeholder:text-muted"
              />
              <button
                type="button"
                onClick={() => setLauncher(false)}
                aria-label="Close launcher"
                className="text-muted hover:text-fg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-5">
              {apps.map((app) => (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => launch(app.id)}
                  className="flex flex-col items-center gap-2 rounded-xl p-3 hover:bg-white/10"
                >
                  <IconTile icon={app.icon} tile={app.tile} size={52} />
                  <span className="text-center text-xs text-white/90">{app.name}</span>
                </button>
              ))}
              {apps.length === 0 && (
                <p className="col-span-full py-10 text-center text-sm text-white/70">
                  No apps match your search.
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
