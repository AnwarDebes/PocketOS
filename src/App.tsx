import { useEffect, useState } from 'react'
import { MotionConfig } from 'framer-motion'
import { BootScreen } from '@/shell/BootScreen'
import { Shell } from '@/shell/Shell'
import { useSettings } from '@/store/settings'
import { useApplyTheme } from '@/hooks/useApplyTheme'
import { seedIfEmpty } from '@/fs/seed'

export default function App() {
  useApplyTheme()
  const hydrated = useSettings((s) => s.hydrated)
  const reduceMotion = useSettings((s) => s.reduceMotion)
  const [bootDone, setBootDone] = useState(false)
  const ready = hydrated && bootDone

  useEffect(() => {
    void seedIfEmpty()
  }, [])

  return (
    <MotionConfig reducedMotion={reduceMotion ? 'always' : 'never'}>
      <div className="h-full w-full">
        {ready ? <Shell /> : <BootScreen onDone={() => setBootDone(true)} />}
      </div>
    </MotionConfig>
  )
}
