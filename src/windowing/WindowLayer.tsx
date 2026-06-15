import { useEffect, useRef, useState } from 'react'
import { useWindowStore } from '@/store/windows'
import { Window } from './Window'
import { SnapOverlay } from './SnapOverlay'
import { WorkAreaContext, type WorkArea } from './WorkAreaContext'

/**
 * Hosts every window and measures the work area so the window manager can place,
 * clamp, and snap windows in pixel space.
 */
export function WindowLayer() {
  const windows = useWindowStore((s) => s.windows)
  const ref = useRef<HTMLDivElement>(null)
  const [area, setArea] = useState<WorkArea>({ left: 0, top: 0, width: 0, height: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const r = el.getBoundingClientRect()
      setArea({ left: r.left, top: r.top, width: r.width, height: r.height })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  return (
    <div ref={ref} className="absolute inset-0">
      <WorkAreaContext.Provider value={area}>
        {windows.map((w) => (
          <Window key={w.id} win={w} />
        ))}
        <SnapOverlay />
      </WorkAreaContext.Provider>
    </div>
  )
}
