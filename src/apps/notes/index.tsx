import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, Plus, StickyNote, Trash2 } from 'lucide-react'
import type { AppProps } from '@/kernel/types'
import { ensureFolder, listDir, readText, remove, uniquePath, writeFile } from '@/fs/vfs'
import { HOME } from '@/lib/paths'
import { relativeTime } from '@/lib/format'
import { useElementSize } from '@/hooks/useElementSize'
import { useWindowStore } from '@/store/windows'
import { cn } from '@/lib/cn'

const NOTES_DIR = `${HOME}/Notes`

function titleOf(content: string): string {
  const first = content.split('\n').find((l) => l.trim()) ?? ''
  return first.replace(/^#+\s*/, '').trim() || 'New note'
}
function previewOf(content: string): string {
  return (
    content
      .split('\n')
      .slice(1)
      .find((l) => l.trim())
      ?.trim() ?? 'No additional text'
  )
}

export default function NotesApp({ windowId }: AppProps) {
  const [ref, { width }] = useElementSize<HTMLDivElement>()
  const compact = width > 0 && width < 560
  const [path, setPath] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const skip = useRef(false)
  const setTitle = useWindowStore((s) => s.setTitle)

  const notes = useLiveQuery(
    () =>
      listDir(NOTES_DIR).then((all) =>
        all.filter((n) => n.type === 'file').sort((a, b) => b.updatedAt - a.updatedAt),
      ),
    [],
  )

  useEffect(() => {
    void ensureFolder(NOTES_DIR)
  }, [])

  useEffect(() => {
    if (!path) return
    if (skip.current) {
      skip.current = false
      return
    }
    const t = window.setTimeout(() => void writeFile(path, draft), 400)
    return () => window.clearTimeout(t)
  }, [draft, path])

  useEffect(() => {
    setTitle(windowId, path ? `Notes: ${titleOf(draft)}` : 'Notes')
  }, [path, draft, windowId, setTitle])

  const select = async (p: string) => {
    skip.current = true
    setDraft(await readText(p))
    setPath(p)
  }
  const create = async () => {
    const p = await uniquePath(NOTES_DIR, 'Untitled.md')
    await writeFile(p, '')
    skip.current = true
    setDraft('')
    setPath(p)
  }
  const del = async (p: string) => {
    await remove(p)
    if (p === path) {
      setPath(null)
      setDraft('')
    }
  }

  const showList = !compact || !path
  const showEditor = !compact || !!path

  return (
    <div ref={ref} className="flex h-full bg-surface">
      {showList && (
        <aside
          className={cn('flex flex-col border-line', compact ? 'w-full' : 'w-56 border-r')}
        >
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <span className="text-sm font-semibold">Notes</span>
            <button
              type="button"
              onClick={create}
              aria-label="New note"
              className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-line"
            >
              <Plus size={17} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {notes && notes.length === 0 && (
              <p className="p-4 text-center text-xs text-muted">No notes yet</p>
            )}
            {notes?.map((n) => {
              const content = typeof n.content === 'string' ? n.content : ''
              return (
                <button
                  key={n.path}
                  type="button"
                  onClick={() => select(n.path)}
                  className={cn(
                    'group flex w-full flex-col gap-0.5 border-b border-line px-3 py-2.5 text-left hover:bg-line',
                    path === n.path && 'bg-line',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="flex-1 truncate text-sm font-medium">{titleOf(content)}</span>
                    <span
                      role="button"
                      aria-label="Delete note"
                      onClick={(e) => {
                        e.stopPropagation()
                        void del(n.path)
                      }}
                      className="hidden text-muted hover:text-danger group-hover:block"
                    >
                      <Trash2 size={14} />
                    </span>
                  </div>
                  <span className="truncate text-xs text-muted">{previewOf(content)}</span>
                  <span className="text-[10px] text-muted/70">{relativeTime(n.updatedAt)}</span>
                </button>
              )
            })}
          </div>
        </aside>
      )}

      {showEditor && (
        <div className="flex min-w-0 flex-1 flex-col">
          {path ? (
            <>
              {compact && (
                <button
                  type="button"
                  onClick={() => setPath(null)}
                  className="flex items-center gap-1 border-b border-line px-3 py-2 text-sm text-muted"
                >
                  <ChevronLeft size={16} /> Notes
                </button>
              )}
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write something..."
                spellCheck={false}
                className="select-text flex-1 resize-none bg-surface p-4 text-sm leading-relaxed outline-none placeholder:text-muted"
              />
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-muted">
              <StickyNote size={28} strokeWidth={1.5} />
              <p className="text-sm">Select a note or create one</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
