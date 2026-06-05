import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ClipboardList, Plus, X, Pencil, Trash2, Calendar, MapPin, Users, ChevronDown, ChevronUp } from 'lucide-react'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import ConfirmModal from '../../components/ConfirmModal'

const EMPTY = {
    projet: '', titre: '', date: '', lieu: '', animateur: '',
    participants: '', ordre_du_jour: '', decisions: '', observations: '',
}

export default function Reunions() {
    const queryClient = useQueryClient()
    const [projetId, setProjetId] = useState('')
    const [open, setOpen] = useState(false)
    const [editItem, setEditItem] = useState(null)
    const [form, setForm] = useState(EMPTY)
    const [expanded, setExpanded] = useState(null)
    const [confirmDeleteId, setConfirmDeleteId] = useState(null)

    const { data: projets = [] } = useQuery({ queryKey: ['projets'], queryFn: () => api.get('/projets/').then(r => r.data) })
    const { data: reunions = [], isLoading } = useQuery({
        queryKey: ['reunions', projetId],
        queryFn: () => api.get(`/projets/reunions/${projetId ? `?projet=${projetId}` : ''}`).then(r => r.data)
    })

    const upd = (k, v) => setForm(f => ({ ...f, [k]: v }))

    const createM = useMutation({
        mutationFn: (data) => api.post('/projets/reunions/', data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['reunions'] }); setOpen(false); setForm(EMPTY) }
    })
    const editM = useMutation({
        mutationFn: ({ id, data }) => api.put(`/projets/reunions/${id}/`, data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['reunions'] }); setOpen(false); setEditItem(null); setForm(EMPTY) }
    })
    const deleteM = useMutation({
        mutationFn: (id) => api.delete(`/projets/reunions/${id}/`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reunions'] })
    })

    const openEdit = (item) => {
        setEditItem(item)
        setForm({
            projet: item.projet, titre: item.titre, date: item.date,
            lieu: item.lieu || '', animateur: item.animateur || '',
            participants: item.participants || '', ordre_du_jour: item.ordre_du_jour || '',
            decisions: item.decisions || '', observations: item.observations || '',
        })
        setOpen(true)
    }

    const submit = () => {
        if (editItem) editM.mutate({ id: editItem.id, data: form })
        else createM.mutate(form)
    }

    return (
        <Layout>
            <div className="page">
                <div className="page-head">
                    <div>
                        <h1 className="page-title">Comptes rendus de réunion</h1>
                        <div className="page-sub">Ordre du jour, décisions et participants</div>
                    </div>
                    <div className="page-head-actions">
                        <button className="btn accent" onClick={() => { setEditItem(null); setForm({ ...EMPTY, projet: projetId }); setOpen(true) }}>
                            <Plus size={15} /> Nouveau CR
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

                {isLoading ? (
                    <div className="text-center color-slate" style={{ padding: 60 }}>Chargement...</div>
                ) : reunions.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon" style={{ background: 'var(--indigo-soft)' }}><ClipboardList size={24} color="var(--indigo)" /></div>
                        <div className="empty-title">Aucun compte rendu</div>
                        <div className="empty-sub">Créez votre premier compte rendu de réunion</div>
                        <button className="btn accent" onClick={() => { setEditItem(null); setForm({ ...EMPTY, projet: projetId }); setOpen(true) }}><Plus size={14} /> Nouveau CR</button>
                    </div>
                ) : (
                    <div className="flex-col gap-10">
                        {reunions.map(cr => {
                            const isExp = expanded === cr.id
                            return (
                                <div key={cr.id} style={{ background: 'white', borderRadius: 14, border: '1.5px solid #F1F5F9', boxShadow: '0 1px 4px rgba(15,23,42,0.04)', overflow: 'hidden' }}>
                                    <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => setExpanded(isExp ? null : cr.id)}>
                                        <div style={{ width: 44, height: 44, borderRadius: 11, background: 'var(--indigo-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <ClipboardList size={18} color="var(--indigo)" />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 3 }}>{cr.titre}</div>
                                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                                <span className="flex-center gap-4 fs-12 color-slate"><Calendar size={11} /> {cr.date}</span>
                                                {cr.lieu && <span className="flex-center gap-4 fs-12 color-slate"><MapPin size={11} /> {cr.lieu}</span>}
                                                {cr.animateur && <span className="flex-center gap-4 fs-12 color-slate"><Users size={11} /> {cr.animateur}</span>}
                                                <span className="tag indigo" style={{ fontSize: 10 }}>{cr.projet_nom}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <button onClick={e => { e.stopPropagation(); openEdit(cr) }} style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid #E2E8F0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }} onMouseEnter={e => { e.currentTarget.style.color = '#0F172A'; e.currentTarget.style.background = '#F8FAFC' }} onMouseLeave={e => { e.currentTarget.style.color = '#64748B'; e.currentTarget.style.background = 'white' }}><Pencil size={13} /></button>
                                            <button onClick={e => { e.stopPropagation(); setConfirmDeleteId(cr.id) }} style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid var(--line)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-2)' }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-soft)'; e.currentTarget.style.color = 'var(--red)' }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted-2)' }}><Trash2 size={13} /></button>
                                            {isExp ? <ChevronUp size={16} color="#94A3B8" /> : <ChevronDown size={16} color="#94A3B8" />}
                                        </div>
                                    </div>
                                    {isExp && (
                                        <div style={{ borderTop: '1px solid #F1F5F9', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                                            {cr.participants && (
                                                <div>
                                                    <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Participants</div>
                                                    <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{cr.participants}</div>
                                                </div>
                                            )}
                                            {cr.ordre_du_jour && (
                                                <div>
                                                    <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Ordre du jour</div>
                                                    <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{cr.ordre_du_jour}</div>
                                                </div>
                                            )}
                                            {cr.decisions && (
                                                <div style={{ background: '#F0FDF4', borderRadius: 10, padding: '12px 14px', border: '1px solid #BBF7D0' }}>
                                                    <div style={{ fontSize: 11, fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Décisions</div>
                                                    <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{cr.decisions}</div>
                                                </div>
                                            )}
                                            {cr.observations && (
                                                <div>
                                                    <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Observations</div>
                                                    <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{cr.observations}</div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {open && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 200, backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => { setOpen(false); setEditItem(null) }}>
                    <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 600, boxShadow: '0 24px 80px rgba(0,0,0,0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '94vh' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '22px 26px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--indigo-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ClipboardList size={20} color="var(--indigo)" /></div>
                                <div>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>{editItem ? 'Modifier le CR' : 'Nouveau compte rendu'}</div>
                                    <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 1 }}>Réunion de chantier ou de coordination</div>
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
                                <div className="field"><label>Date *</label><input type="date" value={form.date} onChange={e => upd('date', e.target.value)} /></div>
                            </div>
                            <div className="field"><label>Titre *</label><input value={form.titre} onChange={e => upd('titre', e.target.value)} placeholder="Ex: Réunion de chantier #12" /></div>
                            <div className="grid-2">
                                <div className="field"><label>Lieu</label><input value={form.lieu} onChange={e => upd('lieu', e.target.value)} placeholder="Ex: Bureau d'études, chantier…" /></div>
                                <div className="field"><label>Animateur</label><input value={form.animateur} onChange={e => upd('animateur', e.target.value)} placeholder="Nom de l'animateur" /></div>
                            </div>
                            <div className="field"><label>Participants</label><textarea rows={2} value={form.participants} onChange={e => upd('participants', e.target.value)} placeholder="Noms et fonctions des participants" style={{ resize: 'vertical' }} /></div>
                            <div className="field"><label>Ordre du jour</label><textarea rows={3} value={form.ordre_du_jour} onChange={e => upd('ordre_du_jour', e.target.value)} placeholder="Points abordés…" style={{ resize: 'vertical' }} /></div>
                            <div className="field"><label>Décisions</label><textarea rows={3} value={form.decisions} onChange={e => upd('decisions', e.target.value)} placeholder="Décisions prises, actions à mener…" style={{ resize: 'vertical' }} /></div>
                            <div className="field" style={{ marginBottom: 0 }}><label>Observations</label><textarea rows={2} value={form.observations} onChange={e => upd('observations', e.target.value)} style={{ resize: 'vertical' }} /></div>
                        </div>
                        <div style={{ padding: '14px 26px 22px', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 10, flexShrink: 0 }}>
                            <button onClick={() => { setOpen(false); setEditItem(null) }} style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: 'white', fontSize: 13, fontWeight: 600, color: '#64748B', cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
                            <button disabled={!form.projet || !form.titre || !form.date || createM.isPending || editM.isPending} onClick={submit} style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: 'var(--grad)', color: 'white', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {editItem ? 'Enregistrer' : 'Créer le compte rendu'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <ConfirmModal
                open={confirmDeleteId !== null}
                title="Supprimer ce compte rendu ?"
                message="Cette action est irréversible."
                onConfirm={() => deleteM.mutate(confirmDeleteId)}
                onCancel={() => setConfirmDeleteId(null)}
            />
        </Layout>
    )
}
