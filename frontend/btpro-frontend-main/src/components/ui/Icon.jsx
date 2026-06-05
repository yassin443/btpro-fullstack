import * as Icons from 'lucide-react'

// name: Lucide icon name in PascalCase (e.g. "Plus", "ArrowRight", "TrendingUp")
// size: number (default 14) — or pass className for .icon / .icon.sm / .icon.lg etc.
export function Icon({ name, size = 14, className = '', ...props }) {
  const LucideIcon = Icons[name]
  if (!LucideIcon) return null
  return <LucideIcon size={size} className={className} {...props} />
}

export default Icon
