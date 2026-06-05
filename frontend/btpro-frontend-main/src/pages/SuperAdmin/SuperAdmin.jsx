import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
    Users, Building2, TrendingUp, CheckCircle2, XCircle,
    LayoutDashboard, LogOut, AlertTriangle, Sparkles, Plus,
    X, Calendar, Trash2, Mail, Eye, UserCheck, MessageSquare
} from 'lucide-react'
import api from '../../api/axios'
import useStore from '../../store/useStore'

const PLAN_COLORS = { SOLO: 'var(--indigo)', CABINET: '#10B981', AGENCE: '#8B5CF6' }
const PLAN_BG      = { SOLO: 'var(--indigo-soft)', CABINET: '#ECFDF5', AGENCE: '#F5F3FF' }
const PLAN_PRICES  = { SOLO: 3900, CABINET: 7900, AGENCE: 14900 }

const fmt   = (n) => Number(n).toLocaleString('fr-DZ')
const fmtM  = (n) => n >= 1_000_000 ? `${(n/1_000_000).toFixed(1)} M` : n >= 1_000 ? `${(n/1_000).toFixed(0)} K` : String(n)
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'

export default function SuperAdmin() {
    const navigate = useNavigate()
    const { user, setToken, setUser } = useStore()
    const qc = useQueryClient()
    const [search, setSearch]           = useState('')
    const [filterPlan, setFilterPlan]   = useState('ALL')
    const [filterActif, setFilterActif] = useState('ALL')
    const [prolongerModal, setProlongerModal] = useState(null)
    const [moisProlongation, setMoisProlongation] = useState(1)
    const [membresModal, setMembresModal] = useState(null)
    const [activeTab, setActiveTab] = useState('cabinets')

    const { data, isLoading } = useQuery({
        queryKey: ['superadmin'],
        queryFn: () => api.get('/superadmin/dashboard/').then(r => r.data),
        retry: false,
        refetchInterval: 60_000,
    })

    const toggleMutation = useMutation({
        mutationFn: (id) => api.patch(`/superadmin/cabinets/${id}/toggle/`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['superadmin'] }),
    })
    const planMutation = useMutation({
        mutationFn: ({ id, plan }) => api.put(`/superadmin/cabinets/${id}/plan/`, { plan }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['superadmin'] }),
    })
    const prolongerMutation = useMutation({
        mutationFn: ({ id, mois }) => api.post(`/superadmin/cabinets/${id}/prolonger/`, { mois }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['superadmin'] }); setProlongerModal(null) },
    })
    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/superadmin/cabinets/${id}/delete/`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['superadmin'] }),
    })

    const { data: membres = [], isLoading: membresLoading } = useQuery({
        queryKey: ['superadmin-membres', membresModal?.id],
        queryFn: () => api.get(`/superadmin/cabinets/${membresModal.id}/membres/`).then(r => r.data),
        enabled: !!membresModal,
    })

    const { data: contactMsgs = [] } = useQuery({
        queryKey: ['superadmin-contact'],
        queryFn: () => api.get('/superadmin/contact-messages/').then(r => r.data),
        enabled: activeTab === 'messages',
    })

    const marquerLuMut = useMutation({
        mutationFn: (id) => api.patch(`/superadmin/contact-messages/${id}/lu/`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['superadmin-contact'] }),
    })

    const handleLogout = () => { setToken(null); setUser(null); navigate('/login') }

    if (isLoading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#64748B' }}>
            Chargement...
        </div>
    )
    if (!data) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#EF4444' }}>
            Accès refusé
        </div>
    )

    const { stats, cabinets } = data

    const filtered = cabinets.filter(c => {
        const matchSearch = c.nom.toLowerCase().includes(search.toLowerCase()) ||
            c.patron_email.toLowerCase().includes(search.toLowerCase())
        const matchPlan   = filterPlan   === 'ALL' || c.plan   === filterPlan
        const matchActif  = filterActif  === 'ALL' || (filterActif === 'ACTIF' ? c.actif : !c.actif)
        return matchSearch && matchPlan && matchActif
    })

    const tauxActif = stats.total_cabinets > 0
        ? Math.round((stats.cabinets_actifs / stats.total_cabinets) * 100)
        : 0

    return (
        <div style={{ minHeight: '100vh', background: '#F1F5F9', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>

            {/* TOP NAV */}
            <div style={{ background: '#0F172A', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60, position: 'sticky', top: 0, zIndex: 50 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, background: 'var(--grad)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <LayoutDashboard size={16} color="white" />
                    </div>
                    <span style={{ color: 'white', fontWeight: 800, fontSize: 16 }}>Planner</span>
                    <span style={{ background: 'var(--indigo)', color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, letterSpacing: 1 }}>SUPER ADMIN</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {stats.churn_risk > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FEF3C7', borderRadius: 8, padding: '5px 12px' }}>
                            <AlertTriangle size={13} color="#D97706" />
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#92400E' }}>{stats.churn_risk} expiration{stats.churn_risk > 1 ? 's' : ''} &lt; 30j</span>
                        </div>
                    )}
                    <span style={{ color: '#94A3B8', fontSize: 13 }}>{user?.email}</span>
                    <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: '1px solid #334155', borderRadius: 8, color: '#94A3B8', padding: '6px 12px', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
                        <LogOut size={14} /> Déconnexion
                    </button>
                </div>
            </div>

            <div style={{ padding: '32px', maxWidth: 1400, margin: '0 auto' }}>

                {/* PAGE TITLE */}
                <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: -0.5 }}>Tableau de bord</div>
                        <div style={{ fontSize: 13, color: '#64748B', marginTop: 3 }}>Vue globale — Planner SaaS</div>
                    </div>
                    {stats.nouveaux_mois > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ECFDF5', border: '1px solid #BBF7D0', borderRadius: 10, padding: '8px 14px' }}>
                            <Sparkles size={14} color="#10B981" />
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#065F46' }}>+{stats.nouveaux_mois} nouveau{stats.nouveaux_mois > 1 ? 'x' : ''} ce mois</span>
                        </div>
                    )}
                </div>

                {/* STAT CARDS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 20 }}>
                    <StatCard icon={<Building2 size={18} color="var(--indigo)" />} bg="var(--indigo-soft)"
                        label="Cabinets inscrits" value={stats.total_cabinets}
                        sub={`${tauxActif}% actifs`} />
                    <StatCard icon={<CheckCircle2 size={18} color="#10B981" />} bg="#ECFDF5"
                        label="Abonnements actifs" value={stats.cabinets_actifs}
                        sub={`${stats.total_cabinets - stats.cabinets_actifs} inactifs`} />
                    <StatCard icon={<TrendingUp size={18} color="#0EA5E9" />} bg="#F0F9FF"
                        label="MRR" value={`${fmtM(stats.ca_mensuel)} DA`}
                        sub="Revenu mensuel récurrent" small />
                    <StatCard icon={<TrendingUp size={18} color="#8B5CF6" />} bg="#F5F3FF"
                        label="ARR" value={`${fmtM(stats.arr)} DA`}
                        sub="Revenu annuel projeté" small />
                    <StatCard icon={<Users size={18} color="#F59E0B" />} bg="#FFFBEB"
                        label="Utilisateurs totaux" value={stats.total_utilisateurs}
                        sub="Tous cabinets confondus" />
                </div>

                {/* PLAN BREAKDOWN */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
                    {['SOLO', 'CABINET', 'AGENCE'].map(plan => {
                        const nb  = stats.plans[plan] || 0
                        const rev = nb * PLAN_PRICES[plan]
                        const pct = stats.cabinets_actifs > 0 ? Math.round((nb / stats.cabinets_actifs) * 100) : 0
                        return (
                            <div key={plan} style={{ background: 'white', borderRadius: 12, border: `1.5px solid ${PLAN_BG[plan]}`, padding: '18px 22px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: PLAN_COLORS[plan] }}>{plan}</span>
                                    <span style={{ background: PLAN_BG[plan], color: PLAN_COLORS[plan], fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20 }}>{fmt(PLAN_PRICES[plan])} DA/mois</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 8 }}>
                                    <div style={{ fontSize: 32, fontWeight: 800, color: '#0F172A', letterSpacing: -1, lineHeight: 1 }}>{nb}</div>
                                    <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 3 }}>cabinet{nb !== 1 ? 's' : ''} · {pct}%</div>
                                </div>
                                <div style={{ height: 4, background: '#F1F5F9', borderRadius: 4, marginBottom: 10 }}>
                                    <div style={{ height: 4, background: PLAN_COLORS[plan], borderRadius: 4, width: `${pct}%`, transition: 'width 0.3s' }} />
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: PLAN_COLORS[plan] }}>
                                    {fmt(rev)} DA/mois
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* TABS */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    {[
                        { key: 'cabinets', label: 'Cabinets', icon: <Building2 size={14} /> },
                        { key: 'messages', label: `Messages${contactMsgs.filter(m => !m.lu).length > 0 ? ` (${contactMsgs.filter(m => !m.lu).length})` : ''}`, icon: <MessageSquare size={14} /> },
                    ].map(t => (
                        <button key={t.key} onClick={() => setActiveTab(t.key)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, background: activeTab === t.key ? '#0F172A' : 'white', color: activeTab === t.key ? 'white' : '#64748B', boxShadow: activeTab === t.key ? '0 2px 8px rgba(0,0,0,0.15)' : 'none' }}>
                            {t.icon} {t.label}
                        </button>
                    ))}
                </div>

                {/* MESSAGES CONTACT */}
                {activeTab === 'messages' && (
                    <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9' }}>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Messages Contact</div>
                        </div>
                        {contactMsgs.length === 0 ? (
                            <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>Aucun message reçu</div>
                        ) : contactMsgs.map(m => (
                            <div key={m.id} style={{ padding: '16px 20px', borderBottom: '1px solid #F8FAFC', background: m.lu ? 'white' : '#EEEEFE22', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                <div style={{ width: 38, height: 38, borderRadius: '50%', background: m.lu ? '#F1F5F9' : 'var(--indigo-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Mail size={16} color={m.lu ? '#94A3B8' : 'var(--indigo)'} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{m.nom}</span>
                                        {m.cabinet && <span style={{ fontSize: 11, color: '#94A3B8' }}>· {m.cabinet}</span>}
                                        <span style={{ fontSize: 11, background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>{m.sujet_label}</span>
                                        {!m.lu && <span style={{ fontSize: 10, background: 'var(--indigo)', color: 'white', padding: '2px 7px', borderRadius: 10, fontWeight: 700 }}>NOUVEAU</span>}
                                    </div>
                                    <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>{m.email} {m.telephone && `· ${m.telephone}`}</div>
                                    <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{m.message}</div>
                                    <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 6 }}>{new Date(m.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                                </div>
                                {!m.lu && (
                                    <button onClick={() => marquerLuMut.mutate(m.id)} style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid #E2E8F0', background: 'white', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#374151', fontFamily: 'inherit', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Eye size={11} /> Marquer lu
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* CABINETS TABLE */}
                {activeTab === 'cabinets' && (
                <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
                            Tous les cabinets
                            <span style={{ marginLeft: 8, fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>{filtered.length} résultats</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Nom ou email..."
                                style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 13, fontFamily: 'inherit', width: 200, outline: 'none' }}
                            />
                            <Select value={filterPlan} onChange={setFilterPlan} options={[
                                { value: 'ALL', label: 'Tous les plans' },
                                { value: 'SOLO', label: 'Solo' },
                                { value: 'CABINET', label: 'Cabinet' },
                                { value: 'AGENCE', label: 'Agence' },
                            ]} />
                            <Select value={filterActif} onChange={setFilterActif} options={[
                                { value: 'ALL', label: 'Tous statuts' },
                                { value: 'ACTIF', label: 'Actifs' },
                                { value: 'INACTIF', label: 'Inactifs' },
                            ]} />
                        </div>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                        <thead>
                            <tr style={{ background: '#F8FAFC' }}>
                                {['Cabinet', 'Email patron', 'Plan', 'Inscription', 'Expiration', 'Membres', 'Statut', 'Actions'].map(h => (
                                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: 0.8, textTransform: 'uppercase', borderBottom: '1px solid #E2E8F0', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={8} style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>Aucun cabinet trouvé</td></tr>
                            ) : filtered.map(c => {
                                const expirationSoon = c.expiration_proche && c.actif
                                return (
                                    <tr key={c.id}
                                        style={{ borderBottom: '1px solid #F8FAFC', background: expirationSoon ? '#FFFBEB' : 'transparent' }}
                                        onMouseEnter={e => e.currentTarget.style.background = expirationSoon ? '#FEF3C7' : '#FAFAFA'}
                                        onMouseLeave={e => e.currentTarget.style.background = expirationSoon ? '#FFFBEB' : 'transparent'}>
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>{c.nom}</div>
                                            {c.telephone && <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>{c.telephone}</div>}
                                        </td>
                                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#374151' }}>{c.patron_email || '—'}</td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <select
                                                value={c.plan}
                                                onChange={e => planMutation.mutate({ id: c.id, plan: e.target.value })}
                                                style={{ padding: '4px 10px', borderRadius: 20, border: 'none', background: PLAN_BG[c.plan] || '#F1F5F9', color: PLAN_COLORS[c.plan] || '#64748B', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                                                <option value="SOLO">SOLO</option>
                                                <option value="CABINET">CABINET</option>
                                                <option value="AGENCE">AGENCE</option>
                                            </select>
                                        </td>
                                        <td style={{ padding: '12px 16px', fontSize: 12, color: '#64748B', whiteSpace: 'nowrap' }}>
                                            {fmtDate(c.date_creation)}
                                        </td>
                                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                                            {c.date_fin ? (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: expirationSoon ? '#D97706' : '#64748B' }}>
                                                    {expirationSoon && <AlertTriangle size={11} />}
                                                    {fmtDate(c.date_fin)}
                                                </span>
                                            ) : (
                                                <span style={{ fontSize: 12, color: '#CBD5E1' }}>—</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                            <span style={{ background: '#F1F5F9', color: '#475569', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{c.nb_utilisateurs}</span>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            {c.actif
                                                ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#ECFDF5', color: '#10B981', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}><CheckCircle2 size={11} /> Actif</span>
                                                : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#FEF2F2', color: '#EF4444', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}><XCircle size={11} /> Inactif</span>
                                            }
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button
                                                    onClick={() => { setProlongerModal(c); setMoisProlongation(1) }}
                                                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: '1px solid #E2E8F0', background: 'white', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#374151', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                                                    <Plus size={11} /> Prolonger
                                                </button>
                                                <button
                                                    onClick={() => toggleMutation.mutate(c.id)}
                                                    disabled={toggleMutation.isPending}
                                                    style={{ padding: '5px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: 'inherit', whiteSpace: 'nowrap', background: c.actif ? '#FEF2F2' : '#ECFDF5', color: c.actif ? '#EF4444' : '#10B981' }}>
                                                    {c.actif ? 'Désactiver' : 'Activer'}
                                                </button>
                                                <button
                                                    onClick={() => setMembresModal(c)}
                                                    style={{ padding: '5px 8px', borderRadius: 7, border: '1px solid #E2E8F0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#374151', fontFamily: 'inherit' }}>
                                                    <Users size={11} /> Membres
                                                </button>
                                                <button
                                                    onClick={() => { if (window.confirm(`Supprimer "${c.nom}" ?`)) deleteMutation.mutate(c.id) }}
                                                    disabled={deleteMutation.isPending}
                                                    style={{ padding: '5px 8px', borderRadius: 7, border: 'none', cursor: 'pointer', background: '#FEF2F2', color: '#EF4444', display: 'flex', alignItems: 'center' }}>
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
                )}

            </div>

            {/* MODAL MEMBRES */}
            {membresModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setMembresModal(null)}>
                    <div style={{ background: 'white', borderRadius: 16, padding: 28, width: 480, maxHeight: '80vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>Membres du cabinet</div>
                                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{membresModal.nom}</div>
                            </div>
                            <button onClick={() => setMembresModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={18} /></button>
                        </div>
                        {membresLoading ? (
                            <div style={{ textAlign: 'center', color: '#94A3B8', padding: 20 }}>Chargement...</div>
                        ) : membres.length === 0 ? (
                            <div style={{ textAlign: 'center', color: '#94A3B8', padding: 20 }}>Aucun membre</div>
                        ) : membres.map(m => (
                            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #F1F5F9' }}>
                                <div style={{ width: 36, height: 36, borderRadius: '50%', background: m.is_patron ? 'var(--indigo-soft)' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <UserCheck size={16} color={m.is_patron ? 'var(--indigo)' : '#94A3B8'} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{m.prenom} {m.nom}</div>
                                    <div style={{ fontSize: 12, color: '#64748B' }}>{m.email}</div>
                                </div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    {m.is_patron && <span style={{ fontSize: 10, background: 'var(--indigo-soft)', color: 'var(--indigo)', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>Patron</span>}
                                    <span style={{ fontSize: 10, background: m.is_active ? '#ECFDF5' : '#FEF2F2', color: m.is_active ? '#10B981' : '#EF4444', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>{m.is_active ? 'Actif' : 'Inactif'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* MODAL PROLONGER */}
            {prolongerModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setProlongerModal(null)}>
                    <div style={{ background: 'white', borderRadius: 16, padding: 28, width: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>Prolonger l'abonnement</div>
                                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{prolongerModal.nom}</div>
                            </div>
                            <button onClick={() => setProlongerModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={18} /></button>
                        </div>
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 8 }}>Durée de prolongation</label>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {[1, 3, 6, 12].map(m => (
                                    <button key={m} onClick={() => setMoisProlongation(m)}
                                        style={{ flex: 1, padding: '10px 4px', borderRadius: 8, border: `2px solid ${moisProlongation === m ? 'var(--indigo)' : '#E2E8F0'}`, background: moisProlongation === m ? 'var(--indigo-soft)' : 'white', color: moisProlongation === m ? 'var(--indigo)' : '#64748B', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                                        {m} mois
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '10px 14px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Calendar size={14} color="#64748B" />
                            <span style={{ fontSize: 12, color: '#374151' }}>
                                Expiration actuelle : <strong>{fmtDate(prolongerModal.date_fin)}</strong>
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setProlongerModal(null)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1.5px solid #E2E8F0', background: 'white', color: '#64748B', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
                            <button
                                disabled={prolongerMutation.isPending}
                                onClick={() => prolongerMutation.mutate({ id: prolongerModal.id, mois: moisProlongation })}
                                style={{ flex: 2, padding: '10px', borderRadius: 8, border: 'none', background: 'var(--grad)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: prolongerMutation.isPending ? 0.7 : 1 }}>
                                {prolongerMutation.isPending ? 'En cours...' : `Prolonger de ${moisProlongation} mois`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function StatCard({ icon, bg, label, value, sub, small }) {
    return (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: '18px 20px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {icon}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6, paddingRight: 44 }}>{label}</div>
            <div style={{ fontSize: small ? 17 : 26, fontWeight: 800, color: '#0F172A', letterSpacing: -0.5, marginBottom: 3, lineHeight: 1.1 }}>{value}</div>
            <div style={{ fontSize: 11, color: '#94A3B8' }}>{sub}</div>
        </div>
    )
}

function Select({ value, onChange, options }) {
    return (
        <select value={value} onChange={e => onChange(e.target.value)}
            style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 13, fontFamily: 'Plus Jakarta Sans, sans-serif', outline: 'none', cursor: 'pointer', background: 'white', color: '#374151' }}>
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
    )
}
