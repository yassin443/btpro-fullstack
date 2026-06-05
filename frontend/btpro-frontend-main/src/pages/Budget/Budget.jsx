import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PiggyBank, Plus, X, Pencil, Trash2, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import ConfirmModal from '../../components/ConfirmModal'

const CAT_CONFIG = {
    HONORAIRES:    { label: 'Honoraires',          color: 'var(--indigo)', bg: 'var(--indigo-soft)' },
    ETUDES:        { label: 'Études techniques',   color: '#8B5CF6', bg: '#F5F3FF' },
    TRAVAUX:       { label: 'Travaux',              color: '#F59E0B', bg: '#FFFBEB' },
    ADMINISTRATION:{ label: 'Frais administratifs',color: '#0EA5E9', bg: '#F0F9FF' },
    DIVERS:        { label: 'Divers',               color: '#64748B', bg: '#F8FAFC' },
}

const EMPTY = { projet: '', categorie: 'HONORAIRES', libelle: '', montant_prevu: '', montant_reel: '' }

export default function Budget() {
    const queryClient = useQueryClient()
    const [projetId, setProjetId] = useState('')
    const [open, setOpen] = useState(false)
    const [editItem, setEditItem] = useState(null)
    const [form, setForm] = useState(EMPTY)
    const [confirmDeleteId, setConfirmDeleteId] = useState(null)

    const { data: projets = [] } = useQuery({ queryKey: ['projets'], queryFn: () => api.get('/projets/').then(r => r.data) })
    const { data: postes = [], isLoading } = useQuery({
        queryKey: ['budget', projetId],
        queryFn: () => api.get(`/projets/budget/${projetId ? `?projet=${projetId}` : ''}`).then(r => r.data)
    })

    const upd = (k, v) => setForm(f => ({ ...f, [k]: v }))

    const createM = useMutation({
        mutationFn: (data) => api.post('/projets/budget/', data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['budget'] }); setOpen(false); setForm(EMPTY) }
    })
    const editM = useMutation({
        mutationFn: ({ id, data }) => api.put(`/projets/budget/${id}/`, data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['budget'] }); setOpen(false); setEditItem(null); setForm(EMPTY) }
    })
    const deleteM = useMutation({
        mutationFn: (id) => api.delete(`/projets/budget/${id}/`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budget'] })
    })

    const openEdit = (item) => {
        setEditItem(item)
        setForm({ projet: item.projet, categorie: item.categorie, libelle: item.libelle, montant_prevu: item.montant_prevu, montant_reel: item.montant_reel })
        setOpen(true)
    }

    const submit = () => {
        const payload = { ...form, montant_prevu: form.montant_prevu || 0, montant_reel: form.montant_reel || 0 }
        if (!payload.projet) payload.projet = projetId || undefined
        if (editItem) editM.mutate({ id: editItem.id, data: payload })
        else createM.mutate(payload)
    }

    const totalPrevu = postes.reduce((s, p) => s + Number(p.montant_prevu), 0)
    const totalReel  = postes.reduce((s, p) => s + Number(p.montant_reel), 0)
    const ecartTotal = totalReel - totalPrevu

    const byCategorie = postes.reduce((acc, p) => {
        acc[p.categorie] = acc[p.categorie] || []
        acc[p.categorie].push(p)
        return acc
    }, {})

    return (
        <Layout>
            <div className="page">
                <div className="page-head">
                    <div>
                        <h1 className="page-title">Budget prévisionnel</h1>
                        <div className="page-sub">Budget prévu vs dépenses réelles par projet</div>
                    </div>
                    <div className="page-head-actions">
                        <button className="btn accent" onClick={() => { setEditItem(null); setForm({ ...EMPTY, projet: projetId }); setOpen(true) }}>
                            <Plus size={15} /> Nouveau poste
                        </button>
                    </div>
                </div>

                <div className="card mb-20">
                    <div className="card-body">
                        <div className="field" style={{ marginBottom: 0 }}>
                            <label>Filtrer par projet <span style={{ fontWeight: 400, color: '#94A3B8' }}>(optionnel)</span></label>
                            <select value={projetId} onChange={e => setProjetId(e.target.value)}>
                                <option value="">Tous les projets</option>
                                {projets.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {postes.length > 0 && (
                    <div className="stats stats-3" style={{ marginBottom: 20 }}>
                        <div className="stat">
                            <div className="stat-icon" style={{ background: 'var(--indigo-soft)' }}><PiggyBank size={18} color="var(--indigo)" /></div>
                            <div className="stat-label">Total prévu</div>
                            <div className="stat-val">{totalPrevu.toLocaleString()} DA</div>
                        </div>
                        <div className="stat">
                            <div className="stat-icon" style={{ background: '#F0F9FF' }}><TrendingUp size={18} color="#0EA5E9" /></div>
                            <div className="stat-label">Total réel</div>
                            <div className="stat-val">{totalReel.toLocaleString()} DA</div>
                        </div>
                        <div className="stat">
                            <div className="stat-icon" style={{ background: ecartTotal > 0 ? '#FEF2F2' : '#ECFDF5' }}>
                                {ecartTotal > 0 ? <TrendingUp size={18} color="#EF4444" /> : ecartTotal < 0 ? <TrendingDown size={18} color="#10B981" /> : <Minus size={18} color="#64748B" />}
                            </div>
                            <div className="stat-label">Écart</div>
                            <div className="stat-val" style={{ color: ecartTotal > 0 ? '#EF4444' : ecartTotal < 0 ? '#10B981' : '#64748B' }}>
                                {ecartTotal > 0 ? '+' : ''}{ecartTotal.toLocaleString()} DA
                            </div>
                        </div>
                    </div>
                )}

                {isLoading ? (
                    <div className="text-center color-slate" style={{ padding: 60 }}>Chargement...</div>
                ) : postes.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon" style={{ background: 'var(--indigo-soft)' }}><PiggyBank size={24} color="var(--indigo)" /></div>
                        <div className="empty-title">Aucun poste budgétaire</div>
                        <div className="empty-sub">Définissez vos postes de dépense prévus et suivez les réels</div>
                        <button className="btn accent" onClick={() => { setEditItem(null); setForm({ ...EMPTY, projet: projetId }); setOpen(true) }}><Plus size={14} /> Nouveau poste</button>
                    </div>
                ) : (
                    <div className="flex-col gap-16">
                        {Object.entries(byCategorie).map(([cat, items]) => {
                            const cc = CAT_CONFIG[cat] || CAT_CONFIG.DIVERS
                            const catPrevu = items.reduce((s, i) => s + Number(i.montant_prevu), 0)
                            const catReel  = items.reduce((s, i) => s + Number(i.montant_reel), 0)
                            const catEcart = catReel - catPrevu
                            return (
                                <div key={cat}>
                                    <div className="flex-between mb-10">
                                        <span style={{ fontSize: 13, fontWeight: 800, padding: '4px 12px', borderRadius: 20, background: cc.bg, color: cc.color }}>{cc.label}</span>
                                        <div className="flex-center gap-14">
                                            <span className="fs-12 color-slate">Prévu: <span className="fw-700" style={{ color: '#0F172A' }}>{catPrevu.toLocaleString()} DA</span></span>
                                            <span className="fs-12 color-slate">Réel: <span className="fw-700" style={{ color: '#0F172A' }}>{catReel.toLocaleString()} DA</span></span>
                                            <span className="fs-12 fw-700" style={{ color: catEcart > 0 ? '#EF4444' : '#10B981' }}>{catEcart > 0 ? '+' : ''}{catEcart.toLocaleString()} DA</span>
                                        </div>
                                    </div>
                                    <div className="card" style={{ overflow: 'hidden' }}>
                                        <table>
                                            <thead><tr><th>Libellé</th>{!projetId && <th>Projet</th>}<th>Prévu</th><th>Réel</th><th>Écart</th><th></th></tr></thead>
                                            <tbody>
                                                {items.map(item => {
                                                    const ecart = Number(item.montant_reel) - Number(item.montant_prevu)
                                                    return (
                                                        <tr key={item.id}>
                                                            <td className="fw-700">{item.libelle}</td>
                                                            {!projetId && <td className="color-slate">{item.projet_nom}</td>}
                                                            <td className="fw-700">{Number(item.montant_prevu).toLocaleString()} DA</td>
                                                            <td className="fw-700">{Number(item.montant_reel).toLocaleString()} DA</td>
                                                            <td className="fw-700" style={{ color: ecart > 0 ? '#EF4444' : ecart < 0 ? '#10B981' : '#64748B' }}>
                                                                {ecart > 0 ? '+' : ''}{ecart.toLocaleString()} DA
                                                            </td>
                                                            <td>
                                                                <div className="flex-center gap-6">
                                                                    <button onClick={() => openEdit(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 4 }} onMouseEnter={e => e.currentTarget.style.color = '#0F172A'} onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}><Pencil size={13} /></button>
                                                                    <button onClick={() => setConfirmDeleteId(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-2)', padding: 4 }} onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--muted-2)'}><Trash2 size={13} /></button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {open && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 200, backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => { setOpen(false); setEditItem(null) }}>
                    <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 500, boxShadow: '0 24px 80px rgba(0,0,0,0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '22px 26px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--indigo-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PiggyBank size={20} color="var(--indigo)" /></div>
                                <div>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>{editItem ? 'Modifier le poste' : 'Nouveau poste budgétaire'}</div>
                                    <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 1 }}>Définissez le prévu et le réel</div>
                                </div>
                            </div>
                            <button onClick={() => { setOpen(false); setEditItem(null) }} style={{ width: 34, height: 34, borderRadius: 9, background: '#F8FAFC', border: '1px solid #E2E8F0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}><X size={15} /></button>
                        </div>
                        <div style={{ padding: '20px 26px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                            <div className="grid-2">
                                <div className="field">
                                    <label>Projet *</label>
                                    <select value={form.projet} onChange={e => upd('projet', e.target.value)}>
                                        <option value="">Sélectionner</option>
                                        {projets.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                                    </select>
                                </div>
                                <div className="field">
                                    <label>Catégorie</label>
                                    <select value={form.categorie} onChange={e => upd('categorie', e.target.value)}>
                                        {Object.entries(CAT_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="field"><label>Libellé *</label><input value={form.libelle} onChange={e => upd('libelle', e.target.value)} placeholder="Ex: Honoraires architecte, BET Structure…" /></div>
                            <div className="grid-2">
                                <div className="field"><label>Montant prévu (DA)</label><input type="number" value={form.montant_prevu} onChange={e => upd('montant_prevu', e.target.value)} placeholder="0" /></div>
                                <div className="field" style={{ marginBottom: 0 }}><label>Montant réel (DA)</label><input type="number" value={form.montant_reel} onChange={e => upd('montant_reel', e.target.value)} placeholder="0" /></div>
                            </div>
                        </div>
                        <div style={{ padding: '14px 26px 22px', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 10, flexShrink: 0 }}>
                            <button onClick={() => { setOpen(false); setEditItem(null) }} style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: 'white', fontSize: 13, fontWeight: 600, color: '#64748B', cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
                            <button disabled={!form.projet || !form.libelle || createM.isPending || editM.isPending} onClick={submit} style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: 'var(--grad)', color: 'white', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {editItem ? 'Enregistrer' : 'Créer le poste'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <ConfirmModal
                open={confirmDeleteId !== null}
                title="Supprimer ce poste ?"
                message="Cette action est irréversible."
                onConfirm={() => deleteM.mutate(confirmDeleteId)}
                onCancel={() => setConfirmDeleteId(null)}
            />
        </Layout>
    )
}
