/* ========================================================================
   Admin — shared UI primitives (ported from design system)
   ======================================================================== */
import React from 'react'
import * as Lucide from 'lucide-react'

export const cx = (...a) => a.filter(Boolean).join(' ')

export function Icon({ name, size = 20, strokeWidth = 2, className = '', style }) {
  const Cmp = Lucide[name]
  if (!Cmp) return null
  return <Cmp size={size} strokeWidth={strokeWidth} className={className} style={style} aria-hidden="true" />
}

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

export const fmtDA = (n) => Number(n).toLocaleString('fr-FR')
export const fmtDate = (s) => {
  if (!s) return '—'
  const d = String(s).split('T')[0].split(' ')[0]
  const parts = d.split('-')
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
  return s
}
export const daysUntil = (s) => Math.ceil((new Date(s) - new Date('2026-06-21')) / 86400000)

export function Badge({ tone = 'neutral', children, dot = false }) {
  const tones = {
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
    danger: 'bg-red-50 text-red-600 ring-red-500/15',
    warn: 'bg-amber-50 text-amber-700 ring-amber-500/20',
    info: 'bg-[rgba(17,0,255,0.06)] text-brand ring-brand/15',
    neutral: 'bg-mist text-muted ring-hair',
    violet: 'bg-violet-50 text-violet-700 ring-violet-500/15',
  }
  const dotc = { success: 'bg-emerald-500', danger: 'bg-red-500', warn: 'bg-amber-500', info: 'bg-brand', neutral: 'bg-faint', violet: 'bg-violet-500' }
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold ring-1', tones[tone])}>
      {dot && <span className={cx('h-1.5 w-1.5 rounded-full', dotc[tone])} />}
      {children}
    </span>
  )
}

export function KPI({ label, value, unit, delta, icon, deltaTone = 'success' }) {
  return (
    <div className="rounded-[14px] border border-hair bg-white p-4 transition-shadow hover:shadow-soft">
      <div className="flex items-center justify-between">
        <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[rgba(17,0,255,0.06)] text-brand"><Icon name={icon} size={16} /></span>
        {delta && <span className={cx('font-mono text-[11px] font-semibold', deltaTone === 'success' ? 'text-emerald-600' : deltaTone === 'muted' ? 'text-faint' : 'text-brand')}>{delta}</span>}
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="font-mono text-[1.5rem] font-bold tracking-tight text-ink">{value}</span>
        {unit && <span className="font-mono text-[12px] font-medium text-faint">{unit}</span>}
      </div>
      <div className="mt-0.5 text-[12.5px] text-muted">{label}</div>
    </div>
  )
}

export function Panel({ title, action, children, className = '', pad = true }) {
  return (
    <div className={cx('rounded-[14px] border border-hair bg-white', className)}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-hair px-4 py-3">
          <h3 className="text-[0.95rem] font-bold tracking-[-0.01em] text-ink">{title}</h3>
          {action}
        </div>
      )}
      <div className={pad ? 'p-4' : ''}>{children}</div>
    </div>
  )
}

export function PageHead({ title, desc, children }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-[1.4rem] font-extrabold tracking-[-0.02em] text-ink">{title}</h1>
        {desc && <p className="mt-1 text-[0.9rem] text-muted">{desc}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  )
}

export function AdminBtn({ children, variant = 'solid', size = 'md', icon, onClick, type = 'button', className = '', danger = false, disabled }) {
  const base = 'inline-flex items-center justify-center gap-1.5 rounded-[10px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'
  const sizes = { sm: 'h-8 px-2.5 text-[12.5px]', md: 'h-9 px-3.5 text-[13px]', lg: 'h-11 px-5 text-[14px]' }
  const variants = {
    solid: danger ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-brand text-white hover:bg-brand-dark',
    ghost: 'bg-white text-ink ring-1 ring-hair hover:bg-mist',
    soft: danger ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-[rgba(17,0,255,0.06)] text-brand hover:bg-[rgba(17,0,255,0.1)]',
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cx(base, sizes[size], variants[variant], className)}>
      {icon && <Icon name={icon} size={size === 'sm' ? 14 : 15} />}{children}
    </button>
  )
}

export function SearchInput({ value, onChange, placeholder = 'Rechercher…', className = '' }) {
  return (
    <div className={cx('relative', className)}>
      <Icon name="Search" size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="h-9 w-full rounded-[10px] border border-hair bg-white pl-9 pr-3 text-[13px] text-ink placeholder:text-faint outline-none transition-all focus:border-brand focus:ring-4 focus:ring-[rgba(17,0,255,0.1)]" />
    </div>
  )
}

export function Select({ value, onChange, options, className = '' }) {
  return (
    <div className={cx('relative', className)}>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full appearance-none rounded-[10px] border border-hair bg-white pl-3 pr-8 text-[13px] font-medium text-ink outline-none transition-all focus:border-brand focus:ring-4 focus:ring-[rgba(17,0,255,0.1)]">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <Icon name="ChevronDown" size={15} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-faint" />
    </div>
  )
}

