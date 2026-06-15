import type { PointerEvent as ReactPointerEvent } from 'react'
import { useWindowStore } from '@/store/windows'
import type { WindowInstance } from '@/kernel/types'
import type { WorkArea } from './WorkAreaContext'

interface Edges {
  n?: boolean
  s?: boolean
  e?: boolean
  w?: boolean
}

const HANDLES: Array<{ edges: Edges; className: string; cursor: string }> = [
  { edges: { n: true }, className: 'left-2 right-2 top-0 h-1.5', cursor: 'ns-resize' },
  { edges: { s: true }, className: 'left-2 right-2 bottom-0 h-1.5', cursor: 'ns-resize' },
  { edges: { w: true }, className: 'top-2 bottom-2 left-0 w-1.5', cursor: 'ew-resize' },
  { edges: { e: true }, className: 'top-2 bottom-2 right-0 w-1.5', cursor: 'ew-resize' },
  { edges: { n: true, w: true }, className: 'top-0 left-0 h-3.5 w-3.5', cursor: 'nwse-resize' },
  { edges: { n: true, e: true }, className: 'top-0 right-0 h-3.5 w-3.5', cursor: 'nesw-resize' },
  { edges: { s: true, w: true }, className: 'bottom-0 left-0 h-3.5 w-3.5', cursor: 'nesw-resize' },
  { edges: { s: true, e: true }, className: 'bottom-0 right-0 h-3.5 w-3.5', cursor: 'nwse-resize' },
]

interface ResizeHandlesProps {
  win: WindowInstance
  area: WorkArea
  minWidth: number
  minHeight: number
}

export function ResizeHandles({ win, area, minWidth, minHeight }: ResizeHandlesProps) {
  const setBounds = useWindowStore((s) => s.setBounds)
  const focusWindow = useWindowStore((s) => s.focusWindow)

  const startResize = (edges: Edges) => (e: ReactPointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    focusWindow(win.id)

    const base = { x: win.x, y: win.y, width: win.width, height: win.height }
    const startX = e.clientX
    const startY = e.clientY

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      let { x, y, width, height } = base
      if (edges.e) width = base.width + dx
      if (edges.s) height = base.height + dy
      if (edges.w) width = base.width - dx
      if (edges.n) height = base.height - dy
      width = Math.max(minWidth, Math.min(width, area.width))
      height = Math.max(minHeight, Math.min(height, area.height))
      if (edges.w) x = base.x + (base.width - width)
      if (edges.n) y = base.y + (base.height - height)
      x = Math.max(0, Math.min(x, area.width - width))
      y = Math.max(0, Math.min(y, area.height - height))
      setBounds(win.id, { x, y, width, height })
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  return (
    <>
      {HANDLES.map((h, i) => (
        <div
          key={i}
          onPointerDown={startResize(h.edges)}
          className={`absolute z-10 touch-none ${h.className}`}
          style={{ cursor: h.cursor }}
        />
      ))}
    </>
  )
}
