// variant: 'default' | 'primary' | 'accent' | 'ghost' | 'danger' | 'terra'
// size: 'sm' | 'md' | 'lg' | 'xl'
export function Button({ variant = 'default', size = 'md', iconOnly = false, as: Tag = 'button', className = '', children, ...props }) {
  const cls = [
    'btn',
    variant !== 'default' ? variant : '',
    size !== 'md' ? size : '',
    iconOnly ? 'icon-only' : '',
    className,
  ].filter(Boolean).join(' ')

  return <Tag className={cls} {...props}>{children}</Tag>
}
