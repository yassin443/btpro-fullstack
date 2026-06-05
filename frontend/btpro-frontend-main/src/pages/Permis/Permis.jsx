import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ScrollText, Plus, X, Pencil, Trash2, CheckCircle, Clock, AlertCircle, Archive } from 'lucide-react'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import ConfirmModal from '../../components/ConfirmModal'

const WILAYAS = [
    '01 - Adrar','02 - Chlef','03 - Laghouat','04 - Oum El Bouaghi','05 - Batna',
    '06 - Béjaïa','07 - Biskra','08 - Béchar','09 - Blida','10 - Bouira',
    '11 - Tamanrasset','12 - Tébessa','13 - Tlemcen','14 - Tiaret','15 - Tizi Ouzou',
    '16 - Alger','17 - Djelfa','18 - Jijel','19 - Sétif','20 - Saïda',
    '21 - Skikda','22 - Sidi Bel Abbès','23 - Annaba','24 - Guelma','25 - Constantine',
    '26 - Médéa','27 - Mostaganem',"28 - M'Sila",'29 - Mascara','30 - Ouargla',
    '31 - Oran','32 - El Bayadh','33 - Illizi','34 - Bordj Bou Arréridj','35 - Boumerdès',
    '36 - El Tarf','37 - Tindouf','38 - Tissemsilt','39 - El Oued','40 - Khenchela',
    '41 - Souk Ahras','42 - Tipaza','43 - Mila','44 - Aïn Defla','45 - Naâma',
    '46 - Aïn Témouchent','47 - Ghardaïa','48 - Relizane','49 - Timimoun',
    '50 - Bordj Badji Mokhtar','51 - Ouled Djellal','52 - Béni Abbès','53 - In Salah',
    "54 - In Guezzam",'55 - Touggourt','56 - Djanet',"57 - El M'Ghair",'58 - El Meniaa',
]

const STATUT_CONFIG = {
    PREPARATION: { label: 'En préparation', cls: 'tag neutral', icon: Clock, color: '#64748B' },
    DEPOSE:      { label: 'Déposé',          cls: 'tag indigo', icon: ScrollText, color: 'var(--indigo)' },
    INSTRUCTION: { label: 'En instruction',  cls: 'tag amber', icon: Clock, color: '#F59E0B' },
    OBTENU:      { label: 'Obtenu',           cls: 'tag green', icon: CheckCircle, color: '#10B981' },
    REFUSE:      { label: 'Refusé',           cls: 'tag red', icon: AlertCircle, color: '#EF4444' },
    ARCHIVE:     { label: 'Archivé',          cls: 'tag neutral', icon: Archive, color: '#94A3B8' },
}

const TYPE_CONFIG = {
    PC:   { label: 'Permis de construire', color: 'var(--indigo)', bg: 'var(--indigo-soft)' },
    CU:   { label: "Certificat d'urbanisme", color: '#10B981', bg: '#ECFDF5' },
    DAEU: { label: 'Décl. achèvement', color: '#F59E0B', bg: '#FFFBEB' },
    AUTRE:{ label: 'Autre', color: '#64748B', bg: '#F8FAFC' },
}

const EMPTY = {
    projet: '', type_pc: 'PC', statut: 'PREPARATION', reference: '',
    wilaya: '', date_depot: '', date_decision_prevue: '', date_obtention: '',
    numero_arrete: '', observations: '',
}

const STATUTS_ORDER = ['PREPARATION', 'DEPOSE', 'INSTRUCTION', 'OBTENU', 'REFUSE', 'ARCHIVE']

