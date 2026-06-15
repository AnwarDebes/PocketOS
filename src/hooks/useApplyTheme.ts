import { useEffect } from 'react'
import { useSettings } from '@/store/settings'

/** Reflects theme settings onto <html>: light class, accent variable, reduced motion. */
export function useApplyTheme(): void {
  const theme = useSettings((s) => s.theme)
  const accent = useSettings((s) => s.accent)
  const reduceMotion = useSettings((s) => s.reduceMotion)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('light', theme === 'light')
    root.style.setProperty('--c-accent', accent)
    root.dataset.reduceMotion = reduceMotion ? 'true' : 'false'
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', theme === 'light' ? '#eef0f6' : '#0b0d12')
  }, [theme, accent, reduceMotion])
}
