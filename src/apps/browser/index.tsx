import { useEffect, useRef, useState } from 'react'
import { ExternalLink, House, RotateCw, ShieldAlert } from 'lucide-react'
import type { AppProps } from '@/kernel/types'
import { useWindowStore } from '@/store/windows'
import { cn } from '@/lib/cn'

interface Curated {
  name: string
  url: string
  tile: string
}

const CURATED: Curated[] = [
  { name: 'Wikipedia', url: 'https://www.wikipedia.org', tile: 'from-zinc-500 to-zinc-700' },
  { name: 'Example', url: 'https://example.com', tile: 'from-blue-500 to-indigo-600' },
  { name: 'Hacker News', url: 'https://news.ycombinator.com', tile: 'from-orange-500 to-amber-600' },
  { name: 'MDN Web Docs', url: 'https://developer.mozilla.org', tile: 'from-sky-500 to-cyan-600' },
  { name: 'OpenStreetMap', url: 'https://www.openstreetmap.org', tile: 'from-emerald-500 to-teal-600' },
  { name: 'Wikibooks', url: 'https://www.wikibooks.org', tile: 'from-violet-500 to-fuchsia-600' },
]

function toUrl(input: string): string {
  const s = input.trim()
  if (!s) return ''
  if (/^https?:\/\//i.test(s)) return s
  if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(s)) return `https://${s}`
  return `https://duckduckgo.com/?q=${encodeURIComponent(s)}`
}

export default function BrowserApp({ windowId, payload }: AppProps) {
  const initial = typeof payload?.url === 'string' ? payload.url : ''
  const [input, setInput] = useState(initial)
  const [url, setUrl] = useState(initial ? toUrl(initial) : '')
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'blocked'>(
    initial ? 'loading' : 'idle',
  )
  const [reloadKey, setReloadKey] = useState(0)
  const timer = useRef<number | null>(null)
  const setTitle = useWindowStore((s) => s.setTitle)

  const navigate = (raw: string) => {
    const u = toUrl(raw)
    if (!u) return
    setUrl(u)
    setInput(u)
    setStatus('loading')
    setReloadKey((k) => k + 1)
  }
  const goHome = () => {
    setUrl('')
    setInput('')
    setStatus('idle')
  }

  useEffect(() => {
    if (!url) {
      setStatus('idle')
      return
    }
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(
      () => setStatus((s) => (s === 'loading' ? 'blocked' : s)),
      5000,
    )
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [url, reloadKey])

  useEffect(() => {
    let host = 'Browser'
    try {
      if (url) host = new URL(url).hostname
    } catch {
      host = 'Browser'
    }
    setTitle(windowId, host)
  }, [url, windowId, setTitle])

  const onLoad = () => {
    if (timer.current) window.clearTimeout(timer.current)
    setStatus((s) => (s === 'blocked' ? s : 'ok'))
  }

  return (
    <div className="flex h-full flex-col bg-surface">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          navigate(input)
        }}
        className="flex items-center gap-1 border-b border-line px-2 py-1.5"
      >
        <button
          type="button"
          onClick={goHome}
          aria-label="Start page"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted hover:bg-line"
        >
          <House size={17} />
        </button>
        <button
          type="button"
          onClick={() => url && setReloadKey((k) => k + 1)}
          aria-label="Reload"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted hover:bg-line"
        >
          <RotateCw size={16} />
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search or enter a URL"
          spellCheck={false}
          className="select-text min-w-0 flex-1 rounded-lg border border-line bg-elevated/60 px-3 py-1.5 text-sm outline-none focus:border-accent"
        />
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="Open in new tab"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted hover:bg-line"
          >
            <ExternalLink size={16} />
          </a>
        )}
      </form>

      <div className="relative flex-1 overflow-hidden bg-white">
        {!url ? (
          <div className="flex h-full flex-col overflow-y-auto bg-surface p-6">
            <h2 className="text-sm font-semibold text-fg">Start page</h2>
            <p className="mt-1 text-xs text-muted">
              Many sites block being embedded. Those open in a new browser tab instead.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {CURATED.map((c) => (
                <button
                  key={c.url}
                  type="button"
                  onClick={() => navigate(c.url)}
                  className="flex items-center gap-3 rounded-xl border border-line bg-elevated/50 p-3 text-left hover:border-accent"
                >
                  <span
                    className={cn('h-9 w-9 shrink-0 rounded-lg bg-gradient-to-br', c.tile)}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-fg">{c.name}</span>
                    <span className="block truncate text-xs text-muted">
                      {new URL(c.url).hostname}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <iframe
              key={reloadKey}
              src={url}
              title="Browser"
              onLoad={onLoad}
              referrerPolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              className="h-full w-full border-0 bg-white"
            />
            {status === 'blocked' && (
              <div className="absolute inset-0 grid place-items-center bg-surface/95 p-6">
                <div className="max-w-xs text-center">
                  <ShieldAlert size={32} className="mx-auto text-warning" />
                  <h3 className="mt-3 text-sm font-semibold">This site can't be embedded</h3>
                  <p className="mt-1 text-xs text-muted">
                    It refused to load in a frame. You can still open it in a new browser tab.
                  </p>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg"
                  >
                    <ExternalLink size={15} /> Open in new tab
                  </a>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
