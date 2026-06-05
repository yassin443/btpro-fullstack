import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Users, TrendingUp, TrendingDown, Wallet, DollarSign,
    Save, Trash2, Check, ChevronLeft, ChevronRight,
    Clock, Briefcase, AlertCircle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import useToast from '../../store/useToast'
import ConfirmModal from '../../components/ConfirmModal'
import useStore from '../../store/useStore'

const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

function fmtDA(n) {
    return Number(n || 0).toLocaleString('fr-DZ') + ' DA'
}

function StatCard({ label, value, icon: Icon, color, bg }) {
    return (
        <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--line)', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={20} color={color} />
            </div>
            <div>
                <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500, marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.5px' }}>{fmtDA(value)}</div>
            </div>
        </div>
    )
}

export default function Paie() {
    const user = useStore(s => s.user)
    const isPatron = user?.is_patron === true
    const qc = useQueryClient()
    const { toast } = useToast()
    const navigate = useNavigate()
    const [confirmDel, setConfirmDel] = useState(null)
    const [editingConfig, setEditingConfig] = useState({}) // { [membreId]: { type_paie, taux } }
    const [savingId, setSavingId] = useState(null)

    const now = new Date()
    const [mois, setMois] = useState(now.getMonth() + 1)
    const [annee, setAnnee] = useState(now.getFullYear())

    const naviguerMois = (delta) => {
        let m = mois + delta
        let a = annee
        if (m > 12) { m = 1; a++ }
        if (m < 1)  { m = 12; a-- }
        setMois(m); setAnnee(a)
    }

    const { data: resume = {} } = useQuery({
        queryKey: ['paie-resume'],
        queryFn: () => api.get('/finances/paie/resume/').then(r => r.data),
    })

    const { data: abo } = useQuery({
        queryKey: ['abonnement'],
        queryFn: () => api.get('/cabinets/abonnement/').then(r => r.data),
        staleTime: 5 * 60 * 1000,
        retry: false,
    })

    const { data: membres = [] } = useQuery({
        queryKey: ['paie-membres', mois, annee],
        queryFn: () => api.get('/finances/paie/membres/', { params: { mois, annee } }).then(r => r.data),
    })

    const { data: fiches = [] } = useQuery({
        queryKey: ['paie-fiches'],
        queryFn: () => api.get('/finances/paie/fiches/').then(r => r.data),
    })

    // Initialise les configs locales depuis l'API
    useEffect(() => {
        if (membres.length > 0) {
            setEditingConfig(prev => {
                const next = { ...prev }
                membres.forEach(m => {
                    if (!next[m.id]) next[m.id] = { type_paie: m.type_paie, taux: m.taux }
                })
                return next
            })
        }
    }, [membres])

    const saveConfigMut = useMutation({
        mutationFn: ({ id, data }) => api.put(`/finances/paie/config/${id}/`, data),
        onSuccess: (_, { id }) => {
            qc.invalidateQueries({ queryKey: ['paie-membres'] })
            qc.invalidateQueries({ queryKey: ['paie-resume'] })
            setSavingId(null)
            toast('Configuration enregistrée')
        },
        onError: () => { setSavingId(null); toast('Erreur lors de la sauvegarde', 'error') },
    })

    const genererMut = useMutation({
        mutationFn: (payload) => api.post('/finances/paie/fiches/', payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['paie-fiches'] })
            qc.invalidateQueries({ queryKey: ['paie-resume'] })
            toast('Bulletin généré')
        },
        onError: (err) => toast(err.response?.data?.error ?? 'Erreur', 'error'),
    })

    const deleteMut = useMutation({
        mutationFn: (id) => api.delete(`/finances/paie/fiches/${id}/`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['paie-fiches'] })
            qc.invalidateQueries({ queryKey: ['paie-resume'] })
            toast('Bulletin supprimé', 'info')
        },
    })

    const cfg = (id) => editingConfig[id] || {}
    const setCfg = (id, key, val) => setEditingConfig(s => ({ ...s, [id]: { ...(s[id] || {}), [key]: val } }))

    const isSolo = abo?.plan === 'SOLO'
    const autresmembres = membres.filter(m => !m.is_patron)
    const fichesDuMois = fiches.filter(f => f.periode_mois === mois && f.periode_annee === annee)
    const payesIds = new Set(fichesDuMois.map(f => f.membre_id))

    const isCurrentMonth = mois === now.getMonth() + 1 && annee === now.getFullYear()
    const isEndOfMonth = now.getDate() >= 25

    const genererPourMembre = async (m) => {
        const c = cfg(m.id)
        const type = c.type_paie || 'MENSUEL'
        const taux = parseFloat(c.taux || 0)
        if (!taux) { toast('Configurez le taux avant de générer', 'error'); return }
        if (type === 'JOURNALIER' && m.heures_mois === 0) { toast('Aucune feuille de temps ce mois', 'error'); return }
        await genererMut.mutateAsync({ membre_id: m.id, periode_mois: mois, periode_annee: annee, type_paie: type, taux, nb_jours: 0 })
    }

    const genererTout = async () => {
        const aGenerer = autresmembres.filter(m => !payesIds.has(m.id))
        let ok = 0
        for (const m of aGenerer) {
            const c = cfg(m.id)
            const type = c.type_paie || 'MENSUEL'
            const taux = parseFloat(c.taux || 0)
            if (!taux) continue
            if (type === 'JOURNALIER' && m.heures_mois === 0) continue
            try {
                await genererMut.mutateAsync({ membre_id: m.id, periode_mois: mois, periode_annee: annee, type_paie: type, taux, nb_jours: 0 })
                ok++
            } catch {}
        }
        if (ok > 0) toast(`${ok} bulletin(s) généré(s)`)
        else toast('Aucun nouveau bulletin à générer', 'info')
    }

    return (
        <Layout>
            <div className="page">
                <div className="page-head">
                    <div>
                        <h1 className="page-title">Rémunération</h1>
                        <div className="page-sub">Gérez les salaires et visualisez le bénéfice net du cabinet</div>
                    </div>
                </div>

                {/* Stats */}
                <div className="stats stats-4">
                    <StatCard label="Revenus encaissés"  value={resume.revenus}         icon={TrendingUp}  color="#10B981" bg="#ECFDF5" />
                    <StatCard label="Charges cabinet"    value={resume.autres_charges}  icon={TrendingDown} color="#EF4444" bg="#FEF2F2" />
                    <StatCard label="Masse salariale"    value={resume.salaires}        icon={Users}       color="#F59E0B" bg="#FFFBEB" />
                    <StatCard label="Bénéfice net"       value={resume.benefice}        icon={Wallet}
                        color={resume.benefice >= 0 ? 'var(--indigo)' : '#EF4444'}
                        bg={resume.benefice >= 0 ? 'var(--indigo-soft)' : '#FEF2F2'} />
                </div>

                {isSolo ? (
                    <div className="empty-state">
                        <div className="empty-icon" style={{ background: 'var(--indigo-soft)' }}><Users size={24} color="var(--indigo)" /></div>
                        <div className="empty-title">Vous gérez seul votre cabinet</div>
                        <div className="empty-sub">Le module de paie est disponible à partir du plan Cabinet.</div>
                    </div>
                ) : (
                    <>
                        {/* ── Sélecteur de période ── */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--line)', padding: '4px' }}>
                                <button onClick={() => naviguerMois(-1)} style={{ width: 34, height: 34, borderRadius: 9, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
                                    <ChevronLeft size={16} />
                                </button>
                                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', minWidth: 140, textAlign: 'center', padding: '0 8px' }}>
                                    {MOIS[mois - 1]} {annee}
                                </div>
                                <button onClick={() => naviguerMois(1)} style={{ width: 34, height: 34, borderRadius: 9, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                            {isPatron && autresmembres.some(m => !payesIds.has(m.id)) && (
                                <button className="btn accent" onClick={genererTout} disabled={genererMut.isPending}>
                                    <DollarSign size={14} /> Générer tous les bulletins
                                </button>
                            )}
                        </div>

                        {/* Avertissement fin de mois */}
                        {isCurrentMonth && !isEndOfMonth && autresmembres.some(m => (cfg(m.id).type_paie || 'MENSUEL') === 'JOURNALIER' && !payesIds.has(m.id)) && (
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'var(--amber-soft)', border: '1px solid #FCD34D', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#92400E' }}>
                                <AlertCircle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
                                Le mois n'est pas terminé (jour {now.getDate()}). Les journaliers pourraient encore travailler avant la fin du mois.
                            </div>
                        )}

                        {/* ── Cartes membres ── */}
                        {autresmembres.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon" style={{ background: 'var(--indigo-soft)' }}><Users size={24} color="var(--indigo)" /></div>
                                <div className="empty-title">Aucun membre</div>
                                <div className="empty-sub">Invitez des collaborateurs depuis les Paramètres → Équipe & rôles.</div>
                                <button className="btn accent" onClick={() => navigate('/settings')}>Aller aux paramètres</button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                                {autresmembres.map(m => {
                                    const c = cfg(m.id)
                                    const type = c.type_paie || 'MENSUEL'
                                    const taux = parseFloat(c.taux || 0)
                                    const paye = payesIds.has(m.id)
                                    const ficheExistante = fichesDuMois.find(f => f.membre_id === m.id)
                                    const montantJour = type === 'JOURNALIER' ? m.montant_calcule : taux
                                    const configChanged = m.type_paie !== c.type_paie || parseFloat(m.taux) !== parseFloat(c.taux || 0)

                                    return (
                                        <div key={m.id} style={{
                                            background: 'var(--surface)', borderRadius: 16,
                                            border: `1px solid ${paye ? 'var(--green-soft)' : 'var(--line)'}`,
                                            overflow: 'hidden',
                                        }}>
                                            {/* Barre de couleur gauche */}
                                            <div style={{ display: 'flex', alignItems: 'stretch' }}>
                                                <div style={{ width: 4, background: paye ? 'var(--green)' : type === 'MENSUEL' ? 'var(--indigo)' : 'var(--amber)', flexShrink: 0 }} />

                                                <div style={{ flex: 1, padding: '16px 20px' }}>
                                                    {/* En-tête membre */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                                                        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--indigo-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--indigo)', flexShrink: 0 }}>
                                                            {m.prenom[0]}{m.nom[0]}
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{m.prenom} {m.nom}</div>
                                                            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
                                                                {type === 'MENSUEL' ? 'Salaire mensuel fixe' : 'Taux journalier'}
                                                            </div>
                                                        </div>
                                                        {paye ? (
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: 'var(--green)', background: 'var(--green-soft)', borderRadius: 20, padding: '4px 12px', border: '1px solid rgba(22,163,74,0.2)' }}>
                                                                <Check size={12} /> Payé — {fmtDA(ficheExistante?.montant)}
                                                            </span>
                                                        ) : (
                                                            <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.5px' }}>
                                                                {taux > 0 ? fmtDA(type === 'MENSUEL' ? taux : montantJour) : <span style={{ fontSize: 13, color: 'var(--red)', fontWeight: 600 }}>Taux manquant</span>}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Détail JOURNALIER */}
                                                    {!paye && type === 'JOURNALIER' && (
                                                        <div style={{ marginBottom: 14, padding: '10px 14px', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--line)' }}>
                                                            {m.heures_mois > 0 ? (
                                                                <>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: m.projets_mois?.length ? 8 : 0 }}>
                                                                        <Clock size={13} color="var(--amber)" />
                                                                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--mono)' }}>
                                                                            {Number(taux).toLocaleString('fr-DZ')} DA × {m.heures_mois}h
                                                                        </span>
                                                                        <span style={{ marginLeft: 'auto', fontSize: 15, fontWeight: 800, color: 'var(--amber)', fontFamily: 'var(--mono)' }}>= {fmtDA(montantJour)}</span>
                                                                    </div>
                                                                    {m.projets_mois?.length > 0 && (
                                                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                                            {m.projets_mois.map(p => (
                                                                                <span key={p.nom} style={{ fontSize: 10, background: 'var(--amber-soft)', color: '#92400E', borderRadius: 20, padding: '2px 9px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                                    <Briefcase size={9} /> {p.nom} · {p.heures}h
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted)', fontSize: 12 }}>
                                                                    <Clock size={13} />
                                                                    Aucune feuille de temps ce mois —
                                                                    <button onClick={() => navigate('/temps')} style={{ background: 'none', border: 'none', color: 'var(--indigo)', fontWeight: 700, cursor: 'pointer', fontSize: 12, padding: 0, fontFamily: 'inherit' }}>
                                                                        Ajouter
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Config inline */}
                                                    {isPatron && !paye && (
                                                        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                                            <div style={{ display: 'flex', borderRadius: 9, border: '1px solid var(--line)', overflow: 'hidden', background: 'var(--bg)' }}>
                                                                {[
                                                                    { key: 'MENSUEL', label: 'Fixe' },
                                                                    { key: 'JOURNALIER', label: 'Journalier' },
                                                                ].map(opt => (
                                                                    <button key={opt.key} onClick={() => setCfg(m.id, 'type_paie', opt.key)}
                                                                        style={{ padding: '6px 14px', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                                                                            background: type === opt.key ? 'var(--indigo)' : 'transparent',
                                                                            color: type === opt.key ? '#fff' : 'var(--muted)',
                                                                        }}>
                                                                        {opt.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                            <input
                                                                type="number"
                                                                value={c.taux || ''}
                                                                onChange={e => setCfg(m.id, 'taux', e.target.value)}
                                                                placeholder={type === 'JOURNALIER' ? 'Ex: 3 500 DA/j' : 'Ex: 80 000 DA/mois'}
                                                                style={{ width: 180, padding: '6px 12px', borderRadius: 9, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--ink)', fontSize: 12, fontFamily: 'inherit' }}
                                                            />
                                                            {configChanged && (
                                                                <button
                                                                    onClick={() => { setSavingId(m.id); saveConfigMut.mutate({ id: m.id, data: { type_paie: type, taux: c.taux || 0 } }) }}
                                                                    disabled={saveConfigMut.isPending && savingId === m.id}
                                                                    style={{ padding: '6px 14px', borderRadius: 9, border: 'none', background: 'var(--indigo)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit' }}>
                                                                    <Save size={12} /> Sauvegarder
                                                                </button>
                                                            )}
                                                            <div style={{ marginLeft: 'auto' }}>
                                                                {taux > 0 && (type === 'MENSUEL' || m.heures_mois > 0) && (
                                                                    <button
                                                                        onClick={() => genererPourMembre(m)}
                                                                        disabled={genererMut.isPending}
                                                                        style={{ padding: '7px 18px', borderRadius: 9, border: 'none', background: 'var(--grad)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', boxShadow: '0 3px 10px rgba(17,0,255,0.2)' }}>
                                                                        <DollarSign size={13} /> Générer le bulletin
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* ── Historique ── */}
                        {fiches.length > 0 && (
                            <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--line)', overflow: 'hidden' }}>
                                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)' }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Historique des bulletins</div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    {fiches.map((f, i) => (
                                        <div key={f.id} style={{ display: 'flex', flexDirection: 'column', borderBottom: i < fiches.length - 1 ? '1px solid var(--line)' : 'none' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', gap: 12 }}>
                                                <div style={{ width: 36, height: 36, borderRadius: 10, background: f.type_paie === 'MENSUEL' ? 'var(--indigo-soft)' : 'var(--amber-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    {f.type_paie === 'MENSUEL'
                                                        ? <Wallet size={16} color="var(--indigo)" />
                                                        : <Clock size={16} color="#B45309" />}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{f.membre_nom}</div>
                                                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
                                                        {MOIS[f.periode_mois - 1]} {f.periode_annee} · {f.type_paie === 'MENSUEL' ? 'Fixe' : 'Journalier'}
                                                        {f.type_paie === 'JOURNALIER' && f.nb_jours > 0 && ` · ${f.nb_jours}h`}
                                                    </div>
                                                </div>
                                                {f.projets?.length > 0 && (
                                                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                                                        {f.projets.map(p => (
                                                            <span key={p.nom} style={{ fontSize: 10, background: 'var(--bg)', color: 'var(--muted)', borderRadius: 20, padding: '2px 8px', border: '1px solid var(--line)', fontWeight: 500 }}>
                                                                {p.nom} · {p.heures}h
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)', marginLeft: 'auto', flexShrink: 0 }}>{fmtDA(f.montant)}</div>
                                                {isPatron && (
                                                    <button onClick={() => setConfirmDel({ id: f.id })}
                                                        style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--line)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', flexShrink: 0 }}
                                                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-soft)'; e.currentTarget.style.color = 'var(--red)' }}
                                                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)' }}>
                                                        <Trash2 size={13} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <ConfirmModal
                open={!!confirmDel}
                title="Supprimer ce bulletin ?"
                message="La charge de salaire associée sera également supprimée."
                onConfirm={() => { deleteMut.mutate(confirmDel.id); setConfirmDel(null) }}
                onCancel={() => setConfirmDel(null)}
            />
        </Layout>
    )
}
