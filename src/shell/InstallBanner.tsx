import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { PocketLogo } from '@/components/PocketLogo'
import { usePwaInstall } from '@/hooks/usePwaInstall'

/** Custom install prompt shown when the browser reports the app is installable. */
export function InstallBanner() {
  const { canInstall, install } = usePwaInstall()
  const [dismissed, setDismissed] = useState(false)

  return (
    <AnimatePresence>
      {canInstall && !dismissed && (
        <motion.div
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          className="absolute bottom-24 left-1/2 z-50 flex max-w-[calc(100%-1.5rem)] -translate-x-1/2 items-center gap-3 rounded-2xl border border-line bg-surface/90 px-4 py-3 shadow-window backdrop-blur-xl"
        >
          <PocketLogo size={36} />
          <div className="min-w-0">
            <div className="text-sm font-medium">Install PocketOS</div>
            <div className="text-xs text-muted">Launch full screen, works offline</div>
          </div>
          <button
            type="button"
            onClick={() => void install()}
            className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg"
          >
            Install
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="shrink-0 text-muted hover:text-fg"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
