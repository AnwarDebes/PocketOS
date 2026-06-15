// POSIX-style path helpers for the virtual filesystem. Paths are always absolute
// internally (start with "/"); the terminal resolves relative paths against a cwd.

export const ROOT = '/'
export const HOME = '/home/user'

export function splitPath(p: string): string[] {
  return p.split('/').filter(Boolean)
}

/** Collapse ".", "..", and duplicate slashes into a clean absolute path. */
export function normalize(p: string): string {
  const isAbsolute = p.startsWith('/')
  const out: string[] = []
  for (const part of p.split('/')) {
    if (part === '' || part === '.') continue
    if (part === '..') {
      if (out.length && out[out.length - 1] !== '..') out.pop()
      else if (!isAbsolute) out.push('..')
      continue
    }
    out.push(part)
  }
  return (isAbsolute ? '/' : '') + out.join('/') || (isAbsolute ? '/' : '.')
}

export function join(...parts: string[]): string {
  return normalize(parts.join('/'))
}

export function dirname(p: string): string {
  const n = normalize(p)
  if (n === ROOT) return ROOT
  const idx = n.lastIndexOf('/')
  if (idx <= 0) return ROOT
  return n.slice(0, idx)
}

export function basename(p: string): string {
  const n = normalize(p)
  if (n === ROOT) return ''
  return n.slice(n.lastIndexOf('/') + 1)
}

export function extname(p: string): string {
  const base = basename(p)
  const idx = base.lastIndexOf('.')
  return idx > 0 ? base.slice(idx).toLowerCase() : ''
}

/** Resolve a possibly-relative path against a current working directory. */
export function resolve(cwd: string, target: string): string {
  if (!target) return normalize(cwd)
  if (target.startsWith('/')) return normalize(target)
  if (target.startsWith('~')) return normalize(target.replace('~', HOME))
  return normalize(`${cwd}/${target}`)
}

/** True if `child` is `parent` or sits inside it. Used to block moving a folder into itself. */
export function isInside(parent: string, child: string): boolean {
  const a = normalize(parent)
  const b = normalize(child)
  if (a === b) return true
  return b.startsWith(a === ROOT ? '/' : `${a}/`)
}
