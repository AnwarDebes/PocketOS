import { AnimatePresence } from 'framer-motion'
import { Desktop } from './Desktop'
import { LockScreen } from './LockScreen'
import { useShell } from '@/store/shell'
import { useViewportModeSync } from '@/hooks/useViewportMode'

export function Shell() {
  useViewportModeSync()
  const locked = useShell((s) => s.locked)

  return (
    <div className="relative h-full w-full">
      <Desktop />
      <AnimatePresence>{locked && <LockScreen key="lock" />}</AnimatePresence>
    </div>
  )
}
