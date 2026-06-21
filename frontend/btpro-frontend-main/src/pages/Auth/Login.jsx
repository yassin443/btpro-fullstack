import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import api from '../../api/axios'
import useStore from '../../store/useStore'
import {
  cx, Icon, AuthLayout, BulletList, GoogleButton, Divider, ErrorBanner,
  Field, PasswordField, Spinner,
} from './_ui'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Login() {
  const navigate = useNavigate()
  const { setUser, setToken } = useStore()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [remember, setRemember] = React.useState(true)
  const [touched, setTouched] = React.useState({})
  const [loading, setLoading] = React.useState(false)
  const [googleLoading, setGoogleLoading] = React.useState(false)
  const [banner, setBanner] = React.useState('')

  const emailValid = EMAIL_REGEX.test(email)
  const emailError = touched.email && !email
    ? 'Veuillez saisir votre adresse email.'
    : touched.email && !emailValid
    ? 'Adresse email invalide — vérifiez le format (ex. nom@cabinet.dz).'
    : ''
  const passwordError = touched.password && !password ? 'Veuillez saisir votre mot de passe.' : ''

  const submit = (e) => {
    e.preventDefault()
    setTouched({ email: true, password: true })
    setBanner('')
    if (!emailValid || !password) return
    setLoading(true)
    api.post('/users/login/', { email, password })
      .then((res) => {
        setToken(res.data.access)
        setUser(res.data.user)
        navigate(res.data.user?.is_superuser ? '/superadmin' : '/dashboard')
      })
      .catch(() => setBanner('Email ou mot de passe incorrect. Veuillez réessayer.'))
      .finally(() => setLoading(false))
  }

  const google = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      setGoogleLoading(true)
      setBanner('')
      api.post('/users/google-auth/', { access_token: tokenResponse.access_token })
        .then((res) => {
          if (res.status === 202) {
            navigate('/register', { state: { google: res.data, accessToken: tokenResponse.access_token } })
          } else {
            setToken(res.data.access)
            setUser(res.data.user)
            navigate(res.data.user?.is_superuser ? '/superadmin' : '/dashboard')
          }
        })
        .catch(() => setBanner('Erreur de connexion Google. Veuillez réessayer.'))
        .finally(() => setGoogleLoading(false))
    },
    onError: () => setBanner('Connexion Google annulée ou refusée.'),
  })

  const left = (
    <>
      <h1 className="text-balance text-[clamp(1.9rem,3vw,2.6rem)] font-extrabold leading-[1.08] tracking-[-0.03em] text-ink">
        La plateforme de gestion pour les cabinets d'architecture <span className="text-brand">algériens</span>.
      </h1>
      <BulletList items={['Gestion complète de vos projets', 'Suivi chantier en temps réel', 'Facturation conforme aux normes algériennes', 'Analyse de rentabilité']} />
    </>
  )

  return (
    <AuthLayout left={left} trust="Paiement via Chargily Pay · données hébergées en sécurité.">
      <span className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-brand">Espace cabinet</span>
      <h2 className="mt-2 flex items-center gap-2 text-[1.75rem] font-extrabold tracking-[-0.02em] text-ink">
        Bon retour <Icon name="Hand" size={24} className="text-brand" />
      </h2>
      <p className="mt-1.5 text-[0.95rem] text-muted">Connectez-vous à votre espace cabinet.</p>

      <div className="mt-7">
        <GoogleButton onClick={() => google()} loading={googleLoading} disabled={loading} />
        <Divider />
        <ErrorBanner message={banner} />

        <form onSubmit={submit} noValidate className="flex flex-col gap-1">
          <Field id="email" label="Adresse email" type="email" placeholder="nom@cabinet.dz" autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))} error={emailError} />
          <PasswordField id="password" label="Mot de passe" value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))} error={passwordError} />

          <div className="mb-1 mt-1 flex items-center justify-between">
            <label className="tap-ring flex cursor-pointer select-none items-center gap-2 text-[0.85rem] text-muted">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="peer sr-only" />
              <span className="flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border border-hair bg-white transition-all peer-checked:border-brand peer-checked:bg-brand peer-focus-visible:ring-4 peer-focus-visible:ring-[rgba(17,0,255,0.12)]">
                {remember && <Icon name="Check" size={12} strokeWidth={3} className="text-white" />}
              </span>
              Se souvenir de moi
            </label>
            <button type="button" onClick={() => navigate('/reset')} className="tap-ring rounded text-[0.85rem] font-semibold text-brand hover:underline">Mot de passe oublié ?</button>
          </div>

          <button type="submit" disabled={loading}
            className="tap-ring mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-[0.95rem] font-semibold text-white shadow-[0_8px_22px_-10px_rgba(17,0,255,0.7)] transition-all duration-200 hover:bg-brand-dark hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-80 disabled:translate-y-0">
            {loading && <Spinner />}
            {loading ? 'Connexion en cours…' : 'Se connecter'}
          </button>
        </form>

        <p className="mt-6 text-center text-[0.9rem] text-muted">
          Pas encore de compte ?{' '}
          <button onClick={() => navigate('/register')} className="tap-ring rounded font-semibold text-brand hover:underline">S'inscrire</button>
        </p>
      </div>
    </AuthLayout>
  )
}