export function LabeledInput({ label, value, onChange, type = 'text', placeholder, mono = false }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-semibold text-ink">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className={cx('h-10 w-full rounded-[10px] border border-hair bg-white px-3 text-[13px] text-ink placeholder:text-faint outline-none transition-all focus:border-brand focus:ring-4 focus:ring-[rgba(17,0,255,0.1)]', mono && 'font-mono')} />
    </label>
  )
}

export function Switch({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={cx('relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2', checked ? 'bg-brand' : 'bg-hair')}>
      <span className={cx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200', checked ? 'translate-x-[22px]' : 'translate-x-0.5')} />
    </button>
  )
}

export function Segmented({ value, onChange, options, size = 'md' }) {
  const idx = Math.max(0, options.findIndex((o) => o.value === value))
  const h = size === 'sm' ? 'h-8' : 'h-9'
  return (
    <div className={cx('relative inline-flex items-center rounded-[10px] bg-mist p-1 ring-1 ring-hair', h)} role="radiogroup">
      <span aria-hidden="true" className="absolute top-1 bottom-1 rounded-[7px] bg-white shadow-soft ring-1 ring-hair transition-all duration-300 ease-[cubic-bezier(.16,1,.3,1)]"
        style={{ left: `calc(${(idx / options.length) * 100}% + 0.25rem)`, width: `calc(${100 / options.length}% - 0.5rem)` }} />
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}
          className={cx('relative z-10 flex-1 whitespace-nowrap rounded-[7px] px-3 text-[12.5px] font-semibold transition-colors duration-200 focus-visible:outline-none',
            value === o.value ? 'text-brand' : 'text-muted hover:text-ink')}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex items-center gap-1 border-b border-hair">
      {tabs.map((t) => (
        <button key={t.value} onClick={() => onChange(t.value)}
          className={cx('relative -mb-px px-3.5 py-2.5 text-[13px] font-semibold transition-colors',
            active === t.value ? 'text-brand' : 'text-muted hover:text-ink')}>
          {t.label}
          {active === t.value && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand" />}
        </button>
      ))}
    </div>
  )
}

export function useTableSort(rows, initial) {
  const [sort, setSort] = React.useState(initial || { key: null, dir: 'asc' })
  const sorted = React.useMemo(() => {
    if (!sort.key) return rows
    const r = [...rows].sort((a, b) => {
      let x = a[sort.key], y = b[sort.key]
      if (typeof x === 'string' && /^\d/.test(x) && /\d{4}-\d{2}/.test(x)) { x = new Date(x); y = new Date(y) }
      if (typeof x === 'number' && typeof y === 'number') return x - y
      return String(x).localeCompare(String(y), 'fr', { numeric: true })
    })
    return sort.dir === 'desc' ? r.reverse() : r
  }, [rows, sort])
  const toggle = (key) => setSort((s) => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })
  return { sorted, sort, toggle }
}

