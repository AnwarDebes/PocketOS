import type { ComponentType, LazyExoticComponent } from 'react'
import type { LucideIcon } from 'lucide-react'

export type ViewportMode = 'desktop' | 'mobile'
export type WindowState = 'normal' | 'minimized' | 'maximized'
export type SnapZone = 'left' | 'right' | null
/** Live hint shown while dragging a window toward an edge. */
export type DragHint = 'left' | 'right' | 'max' | null

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/** Data handed to an app when it is launched, e.g. a file to open. */
export interface AppLaunchPayload {
  path?: string
  url?: string
  [key: string]: unknown
}

/** A live window. Windows are the unit of "process" in PocketOS. */
export interface WindowInstance {
  id: string
  appId: string
  title: string
  /** Free-floating geometry, used in desktop mode when state is `normal`. */
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  state: WindowState
  /** Edge snap (half tiling). When set, rendering shows the snapped half. */
  snap: SnapZone
  payload?: AppLaunchPayload
  createdAt: number
}

/** Props every app component receives. */
export interface AppProps {
  windowId: string
  payload?: AppLaunchPayload
}

/** Single source of truth describing a built-in app. */
export interface AppManifest {
  id: string
  name: string
  icon: LucideIcon
  component: LazyExoticComponent<ComponentType<AppProps>>
  defaultSize: { width: number; height: number }
  minSize?: { width: number; height: number }
  /** If true, re-launching focuses the existing window instead of opening another. */
  singleInstance?: boolean
  /** Returns true if this app can open the given file path (for "open with"). */
  handlesFile?: (path: string) => boolean
  /** Show on the desktop and in the launcher's pinned row. */
  pinned?: boolean
  /** Tailwind gradient classes for the app's icon tile. */
  tile?: string
}
