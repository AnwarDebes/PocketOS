import { Wallpaper } from './Wallpaper'
import { StatusBar } from './StatusBar'
import { Dock } from './Dock'
import { DesktopIcons } from './DesktopIcons'
import { Launcher } from './Launcher'
import { AppSwitcher } from './AppSwitcher'
import { MobileGestures } from './MobileGestures'
import { InstallBanner } from './InstallBanner'
import { WindowLayer } from '@/windowing/WindowLayer'
import { useViewportMode } from '@/hooks/useViewportMode'

export function Desktop() {
  const mode = useViewportMode()
  return (
    <div className="relative h-full w-full overflow-hidden">
      <Wallpaper />
      <div className="relative flex h-full flex-col">
        <StatusBar />
        <div className="relative flex-1 overflow-hidden">
          <DesktopIcons />
          <WindowLayer />
        </div>
        {mode === 'desktop' ? <Dock /> : <MobileGestures />}
      </div>
      <Launcher />
      <AppSwitcher />
      <InstallBanner />
    </div>
  )
}
