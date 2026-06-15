import type { CSSProperties } from 'react'
import { useWindowStore } from '@/store/windows'

/** Translucent preview of where a dragged window will land. */
export function SnapOverlay() {
  const hint = useWindowStore((s) => s.dragHint)
  if (!hint) return null

  const style: CSSProperties =
    hint === 'left'
      ? { left: 0, top: 0, width: '50%', height: '100%' }
      : hint === 'right'
        ? { left: '50%', top: 0, width: '50%', height: '100%' }
        : { left: 0, top: 0, width: '100%', height: '100%' }

  return (
    <div
      className="pointer-events-none absolute z-[5] m-1 rounded-window border-2 border-accent/60 bg-accent/15 backdrop-blur-sm transition-all duration-100"
      style={style}
    />
  )
}