export default function Permis() {
    const queryClient = useQueryClient()
    const [filterStatut, setFilterStatut] = useState('all')
    const [filterProjet, setFilterProjet] = useState('')
    const [open, setOpen] = useState(false)
    const [editItem, setEditItem] = useState(null)
    const [form, setForm] = useState(EMPTY)
    const [confirmDeleteId, setConfirmDeleteId] = useState(null)

    const { data: projets = [] } = useQuery({ queryKey: ['projets'], queryFn: () => api.get('/projets/').then(r => r.data) })
    const { data: permis = [], isLoading } = useQuery({ queryKey: ['permis'], queryFn: () => api.get('/projets/permis/').then(r => r.data) })

    const upd = (k, v) => setForm(f => ({ ...f, [k]: v }))

    const createM = useMutation({
        mutationFn: (data) => api.post('/projets/permis/', data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['permis'] }); setOpen(false); setForm(EMPTY) }
    })
    const editM = useMutation({
        mutationFn: ({ id, data }) => api.put(`/projets/permis/${id}/`, data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['permis'] }); setOpen(false); setEditItem(null); setForm(EMPTY) }
    })
    const deleteM = useMutation({
        mutationFn: (id) => api.delete(`/projets/permis/${id}/`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['permis'] })
    })

    const openEdit = (item) => {
        setEditItem(item)
        setForm({
            projet: item.projet, type_pc: item.type_pc, statut: item.statut,
            reference: item.reference || '', wilaya: item.wilaya || '',
            date_depot: item.date_depot || '', date_decision_prevue: item.date_decision_prevue || '',
            date_obtention: item.date_obtention || '', numero_arrete: item.numero_arrete || '',
            observations: item.observations || '',
        })
        setOpen(true)
    }

    const submit = () => {
        const payload = { ...form }
        if (!payload.date_depot) delete payload.date_depot
        if (!payload.date_decision_prevue) delete payload.date_decision_prevue
        if (!payload.date_obtention) delete payload.date_obtention
        if (editItem) editM.mutate({ id: editItem.id, data: payload })
        else createM.mutate(payload)
    }

    const list = permis.filter(p => {
        if (filterStatut !== 'all' && p.statut !== filterStatut) return false
        if (filterProjet && String(p.projet) !== filterProjet) return false
        return true
    })

    const obtenu = permis.filter(p => p.statut === 'OBTENU').length
    const instruction = permis.filter(p => p.statut === 'INSTRUCTION' || p.statut === 'DEPOSE').length
    const refuse = permis.filter(p => p.statut === 'REFUSE').length

    return (
        <Layout>
            <div className="page">
                <div className="page-head">
                    <div>
                        <h1 className="page-title">Permis de construire</h1>
                        <div className="page-sub">Suivi des dossiers PC, CU et déclarations</div>
                    </div>
                    <div className="page-head-actions">
                        <button className="btn accent" onClick={() => { setEditItem(null); setForm(EMPTY); setOpen(true) }}>
                            <Plus size={15} /> Nouveau dossier
                        </button>
                    </div>
                </div>

                <div className="stats stats-3">
                    <div className="stat">
                        <div className="stat-icon" style={{ background: '#ECFDF5' }}><CheckCircle size={18} color="#10B981" /></div>
                        <div className="stat-label">Obtenus</div>
                        <div className="stat-val">{obtenu}</div>
                    </div>
                    <div className="stat">
                        <div className="stat-icon" style={{ background: '#FFFBEB' }}><Clock size={18} color="#F59E0B" /></div>
                        <div className="stat-label">En cours</div>
                        <div className="stat-val">{instruction}</div>
                    </div>
                    <div className="stat">
                        <div className="stat-icon" style={{ background: '#FEF2F2' }}><AlertCircle size={18} color="#EF4444" /></div>
                        <div className="stat-label">Refusés</div>
                        <div className="stat-val">{refuse}</div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                    <select value={filterProjet} onChange={e => setFilterProjet(e.target.value)} style={{ padding: '8px 12px', borderRadius: 9, border: '1.5px solid #E2E8F0', fontSize: 13, fontWeight: 600, color: '#374151', background: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>
                        <option value="">Tous les projets</option>
                        {projets.map(p => <option key={p.id} value={String(p.id)}>{p.nom}</option>)}
                    </select>
                    <div className="filter-tabs" style={{ marginBottom: 0 }}>
                        <button className={'filter-tab' + (filterStatut === 'all' ? ' active' : '')} onClick={() => setFilterStatut('all')}>Tous ({permis.length})</button>
                        {STATUTS_ORDER.map(s => {
                            const c = STATUT_CONFIG[s]
                            const n = permis.filter(p => p.statut === s).length
                            return n > 0 ? <button key={s} className={'filter-tab' + (filterStatut === s ? ' active' : '')} onClick={() => setFilterStatut(s)}>{c.label} ({n})</button> : null
                        })}
                    </div>
                </div>

                {isLoading ? (
                    <div className="text-center color-slate" style={{ padding: 60 }}>Chargement...</div>
                ) : list.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon" style={{ background: '#ECFDF5' }}><ScrollText size={24} color="#10B981" /></div>
                        <div className="empty-title">Aucun dossier</div>
                        <div className="empty-sub">Créez votre premier dossier de permis</div>
                        <button className="btn accent" onClick={() => { setEditItem(null); setForm(EMPTY); setOpen(true) }}><Plus size={14} /> Nouveau dossier</button>
                    </div>
                ) : (
                    <div className="flex-col gap-10">
                        {list.map(pc => {
                            const sc = STATUT_CONFIG[pc.statut] || STATUT_CONFIG.PREPARATION
                            const tc = TYPE_CONFIG[pc.type_pc] || TYPE_CONFIG.AUTRE
                            const SI = sc.icon
                            return (
                                <div key={pc.id} style={{ background: 'white', borderRadius: 14, border: '1.5px solid #F1F5F9', boxShadow: '0 1px 4px rgba(15,23,42,0.04)', display: 'flex', alignItems: 'stretch', overflow: 'hidden' }}>
                                    <div style={{ width: 4, background: sc.color, flexShrink: 0 }} />
                                    <div style={{ flex: 1, padding: '14px 16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{pc.projet_nom}</span>
                                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: tc.bg, color: tc.color }}>{tc.label}</span>
                                            <span className={sc.cls}><SI size={10} style={{ marginRight: 3 }} />{sc.label}</span>
                                            {pc.reference && <span className="fs-12 color-slate">Réf: {pc.reference}</span>}
                                        </div>
                                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                            {pc.date_depot && <div><span className="fs-11 color-slate fw-600">Dépôt — </span><span className="fs-12 fw-700">{pc.date_depot}</span></div>}
                                            {pc.date_decision_prevue && <div><span className="fs-11 color-slate fw-600">Décision prévue — </span><span className="fs-12 fw-700">{pc.date_decision_prevue}</span></div>}
                                            {pc.date_obtention && <div><span className="fs-11 color-slate fw-600">Obtenu le — </span><span className="fs-12 fw-700 color-green">{pc.date_obtention}</span></div>}
                                            {pc.numero_arrete && <div><span className="fs-11 color-slate fw-600">N° arrêté — </span><span className="fs-12 fw-700">{pc.numero_arrete}</span></div>}
                                            {pc.wilaya && <div><span className="fs-11 color-slate fw-600">Wilaya — </span><span className="fs-12 fw-700">{pc.wilaya}</span></div>}
                                        </div>
                                        {pc.observations && <div className="fs-12 color-slate" style={{ marginTop: 6 }}>{pc.observations}</div>}
                                    </div>
                                    <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 6, borderLeft: '1px solid #F1F5F9', flexShrink: 0 }}>
                                        <button onClick={() => openEdit(pc)} style={{ width: 34, height: 34, borderRadius: 9, border: '1.5px solid #E2E8F0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }} onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#0F172A' }} onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#64748B' }}><Pencil size={14} /></button>
                                        <button onClick={() => setConfirmDeleteId(pc.id)} style={{ width: 34, height: 34, borderRadius: 9, border: '1.5px solid var(--line)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-2)' }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-soft)'; e.currentTarget.style.color = 'var(--red)' }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted-2)' }}><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {open && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 200, backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => { setOpen(false); setEditItem(null) }}>
                    <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 560, boxShadow: '0 24px 80px rgba(0,0,0,0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '92vh' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '22px 26px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 42, height: 42, borderRadius: 12, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ScrollText size={20} color="#10B981" /></div>
                                <div>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>{editItem ? 'Modifier le dossier' : 'Nouveau dossier PC'}</div>
                                    <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 1 }}>Permis, certificat ou déclaration</div>
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
                                    <label>Type de dossier</label>
                                    <select value={form.type_pc} onChange={e => upd('type_pc', e.target.value)}>
                                        <option value="PC">Permis de construire</option>
                                        <option value="CU">Certificat d'urbanisme</option>
                                        <option value="DAEU">Décl. achèvement</option>
                                        <option value="AUTRE">Autre</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid-2">
                                <div className="field">
                                    <label>Statut</label>
                                    <select value={form.statut} onChange={e => upd('statut', e.target.value)}>
                                        <option value="PREPARATION">En préparation</option>
                                        <option value="DEPOSE">Déposé</option>
                                        <option value="INSTRUCTION">En instruction</option>
                                        <option value="OBTENU">Obtenu</option>
                                        <option value="REFUSE">Refusé</option>
                                        <option value="ARCHIVE">Archivé</option>
                                    </select>
                                </div>
                                <div className="field">
                                    <label>Wilaya APC</label>
                                    <select value={form.wilaya} onChange={e => upd('wilaya', e.target.value)}>
                                        <option value="">Sélectionner</option>
                                        {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid-2">
                                <div className="field"><label>Référence dossier</label><input value={form.reference} onChange={e => upd('reference', e.target.value)} placeholder="Ex: PC-2024-0123" /></div>
                                <div className="field"><label>N° arrêté (si obtenu)</label><input value={form.numero_arrete} onChange={e => upd('numero_arrete', e.target.value)} /></div>
                            </div>
                            <div className="grid-2">
                                <div className="field"><label>Date de dépôt</label><input type="date" value={form.date_depot} onChange={e => upd('date_depot', e.target.value)} /></div>
                                <div className="field"><label>Décision prévue</label><input type="date" value={form.date_decision_prevue} onChange={e => upd('date_decision_prevue', e.target.value)} /></div>
                            </div>
                            <div className="field"><label>Date d'obtention</label><input type="date" value={form.date_obtention} onChange={e => upd('date_obtention', e.target.value)} /></div>
                            <div className="field" style={{ marginBottom: 0 }}><label>Observations</label><textarea rows={2} value={form.observations} onChange={e => upd('observations', e.target.value)} style={{ resize: 'vertical' }} /></div>
                        </div>
                        <div style={{ padding: '14px 26px 22px', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 10, flexShrink: 0 }}>
                            <button onClick={() => { setOpen(false); setEditItem(null) }} style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: 'white', fontSize: 13, fontWeight: 600, color: '#64748B', cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
                            <button disabled={!form.projet || createM.isPending || editM.isPending} onClick={submit} style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#10B981,#059669)', color: 'white', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {editItem ? 'Enregistrer' : 'Créer le dossier'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <ConfirmModal
                open={confirmDeleteId !== null}
                title="Supprimer ce dossier ?"
                message="Cette action est irréversible."
                onConfirm={() => deleteM.mutate(confirmDeleteId)}
                onCancel={() => setConfirmDeleteId(null)}
            />
        </Layout>
    )
}
