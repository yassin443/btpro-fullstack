// color: 'green' | 'amber' | 'red' | 'indigo' | 'blue' | 'terra' | 'neutral' | 'dark' | 'line'
export function Tag({ color = 'neutral', dot = false, className = '', children, ...props }) {
  return (
    <span className={`tag ${color} ${className}`} {...props}>
      {dot && <span className="dot" />}
      {children}
    </span>
  )
}
