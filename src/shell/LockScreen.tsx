import { motion, type PanInfo } from 'framer-motion'
import { ChevronUp, Lock } from 'lucide-react'
import { Wallpaper } from './Wallpaper'
import { useClock } from '@/hooks/useClock'
import { useSettings } from '@/store/settings'
import { useShell } from '@/store/shell'
import { formatClock } from '@/lib/format'

export function LockScreen() {
  const now = useClock()
  const unlock = useShell((s) => s.unlock)
  const userName = useSettings((s) => s.userName)

  const date = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y < -100) unlock()
  }

  return (
    <motion.div
      className="absolute inset-0 z-[60] overflow-hidden"
      initial={{ y: 0 }}
      exit={{ y: '-100%' }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
    >
      <Wallpaper />
      <div className="absolute inset-0 bg-black/30" />

      <motion.div
        className="relative flex h-full touch-none flex-col items-center justify-between pb-safe pt-safe"
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.6, bottom: 0 }}
        onDragEnd={onDragEnd}
      >
        <div className="mt-[18vh] flex flex-col items-center text-white">
          <Lock size={20} className="mb-4 opacity-70" />
          <div className="text-7xl font-light tabular-nums tracking-tight drop-shadow-lg">
            {formatClock(now)}
          </div>
          <div className="mt-2 text-base text-white/80">{date}</div>
        </div>

        <button
          type="button"
          onClick={unlock}
          className="mb-[8vh] flex flex-col items-center gap-2 text-white/80"
        >
          <span className="text-sm">Welcome back, {userName}</span>
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 1.8 }}>
            <ChevronUp size={24} />
          </motion.div>
          <span className="text-xs text-white/60">Swipe up or tap to unlock</span>
        </button>
      </motion.div>
    </motion.div>
  )
}
