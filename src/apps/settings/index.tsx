import { useEffect, useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Check, Download, Upload } from 'lucide-react'
import { useSettings } from '@/store/settings'
import { WALLPAPERS } from '@/lib/wallpapers'
import { usage, clearAll } from '@/fs/vfs'
import { seedIfEmpty } from '@/fs/seed'
import { exportArchive, importArchive } from '@/fs/archive'
import { usePwaInstall } from '@/hooks/usePwaInstall'
import { formatBytes } from '@/lib/format'
import { APP_VERSION } from '@/lib/constants'
import { cn } from '@/lib/cn'
import { Button } from '@/components/Button'
import { Modal } from '@/components/Modal'

const ACCENTS = [
  { name: 'Indigo', rgb: '99 102 241' },
  { name: 'Violet', rgb: '139 92 246' },
  { name: 'Blue', rgb: '59 130 246' },
  { name: 'Cyan', rgb: '34 211 238' },
  { name: 'Emerald', rgb: '16 185 129' },
  { name: 'Amber', rgb: '245 158 11' },
  { name: 'Rose', rgb: '244 63 94' },
]

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">{title}</h2>
      <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-elevated/40">
        {children}
      </div>
    </section>
  )
}

function Row({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0 text-sm">{label}</div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn('relative h-6 w-11 rounded-full transition-colors', checked ? 'bg-accent' : 'bg-line')}
    >
      <span
        className={cn(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
          checked ? 'left-[22px]' : 'left-0.5',
        )}
      />
    </button>
  )
}

export default function SettingsApp() {
  const s = useSettings()
  const use = useLiveQuery(() => usage(), [])
  const { canInstall, install } = usePwaInstall()
  const [resetOpen, setResetOpen] = useState(false)
  const [importJson, setImportJson] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 3000)
    return () => window.clearTimeout(t)
  }, [toast])

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') s.setCustomWallpaper(reader.result)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const resetFilesystem = async () => {
    await clearAll()
    await seedIfEmpty()
    setResetOpen(false)
    setToast('Filesystem reset')
  }

  const doExport = async () => {
    const json = await exportArchive()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pocketos-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const onImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImportJson(String(reader.result))
    reader.readAsText(file)
    e.target.value = ''
  }

  const doImport = async () => {
    if (!importJson) return
    try {
      const n = await importArchive(importJson)
      setToast(`Restored ${n} items`)
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Import failed')
    }
    setImportJson(null)
  }

  return (
    <div className="h-full overflow-y-auto bg-surface">
      <div className="mx-auto max-w-2xl space-y-6 p-5">
        <Section title="Appearance">
          <Row label="Theme">
            <div className="flex overflow-hidden rounded-lg border border-line">
              {(['dark', 'light'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => s.setTheme(t)}
                  className={cn(
                    'px-3 py-1.5 text-sm capitalize',
                    s.theme === t ? 'bg-accent text-accent-fg' : 'text-muted hover:bg-line',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </Row>
          <Row label="Accent">
            <div className="flex flex-wrap justify-end gap-2">
              {ACCENTS.map((a) => (
                <button
                  key={a.rgb}
                  type="button"
                  title={a.name}
                  aria-label={a.name}
                  onClick={() => s.setAccent(a.rgb)}
                  className={cn(
                    'grid h-7 w-7 place-items-center rounded-full ring-2 ring-offset-2 ring-offset-surface transition',
                    s.accent === a.rgb ? 'ring-fg' : 'ring-transparent',
                  )}
                  style={{ backgroundColor: `rgb(${a.rgb})` }}
                >
                  {s.accent === a.rgb && <Check size={14} className="text-white" />}
                </button>
              ))}
            </div>
          </Row>
          <Row label="Reduce motion">
            <Toggle checked={s.reduceMotion} onChange={s.setReduceMotion} />
          </Row>
        </Section>

        <Section title="Wallpaper">
          <div className="p-4">
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {WALLPAPERS.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => s.setWallpaper(w.id)}
                  className={cn(
                    'relative h-16 overflow-hidden rounded-lg ring-2 transition',
                    s.wallpaperId === w.id ? 'ring-accent' : 'ring-transparent hover:ring-line',
                  )}
                  style={{ background: w.css }}
                  aria-label={w.name}
                >
                  {s.wallpaperId === w.id && (
                    <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-accent text-accent-fg">
                      <Check size={12} />
                    </span>
                  )}
                </button>
              ))}
              <label
                className={cn(
                  'flex h-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line text-muted hover:border-accent hover:text-fg',
                  s.wallpaperId === 'custom' && 'border-accent text-fg',
                )}
              >
                <Upload size={16} />
                <span className="text-[10px]">Upload</span>
                <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
              </label>
            </div>
          </div>
        </Section>

        <Section title="Profile">
          <Row label="Display name">
            <input
              value={s.userName}
              onChange={(e) => s.setUserName(e.target.value)}
              className="select-text w-44 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-accent"
            />
          </Row>
        </Section>

        <Section title="Storage">
          <Row
            label={
              <div>
                <div>On-device usage</div>
                <div className="text-xs text-muted">
                  {use ? `${use.files} files, ${use.folders} folders` : 'Calculating...'}
                </div>
              </div>
            }
          >
            <span className="text-sm font-medium tabular-nums">{formatBytes(use?.bytes ?? 0)}</span>
          </Row>
          <Row label={<div>Reset filesystem<div className="text-xs text-muted">Restore the starter files</div></div>}>
            <Button variant="danger" onClick={() => setResetOpen(true)}>
              Reset
            </Button>
          </Row>
        </Section>

        <Section title="Data">
          <Row
            label={
              <div>
                Back up
                <div className="text-xs text-muted">Download all files as a JSON archive</div>
              </div>
            }
          >
            <Button onClick={doExport}>
              <Download size={15} />
              Export
            </Button>
          </Row>
          <Row
            label={
              <div>
                Restore
                <div className="text-xs text-muted">Replace everything from a backup</div>
              </div>
            }
          >
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-elevated px-3 py-1.5 text-sm font-medium hover:bg-line">
              <Upload size={15} />
              Import
              <input type="file" accept="application/json,.json" className="hidden" onChange={onImportFile} />
            </label>
          </Row>
        </Section>

        <Section title="About">
          <Row label="PocketOS">
            <span className="text-sm text-muted">v{APP_VERSION}</span>
          </Row>
          {canInstall && (
            <Row
              label={
                <div>
                  Install as an app
                  <div className="text-xs text-muted">Full screen, offline, on your home screen</div>
                </div>
              }
            >
              <Button variant="primary" onClick={() => void install()}>
                <Download size={15} />
                Install
              </Button>
            </Row>
          )}
          <div className="px-4 py-3 text-xs text-muted">
            A desktop environment in your browser. Fully offline, 100% on your device.
          </div>
        </Section>
      </div>

      <Modal
        open={resetOpen}
        title="Reset filesystem"
        onClose={() => setResetOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={resetFilesystem}>
              Reset everything
            </Button>
          </>
        }
      >
        This deletes all files and folders and restores the starter set. This cannot be undone.
      </Modal>

      <Modal
        open={!!importJson}
        title="Restore from backup"
        onClose={() => setImportJson(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setImportJson(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={doImport}>
              Replace everything
            </Button>
          </>
        }
      >
        Restoring replaces all current files and folders with the contents of the backup. This cannot
        be undone.
      </Modal>

      {toast && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-lg bg-elevated px-3 py-1.5 text-xs text-fg shadow-window">
          {toast}
        </div>
      )}
    </div>
  )
}
