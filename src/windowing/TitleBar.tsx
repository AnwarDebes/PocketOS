import type { PointerEvent as ReactPointerEvent } from 'react'
import { Minus, Maximize2, Minimize2, X } from 'lucide-react'
import { getApp } from '@/apps/registry'
import { cn } from '@/lib/cn'
import type { WindowInstance } from '@/kernel/types'

interface TitleBarProps {
  win: WindowInstance
  focused: boolean
  draggable: boolean
  showMaximize?: boolean
  onDragStart: (e: ReactPointerEvent) => void
  onMinimize: () => void
  onToggleMax: () => void
  onClose: () => void
}

export function TitleBar({
  win,
  focused,
  draggable,
  showMaximize = true,
  onDragStart,
  onMinimize,
  onToggleMax,
  onClose,
}: TitleBarProps) {
  const app = getApp(win.appId)
  const Icon = app?.icon
  const stop = (e: ReactPointerEvent) => e.stopPropagation()

  return (
    <div
      className={cn(
        'flex h-10 shrink-0 select-none items-center gap-2 border-b border-line px-2.5',
        focused ? 'bg-elevated' : 'bg-surface',
        draggable && 'cursor-default touch-none',
      )}
      onPointerDown={draggable ? onDragStart : undefined}
      onDoubleClick={draggable ? onToggleMax : undefined}
    >
      {Icon && <Icon size={15} className="shrink-0 text-muted" />}
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{win.title}</span>

      <div className="flex items-center gap-0.5">
        <button
          type="button"
          aria-label="Minimize"
          onPointerDown={stop}
          onClick={onMinimize}
          className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-line hover:text-fg"
        >
          <Minus size={15} />
        </button>
        {showMaximize && (
          <button
            type="button"
            aria-label={win.state === 'maximized' ? 'Restore' : 'Maximize'}
            onPointerDown={stop}
            onClick={onToggleMax}
            className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-line hover:text-fg"
          >
            {win.state === 'maximized' ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        )}
        <button
          type="button"
          aria-label="Close"
          onPointerDown={stop}
          onClick={onClose}
          className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-danger hover:text-white"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  )
}
