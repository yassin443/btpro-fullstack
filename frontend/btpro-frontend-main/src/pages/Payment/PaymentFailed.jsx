import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { XCircle, RefreshCw, ArrowLeft } from 'lucide-react'

export default function PaymentFailed() {
    const navigate = useNavigate()

    useEffect(() => {
        // Supprimer le token en attente — l'utilisateur n'a pas payé
        sessionStorage.removeItem('pending_token')
        sessionStorage.removeItem('pending_user')
    }, [])

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #FFF1F2, #FEF2F2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--sans)', padding: 20 }}>
            <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.1)', padding: '48px 40px', textAlign: 'center', maxWidth: 440, width: '100%' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                    <XCircle size={36} color="#DC2626" />
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', marginBottom: 10 }}>Paiement échoué</div>
                <div style={{ fontSize: 14, color: '#64748B', marginBottom: 32, lineHeight: 1.7 }}>
                    Le paiement n'a pas pu être traité.<br />
                    Vérifiez vos informations bancaires et réessayez.
                </div>
                <button
                    onClick={() => navigate('/register')}
                    style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #DC2626, #EF4444)', color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'var(--sans)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
                    <RefreshCw size={16} /> Réessayer l'inscription
                </button>
                <button
                    onClick={() => navigate('/login')}
                    style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1.5px solid #E2E8F0', background: '#fff', color: '#64748B', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--sans)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <ArrowLeft size={15} /> Se connecter
                </button>
            </div>
        </div>
    )
}
