import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  ArrowLeft,
  ArrowUp,
  Copy,
  CopyPlus,
  ExternalLink,
  File,
  FileCode,
  FileJson,
  FilePlus,
  FileText,
  Folder,
  FolderPlus,
  House,
  Image as ImageIcon,
  LayoutGrid,
  List,
  MoreVertical,
  Pencil,
  ClipboardPaste,
  Scissors,
  Trash2,
  Upload,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { AppProps } from '@/kernel/types'
import type { VFSNode } from '@/fs/types'
import { copy, createFolder, listDir, move, remove, rename, uniquePath, writeFile } from '@/fs/vfs'
import { basename, dirname, extname, HOME, join, ROOT, splitPath } from '@/lib/paths'
import { isImageFile, isTextFile } from '@/lib/mime'
import { appForFile } from '@/apps/registry'
import { useWindowStore } from '@/store/windows'
import { formatBytes } from '@/lib/format'
import { cn } from '@/lib/cn'
import { Button } from '@/components/Button'
import { Modal } from '@/components/Modal'

const CODE_EXT = new Set([
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.css',
  '.scss',
  '.html',
  '.py',
  '.go',
  '.rs',
  '.sh',
  '.sql',
  '.c',
  '.cpp',
  '.java',
])

function entryIcon(node: VFSNode): { Icon: LucideIcon; cls: string } {
  if (node.type === 'folder') return { Icon: Folder, cls: 'text-blue-400' }
  if (isImageFile(node.path)) return { Icon: ImageIcon, cls: 'text-pink-400' }
  const ext = extname(node.path)
  if (ext === '.json') return { Icon: FileJson, cls: 'text-amber-400' }
  if (CODE_EXT.has(ext)) return { Icon: FileCode, cls: 'text-violet-400' }
  if (isTextFile(node.path)) return { Icon: FileText, cls: 'text-sky-400' }
  return { Icon: File, cls: 'text-muted' }
}

type Dialog =
  | { kind: 'new-folder' | 'new-file'; value: string; error?: string }
  | { kind: 'rename'; value: string; target: string; error?: string }

