import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import { Eye, EyeOff } from 'lucide-react'
import api from '../../api/axios'
import useStore from '../../store/useStore'
import { PlannerLogo } from '../../components/PlannerLogo'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
)

export default function Login() {
    const navigate = useNavigate()
    const { setUser, setToken } = useStore()
    const [form, setForm] = useState({ email: '', password: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [gLoading, setGLoading] = useState(false)
    const [showPwd, setShowPwd] = useState(false)
    const [emailError, setEmailError] = useState('')

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!EMAIL_REGEX.test(form.email)) {
            setEmailError('Adresse email invalide (doit contenir @)')
            return
        }
        setEmailError('')
        setLoading(true)
        setError('')
        api.post('/users/login/', form).then(res => {
            setToken(res.data.access)
            setUser(res.data.user)
            navigate(res.data.user?.is_superuser ? '/superadmin' : '/dashboard')
        }).catch(() => {
            setError('Email ou mot de passe incorrect')
        }).finally(() => setLoading(false))
    }

    const googleLogin = useGoogleLogin({
        onSuccess: (tokenResponse) => {
            setGLoading(true)
            api.post('/users/google-auth/', { access_token: tokenResponse.access_token })
                .then(res => {
                    if (res.status === 202) {
                        navigate('/register', { state: { google: res.data, accessToken: tokenResponse.access_token } })
                    } else {
                        setToken(res.data.access)
                        setUser(res.data.user)
                        navigate(res.data.user?.is_superuser ? '/superadmin' : '/dashboard')
                    }
                })
                .catch(() => setError('Erreur connexion Google. Vérifiez votre configuration.'))
                .finally(() => setGLoading(false))
        },
        onError: () => setError('Connexion Google annulée ou refusée'),
    })

    return (
        <div className="auth-layout">
            {/* Left: dark art panel */}
            <div className="auth-left" style={{ padding: '48px 56px', justifyContent: 'flex-start' }}>
                <PlannerLogo size={28} variant="onDark" />

                <div style={{ flex: 1, display: 'grid', placeItems: 'center', marginTop: 48 }}>
                    <svg viewBox="0 0 400 400" style={{ width: '100%', maxWidth: 360, opacity: 0.82 }}>
                        <defs>
                            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
                            </pattern>
                        </defs>
                        <rect width="400" height="400" fill="url(#grid)"/>
                        <g stroke="rgba(255,255,255,0.8)" strokeWidth="1.2" fill="none">
                            <rect x="60" y="80" width="280" height="240"/>
                            <line x1="60" y1="180" x2="220" y2="180"/>
                            <line x1="220" y1="80" x2="220" y2="320"/>
                            <line x1="220" y1="240" x2="340" y2="240"/>
                            <line x1="140" y1="180" x2="140" y2="320"/>
                            <path d="M 80 80 A 20 20 0 0 1 100 100"/>
                            <path d="M 240 180 A 20 20 0 0 1 260 200"/>
                            <rect x="70" y="200" width="50" height="20" strokeDasharray="2 2"/>
                            <rect x="160" y="100" width="40" height="60" strokeDasharray="2 2"/>
                            <circle cx="280" cy="290" r="20" strokeDasharray="2 2"/>
                            <text x="155" y="160" fill="rgba(255,255,255,0.45)" fontSize="9" fontFamily="monospace">SÉJOUR · 32 m²</text>
                            <text x="80" y="260" fill="rgba(255,255,255,0.45)" fontSize="9" fontFamily="monospace">CH. 1</text>
                            <text x="240" y="160" fill="rgba(255,255,255,0.45)" fontSize="9" fontFamily="monospace">CUISINE</text>
                            <text x="240" y="300" fill="rgba(255,255,255,0.45)" fontSize="9" fontFamily="monospace">PATIO</text>
                            <line x1="60" y1="340" x2="340" y2="340" strokeWidth="0.5"/>
                            <text x="195" y="358" fill="rgba(255,255,255,0.35)" fontSize="9" fontFamily="monospace" textAnchor="middle">14.00 m</text>
                        </g>
                    </svg>
                </div>

            </div>

            {/* Right: centered form */}
            <div className="auth-form-wrap">
                <div className="auth-form">
                    <h2 className="auth-title">Bon retour.</h2>
                    <p className="auth-sub">Connectez-vous à votre espace Planner.</p>

                    <button className="btn-google" onClick={() => googleLogin()} disabled={gLoading}>
                        <GoogleIcon />
                        {gLoading ? 'Connexion...' : 'Continuer avec Google'}
                    </button>

                    <div className="auth-divider">ou avec votre email</div>

                    {error && <div className="auth-error">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="auth-fields-card">
                            <div className="field">
                                <label>Adresse email</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setEmailError('') }}
                                    placeholder="votre@email.com"
                                    required
                                    style={emailError ? { borderColor: '#EF4444' } : {}}
                                />
                                {emailError && <p style={{ fontSize: 12, color: 'var(--red)', marginTop: 2 }}>{emailError}</p>}
                            </div>

                            <div className="field">
                                <label>Mot de passe</label>
                                <div className="auth-pwd-wrap">
                                    <input
                                        type={showPwd ? 'text' : 'password'}
                                        value={form.password}
                                        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                        placeholder="••••••••"
                                        required
                                        style={{ paddingRight: 44 }}
                                    />
                                    <button type="button" className="auth-pwd-toggle" onClick={() => setShowPwd(s => !s)}>
                                        {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button type="submit" className="btn-auth" disabled={loading}>
                            {loading ? 'Connexion en cours...' : 'Se connecter →'}
                        </button>
                    </form>

                    <p className="auth-footer">
                        Pas encore de compte ?{' '}
                        <span className="auth-link" onClick={() => navigate('/register')}>S'inscrire</span>
                    </p>
                </div>
            </div>
        </div>
    )
}
