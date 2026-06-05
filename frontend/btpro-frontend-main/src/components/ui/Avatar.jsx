// color: 'indigo' | 'terra' | 'green' | 'amber' | 'red' | '' (dark/default)
// size: 'sm' | 'md' | 'lg' | 'xl'
export function Avatar({ initials = '?', color = 'indigo', size = 'md', src, className = '', ...props }) {
  const sizeClass = size !== 'md' ? size : ''
  if (src) {
    return (
      <img
        src={src}
        className={`avatar ${color} ${sizeClass} ${className}`}
        style={{ objectFit: 'cover' }}
        alt={initials}
        {...props}
      />
    )
  }
  return (
    <div className={`avatar ${color} ${sizeClass} ${className}`} {...props}>
      {initials}
    </div>
  )
}

// Stacked row of avatars
export function AvatarStack({ users = [], max = 4, size = 'sm' }) {
  const visible = users.slice(0, max)
  const rest = users.length - max
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {visible.map((u, i) => (
        <Avatar
          key={i}
          initials={u.initials}
          color={u.color || 'indigo'}
          size={size}
          style={{ marginLeft: i === 0 ? 0 : -6, border: '2px solid var(--surface)', borderRadius: '50%' }}
          title={u.nom || u.initials}
        />
      ))}
      {rest > 0 && (
        <div
          className={`avatar ${size}`}
          style={{ marginLeft: -6, background: 'var(--bg-2)', color: 'var(--muted)', border: '2px solid var(--surface)', borderRadius: '50%', fontSize: 9 }}
        >
          +{rest}
        </div>
      )}
    </div>
  )
}
