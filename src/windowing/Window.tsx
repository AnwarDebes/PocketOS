import { Suspense, useRef } from 'react'
import type { CSSProperties } from 'react'
import { getApp } from '@/apps/registry'
import { useWindowStore } from '@/store/windows'
import { usePointerDrag } from '@/hooks/usePointerDrag'
import { cn } from '@/lib/cn'
import { Spinner } from '@/components/Spinner'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import type { DragHint, WindowInstance } from '@/kernel/types'
import { TitleBar } from './TitleBar'
import { ResizeHandles } from './ResizeHandles'
import { useWorkArea } from './WorkAreaContext'

const SNAP_EDGE = 28

export function Window({ win }: { win: WindowInstance }) {
  const mode = useWindowStore((s) => s.mode)
  const focused = useWindowStore((s) => s.focusedId) === win.id
  const split = useWindowStore((s) => s.splitView)
  const area = useWorkArea()

  const focusWindow = useWindowStore((s) => s.focusWindow)
  const closeWindow = useWindowStore((s) => s.closeWindow)
  const minimizeWindow = useWindowStore((s) => s.minimizeWindow)
  const toggleMaximize = useWindowStore((s) => s.toggleMaximize)
  const setBounds = useWindowStore((s) => s.setBounds)
  const beginFloat = useWindowStore((s) => s.beginFloat)
  const snapWindow = useWindowStore((s) => s.snapWindow)
  const setDragHint = useWindowStore((s) => s.setDragHint)

  const app = getApp(win.appId)
  const moveBase = useRef<{ x: number; y: number } | null>(null)
  const hintRef = useRef<DragHint>(null)

  const mobile = mode === 'mobile'
  const floating = !mobile && win.state === 'normal' && !win.snap

  const onDragStart = usePointerDrag({
    onStart: (e) => {
      focusWindow(win.id)
      if (win.state === 'maximized' || win.snap) {
        // Un-snap into a floating window placed under the pointer.
        const w = win.width
        const h = win.height
        let x = e.clientX - area.left - w / 2
        let y = e.clientY - area.top - 18
        x = Math.max(0, Math.min(x, area.width - w))
        y = Math.max(0, Math.min(y, area.height - h))
        beginFloat(win.id, { x, y, width: w, height: h })
        moveBase.current = { x, y }
      } else {
        moveBase.current = { x: win.x, y: win.y }
      }
    },
    onMove: ({ dx, dy }, e) => {
      const base = moveBase.current
      if (!base) return
      const x = Math.max(-(win.width - 120), Math.min(base.x + dx, area.width - 120))
      const y = Math.max(0, Math.min(base.y + dy, area.height - 44))
      setBounds(win.id, { x, y })

      const px = e.clientX - area.left
      const py = e.clientY - area.top
      let hint: DragHint = null
      if (py <= SNAP_EDGE) hint = 'max'
      else if (px <= SNAP_EDGE) hint = 'left'
      else if (px >= area.width - SNAP_EDGE) hint = 'right'
      if (hint !== hintRef.current) {
        hintRef.current = hint
        setDragHint(hint)
      }
    },
    onEnd: () => {
      const hint = hintRef.current
      if (hint === 'max') {
        const current = useWindowStore.getState().windows.find((x) => x.id === win.id)
        if (current && current.state !== 'maximized') toggleMaximize(win.id)
      } else if (hint === 'left' || hint === 'right') {
        snapWindow(win.id, hint)
      }
      moveBase.current = null
      hintRef.current = null
      setDragHint(null)
    },
  })

  const style: CSSProperties = { zIndex: win.zIndex }
  if (win.state === 'minimized') {
    style.display = 'none'
  } else if (mobile && split) {
    if (win.id === split[0]) Object.assign(style, { left: 0, top: 0, width: '100%', height: '50%' })
    else if (win.id === split[1])
      Object.assign(style, { left: 0, top: '50%', width: '100%', height: '50%' })
    else style.display = 'none'
  } else if (mobile || win.state === 'maximized') {
    Object.assign(style, { left: 0, top: 0, width: '100%', height: '100%' })
  } else if (win.snap === 'left') {
    Object.assign(style, { left: 0, top: 0, width: '50%', height: '100%' })
  } else if (win.snap === 'right') {
    Object.assign(style, { left: '50%', top: 0, width: '50%', height: '100%' })
  } else {
    Object.assign(style, { left: win.x, top: win.y, width: win.width, height: win.height })
  }

  const AppComponent = app?.component

  return (
    <div
      className={cn(
        'absolute flex flex-col overflow-hidden bg-surface',
        floating && 'rounded-window border shadow-window',
        floating && (focused ? 'border-accent/40' : 'border-line'),
      )}
      style={style}
      onPointerDown={() => focusWindow(win.id)}
    >
      <TitleBar
        win={win}
        focused={focused}
        draggable={!mobile}
        showMaximize={!mobile}
        onDragStart={onDragStart}
        onMinimize={() => minimizeWindow(win.id)}
        onToggleMax={() => toggleMaximize(win.id)}
        onClose={() => closeWindow(win.id)}
      />

      <div className="relative flex-1 overflow-hidden bg-surface text-fg">
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="grid h-full place-items-center text-muted">
                <Spinner />
              </div>
            }
          >
            {AppComponent && <AppComponent windowId={win.id} payload={win.payload} />}
          </Suspense>
        </ErrorBoundary>
      </div>

      {floating && (
        <ResizeHandles
          win={win}
          area={area}
          minWidth={app?.minSize?.width ?? 260}
          minHeight={app?.minSize?.height ?? 200}
        />
      )}
    </div>
  )
}
