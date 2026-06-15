import { useEffect, useState } from 'react'

interface BatteryManagerLike extends EventTarget {
  level: number
  charging: boolean
}

interface NavigatorWithBattery extends Navigator {
  getBattery?: () => Promise<BatteryManagerLike>
}

export interface BatteryInfo {
  supported: boolean
  level: number
  charging: boolean
}

/** Battery status via the (non-standard) Battery API, gracefully unsupported. */
export function useBattery(): BatteryInfo {
  const [info, setInfo] = useState<BatteryInfo>({ supported: false, level: 1, charging: false })

  useEffect(() => {
    const nav = navigator as NavigatorWithBattery
    if (!nav.getBattery) return
    let battery: BatteryManagerLike | null = null
    let active = true

    const update = () => {
      if (battery) setInfo({ supported: true, level: battery.level, charging: battery.charging })
    }

    nav.getBattery().then((b) => {
      if (!active) return
      battery = b
      update()
      b.addEventListener('levelchange', update)
      b.addEventListener('chargingchange', update)
    })

    return () => {
      active = false
      if (battery) {
        battery.removeEventListener('levelchange', update)
        battery.removeEventListener('chargingchange', update)
      }
    }
  }, [])

  return info
}
