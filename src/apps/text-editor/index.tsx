import { useCallback, useEffect, useState } from 'react'
import { FilePlus, Save } from 'lucide-react'
import type { AppProps } from '@/kernel/types'
import { exists, readText, writeFile } from '@/fs/vfs'
import { basename, HOME, join, normalize } from '@/lib/paths'
import { useWindowStore } from '@/store/windows'
import { Button } from '@/components/Button'
import { Modal } from '@/components/Modal'
import { Spinner } from '@/components/Spinner'

export default function TextEditorApp({ windowId, payload }: AppProps) {
  const initialPath = typeof payload?.path === 'string' ? payload.path : null
  const [path, setPath] = useState<string | null>(initialPath)
  const [content, setContent] = useState('')
  const [dirty, setDirty] = useState(false)
  const [loading, setLoading] = useState(!!initialPath)
  const [saveAs, setSaveAs] = useState<{ value: string; error?: string } | null>(null)
  const setTitle = useWindowStore((s) => s.setTitle)

  useEffect(() => {
    if (!initialPath) return
    let active = true
    setLoading(true)
    readText(initialPath)
      .then((t) => {
        if (active) {
          setContent(t)
          setDirty(false)
        }
      })
      .catch(() => undefined)
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [initialPath])

  const name = path ? basename(path) : 'Untitled'
  useEffect(() => {
    setTitle(windowId, `${name}${dirty ? ' •' : ''}`)
  }, [name, dirty, windowId, setTitle])

  const save = useCallback(async () => {
    if (!path) {
      setSaveAs({ value: 'untitled.txt' })
      return
    }
    await writeFile(path, content)
    setDirty(false)
  }, [path, content])

  const doSaveAs = async () => {
    if (!saveAs) return
    const raw = saveAs.value.trim()
    if (!raw) return
    const target = raw.startsWith('/') ? normalize(raw) : join(HOME, raw)
    try {
      if (await exists(target)) {
        setSaveAs({ ...saveAs, error: 'A file with that name already exists' })
        return
      }
      await writeFile(target, content)
      setPath(target)
      setDirty(false)
      setSaveAs(null)
    } catch (e) {
      setSaveAs({ ...saveAs, error: e instanceof Error ? e.message : String(e) })
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (useWindowStore.getState().focusedId !== windowId) return
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void save()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [save, windowId])

  const newDoc = () => {
    setPath(null)
    setContent('')
    setDirty(false)
  }

  const lineCount = content ? content.split('\n').length : 0

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex items-center gap-2 border-b border-line px-3 py-1.5">
        <span className="flex-1 truncate text-sm">
          {name}
          {dirty && <span className="ml-1 text-accent">{'•'}</span>}
        </span>
        <span className="hidden text-xs text-muted sm:inline">
          {lineCount} lines, {content.length} chars
        </span>
        <button
          type="button"
          onClick={newDoc}
          title="New"
          aria-label="New"
          className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-line"
        >
          <FilePlus size={16} />
        </button>
        <Button variant="primary" onClick={() => void save()} disabled={!dirty && !!path}>
          <Save size={15} />
          Save
        </Button>
      </div>

      {loading ? (
        <div className="grid flex-1 place-items-center text-muted">
          <Spinner />
        </div>
      ) : (
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value)
            setDirty(true)
          }}
          spellCheck={false}
          placeholder="Start typing..."
          className="select-text flex-1 resize-none bg-surface p-4 font-mono text-sm leading-relaxed outline-none placeholder:text-muted"
        />
      )}

      <Modal
        open={!!saveAs}
        title="Save as"
        onClose={() => setSaveAs(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSaveAs(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={doSaveAs}>
              Save
            </Button>
          </>
        }
      >
        {saveAs && (
          <div className="space-y-2">
            <p className="text-xs text-muted">Saved to your home folder unless you type a full path.</p>
            <input
              autoFocus
              value={saveAs.value}
              onChange={(e) => setSaveAs({ value: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && doSaveAs()}
              className="select-text w-full rounded-lg border border-line bg-surface px-3 py-2 font-mono text-sm outline-none focus:border-accent"
            />
            {saveAs.error && <p className="text-xs text-danger">{saveAs.error}</p>}
          </div>
        )}
      </Modal>
    </div>
  )
}
