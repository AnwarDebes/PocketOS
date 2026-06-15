import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

interface IconTileProps {
  icon: LucideIcon
  tile?: string
  size?: number
  rounded?: string
  className?: string
}

/** App icon rendered on a gradient tile. Shared by the dock, launcher, and desktop. */
export function IconTile({
  icon: Icon,
  tile,
  size = 44,
  rounded = 'rounded-2xl',
  className,
}: IconTileProps) {
  return (
    <div
      className={cn(
        'grid shrink-0 place-items-center bg-gradient-to-br text-white shadow-sm',
        tile ?? 'from-zinc-500 to-zinc-700',
        rounded,
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Icon size={Math.round(size * 0.5)} strokeWidth={2} />
    </div>
  )
}
