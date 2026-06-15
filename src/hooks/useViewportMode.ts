import { useEffect } from 'react'
import { useWindowStore } from '@/store/windows'
import type { ViewportMode } from '@/kernel/types'

export const MOBILE_BREAKPOINT = 768

export function computeMode(): ViewportMode {
  return window.innerWidth < MOBILE_BREAKPOINT ? 'mobile' : 'desktop'
}

/**
 * Mounts once (in Shell) and keeps the window store's `mode` in sync with the
 * viewport. Centralising it here means the window manager can adapt geometry the
 * moment the phone is rotated or a display is connected.
 */
export function useViewportModeSync(): ViewportMode {
  const mode = useWindowStore((s) => s.mode)
  const setMode = useWindowStore((s) => s.setMode)
  useEffect(() => {
    const onResize = () => setMode(computeMode())
    onResize()
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
  }, [setMode])
  return mode
}

/** Read-only access to the current mode for components that just need to branch. */
export function useViewportMode(): ViewportMode {
  return useWindowStore((s) => s.mode)
}
