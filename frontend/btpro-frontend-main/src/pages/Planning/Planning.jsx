import { useQuery } from '@tanstack/react-query'
import { Users, AlertTriangle, CheckCircle, Clock, Briefcase } from 'lucide-react'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import useStore from '../../store/useStore'

const STATUS = {
    DISPONIBLE: { label: 'Disponible', color: '#16A34A', light: '#F0FDF4', border: '#BBF7D0' },
    OCCUPE:     { label: 'Occupé',     color: '#D97706', light: '#FFFBEB', border: '#FDE68A' },
    SURCHARGE:  { label: 'Surchargé',  color: '#DC2626', light: '#FEF2F2', border: '#FECACA' },
}

const AVATAR_PALETTES = [
    { bg: 'var(--indigo-soft)', color: 'var(--indigo)' },
    { bg: '#F0FDF4', color: '#15803D' },
    { bg: '#FFF7ED', color: '#C2410C' },
    { bg: '#EFF6FF', color: '#1D4ED8' },
    { bg: '#FDF4FF', color: '#7E22CE' },
    { bg: '#FFF1F2', color: '#BE123C' },
]

export default function Planning() {
    const { user: currentUser } = useStore()
    const isPatron = currentUser?.is_patron === true

    const { data: membres, isLoading } = useQuery({
        queryKey: ['planning'],
        queryFn: () => api.get('/projets/planning/').then(r => r.data),
    })

    const allList = membres || []
    const list = isPatron ? allList : allList.filter(m => m.id === currentUser?.id)

    const disponibles = list.filter(m => m.statut === 'DISPONIBLE').length
    const occupes     = list.filter(m => m.statut === 'OCCUPE').length
    const surcharges  = list.filter(m => m.statut === 'SURCHARGE').length

    const STATS = [
        { icon: <CheckCircle size={18} color="#16A34A" />, bg: '#F0FDF4', label: 'Disponibles', val: disponibles, sub: 'Aucun projet actif',  color: '#16A34A' },
        { icon: <Clock size={18} color="#D97706" />,        bg: '#FFFBEB', label: 'Occupés',     val: occupes,     sub: 'Charge normale',     color: '#D97706' },
        { icon: <AlertTriangle size={18} color="#DC2626" />, bg: '#FEF2F2', label: 'Surchargés', val: surcharges,  sub: 'À surveiller',       color: '#DC2626' },
    ]

    return (
        <Layout>
            <div className="page">
                <div className="page-head">
                    <div>
                        <h1 className="page-title">{isPatron ? 'Planning équipe' : 'Mon planning'}</h1>
                        <div className="page-sub">{isPatron ? 'Charge de travail et disponibilité des membres' : 'Votre charge de travail et disponibilité'}</div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="text-center color-slate" style={{ padding: 80 }}>Chargement...</div>
                ) : (
                    <>
                        {/* Stats strip */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 28 }}>
                            {STATS.map((s, i) => (
                                <div key={i} style={{
                                    background: '#fff', borderRadius: 16,
                                    border: '1px solid #E5E7EB',
                                    padding: '20px 22px',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                                }}>
                                    <div>
                                        <div style={{ fontSize: 40, fontWeight: 800, color: s.color, letterSpacing: '-2px', lineHeight: 1 }}>{s.val}</div>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginTop: 6 }}>{s.label}</div>
                                        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{s.sub}</div>
                                    </div>
                                    <div style={{ width: 38, height: 38, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        {s.icon}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {list.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon" style={{ background: 'var(--indigo-soft)' }}><Users size={24} color="var(--indigo)" /></div>
                                <div className="empty-title">Aucun membre</div>
                                <div className="empty-sub">Ajoutez des membres à votre cabinet</div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {list.map((membre, mi) => {
                                    const cfg      = STATUS[membre.statut] || STATUS.DISPONIBLE
                                    const palette  = AVATAR_PALETTES[mi % AVATAR_PALETTES.length]
                                    const totalH   = parseFloat(membre.heures_total || 0)
                                    const projets  = membre.heures_par_projet || []
                                    const initials = membre.nom.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

                                    return (
                                        <div key={membre.id} style={{
                                            background: '#fff',
                                            borderRadius: 16,
                                            border: '1px solid #E5E7EB',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
                                            display: 'flex',
                                            overflow: 'hidden',
                                        }}>
                                            <div style={{ width: 4, background: cfg.color, flexShrink: 0 }} />

                                            <div style={{ flex: 1, padding: '20px 22px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: projets.length > 0 ? 16 : 0 }}>
                                                    <div style={{
                                                        width: 44, height: 44, borderRadius: 12,
                                                        background: palette.bg, color: palette.color,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: 15, fontWeight: 800, flexShrink: 0,
                                                        letterSpacing: '-0.5px',
                                                    }}>
                                                        {initials}
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {membre.nom}
                                                        </div>
                                                        <div style={{ fontSize: 11.5, color: '#9CA3AF', fontWeight: 500, marginTop: 2 }}>
                                                            {membre.role}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                                                        <span style={{ fontSize: 18, fontWeight: 800, color: cfg.color, letterSpacing: '-0.5px' }}>
                                                            {totalH}h
                                                        </span>
                                                        <div style={{
                                                            display: 'flex', alignItems: 'center', gap: 5,
                                                            padding: '5px 11px', borderRadius: 20,
                                                            background: cfg.light, color: cfg.color,
                                                            fontSize: 12, fontWeight: 600,
                                                            border: `1px solid ${cfg.border}`,
                                                        }}>
                                                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color }} />
                                                            {cfg.label}
                                                        </div>
                                                    </div>
                                                </div>

                                                {projets.length > 0 && (
                                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 14, borderTop: '1px solid #F3F4F6' }}>
                                                        {projets.map((hp, i) => (
                                                            <div key={i} style={{
                                                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                                                padding: '4px 10px', borderRadius: 8,
                                                                background: '#F5F3FF', color: '#6D28D9',
                                                                fontSize: 12, fontWeight: 600,
                                                                border: '1px solid #EDE9FE',
                                                            }}>
                                                                <Briefcase size={10} />
                                                                {hp.projet}
                                                                <span style={{ color: '#7C3AED', fontWeight: 700, marginLeft: 2 }}>{hp.heures}h</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
        </Layout>
    )
}
