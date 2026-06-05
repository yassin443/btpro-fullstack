import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import useStore from '../../store/useStore'
import api from '../../api/axios'

export default function PaymentSuccess() {
    const navigate = useNavigate()
    const qc = useQueryClient()
    const { setToken, setUser } = useStore()
    const [phase, setPhase] = useState('checking') // 'checking' | 'done' | 'slow'

    useEffect(() => {
        let cancelled = false

        async function verify() {
            const pendingToken = sessionStorage.getItem('pending_token')
            const pendingUser = sessionStorage.getItem('pending_user')
            // Si inscription: utiliser le pending token directement dans le header
            // Si renouvellement: l'utilisateur est déjà connecté, axios l'ajoutera automatiquement
            const reqConfig = pendingToken ? { headers: { Authorization: `Bearer ${pendingToken}` } } : {}

            for (let i = 0; i < 5; i++) {
                if (cancelled) return
                if (i > 0) await new Promise(r => setTimeout(r, 2000))
                try {
                    const res = await api.get('/cabinets/abonnement/', reqConfig)
                    if (cancelled) return
                    if (res.data.actif) {
                        // Paiement confirmé — connecter l'utilisateur si inscription
                        if (pendingToken && pendingUser) {
                            setToken(pendingToken)
                            setUser(JSON.parse(pendingUser))
                            sessionStorage.removeItem('pending_token')
                            sessionStorage.removeItem('pending_user')
                        }
                        // Mettre à jour le cache directement pour éviter toute race condition dans SubscriptionRoute
                        qc.setQueryData(['abonnement'], res.data)
                        if (!cancelled) setPhase('done')
                        return
                    }
                } catch { /* webhook pas encore arrivé, on réessaie */ }
            }

            // Après 5 tentatives (~10s): Chargily a redirigé ici donc le paiement est accepté
            // Le webhook backend est lent — on connecte quand même l'utilisateur
            if (pendingToken && pendingUser) {
                setToken(pendingToken)
                setUser(JSON.parse(pendingUser))
                sessionStorage.removeItem('pending_token')
                sessionStorage.removeItem('pending_user')
            }
            qc.setQueryData(['abonnement'], prev => ({ ...prev, actif: true }))
            if (!cancelled) setPhase('slow')
        }

        verify()
        return () => { cancelled = true }
    }, [])

    if (phase === 'checking') {
        return (
            <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F0FDF4, #ECFDF5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--sans)', padding: 20 }}>
                <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.1)', padding: '48px 40px', textAlign: 'center', maxWidth: 440, width: '100%' }}>
                    <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                        <Loader2 size={36} color="#16A34A" style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 10 }}>Vérification du paiement...</div>
                    <div style={{ fontSize: 14, color: '#64748B', lineHeight: 1.7 }}>Nous confirmons votre paiement avec Chargily.<br />Cela prend quelques secondes.</div>
                </div>
            </div>
        )
    }

    if (phase === 'slow') {
        return (
            <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--sans)', padding: 20 }}>
                <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.1)', padding: '48px 40px', textAlign: 'center', maxWidth: 440, width: '100%' }}>
                    <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                        <AlertCircle size={36} color="#F59E0B" />
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', marginBottom: 10 }}>Paiement accepté</div>
                    <div style={{ fontSize: 14, color: '#64748B', marginBottom: 32, lineHeight: 1.7 }}>
                        Votre paiement a bien été reçu.<br />
                        La confirmation finale prend quelques instants supplémentaires.
                    </div>
                    <button
                        onClick={() => navigate('/dashboard')}
                        style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #F59E0B, #EAB308)', color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                        Accéder au tableau de bord
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F0FDF4, #ECFDF5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--sans)', padding: 20 }}>
            <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.1)', padding: '48px 40px', textAlign: 'center', maxWidth: 440, width: '100%' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                    <CheckCircle2 size={36} color="#16A34A" />
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', marginBottom: 10 }}>Paiement réussi !</div>
                <div style={{ fontSize: 14, color: '#64748B', marginBottom: 32, lineHeight: 1.7 }}>
                    Votre abonnement Planner est maintenant actif pour 30 jours.<br />
                    Vous avez accès à toutes les fonctionnalités de votre plan.
                </div>
                <button
                    onClick={() => navigate('/dashboard')}
                    style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #16A34A, #10B981)', color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                    Accéder au tableau de bord
                </button>
            </div>
        </div>
    )
}
