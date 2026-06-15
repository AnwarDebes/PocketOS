import { useRef } from 'react'
import { usePointerDrag, type DragDelta } from '@/hooks/usePointerDrag'
import { useWindowStore } from '@/store/windows'
import { useShell } from '@/store/shell'

/**
 * The mobile home indicator. Gestures on it:
 * - swipe up   -> app switcher
 * - swipe down -> home (minimize everything)
 * - swipe left/right -> switch to the next/previous app
 * - tap -> home, or the switcher when already on the home screen
 */
export function MobileGestures() {
  const cycleFocus = useWindowStore((s) => s.cycleFocus)
  const showDesktop = useWindowStore((s) => s.showDesktop)
  const focusedId = useWindowStore((s) => s.focusedId)
  const setSwitcher = useShell((s) => s.setSwitcher)
  const last = useRef<DragDelta>({ dx: 0, dy: 0 })

  const onPointerDown = usePointerDrag({
    onMove: (d) => {
      last.current = d
    },
    onEnd: () => {
      const { dx, dy } = last.current
      last.current = { dx: 0, dy: 0 }
      const absX = Math.abs(dx)
      const absY = Math.abs(dy)
      if (absY > 36 && absY >= absX) {
        if (dy < 0) setSwitcher(true)
        else showDesktop()
      } else if (absX > 48) {
        cycleFocus(dx < 0 ? 1 : -1)
      } else if (focusedId) {
        showDesktop()
      } else {
        setSwitcher(true)
      }
    },
  })

  return (
    <div className="relative z-40 flex shrink-0 justify-center pb-safe">
      <button
        type="button"
        aria-label="Home"
        onPointerDown={onPointerDown}
        className="flex w-48 touch-none items-center justify-center py-2.5"
      >
        <span className="h-1.5 w-36 rounded-full bg-fg/40 transition-colors active:bg-fg/60" />
      </button>
    </div>
  )
}
