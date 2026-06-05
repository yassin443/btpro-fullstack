// color: 'indigo' | 'green' | 'amber' | 'red' | '' (dark/default)
// thin: boolean
export function Meter({ value = 0, max = 100, color = '', thin = false, className = '', ...props }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className={`meter ${color} ${thin ? 'thin' : ''} ${className}`} {...props}>
      <span style={{ width: `${pct}%` }} />
    </div>
  )
}
