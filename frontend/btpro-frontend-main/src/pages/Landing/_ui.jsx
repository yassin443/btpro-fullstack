/* ========================================================================
   Shared UI primitives — Planner landing (ported from design system)
   ======================================================================== */
import React from 'react'
import * as Lucide from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export const cx = (...a) => a.filter(Boolean).join(' ')

/* ---- Navigation (react-router) ---- */
export function useNav() {
  const navigate = useNavigate()
  return {
    go: (s) => {
      if (s === 'login') navigate('/login')
      else if (s === 'register') navigate('/register')
      else if (s === 'landing') navigate('/')
      else navigate('/' + s)
    },
  }
}

/* ---- Icon (lucide-react, PascalCase names) ---- */
export function Icon({ name, size = 20, strokeWidth = 2, className = '', style }) {
  const Cmp = Lucide[name]
  if (!Cmp) return null
  return (
    <Cmp size={size} strokeWidth={strokeWidth} className={className} style={style} aria-hidden="true" />
  )
}

/* ---- Scroll reveal ---- */
export function useReveal(options) {
  const ref = React.useRef(null)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) { el.classList.add('is-in'); return }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { el.classList.add('is-in'); io.unobserve(el) }
      })
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px', ...(options || {}) })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return ref
}

export function Reveal({ as = 'div', delay = 0, className = '', children, ...rest }) {
  const ref = useReveal()
  const Tag = as
  return (
    <Tag ref={ref} className={cx('reveal', className)} style={{ transitionDelay: delay ? `${delay}ms` : undefined }} {...rest}>
      {children}
    </Tag>
  )
}

/* ---- Layout ---- */
export function Container({ className = '', children }) {
  return <div className={cx('mx-auto w-full max-w-[1180px] px-5 sm:px-8', className)}>{children}</div>
}

/* ---- Eyebrow (mono label) ---- */
export function Eyebrow({ children, className = '' }) {
  return (
    <span className={cx('inline-flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-brand', className)}>
      <span className="h-1 w-1 rounded-full bg-brand" />
      {children}
    </span>
  )
}

/* ---- Section header ---- */
export function SectionHeader({ eyebrow, title, subtitle, align = 'center', className = '' }) {
  const center = align === 'center'
  return (
    <div className={cx(center ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl', className)}>
      {eyebrow && <Reveal><Eyebrow>{eyebrow}</Eyebrow></Reveal>}
      <Reveal delay={60}>
        <h2 className="mt-4 text-balance text-[clamp(1.9rem,4vw,3rem)] font-bold leading-[1.06] tracking-[-0.02em] text-ink">
          {title}
        </h2>
      </Reveal>
      {subtitle && (
        <Reveal delay={120}>
          <p className={cx('mt-4 text-[1.0625rem] leading-relaxed text-muted', center && 'mx-auto')}>{subtitle}</p>
        </Reveal>
      )}
    </div>
  )
}

/* ---- Button ---- */
export function Button({ as = 'button', variant = 'solid', size = 'md', className = '', children, icon, ...rest }) {
  const Tag = as
  const base = 'group inline-flex items-center justify-center gap-2 rounded-full font-semibold tap-ring transition-all duration-200 select-none'
  const sizes = { md: 'h-11 px-5 text-[0.9375rem]', lg: 'h-[52px] px-7 text-base' }
  const variants = {
    solid: 'bg-brand text-white shadow-[0_8px_22px_-10px_rgba(17,0,255,0.7)] hover:bg-brand-dark hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-12px_rgba(17,0,255,0.8)] active:translate-y-0',
    ghost: 'bg-white text-ink ring-1 ring-hair hover:ring-brand/30 hover:bg-mist hover:-translate-y-0.5',
    softer: 'bg-[rgba(17,0,255,0.06)] text-brand hover:bg-[rgba(17,0,255,0.1)] hover:-translate-y-0.5',
  }
  return (
    <Tag className={cx(base, sizes[size], variants[variant], className)} {...rest}>
      {children}
      {icon && <Icon name={icon} size={size === 'lg' ? 18 : 16} className="transition-transform duration-200 group-hover:translate-x-0.5" />}
    </Tag>
  )
}

/* ---- Border beam wrapper ---- */
export function BorderBeam({ children, className = '', radius = 16, duration = 7, borderClass = 'ring-1 ring-hair' }) {
  return (
    <div className={cx('beam-wrap', borderClass, className)} style={{ borderRadius: radius, overflow: 'hidden' }}>
      <span className="beam-comet" style={{ '--beam-dur': `${duration}s` }} />
      {children}
    </div>
  )
}

/* ---- Interactive blueprint grid ---- */
export function BlueprintGrid({ cols = 16, rows = 9, className = '' }) {
  const cells = React.useMemo(() => Array.from({ length: cols * rows }), [cols, rows])
  return (
    <div className={cx('pointer-events-none absolute inset-0 select-none', className)} aria-hidden="true">
      <div className="blueprint-bg blueprint-fade absolute inset-0" />
      <div
        className="blueprint-fade pointer-events-auto absolute inset-0 grid"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}
      >
        {cells.map((_, i) => <div key={i} className="igrid-cell" />)}
      </div>
    </div>
  )
}

/* ---- Brand wordmark + house/blueprint mark ---- */
export function Logomark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="30" height="30" rx="8" fill="#1100FF" />
      <path d="M9 22V14.4L16 9l7 5.4V22" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.4 22v-4.2h5.2V22" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 14.4h14" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeOpacity="0.55" />
    </svg>
  )
}
export function Wordmark({ size = 28, className = '' }) {
  return (
    <span className={cx('inline-flex items-center gap-2.5', className)}>
      <Logomark size={size} />
      <span className="text-[1.15rem] font-extrabold tracking-[-0.02em] text-ink">Planner</span>
    </span>
  )
}
