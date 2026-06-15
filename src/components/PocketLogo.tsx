interface PocketLogoProps {
  size?: number
  className?: string
  /** Render only the window glyph (no rounded background tile). */
  bare?: boolean
}

/**
 * The PocketOS mark: overlapping windows (multitasking) on a gradient tile.
 * Kept in sync with public/favicon.svg and the generated PWA icons.
 */
export function PocketLogo({ size = 64, className, bare = false }: PocketLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="PocketOS"
    >
      <defs>
        <linearGradient id="pocketos-tile" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366F1" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      {!bare && <rect x="0" y="0" width="512" height="512" rx="116" fill="url(#pocketos-tile)" />}
      {/* back window */}
      <rect x="186" y="150" width="196" height="150" rx="20" fill="#FFFFFF" fillOpacity="0.32" />
      {/* front window */}
      <rect x="138" y="196" width="236" height="178" rx="22" fill="#FFFFFF" />
      <circle cx="170" cy="226" r="9" fill="#6366F1" fillOpacity="0.9" />
      <circle cx="198" cy="226" r="9" fill="#6366F1" fillOpacity="0.5" />
      <circle cx="226" cy="226" r="9" fill="#6366F1" fillOpacity="0.3" />
    </svg>
  )
}
