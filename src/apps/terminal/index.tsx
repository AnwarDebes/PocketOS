import { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { HOME } from '@/lib/paths'
import { execute, type ShellContext } from './commands'

export default function TerminalApp() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = ref.current
    if (!host) return

    const term = new Terminal({
      fontSize: 13,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      cursorBlink: true,
      convertEol: true,
      theme: {
        background: '#0b0d12',
        foreground: '#e7e9ee',
        cursor: '#8b8cf6',
        selectionBackground: '#33415580',
      },
    })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(host)
    fit.fit()
    term.focus()

    let cwd = HOME
    let buffer = ''
    let running = false
    const history: string[] = []
    let histIdx = 0

    const ctx: ShellContext = {
      get cwd() {
        return cwd
      },
      setCwd: (p) => {
        cwd = p
      },
    }

    const prompt = () => term.write(`\x1b[38;5;141m${cwd}\x1b[0m $ `)
    const replaceLine = (text: string) => {
      term.write('\x1b[2K\r')
      term.write(`\x1b[38;5;141m${cwd}\x1b[0m $ ${text}`)
      buffer = text
    }
    const run = async (line: string) => {
      const res = await execute(line, ctx)
      if (res.clear) term.clear()
      else for (const l of res.lines) term.writeln(l)
      prompt()
    }

    term.writeln('\x1b[1mPocketOS terminal\x1b[0m   type "help" to begin')
    prompt()

    const sub = term.onData((data) => {
      if (running) return
      if (data === '\r') {
        term.write('\r\n')
        const line = buffer
        buffer = ''
        if (line.trim()) history.push(line)
        histIdx = history.length
        running = true
        void run(line).finally(() => {
          running = false
        })
        return
      }
      if (data === '\x7f' || data === '\b') {
        if (buffer.length) {
          buffer = buffer.slice(0, -1)
          term.write('\b \b')
        }
        return
      }
      if (data === '\x03') {
        term.write('^C\r\n')
        buffer = ''
        prompt()
        return
      }
      if (data === '\x1b[A') {
        if (history.length) {
          histIdx = Math.max(0, histIdx - 1)
          replaceLine(history[histIdx] ?? '')
        }
        return
      }
      if (data === '\x1b[B') {
        if (history.length) {
          histIdx = Math.min(history.length, histIdx + 1)
          replaceLine(histIdx === history.length ? '' : (history[histIdx] ?? ''))
        }
        return
      }
      if (data.startsWith('\x1b')) return
      buffer += data
      term.write(data)
    })

    const ro = new ResizeObserver(() => {
      try {
        fit.fit()
      } catch {
        // not visible yet
      }
    })
    ro.observe(host)

    return () => {
      sub.dispose()
      ro.disconnect()
      term.dispose()
    }
  }, [])

  return <div ref={ref} className="h-full w-full overflow-hidden bg-[#0b0d12] p-2" />
}
