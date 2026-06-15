import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { PocketLogo } from '@/components/PocketLogo'
import { APP_NAME, APP_VERSION } from '@/lib/constants'

interface BootScreenProps {
  onDone: () => void
  /** How long the boot animation runs before handing off, in ms. */
  duration?: number
}

/**
 * First thing the user sees on cold start. In later phases this hands off to the
 * lock screen; for now it hands back to App to show the Phase 0 status view.
 */
export function BootScreen({ onDone, duration = 1900 }: BootScreenProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, duration)
    return () => window.clearTimeout(timer)
  }, [onDone, duration])

  return (
    <motion.div
      className="fixed inset-0 grid place-items-center bg-bg"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col items-center gap-7">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        >
          <PocketLogo size={104} className="drop-shadow-[0_8px_30px_rgba(99,102,241,0.45)]" />
        </motion.div>

        <motion.div
          className="text-center"
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <h1 className="text-2xl font-semibold tracking-tight">{APP_NAME}</h1>
          <p className="mt-1 text-sm text-muted">A desktop in your pocket</p>
        </motion.div>

        {/* indeterminate loading bar */}
        <div className="relative h-1 w-44 overflow-hidden rounded-full bg-elevated">
          <motion.div
            className="absolute inset-y-0 w-1/2 rounded-full bg-accent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
          />
        </div>

        <p className="text-xs text-muted/70">v{APP_VERSION}</p>
      </div>
    </motion.div>
  )
}
