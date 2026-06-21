/* ========================================================================
   Shared auth UI — Planner (login / register / reset)
   Ported from design/components/auth-ui.jsx → ES modules, wired to react-router.
   ======================================================================== */
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { cx, Icon, Reveal, BlueprintGrid, Wordmark } from '../Landing/_ui'

export { cx, Icon, Reveal } from '../Landing/_ui'

const ROUTES = { landing: '/', login: '/login', register: '/register', reset: '/reset', dashboard: '/dashboard' }
export function useGo() {
  const navigate = useNavigate()
  return (key) => navigate(ROUTES[key] || '/' + key)
}

export function GoogleG({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.22V7.04H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  )
}

export function Spinner({ size = 18, className = '' }) {
  return <Icon name="Loader" size={size} className={cx('animate-spin', className)} />
}

export function Divider({ label = 'ou' }) {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-hair" />
      <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-faint">{label}</span>
      <span className="h-px flex-1 bg-hair" />
    </div>
  )
}

export function ErrorBanner({ message }) {
  return (
    <div aria-live="assertive">
      {message && (
        <div className="mb-4 flex items-start gap-2.5 rounded-[12px] border border-red-200 bg-red-50 px-3.5 py-3 text-[0.85rem] text-red-600 animate-[shake_.4s_ease]">
          <Icon name="CircleAlert" size={16} className="mt-0.5 shrink-0" />
          <span className="font-medium">{message}</span>
        </div>
      )}
    </div>
  )
}

export function GoogleButton({ onClick, loading, disabled, label = 'Continuer avec Google' }) {
  return (
    <button type="button" onClick={onClick} disabled={loading || disabled}
      className="tap-ring flex h-12 w-full items-center justify-center gap-2.5 rounded-[12px] border border-hair bg-white text-[0.95rem] font-semibold text-ink transition-all duration-200 hover:bg-mist hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:translate-y-0">
      {loading ? <Spinner className="text-faint" /> : <GoogleG size={18} />}
      {loading ? 'Connexion…' : label}
    </button>
  )
}

export function Field({ id, label, type = 'text', value, onChange, error, placeholder, autoComplete, rightSlot, onBlur, inputMode, leftSlot }) {
  return (
    <div>
      {label && <label htmlFor={id} className="mb-1.5 block text-[0.85rem] font-semibold text-ink">{label}</label>}
      <div className="relative">
        {leftSlot && <div className="absolute left-1.5 top-1/2 -translate-y-1/2">{leftSlot}</div>}
        <input
          id={id} type={type} value={value} onChange={onChange} onBlur={onBlur}
          placeholder={placeholder} autoComplete={autoComplete} inputMode={inputMode}
          aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined}
          className={cx(
            'h-12 w-full rounded-[12px] border bg-white px-3.5 text-[0.95rem] text-ink placeholder:text-faint transition-all duration-200 outline-none',
            rightSlot && 'pr-11', leftSlot && 'pl-[4.5rem]',
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
              : 'border-hair focus:border-brand focus:ring-4 focus:ring-[rgba(17,0,255,0.12)]'
          )}
        />
        {rightSlot && <div className="absolute right-1.5 top-1/2 -translate-y-1/2">{rightSlot}</div>}
      </div>
      <div className="min-h-[18px]" aria-live="polite">
        {error && (
          <p id={`${id}-err`} className="mt-1 flex items-center gap-1 text-[0.78rem] font-medium text-red-500">
            <Icon name="CircleAlert" size={12} /> {error}
          </p>
        )}
      </div>
    </div>
  )
}

export function PasswordField({ id, label, value, onChange, error, placeholder = '••••••••', autoComplete = 'current-password', meter = false, onBlur }) {
  const [show, setShow] = React.useState(false)
  return (
    <div>
      <Field
        id={id} label={label} type={show ? 'text' : 'password'} value={value}
        onChange={onChange} onBlur={onBlur} error={error}
        placeholder={placeholder} autoComplete={autoComplete}
        rightSlot={
          <button type="button" onClick={() => setShow((v) => !v)}
            aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            className="tap-ring flex h-8 w-8 items-center justify-center rounded-lg text-faint transition-colors hover:bg-mist hover:text-ink">
            <Icon name={show ? 'EyeOff' : 'Eye'} size={17} />
          </button>
        }
      />
      {meter && value && <StrengthMeter value={value} />}
    </div>
  )
}

export function strengthScore(pw) {
  if (!pw) return 0
  let s = 0
  if (pw.length >= 8) s++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++
  if (/\d/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return s
}

export function StrengthMeter({ value }) {
  const s = strengthScore(value)
  const labels = ['Très faible', 'Faible', 'Correct', 'Bon', 'Excellent']
  const colors = ['bg-red-400', 'bg-red-400', 'bg-amber-400', 'bg-brand/70', 'bg-brand']
  return (
    <div className="-mt-1 mb-1">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={cx('h-1.5 flex-1 rounded-full transition-colors duration-300', i < s ? colors[s] : 'bg-hair')} />
        ))}
      </div>
      <p className="mt-1 font-mono text-[10px] text-faint">Sécurité : <span className="text-muted">{labels[s]}</span></p>
    </div>
  )
}

export function BulletList({ items }) {
  return (
    <ul className="mt-9 flex flex-col gap-4">
      {items.map((b, i) => (
        <Reveal as="li" key={b} delay={120 + i * 80} className="flex items-center gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-white">
            <Icon name="Check" size={13} strokeWidth={3} />
          </span>
          <span className="text-[1rem] font-medium text-ink/90">{b}</span>
        </Reveal>
      ))}
    </ul>
  )
}

/* ---- Split-screen auth layout (left brand panel + right form) ---- */
export function AuthLayout({ left, trust, children, maxW = 420 }) {
  const go = useGo()
  return (
    <div className="planner-site font-sans text-ink antialiased">
      <div className="flex min-h-screen w-full">
        <aside className="relative hidden w-[45%] flex-col overflow-hidden border-r border-hair bg-mist/50 lg:flex">
          <BlueprintGrid cols={12} rows={16} className="h-full" />
          <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(70% 50% at 30% 18%, rgba(17,0,255,0.10), transparent 70%)' }} />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full" style={{ background: 'radial-gradient(circle, rgba(17,0,255,0.10), transparent 70%)' }} />
          <div className="relative z-10 flex h-full flex-col p-10 xl:p-14">
            <button onClick={() => go('landing')} className="tap-ring inline-flex w-fit rounded-lg" aria-label="Retour à l'accueil">
              <Wordmark size={30} />
            </button>
            <div className="my-auto w-full max-w-md">{left}</div>
            <div className="flex items-center gap-2 font-mono text-[11.5px] text-faint">
              <Icon name="ShieldCheck" size={14} className="text-brand" />
              {trust}
            </div>
          </div>
        </aside>

        <main className="relative flex w-full flex-1 items-center justify-center bg-white px-5 py-10 sm:px-8">
          <div className="blueprint-bg blueprint-fade pointer-events-none absolute inset-0 opacity-60 lg:hidden" />
          <Reveal className="relative w-full" style={{ maxWidth: maxW }}>
            <button onClick={() => go('landing')} className="tap-ring mb-8 flex w-fit rounded-lg lg:hidden" aria-label="Retour à l'accueil">
              <Wordmark size={30} />
            </button>
            {children}
          </Reveal>
        </main>
      </div>
    </div>
  )
}
