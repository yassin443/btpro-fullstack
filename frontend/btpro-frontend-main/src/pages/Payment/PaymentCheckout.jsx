import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { CheckCircle2, CreditCard, Shield, ArrowRight, ArrowLeft } from 'lucide-react'
import api from '../../api/axios'
import { PlannerMark } from '../../components/PlannerLogo'

const PLANS = {
    SOLO: {
        label: 'Solo', prix: 4900, color: 'var(--indigo)', bg: '#EEEEFE',
        limits: '1 architecte · 5 GB',
        features: ['Projets illimités', 'Factures + Devis PDF', 'Journal de chantier', 'Documents & Photos'],
    },
    CABINET: {
        label: 'Cabinet', prix: 8900, color: '#10B981', bg: '#ECFDF5',
        limits: '3 architectes · 10 GB',
        features: ['Tout Solo inclus', 'Planning équipe', 'Feuilles de temps', 'Rentabilité par projet'],
    },
    AGENCE: {
        label: 'Agence', prix: 14900, color: '#8B5CF6', bg: '#F5F3FF',
        limits: '5 architectes · 15 GB',
        features: ['Tout Cabinet inclus', 'Export comptable', 'Support 7j/7', 'Onboarding inclus'],
    },
}

export default function PaymentCheckout() {
    const navigate = useNavigate()
    const location = useLocation()
    const planKey = location.state?.plan ?? 'CABINET'
    const plan = PLANS[planKey] ?? PLANS.CABINET
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handlePay = () => {
        setLoading(true)
        setError('')
        api.post('/finances/checkout/', { plan: planKey })
            .then(res => { window.location.href = res.data.checkout_url })
            .catch(err => {
                const msg = err.response?.data?.error ?? err.response?.data?.detail ?? 'Erreur lors de la création du paiement'
                setError(msg)
                setLoading(false)
            })
    }

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F8FAFC 0%, var(--indigo-soft) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'var(--sans)' }}>
            <div style={{ width: '100%', maxWidth: 460 }}>

                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                        <PlannerMark size={34} />
                        <span style={{ fontSize: 20, fontWeight: 800, color: '#0F172A' }}>Planner</span>
                    </div>
                </div>

                <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.1)', padding: '32px' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>Confirmer votre plan</div>
                    <div style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>Accès complet pendant 30 jours · Renouvelable</div>

                    {/* Plan sélectionné */}
                    <div style={{ background: plan.bg, borderRadius: 16, padding: '20px', marginBottom: 20, border: `2px solid ${plan.color}22` }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: plan.color }}>{plan.label}</div>
                                <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{plan.limits}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 22, fontWeight: 900, color: '#0F172A' }}>{plan.prix.toLocaleString()}</div>
                                <div style={{ fontSize: 11, color: '#94A3B8' }}>DA/mois</div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                            {plan.features.map(f => (
                                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#334155' }}>
                                    <CheckCircle2 size={12} color={plan.color} /> {f}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Total */}
                    <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 13, color: '#64748B' }}>Total à payer</span>
                        <span style={{ fontSize: 20, fontWeight: 900, color: '#0F172A' }}>{plan.prix.toLocaleString()} DA</span>
                    </div>

                    {error && (
                        <div style={{ background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#EF4444' }}>
                            {error}
                        </div>
                    )}

                    <button onClick={handlePay} disabled={loading} style={{
                        width: '100%', padding: 14, borderRadius: 12, border: 'none',
                        background: loading ? '#E2E8F0' : `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`,
                        color: loading ? '#94A3B8' : '#fff',
                        fontSize: 15, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
                        fontFamily: 'var(--sans)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        boxShadow: loading ? 'none' : `0 4px 14px ${plan.color}44`,
                        marginBottom: 12,
                    }}>
                        {loading
                            ? 'Redirection...'
                            : <><CreditCard size={16} /> Payer {plan.prix.toLocaleString()} DA <ArrowRight size={14} /></>
                        }
                    </button>

                    <button onClick={() => navigate('/register')} style={{
                        width: '100%', padding: 12, borderRadius: 12, border: '1.5px solid #E2E8F0',
                        background: '#fff', color: '#64748B', fontSize: 13, fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'var(--sans)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}>
                        <ArrowLeft size={14} /> Changer de plan
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, fontSize: 11, color: '#94A3B8' }}>
                        <Shield size={11} /> Paiement sécurisé via Chargily Pay
                    </div>
                </div>
            </div>
        </div>
    )
}
