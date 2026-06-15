import { useEffect, useState } from 'react'
import { Delete } from 'lucide-react'
import type { AppProps } from '@/kernel/types'
import { useWindowStore } from '@/store/windows'
import { cn } from '@/lib/cn'

type Op = '+' | '-' | '×' | '÷'

function round(n: number): number {
  return Math.round((n + Number.EPSILON) * 1e10) / 1e10
}
function apply(a: number, b: number, op: Op): number {
  if (op === '+') return a + b
  if (op === '-') return a - b
  if (op === '×') return a * b
  return a / b
}

export default function CalculatorApp({ windowId }: AppProps) {
  const [display, setDisplay] = useState('0')
  const [prev, setPrev] = useState<number | null>(null)
  const [op, setOp] = useState<Op | null>(null)
  const [overwrite, setOverwrite] = useState(true)

  const show = (n: number) => {
    if (!Number.isFinite(n)) return 'Error'
    return String(round(n))
  }

  const inputDigit = (d: string) =>
    setDisplay((cur) => {
      if (cur === 'Error') return d === '.' ? '0.' : d
      if (overwrite) {
        setOverwrite(false)
        return d === '.' ? '0.' : d
      }
      if (d === '.' && cur.includes('.')) return cur
      if (cur === '0' && d !== '.') return d
      return cur + d
    })

  const clearAll = () => {
    setDisplay('0')
    setPrev(null)
    setOp(null)
    setOverwrite(true)
  }
  const backspace = () =>
    setDisplay((c) => (overwrite || c.length <= 1 || c === 'Error' ? '0' : c.slice(0, -1)))
  const toggleSign = () =>
    setDisplay((c) => (c.startsWith('-') ? c.slice(1) : c === '0' ? c : `-${c}`))
  const percent = () => {
    setDisplay((c) => show(parseFloat(c) / 100))
    setOverwrite(true)
  }

  const chooseOp = (next: Op) => {
    const cur = parseFloat(display)
    if (prev !== null && op && !overwrite) {
      const result = apply(prev, cur, op)
      setPrev(result)
      setDisplay(show(result))
    } else {
      setPrev(cur)
    }
    setOp(next)
    setOverwrite(true)
  }
  const equals = () => {
    if (prev === null || !op) return
    const result = apply(prev, parseFloat(display), op)
    setDisplay(show(result))
    setPrev(null)
    setOp(null)
    setOverwrite(true)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (useWindowStore.getState().focusedId !== windowId) return
      const k = e.key
      if (k >= '0' && k <= '9') inputDigit(k)
      else if (k === '.') inputDigit('.')
      else if (k === '+') chooseOp('+')
      else if (k === '-') chooseOp('-')
      else if (k === '*') chooseOp('×')
      else if (k === '/') {
        e.preventDefault()
        chooseOp('÷')
      } else if (k === 'Enter' || k === '=') {
        e.preventDefault()
        equals()
      } else if (k === 'Backspace') backspace()
      else if (k === 'Escape') clearAll()
      else if (k === '%') percent()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowId, display, prev, op, overwrite])

  const Key = ({
    label,
    onClick,
    variant = 'num',
    wide,
  }: {
    label: React.ReactNode
    onClick: () => void
    variant?: 'num' | 'op' | 'fn'
    wide?: boolean
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-full items-center justify-center rounded-xl text-lg font-medium transition active:scale-95',
        wide && 'col-span-2',
        variant === 'num' && 'bg-elevated hover:brightness-110',
        variant === 'fn' && 'bg-line text-fg hover:brightness-110',
        variant === 'op' && 'bg-accent text-accent-fg hover:brightness-110',
        op === label && variant === 'op' && 'ring-2 ring-fg',
      )}
    >
      {label}
    </button>
  )

  return (
    <div className="flex h-full flex-col bg-surface p-3">
      <div className="flex flex-1 flex-col justify-end px-2 pb-3 text-right">
        <div className="truncate text-5xl font-light tabular-nums">{display}</div>
      </div>
      <div className="grid flex-[2] grid-cols-4 gap-2">
        <Key label="AC" variant="fn" onClick={clearAll} />
        <Key label={<Delete size={20} />} variant="fn" onClick={backspace} />
        <Key label="%" variant="fn" onClick={percent} />
        <Key label="÷" variant="op" onClick={() => chooseOp('÷')} />
        <Key label="7" onClick={() => inputDigit('7')} />
        <Key label="8" onClick={() => inputDigit('8')} />
        <Key label="9" onClick={() => inputDigit('9')} />
        <Key label="×" variant="op" onClick={() => chooseOp('×')} />
        <Key label="4" onClick={() => inputDigit('4')} />
        <Key label="5" onClick={() => inputDigit('5')} />
        <Key label="6" onClick={() => inputDigit('6')} />
        <Key label="-" variant="op" onClick={() => chooseOp('-')} />
        <Key label="1" onClick={() => inputDigit('1')} />
        <Key label="2" onClick={() => inputDigit('2')} />
        <Key label="3" onClick={() => inputDigit('3')} />
        <Key label="+" variant="op" onClick={() => chooseOp('+')} />
        <Key label="±" variant="fn" onClick={toggleSign} />
        <Key label="0" onClick={() => inputDigit('0')} />
        <Key label="." onClick={() => inputDigit('.')} />
        <Key label="=" variant="op" onClick={equals} />
      </div>
    </div>
  )
}