export function DataTable({ columns, rows, sort, onSort, rowKey, empty = 'Aucun résultat.' }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-hair">
            {columns.map((c) => (
              <th key={c.key} className={cx('whitespace-nowrap px-3 py-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-faint', c.align === 'right' && 'text-right', c.align === 'center' && 'text-center')}>
                {c.sortable
                  ? <button onClick={() => onSort(c.key)} className="inline-flex items-center gap-1 transition-colors hover:text-ink">
                      {c.label}
                      <Icon name={sort.key === c.key ? (sort.dir === 'asc' ? 'ChevronUp' : 'ChevronDown') : 'ChevronsUpDown'} size={12} className={sort.key === c.key ? 'text-brand' : 'text-faint/60'} />
                    </button>
                  : c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={columns.length} className="px-3 py-10 text-center text-[13px] text-faint">{empty}</td></tr>
          )}
          {rows.map((row, i) => (
            <tr key={rowKey ? row[rowKey] : i} className="border-b border-hair/70 transition-colors last:border-0 hover:bg-mist/50">
              {columns.map((c) => (
                <td key={c.key} className={cx('px-3 py-3 text-[13px] text-ink', c.align === 'right' && 'text-right', c.align === 'center' && 'text-center', c.mono && 'font-mono', c.nowrap && 'whitespace-nowrap')}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Drawer({ open, onClose, title, subtitle, children, footer, width = 440 }) {
  React.useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  return (
    <div className={cx('fixed inset-0 z-[120]', open ? 'pointer-events-auto' : 'pointer-events-none')} aria-hidden={!open}>
      <div onClick={onClose} className={cx('absolute inset-0 bg-ink/30 backdrop-blur-sm transition-opacity duration-300', open ? 'opacity-100' : 'opacity-0')} />
      <div className={cx('absolute right-0 top-0 flex h-full flex-col bg-white shadow-2xl transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)]', open ? 'translate-x-0' : 'translate-x-full')}
        style={{ width: `min(${width}px, 100%)` }} role="dialog" aria-modal="true">
        <div className="flex items-start justify-between gap-3 border-b border-hair px-5 py-4">
          <div>
            <h3 className="text-[1.05rem] font-bold tracking-[-0.01em] text-ink">{title}</h3>
            {subtitle && <p className="mt-0.5 text-[12.5px] text-muted">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-faint transition-colors hover:bg-mist hover:text-ink" aria-label="Fermer"><Icon name="X" size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-hair px-5 py-3.5">{footer}</div>}
      </div>
    </div>
  )
}

export function Modal({ open, onClose, title, subtitle, icon, iconTone = 'info', children, footer, width = 420 }) {
  React.useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  const tone = { info: 'bg-[rgba(17,0,255,0.06)] text-brand', danger: 'bg-red-50 text-red-500', warn: 'bg-amber-50 text-amber-500' }[iconTone]
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-ink/35 backdrop-blur-sm animate-[fadein_.2s_ease]" />
      <div className="relative w-full overflow-hidden rounded-[16px] border border-hair bg-white shadow-2xl animate-[pop_.22s_cubic-bezier(.16,1,.3,1)]" style={{ maxWidth: width }} role="dialog" aria-modal="true">
        <div className="px-5 pt-5">
          <div className="flex items-start gap-3">
            {icon && <span className={cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px]', tone)}><Icon name={icon} size={19} /></span>}
            <div className="flex-1">
              <h3 className="text-[1.1rem] font-bold tracking-[-0.01em] text-ink">{title}</h3>
              {subtitle && <p className="mt-1 text-[13px] leading-relaxed text-muted">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-faint transition-colors hover:bg-mist hover:text-ink" aria-label="Fermer"><Icon name="X" size={18} /></button>
          </div>
          {children && <div className="mt-4">{children}</div>}
        </div>
        {footer && <div className="mt-5 flex justify-end gap-2 border-t border-hair bg-mist/40 px-5 py-3.5">{footer}</div>}
      </div>
    </div>
  )
}

export function useToast() {
  const [toast, setToast] = React.useState(null)
  const show = React.useCallback((msg, tone = 'success') => {
    setToast({ msg, tone, id: Date.now() })
    setTimeout(() => setToast(null), 2600)
  }, [])
  const node = toast ? (
    <div className="fixed bottom-20 left-1/2 z-[200] -translate-x-1/2 animate-[pop_.22s_cubic-bezier(.16,1,.3,1)]">
      <div className="flex items-center gap-2.5 rounded-full border border-hair bg-white px-4 py-2.5 shadow-lift">
        <span className={cx('flex h-5 w-5 items-center justify-center rounded-full', toast.tone === 'success' ? 'bg-emerald-500' : toast.tone === 'danger' ? 'bg-red-500' : 'bg-brand')}>
          <Icon name={toast.tone === 'danger' ? 'X' : 'Check'} size={12} strokeWidth={3} className="text-white" />
        </span>
        <span className="text-[13px] font-medium text-ink">{toast.msg}</span>
      </div>
    </div>
  ) : null
  return { show, node }
}

export function AreaChart({ data, height = 150, color = '#1100FF' }) {
  const w = 600, pad = 6
  const max = Math.max(...data.map((d) => d.v ?? d)) * 1.1
  const min = 0
  const xs = (i) => pad + (i * (w - pad * 2)) / (data.length - 1)
  const ys = (v) => height - pad - ((v - min) / (max - min)) * (height - pad * 2)
  const pts = data.map((d, i) => [xs(i), ys(d.v ?? d)])
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const area = `${line} L${xs(data.length - 1)} ${height - pad} L${pad} ${height - pad} Z`
  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${w} ${height}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
        <defs>
          <linearGradient id="ac-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((g) => <line key={g} x1={pad} x2={w - pad} y1={height * g} y2={height * g} stroke="#ECECF2" strokeWidth="1" />)}
        <path d={area} fill="url(#ac-grad)" />
        <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="#fff" stroke={color} strokeWidth="2" />)}
      </svg>
      {data[0] && data[0].m && (
        <div className="mt-2 flex justify-between px-1 font-mono text-[10px] text-faint">
          {data.map((d, i) => <span key={i}>{d.m}</span>)}
        </div>
      )}
    </div>
  )
}

export function MiniSpark({ data, color = '#1100FF', height = 40 }) {
  const w = 120, pad = 2
  const max = Math.max(...data) * 1.1, min = Math.min(...data) * 0.9
  const xs = (i) => pad + (i * (w - pad * 2)) / (data.length - 1)
  const ys = (v) => height - pad - ((v - min) / (max - min || 1)) * (height - pad * 2)
  const line = data.map((v, i) => `${i ? 'L' : 'M'}${xs(i).toFixed(1)} ${ys(v).toFixed(1)}`).join(' ')
  return <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }}><path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

export function BarRow({ label, value, max, suffix = '', barClass = 'bg-brand' }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[12.5px]">
        <span className="text-muted">{label}</span>
        <span className="font-mono font-semibold text-ink">{fmtDA(value)}{suffix}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-mist">
        <div className={cx('h-full rounded-full', barClass)} style={{ width: `${(value / max) * 100}%` }} />
      </div>
    </div>
  )
}
