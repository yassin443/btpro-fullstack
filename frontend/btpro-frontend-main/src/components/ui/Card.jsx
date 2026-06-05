export function Card({ className = '', children, ...props }) {
  return <div className={`card ${className}`} {...props}>{children}</div>
}

export function CardHead({ className = '', children, ...props }) {
  return <div className={`card-head ${className}`} {...props}>{children}</div>
}

export function CardBody({ className = '', children, ...props }) {
  return <div className={`card-body ${className}`} {...props}>{children}</div>
}

export function CardFoot({ className = '', children, ...props }) {
  return <div className={`card-foot ${className}`} {...props}>{children}</div>
}

export function CardTitle({ className = '', children, ...props }) {
  return <div className={`card-title ${className}`} {...props}>{children}</div>
}
