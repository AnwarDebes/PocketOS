import { lazy } from 'react'
import type { ComponentType, LazyExoticComponent } from 'react'
import {
  Calculator,
  Code2,
  FileText,
  FolderOpen,
  Globe,
  Image,
  Settings,
  SquareTerminal,
  StickyNote,
} from 'lucide-react'
import type { AppManifest, AppProps } from '@/kernel/types'
import { extname } from '@/lib/paths'

type AppLoader = () => Promise<{ default: ComponentType<AppProps> }>
function lazyApp(loader: AppLoader): LazyExoticComponent<ComponentType<AppProps>> {
  return lazy(loader)
}

const TEXT_EXT = new Set([
  '.txt',
  '.md',
  '.markdown',
  '.json',
  '.csv',
  '.log',
  '.xml',
  '.yml',
  '.yaml',
  '.ini',
  '.env',
])
const CODE_EXT = new Set([
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.css',
  '.scss',
  '.html',
  '.json',
  '.py',
  '.go',
  '.rs',
  '.java',
  '.c',
  '.cpp',
  '.sh',
  '.md',
  '.yml',
  '.yaml',
  '.xml',
  '.sql',
])
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.avif'])

/** Single source of truth for every built-in app. */
export const APPS: AppManifest[] = [
  {
    id: 'file-manager',
    name: 'Files',
    icon: FolderOpen,
    component: lazyApp(() => import('./file-manager')),
    defaultSize: { width: 840, height: 560 },
    minSize: { width: 360, height: 360 },
    pinned: true,
    tile: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'terminal',
    name: 'Terminal',
    icon: SquareTerminal,
    component: lazyApp(() => import('./terminal')),
    defaultSize: { width: 720, height: 440 },
    minSize: { width: 340, height: 260 },
    pinned: true,
    tile: 'from-slate-600 to-slate-800',
  },
  {
    id: 'text-editor',
    name: 'Text Editor',
    icon: FileText,
    component: lazyApp(() => import('./text-editor')),
    defaultSize: { width: 720, height: 540 },
    minSize: { width: 340, height: 320 },
    handlesFile: (p) => TEXT_EXT.has(extname(p)),
    tile: 'from-sky-500 to-cyan-600',
  },
  {
    id: 'code-editor',
    name: 'Code',
    icon: Code2,
    component: lazyApp(() => import('./code-editor')),
    defaultSize: { width: 920, height: 620 },
    minSize: { width: 380, height: 340 },
    handlesFile: (p) => CODE_EXT.has(extname(p)),
    tile: 'from-violet-500 to-fuchsia-600',
  },
  {
    id: 'browser',
    name: 'Browser',
    icon: Globe,
    component: lazyApp(() => import('./browser')),
    defaultSize: { width: 980, height: 640 },
    minSize: { width: 360, height: 360 },
    pinned: true,
    tile: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'image-viewer',
    name: 'Images',
    icon: Image,
    component: lazyApp(() => import('./image-viewer')),
    defaultSize: { width: 760, height: 560 },
    minSize: { width: 320, height: 320 },
    handlesFile: (p) => IMAGE_EXT.has(extname(p)),
    tile: 'from-pink-500 to-rose-600',
  },
  {
    id: 'notes',
    name: 'Notes',
    icon: StickyNote,
    component: lazyApp(() => import('./notes')),
    defaultSize: { width: 440, height: 560 },
    minSize: { width: 300, height: 320 },
    pinned: true,
    tile: 'from-amber-400 to-orange-500',
  },
  {
    id: 'calculator',
    name: 'Calculator',
    icon: Calculator,
    component: lazyApp(() => import('./calculator')),
    defaultSize: { width: 340, height: 500 },
    minSize: { width: 280, height: 420 },
    singleInstance: true,
    tile: 'from-orange-500 to-amber-600',
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: Settings,
    component: lazyApp(() => import('./settings')),
    defaultSize: { width: 760, height: 560 },
    minSize: { width: 340, height: 360 },
    singleInstance: true,
    pinned: true,
    tile: 'from-zinc-500 to-zinc-700',
  },
]

const byId = new Map(APPS.map((a) => [a.id, a]))

export function getApp(id: string): AppManifest | undefined {
  return byId.get(id)
}

export function getApps(): AppManifest[] {
  return APPS
}

export function getPinnedApps(): AppManifest[] {
  return APPS.filter((a) => a.pinned)
}

/** Pick the best app to open a given file path ("open with" default). */
export function appForFile(path: string): AppManifest | undefined {
  return APPS.find((a) => a.handlesFile?.(path))
}
