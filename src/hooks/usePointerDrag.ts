import { useCallback, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'

export interface DragDelta {
  dx: number
  dy: number
}

interface DragHandlers {
  onStart?: (e: ReactPointerEvent) => void
  onMove: (delta: DragDelta, e: PointerEvent) => void
  onEnd?: (e: PointerEvent) => void
}

/**
 * Unified pointer drag (mouse + touch + pen). Returns an onPointerDown handler.
 * Tracks deltas from the press point and attaches window-level listeners so the
 * drag keeps working even if the pointer leaves the element.
 */
export function usePointerDrag(handlers: DragHandlers): (e: ReactPointerEvent) => void {
  const ref = useRef(handlers)
  ref.current = handlers

  return useCallback((e: ReactPointerEvent) => {
    // Primary button / touch / pen only.
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()

    const startX = e.clientX
    const startY = e.clientY
    ref.current.onStart?.(e)

    const onMove = (ev: PointerEvent) => {
      ref.current.onMove({ dx: ev.clientX - startX, dy: ev.clientY - startY }, ev)
    }
    const onUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      ref.current.onEnd?.(ev)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }, [])
}
