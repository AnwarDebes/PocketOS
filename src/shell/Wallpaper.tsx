import { useSettings } from '@/store/settings'
import { resolveWallpaperCss } from '@/lib/wallpapers'
import { cn } from '@/lib/cn'

export function Wallpaper({ className }: { className?: string }) {
  const wallpaperId = useSettings((s) => s.wallpaperId)
  const custom = useSettings((s) => s.customWallpaper)
  return (
    <div
      className={cn('absolute inset-0', className)}
      style={{ background: resolveWallpaperCss(wallpaperId, custom) }}
    />
  )
}
