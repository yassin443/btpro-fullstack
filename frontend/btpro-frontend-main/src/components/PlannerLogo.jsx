import logoSrc from '../assets/planner-logo.png'

export const PlannerMark = ({ size = 32, radius }) => (
  <img
    src={logoSrc}
    width={size}
    height={size}
    alt="Planner"
    style={{
      display: 'block',
      borderRadius: radius != null ? radius : Math.round(size * 0.22),
      objectFit: 'cover',
      flexShrink: 0,
    }}
  />
)

export const PlannerLogo = ({ size = 28, variant = 'default', showSub = false }) => {
  const textColor = variant === 'light' || variant === 'onDark' ? 'white' : 'var(--ink)'
  const subColor  = variant === 'light' || variant === 'onDark' ? 'rgba(255,255,255,0.55)' : 'var(--muted)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <PlannerMark size={size} />
      <div>
        <div style={{
          fontWeight: 700,
          fontSize: Math.round(size * 0.60),
          letterSpacing: '-0.025em',
          lineHeight: 1,
          color: textColor,
        }}>Planner</div>
        {showSub && (
          <div style={{
            fontSize: Math.max(9, Math.round(size * 0.30)),
            color: subColor,
            textTransform: 'uppercase',
            letterSpacing: '0.10em',
            fontWeight: 600,
            marginTop: 3,
          }}>Architecture</div>
        )}
      </div>
    </div>
  )
}

export default PlannerLogo
