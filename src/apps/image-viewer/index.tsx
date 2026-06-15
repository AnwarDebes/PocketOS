import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, ChevronRight, Image as ImageIcon, Maximize, Minus, Plus, RotateCw } from 'lucide-react'
import type { AppProps } from '@/kernel/types'
import { listDir, readBlob } from '@/fs/vfs'
import { basename, dirname } from '@/lib/paths'
import { isImageFile } from '@/lib/mime'
import { useWindowStore } from '@/store/windows'

export default function ImageViewerApp({ windowId, payload }: AppProps) {
  const [path, setPath] = useState<string | null>(
    typeof payload?.path === 'string' ? payload.path : null,
  )
  const [url, setUrl] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [rot, setRot] = useState(0)
  const setTitle = useWindowStore((s) => s.setTitle)
  const openApp = useWindowStore((s) => s.openApp)

  const siblings = useLiveQuery(async () => {
    if (!path) return [] as string[]
    const items = await listDir(dirname(path))
    return items.filter((i) => i.type === 'file' && isImageFile(i.path)).map((i) => i.path)
  }, [path])

  useEffect(() => {
    if (!path) {
      setUrl(null)
      return
    }
    let active = true
    let created: string | null = null
    setZoom(1)
    setRot(0)
    void readBlob(path).then((b) => {
      if (!active || !b) {
        setUrl(null)
        return
      }
      created = URL.createObjectURL(b)
      setUrl(created)
    })
    return () => {
      active = false
      if (created) URL.revokeObjectURL(created)
    }
  }, [path])

  useEffect(() => {
    setTitle(windowId, path ? `Images: ${basename(path)}` : 'Images')
  }, [path, windowId, setTitle])

  const idx = siblings && path ? siblings.indexOf(path) : -1
  const canPage = !!siblings && siblings.length > 1 && idx >= 0
  const go = (delta: number) => {
    if (!siblings || idx < 0) return
    setPath(siblings[(idx + delta + siblings.length) % siblings.length])
  }

  if (!path) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-surface text-muted">
        <ImageIcon size={32} strokeWidth={1.5} />
        <p className="text-sm">Open an image from the Files app</p>
        <button
          type="button"
          onClick={() => openApp('file-manager')}
          className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg"
        >
          Open Files
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex items-center gap-1 border-b border-line px-2 py-1.5">
        <span className="flex-1 truncate px-1 text-sm">{basename(path)}</span>
        {canPage && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Previous" className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-line">
              <ChevronLeft size={18} />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Next" className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-line">
              <ChevronRight size={18} />
            </button>
            <div className="mx-1 h-5 w-px bg-line" />
          </>
        )}
        <button type="button" onClick={() => setZoom((z) => Math.max(0.1, z / 1.25))} aria-label="Zoom out" className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-line">
          <Minus size={17} />
        </button>
        <span className="w-12 text-center text-xs tabular-nums text-muted">{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => setZoom((z) => Math.min(8, z * 1.25))} aria-label="Zoom in" className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-line">
          <Plus size={17} />
        </button>
        <button type="button" onClick={() => { setZoom(1); setRot(0) }} aria-label="Reset" className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-line">
          <Maximize size={16} />
        </button>
        <button type="button" onClick={() => setRot((r) => (r + 90) % 360)} aria-label="Rotate" className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-line">
          <RotateCw size={16} />
        </button>
      </div>

      <div
        className="grid flex-1 place-items-center overflow-auto p-4"
        style={{
          backgroundImage:
            'linear-gradient(45deg, rgba(255,255,255,0.04) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.04) 75%), linear-gradient(45deg, rgba(255,255,255,0.04) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.04) 75%)',
          backgroundSize: '24px 24px',
          backgroundPosition: '0 0, 12px 12px',
        }}
      >
        {url ? (
          <img
            src={url}
            alt={basename(path)}
            draggable={false}
            className="max-h-full max-w-full select-none object-contain transition-transform"
            style={{ transform: `scale(${zoom}) rotate(${rot}deg)` }}
          />
        ) : (
          <p className="text-sm text-muted">Could not load this image</p>
        )}
      </div>
    </div>
  )
}
