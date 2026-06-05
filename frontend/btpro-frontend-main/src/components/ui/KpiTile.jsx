import { TrendingUp, TrendingDown } from 'lucide-react'

function Spark({ data = [], color = 'currentColor' }) {
  if (!data.length) return null
  const w = 72, h = 32
  const max = Math.max(...data)
  const min = Math.min(...data)
  const span = max - min || 1
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / span) * (h - 4) - 2}`)
    .join(' ')
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="kpi-spark"
      style={{ stroke: color }}
    >
      <polyline points={pts} />
    </svg>
  )
}

// dark: boolean — fond #0B0B14
// delta: number (positive = up, negative = down)
export function KpiTile({ label, value, unit, delta, deltaLabel, spark, dark = false, icon: Icon, className = '', children }) {
  const isUp = delta > 0
  const isDown = delta < 0
  return (
    <div className={`kpi-tile ${dark ? 'dark' : ''} ${className}`}>
      <div className="kpi-label">
        {Icon && <Icon size={12} />}
        {label}
      </div>
      <div className="kpi-val">
        {value}
        {unit && <span className="unit">{unit}</span>}
      </div>
      {(delta !== undefined || deltaLabel) && (
        <div className={`kpi-delta ${isUp ? 'up' : ''} ${isDown ? 'down' : ''}`}>
          {isUp && <TrendingUp size={11} />}
          {isDown && <TrendingDown size={11} />}
          {deltaLabel}
        </div>
      )}
      {spark && <Spark data={spark} color={dark ? 'white' : 'var(--ink)'} />}
      {children}
    </div>
  )
}
