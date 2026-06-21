import React from 'react'
import { useNavigate } from 'react-router-dom'
import { cx, Icon, Reveal, Wordmark } from '../Landing/_ui'
import { Field, Spinner } from './_ui'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function ResetCard({ children }) {
  const navigate = useNavigate()
  return (
    <div className="planner-site font-sans text-ink antialiased">
      <div className="relative flex min-h-screen w-full items-center justify-center bg-white px-5 py-10">
        <div className="blueprint-bg blueprint-fade pointer-events-none absolute inset-0 opacity-60" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[40vh]" style={{ background: 'radial-gradient(60% 100% at 50% 0%, rgba(17,0,255,0.07), transparent 70%)' }} />
        <Reveal className="relative w-full max-w-[420px]">
          <button onClick={() => navigate('/')} className="tap-ring mx-auto mb-8 flex w-fit rounded-lg" aria-label="Accueil">
            <Wordmark size={30} />
          </button>
          <div className="rounded-[18px] border border-hair bg-white p-7 shadow-soft sm:p-8">
            {children}
          </div>
        </Reveal>
      </div>
    </div>
  )
}

export default function Reset() {
  const navigate = useNavigate()
  const [email, setEmail] = React.useState('')
  const [touched, setTouched] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [sent, setSent] = React.useState(false)

  const emailValid = EMAIL_REGEX.test(email)

  const sendLink = (e) => {
    e.preventDefault()
    setTouched(true)
    if (!emailValid) return
    setLoading(true)
    // NOTE (T3): real send wires to a backend reset endpoint via Resend once the
    // sending domain is configured. We confirm optimistically so the UX is complete.
    setTimeout(() => { setLoading(false); setSent(true) }, 600)
  }

  return (
    <ResetCard>
      <div key={String(sent)} className="animate-[step-in_.4s_cubic-bezier(.16,1,.3,1)]">
        {!sent ? (
          <>
            <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[rgba(17,0,255,0.06)] text-brand ring-1 ring-brand/10"><Icon name="KeyRound" size={20} /></span>
            <h2 className="mt-4 text-[1.5rem] font-extrabold tracking-[-0.02em] text-ink">Mot de passe oublié ?</h2>
            <p className="mt-1.5 text-[0.95rem] text-muted">Entrez votre email — nous vous enverrons un lien de réinitialisation.</p>
            <form onSubmit={sendLink} noValidate className="mt-6">
              <Field id="reset-email" label="Adresse email" type="email" placeholder="nom@cabinet.dz" autoComplete="email"
                value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched(true)}
                error={touched && !emailValid ? 'Adresse email invalide.' : ''} />
              <button type="submit" disabled={loading}
                className="tap-ring mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-[0.95rem] font-semibold text-white shadow-[0_8px_22px_-10px_rgba(17,0,255,0.7)] transition-all duration-200 hover:bg-brand-dark hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-80">
                {loading && <Spinner />}{loading ? 'Envoi en cours…' : 'Envoyer le lien'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-brand"><Icon name="MailCheck" size={26} /></span>
            <h2 className="mt-5 text-[1.5rem] font-extrabold tracking-[-0.02em] text-ink">Email envoyé</h2>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">
              Si un compte existe pour <strong className="font-semibold text-ink">{email}</strong>, vous recevrez un lien de réinitialisation. Vérifiez votre boîte de réception (et les spams).
            </p>
            <button onClick={() => setSent(false)} className="tap-ring mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full border border-hair bg-white text-[0.95rem] font-semibold text-ink transition-all hover:bg-mist hover:-translate-y-0.5">
              <Icon name="RotateCw" size={15} /> Renvoyer l'email
            </button>
          </div>
        )}
      </div>

      <button onClick={() => navigate('/login')} className="tap-ring mx-auto mt-6 flex items-center gap-1.5 rounded text-[0.88rem] font-semibold text-muted transition-colors hover:text-ink">
        <Icon name="ArrowLeft" size={15} /> Retour à la connexion
      </button>
    </ResetCard>
  )
}