export default function FileManagerApp({ windowId, payload }: AppProps) {
  const start = typeof payload?.path === 'string' ? payload.path : HOME
  const [cwd, setCwd] = useState(start)
  const [history, setHistory] = useState<string[]>([])
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [menu, setMenu] = useState<{ x: number; y: number; node: VFSNode } | null>(null)
  const [clipboard, setClipboard] = useState<{ path: string; op: 'cut' | 'copy' } | null>(null)
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const [confirmDel, setConfirmDel] = useState<VFSNode | null>(null)
  const [error, setError] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const entries = useLiveQuery(() => listDir(cwd), [cwd])
  const setTitle = useWindowStore((s) => s.setTitle)
  const openApp = useWindowStore((s) => s.openApp)

  useEffect(() => {
    setTitle(windowId, `Files: ${basename(cwd) || 'Home'}`)
  }, [cwd, windowId, setTitle])

  useEffect(() => {
    if (!error) return
    const t = window.setTimeout(() => setError(null), 3500)
    return () => window.clearTimeout(t)
  }, [error])

  const fail = (e: unknown) => setError(e instanceof Error ? e.message : String(e))

  const navigate = (dir: string) => {
    setHistory((h) => [...h, cwd])
    setCwd(dir)
  }
  const goBack = () =>
    setHistory((h) => {
      if (!h.length) return h
      setCwd(h[h.length - 1])
      return h.slice(0, -1)
    })
  const goUp = () => cwd !== ROOT && navigate(dirname(cwd))

  const openEntry = (node: VFSNode) => {
    if (node.type === 'folder') navigate(node.path)
    else openApp(appForFile(node.path)?.id ?? 'text-editor', { path: node.path })
  }

  const openMenu = (e: React.MouseEvent, node: VFSNode) => {
    e.preventDefault()
    e.stopPropagation()
    const r = containerRef.current?.getBoundingClientRect()
    const x = e.clientX - (r?.left ?? 0)
    const y = e.clientY - (r?.top ?? 0)
    setMenu({
      x: Math.min(x, (r?.width ?? 0) - 184),
      y: Math.min(y, (r?.height ?? 0) - 264),
      node,
    })
  }

  const handleFiles = async (files: FileList, destDir: string) => {
    for (const file of Array.from(files)) {
      try {
        const target = await uniquePath(destDir, file.name)
        await writeFile(target, file, file.type || undefined)
      } catch (err) {
        fail(err)
      }
    }
  }

  const onDropTo = async (e: React.DragEvent, destDir: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFiles(e.dataTransfer.files, destDir)
      return
    }
    const src = e.dataTransfer.getData('text/pocketos-path')
    if (!src || dirname(src) === destDir || src === destDir) return
    try {
      await move(src, destDir)
    } catch (err) {
      fail(err)
    }
  }
  const allowDrop = (e: React.DragEvent) => {
    if (
      e.dataTransfer.types.includes('text/pocketos-path') ||
      e.dataTransfer.types.includes('Files')
    )
      e.preventDefault()
  }

  const submitDialog = async () => {
    if (!dialog) return
    const name = dialog.value.trim()
    if (!name) return
    try {
      if (dialog.kind === 'rename') await rename(dialog.target, name)
      else if (dialog.kind === 'new-folder') await createFolder(join(cwd, name))
      else await writeFile(join(cwd, name), '')
      setDialog(null)
    } catch (err) {
      setDialog({ ...dialog, error: err instanceof Error ? err.message : String(err) })
    }
  }

  const paste = async () => {
    if (!clipboard) return
    try {
      if (clipboard.op === 'cut') {
        await move(clipboard.path, cwd)
        setClipboard(null)
      } else {
        await copy(clipboard.path, cwd)
      }
    } catch (err) {
      fail(err)
    }
  }

  const confirmDelete = async () => {
    if (!confirmDel) return
    try {
      await remove(confirmDel.path, true)
    } catch (err) {
      fail(err)
    }
    setConfirmDel(null)
  }

  const crumbs = splitPath(cwd)

  return (
    <div ref={containerRef} className="relative flex h-full flex-col bg-surface">
      {/* toolbar */}
      <div className="flex items-center gap-1 border-b border-line px-2 py-1.5">
        <button
          type="button"
          onClick={goBack}
          disabled={!history.length}
          aria-label="Back"
          className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-line disabled:opacity-30"
        >
          <ArrowLeft size={17} />
        </button>
        <button
          type="button"
          onClick={goUp}
          disabled={cwd === ROOT}
          aria-label="Up"
          className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-line disabled:opacity-30"
        >
          <ArrowUp size={17} />
        </button>

        <div className="mx-1 flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto rounded-md bg-elevated/60 px-2 py-1 text-sm">
          <button
            type="button"
            onClick={() => navigate(ROOT)}
            onDragOver={allowDrop}
            onDrop={(e) => onDropTo(e, ROOT)}
            className="shrink-0 rounded p-0.5 text-muted hover:text-fg"
            aria-label="Root"
          >
            <House size={15} />
          </button>
          {crumbs.map((seg, i) => {
            const path = '/' + crumbs.slice(0, i + 1).join('/')
            return (
              <span key={path} className="flex shrink-0 items-center">
                <span className="text-muted">/</span>
                <button
                  type="button"
                  onClick={() => navigate(path)}
                  onDragOver={allowDrop}
                  onDrop={(e) => onDropTo(e, path)}
                  className="rounded px-1 hover:bg-line"
                >
                  {seg}
                </button>
              </span>
            )
          })}
        </div>

        {clipboard && (
          <button
            type="button"
            onClick={paste}
            aria-label="Paste"
            title="Paste"
            className="grid h-8 w-8 place-items-center rounded-md text-accent hover:bg-line"
          >
            <ClipboardPaste size={17} />
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void handleFiles(e.target.files, cwd)
            e.target.value = ''
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Upload files"
          title="Upload files"
          className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-line"
        >
          <Upload size={17} />
        </button>
        <button
          type="button"
          onClick={() => setDialog({ kind: 'new-folder', value: '' })}
          aria-label="New folder"
          title="New folder"
          className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-line"
        >
          <FolderPlus size={17} />
        </button>
        <button
          type="button"
          onClick={() => setDialog({ kind: 'new-file', value: '' })}
          aria-label="New file"
          title="New file"
          className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-line"
        >
          <FilePlus size={17} />
        </button>
        <button
          type="button"
          onClick={() => setView((v) => (v === 'grid' ? 'list' : 'grid'))}
          aria-label="Toggle view"
          className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-line"
        >
          {view === 'grid' ? <List size={17} /> : <LayoutGrid size={17} />}
        </button>
      </div>

      {/* body */}
      <div
        className="flex-1 overflow-y-auto p-3"
        onDragOver={allowDrop}
        onDrop={(e) => onDropTo(e, cwd)}
        onClick={() => setMenu(null)}
      >
        {entries && entries.length === 0 && (
          <div className="grid h-full place-items-center text-sm text-muted">This folder is empty</div>
        )}

        {view === 'grid' ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(92px,1fr))] gap-1">
            {entries?.map((node) => {
              const { Icon, cls } = entryIcon(node)
              return (
                <button
                  key={node.path}
                  type="button"
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/pocketos-path', node.path)}
                  onDragOver={node.type === 'folder' ? allowDrop : undefined}
                  onDrop={node.type === 'folder' ? (e) => onDropTo(e, node.path) : undefined}
                  onClick={() => openEntry(node)}
                  onContextMenu={(e) => openMenu(e, node)}
                  className="group relative flex flex-col items-center gap-1 rounded-lg p-2 text-center hover:bg-line"
                >
                  <Icon size={36} strokeWidth={1.5} className={cls} />
                  <span className="line-clamp-2 w-full break-words text-xs">{node.name}</span>
                  <span
                    role="button"
                    aria-label="Actions"
                    onClick={(e) => openMenu(e, node)}
                    className="absolute right-0.5 top-0.5 hidden rounded p-0.5 text-muted hover:bg-elevated group-hover:block"
                  >
                    <MoreVertical size={14} />
                  </span>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-line">
            {entries?.map((node) => {
              const { Icon, cls } = entryIcon(node)
              return (
                <div
                  key={node.path}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/pocketos-path', node.path)}
                  onDragOver={node.type === 'folder' ? allowDrop : undefined}
                  onDrop={node.type === 'folder' ? (e) => onDropTo(e, node.path) : undefined}
                  onClick={() => openEntry(node)}
                  onContextMenu={(e) => openMenu(e, node)}
                  className="flex cursor-default items-center gap-3 border-b border-line px-3 py-2 last:border-0 hover:bg-line"
                >
                  <Icon size={18} className={cls} />
                  <span className="flex-1 truncate text-sm">{node.name}</span>
                  <span className="text-xs tabular-nums text-muted">
                    {node.type === 'file' ? formatBytes(node.size) : ''}
                  </span>
                  <button
                    type="button"
                    aria-label="Actions"
                    onClick={(e) => openMenu(e, node)}
                    className="rounded p-1 text-muted hover:bg-elevated"
                  >
                    <MoreVertical size={15} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {error && (
        <div className="absolute bottom-3 left-1/2 z-40 -translate-x-1/2 rounded-lg bg-danger px-3 py-1.5 text-xs text-white shadow-window">
          {error}
        </div>
      )}

      {/* context menu */}
      {menu && (
        <>
          <div className="absolute inset-0 z-20" onPointerDown={() => setMenu(null)} />
          <div
            className="absolute z-30 w-44 overflow-hidden rounded-lg border border-line bg-elevated py-1 text-sm shadow-window"
            style={{ left: Math.max(4, menu.x), top: Math.max(4, menu.y) }}
          >
            <MenuItem icon={ExternalLink} label="Open" onClick={() => openEntry(menu.node)} after={() => setMenu(null)} />
            <MenuItem
              icon={Pencil}
              label="Rename"
              onClick={() => setDialog({ kind: 'rename', value: menu.node.name, target: menu.node.path })}
              after={() => setMenu(null)}
            />
            <MenuItem
              icon={Scissors}
              label="Cut"
              onClick={() => setClipboard({ path: menu.node.path, op: 'cut' })}
              after={() => setMenu(null)}
            />
            <MenuItem
              icon={Copy}
              label="Copy"
              onClick={() => setClipboard({ path: menu.node.path, op: 'copy' })}
              after={() => setMenu(null)}
            />
            <MenuItem
              icon={CopyPlus}
              label="Duplicate"
              onClick={async () => {
                try {
                  await copy(menu.node.path, cwd)
                } catch (err) {
                  fail(err)
                }
              }}
              after={() => setMenu(null)}
            />
            <div className="my-1 h-px bg-line" />
            <MenuItem
              icon={Trash2}
              label="Delete"
              danger
              onClick={() => setConfirmDel(menu.node)}
              after={() => setMenu(null)}
            />
          </div>
        </>
      )}

      {/* new / rename dialog */}
      <Modal
        open={!!dialog}
        title={
          dialog?.kind === 'new-folder'
            ? 'New folder'
            : dialog?.kind === 'new-file'
              ? 'New file'
              : 'Rename'
        }
        onClose={() => setDialog(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={submitDialog}>
              {dialog?.kind === 'rename' ? 'Rename' : 'Create'}
            </Button>
          </>
        }
      >
        {dialog && (
          <div className="space-y-2">
            <input
              autoFocus
              value={dialog.value}
              onChange={(e) => setDialog({ ...dialog, value: e.target.value, error: undefined })}
              onKeyDown={(e) => e.key === 'Enter' && submitDialog()}
              placeholder="Name"
              className="select-text w-full rounded-lg border border-line bg-surface px-3 py-2 outline-none focus:border-accent"
            />
            {dialog.error && <p className="text-xs text-danger">{dialog.error}</p>}
          </div>
        )}
      </Modal>

      {/* delete confirm */}
      <Modal
        open={!!confirmDel}
        title="Delete"
        onClose={() => setConfirmDel(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDel(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete
            </Button>
          </>
        }
      >
        Delete <span className="font-medium">{confirmDel?.name}</span>
        {confirmDel?.type === 'folder' ? ' and everything inside it?' : '?'} This cannot be undone.
      </Modal>
    </div>
  )
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  after,
  danger,
}: {
  icon: LucideIcon
  label: string
  onClick: () => void
  after: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={() => {
        onClick()
        after()
      }}
      className={cn(
        'flex w-full items-center gap-2.5 px-3 py-1.5 text-left hover:bg-line',
        danger ? 'text-danger' : 'text-fg',
      )}
    >
      <Icon size={15} />
      {label}
    </button>
  )
}
