import './monaco-setup'
import { useEffect, useRef, useState } from 'react'
import Editor, { type OnMount } from '@monaco-editor/react'
import { FilePlus, Save } from 'lucide-react'
import type { AppProps } from '@/kernel/types'
import { exists, readText, writeFile } from '@/fs/vfs'
import { basename, extname, HOME, join, normalize } from '@/lib/paths'
import { useWindowStore } from '@/store/windows'
import { useSettings } from '@/store/settings'
import { Button } from '@/components/Button'
import { Modal } from '@/components/Modal'
import { Spinner } from '@/components/Spinner'

const LANG: Record<string, string> = {
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.json': 'json',
  '.css': 'css',
  '.scss': 'scss',
  '.html': 'html',
  '.md': 'markdown',
  '.markdown': 'markdown',
  '.py': 'python',
  '.go': 'go',
  '.rs': 'rust',
  '.java': 'java',
  '.c': 'c',
  '.cpp': 'cpp',
  '.sh': 'shell',
  '.sql': 'sql',
  '.yml': 'yaml',
  '.yaml': 'yaml',
  '.xml': 'xml',
}
const langFor = (path: string | null) => (path ? (LANG[extname(path)] ?? 'plaintext') : 'plaintext')

export default function CodeEditorApp({ windowId, payload }: AppProps) {
  const initialPath = typeof payload?.path === 'string' ? payload.path : null
  const [path, setPath] = useState<string | null>(initialPath)
  const [value, setValue] = useState('')
  const [dirty, setDirty] = useState(false)
  const [loading, setLoading] = useState(!!initialPath)
  const [saveAs, setSaveAs] = useState<{ value: string; error?: string } | null>(null)
  const theme = useSettings((s) => s.theme)
  const setTitle = useWindowStore((s) => s.setTitle)
  const saveRef = useRef<() => void>(() => {})

  useEffect(() => {
    if (!initialPath) return
    let active = true
    setLoading(true)
    readText(initialPath)
      .then((t) => {
        if (active) {
          setValue(t)
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

  const save = async () => {
    if (!path) {
      setSaveAs({ value: 'untitled.txt' })
      return
    }
    await writeFile(path, value)
    setDirty(false)
  }
  saveRef.current = () => void save()

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
      await writeFile(target, value)
      setPath(target)
      setDirty(false)
      setSaveAs(null)
    } catch (e) {
      setSaveAs({ ...saveAs, error: e instanceof Error ? e.message : String(e) })
    }
  }

  const onMount: OnMount = (editor, monaco) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => saveRef.current())
  }

  const newDoc = () => {
    setPath(null)
    setValue('')
    setDirty(false)
  }

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex items-center gap-2 border-b border-line px-3 py-1.5">
        <span className="flex-1 truncate text-sm">
          {name}
          {dirty && <span className="ml-1 text-accent">{'•'}</span>}
        </span>
        <span className="hidden rounded bg-elevated px-1.5 py-0.5 text-[10px] uppercase text-muted sm:inline">
          {langFor(path)}
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

      <div className="relative flex-1">
        {loading ? (
          <div className="grid h-full place-items-center text-muted">
            <Spinner />
          </div>
        ) : (
          <Editor
            height="100%"
            theme={theme === 'light' ? 'light' : 'vs-dark'}
            language={langFor(path)}
            value={value}
            onChange={(v) => {
              setValue(v ?? '')
              setDirty(true)
            }}
            onMount={onMount}
            loading={<Spinner />}
            options={{
              fontSize: 13,
              minimap: { enabled: false },
              automaticLayout: true,
              scrollBeyondLastLine: false,
              tabSize: 2,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
              padding: { top: 10 },
            }}
          />
        )}
      </div>

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
