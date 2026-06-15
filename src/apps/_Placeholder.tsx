import type { LucideIcon } from 'lucide-react'

/** Temporary app body used until an app is implemented in its phase. */
export function Placeholder({
  icon: Icon,
  name,
  note,
}: {
  icon: LucideIcon
  name: string
  note: string
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <Icon className="h-10 w-10 text-accent" strokeWidth={1.5} />
      <h2 className="text-lg font-semibold">{name}</h2>
      <p className="max-w-xs text-sm text-muted">{note}</p>
    </div>
  )
}
