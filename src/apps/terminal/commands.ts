import {
  copy,
  createFolder,
  exists,
  listDir,
  moveTo,
  readText,
  remove,
  stat,
  writeFile,
} from '@/fs/vfs'
import { basename, dirname, HOME, resolve } from '@/lib/paths'
import { appForFile, getApp, getApps } from '@/apps/registry'
import { useWindowStore } from '@/store/windows'

export interface ShellContext {
  cwd: string
  setCwd: (path: string) => void
}

export interface ExecResult {
  lines: string[]
  clear?: boolean
}

const red = (s: string) => `\x1b[38;5;203m${s}\x1b[0m`

function tokenize(line: string): string[] {
  const tokens: string[] = []
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(line)) !== null) tokens.push(m[1] ?? m[2] ?? m[3])
  return tokens
}

type CommandFn = (args: string[], ctx: ShellContext) => Promise<string[]> | string[]

const COMMANDS: Record<string, CommandFn> = {
  help: () => [
    'Available commands:',
    '  ls [path]         list a directory',
    '  cd [path]         change directory',
    '  pwd               print working directory',
    '  cat <file>        print a file',
    '  mkdir <dir>       create a directory',
    '  touch <file>      create an empty file',
    '  rm [-r] <path>    remove a file or directory',
    '  mv <src> <dest>   move or rename',
    '  cp [-r] <src> <dest>  copy',
    '  echo <text>       print text (supports > and >> to a file)',
    '  open <app|path>   open an app or a file',
    '  whoami            print the current user',
    '  date              print the date',
    '  clear             clear the screen',
  ],

  pwd: (_args, ctx) => [ctx.cwd],

  whoami: () => ['user'],

  date: () => [new Date().toString()],

  echo: (args) => [args.join(' ')],

  ls: async (args, ctx) => {
    const target = resolve(ctx.cwd, args.find((a) => !a.startsWith('-')) ?? '.')
    const node = await stat(target)
    if (!node) throw new Error(`ls: no such file or directory: ${target}`)
    if (node.type === 'file') return [basename(target)]
    const items = await listDir(target)
    return items.map((i) => (i.type === 'folder' ? `${i.name}/` : i.name))
  },

  cd: async (args, ctx) => {
    const target = resolve(ctx.cwd, args[0] ?? HOME)
    const node = await stat(target)
    if (!node) throw new Error(`cd: no such directory: ${target}`)
    if (node.type !== 'folder') throw new Error(`cd: not a directory: ${target}`)
    ctx.setCwd(target)
    return []
  },

  cat: async (args, ctx) => {
    if (!args[0]) throw new Error('cat: missing file')
    const target = resolve(ctx.cwd, args[0])
    const node = await stat(target)
    if (!node) throw new Error(`cat: no such file: ${target}`)
    if (node.type === 'folder') throw new Error(`cat: is a directory: ${target}`)
    return (await readText(target)).split('\n')
  },

  mkdir: async (args, ctx) => {
    if (!args[0]) throw new Error('mkdir: missing operand')
    await createFolder(resolve(ctx.cwd, args[0]))
    return []
  },

  touch: async (args, ctx) => {
    if (!args[0]) throw new Error('touch: missing operand')
    const target = resolve(ctx.cwd, args[0])
    if (!(await exists(target))) await writeFile(target, '')
    return []
  },

  rm: async (args, ctx) => {
    const recursive = args.includes('-r') || args.includes('-rf') || args.includes('-fr')
    const path = args.find((a) => !a.startsWith('-'))
    if (!path) throw new Error('rm: missing operand')
    await remove(resolve(ctx.cwd, path), recursive)
    return []
  },

  mv: async (args, ctx) => {
    const operands = args.filter((a) => !a.startsWith('-'))
    if (operands.length < 2) throw new Error('mv: needs a source and a destination')
    const src = resolve(ctx.cwd, operands[0])
    let dest = resolve(ctx.cwd, operands[1])
    const destNode = await stat(dest)
    if (destNode?.type === 'folder') dest = resolve(dest, basename(src))
    await moveTo(src, dest)
    return []
  },

  cp: async (args, ctx) => {
    const operands = args.filter((a) => !a.startsWith('-'))
    if (operands.length < 2) throw new Error('cp: needs a source and a destination')
    const src = resolve(ctx.cwd, operands[0])
    const dest = resolve(ctx.cwd, operands[1])
    const srcNode = await stat(src)
    if (!srcNode) throw new Error(`cp: no such file: ${src}`)
    const destNode = await stat(dest)
    if (srcNode.type === 'file') {
      const target = destNode?.type === 'folder' ? resolve(dest, basename(src)) : dest
      await writeFile(target, srcNode.content ?? '', srcNode.mimeType)
    } else {
      const destDir = destNode?.type === 'folder' ? dest : dirname(dest)
      await copy(src, destDir)
    }
    return []
  },

  open: async (args, ctx) => {
    if (!args[0]) throw new Error('open: missing app or path')
    const openApp = useWindowStore.getState().openApp
    const known = getApp(args[0])
    if (known) {
      openApp(known.id)
      return [`Opening ${known.name}`]
    }
    const target = resolve(ctx.cwd, args[0])
    const node = await stat(target)
    if (!node) {
      throw new Error(`open: unknown app or path: ${args[0]} (apps: ${getApps().map((a) => a.id).join(', ')})`)
    }
    if (node.type === 'folder') {
      openApp('file-manager', { path: target })
    } else {
      openApp(appForFile(target)?.id ?? 'text-editor', { path: target })
    }
    return [`Opening ${basename(target)}`]
  },
}

export async function execute(line: string, ctx: ShellContext): Promise<ExecResult> {
  const trimmed = line.trim()
  if (!trimmed) return { lines: [] }

  const tokens = tokenize(trimmed)
  let argv = tokens
  let redirect: { path: string; append: boolean } | null = null
  const ri = tokens.findIndex((t) => t === '>' || t === '>>')
  if (ri >= 0) {
    const target = tokens[ri + 1]
    if (!target) return { lines: [red('syntax error: expected a file after >')] }
    redirect = { path: target, append: tokens[ri] === '>>' }
    argv = tokens.slice(0, ri)
  }

  const [cmd, ...args] = argv
  if (cmd === 'clear') return { lines: [], clear: true }
  const fn = COMMANDS[cmd]
  if (!fn) return { lines: [red(`command not found: ${cmd}`)] }

  try {
    const out = await fn(args, ctx)
    if (redirect) {
      const text = out.length ? `${out.join('\n')}\n` : ''
      const path = resolve(ctx.cwd, redirect.path)
      if (redirect.append) {
        let prev = ''
        try {
          prev = await readText(path)
        } catch {
          prev = ''
        }
        await writeFile(path, prev + text)
      } else {
        await writeFile(path, text)
      }
      return { lines: [] }
    }
    return { lines: out }
  } catch (e) {
    return { lines: [red(e instanceof Error ? e.message : String(e))] }
  }
}
