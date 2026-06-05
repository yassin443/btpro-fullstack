import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, CreditCard } from 'lucide-react'
import api from '../../api/axios'
import useStore from '../../store/useStore'
import { PlannerMark } from '../../components/PlannerLogo'

const PLANS = [
    { key: 'SOLO',    label: 'Solo',    prix: 4900,  color: 'var(--indigo)' },
    { key: 'CABINET', label: 'Cabinet', prix: 8900,  color: '#10B981' },
    { key: 'AGENCE',  label: 'Agence',  prix: 14900, color: '#8B5CF6' },
]

export default function AbonnementRequis() {
    const navigate = useNavigate()
    const { logout } = useStore()
    const [plan, setPlan] = useState('CABINET')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handlePay = () => {
        setLoading(true)
        setError('')
        api.post('/finances/checkout/', { plan })
            .then(res => { window.location.href = res.data.checkout_url })
            .catch(() => { setError('Erreur lors de la création du paiement'); setLoading(false) })
    }

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F8FAFC, var(--indigo-soft))', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'var(--sans)' }}>
            <div style={{ width: '100%', maxWidth: 460, textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
                    <PlannerMark size={36} />
                    <span style={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>Planner</span>
                </div>

                <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.1)', padding: '40px 32px' }}>
                    <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <Lock size={26} color="#F59E0B" />
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>Abonnement requis</div>
                    <div style={{ fontSize: 14, color: '#64748B', marginBottom: 28, lineHeight: 1.6 }}>
                        Votre abonnement est expiré ou inactif.<br />Choisissez un plan pour continuer.
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                        {PLANS.map(p => (
                            <div
                                key={p.key}
                                onClick={() => setPlan(p.key)}
                                style={{
                                    flex: 1, padding: '12px 8px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                                    border: plan === p.key ? `2px solid ${p.color}` : '1.5px solid #E2E8F0',
                                    background: plan === p.key ? '#F8FAFC' : '#fff',
                                }}
                            >
                                <div style={{ fontSize: 12, fontWeight: 700, color: plan === p.key ? p.color : '#64748B' }}>{p.label}</div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{p.prix.toLocaleString()} DA</div>
                            </div>
                        ))}
                    </div>

                    {error && <div style={{ background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#EF4444' }}>{error}</div>}

                    <button
                        onClick={handlePay}
                        disabled={loading}
                        style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: 'var(--grad)', color: '#fff', fontSize: 15, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1 }}
                    >
                        <CreditCard size={16} />
                        {loading ? 'Redirection...' : 'Payer et accéder'}
                    </button>

                    <button
                        onClick={() => { logout(); navigate('/login') }}
                        style={{ marginTop: 12, width: '100%', padding: 12, borderRadius: 12, border: '1.5px solid #E2E8F0', background: '#fff', color: '#64748B', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)' }}
                    >
                        Se déconnecter
                    </button>
                </div>
            </div>
        </div>
    )
}
