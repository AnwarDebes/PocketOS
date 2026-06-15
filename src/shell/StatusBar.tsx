import {
  Battery,
  BatteryCharging,
  BatteryLow,
  BatteryMedium,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { PocketLogo } from '@/components/PocketLogo'
import { useClock } from '@/hooks/useClock'
import { useOnline } from '@/hooks/useOnline'
import { useBattery } from '@/hooks/useBattery'
import { useViewportMode } from '@/hooks/useViewportMode'
import { useWindowStore } from '@/store/windows'
import { useShell } from '@/store/shell'
import { formatClock } from '@/lib/format'

export function StatusBar() {
  const now = useClock()
  const online = useOnline()
  const battery = useBattery()
  const mode = useViewportMode()
  const toggleLauncher = useShell((s) => s.toggleLauncher)
  const focused = useWindowStore((s) => s.windows.find((w) => w.id === s.focusedId))

  const level = Math.round(battery.level * 100)
  const BatteryIcon = battery.charging
    ? BatteryCharging
    : battery.level > 0.6
      ? Battery
      : battery.level > 0.25
        ? BatteryMedium
        : BatteryLow

  return (
    <header className="relative z-40 shrink-0 bg-black/15 pt-safe backdrop-blur-md">
      <div className="flex h-8 items-center justify-between px-3 text-xs text-fg/90">
        <button
          type="button"
          onClick={toggleLauncher}
          className="flex items-center gap-1.5 rounded-md px-1.5 py-0.5 hover:bg-white/10"
        >
          <PocketLogo size={15} />
          <span className="font-semibold">PocketOS</span>
        </button>

        {mode === 'desktop' && focused && (
          <span className="truncate px-2 text-muted">{focused.title}</span>
        )}

        <div className="flex items-center gap-2.5">
          {online ? (
            <Wifi size={14} className="text-fg/80" />
          ) : (
            <WifiOff size={14} className="text-warning" />
          )}
          {battery.supported && (
            <span className="flex items-center gap-1 tabular-nums">
              <BatteryIcon size={16} className="text-fg/80" />
              {level}%
            </span>
          )}
          <span className="font-medium tabular-nums">{formatClock(now)}</span>
        </div>
      </div>
    </header>
  )
}
