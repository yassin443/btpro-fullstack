import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FileSignature, Plus, X, Pencil, Trash2, FileText, Building2, CalendarDays, BadgeCheck, FilePen } from 'lucide-react'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import { printDoc } from '../../components/documents/printDoc'
import useToast from '../../store/useToast'
import ConfirmModal from '../../components/ConfirmModal'

const MISSIONS = [
    { key: 'ESQ', label: 'Esquisse' }, { key: 'APS', label: 'APS' },
    { key: 'APD', label: 'APD' }, { key: 'PC', label: 'Permis de construire' },
    { key: 'DCE', label: 'DCE' }, { key: 'APM', label: 'APM' },
    { key: 'DET', label: 'DET' }, { key: 'AOR', label: 'AOR' },
]

const STATUTS = {
    BROUILLON: { label: 'Brouillon', badge: 'tag neutral' },
    ENVOYE:    { label: 'Envoyé',    badge: 'tag indigo' },
    SIGNE:     { label: 'Signé',     badge: 'tag green' },
    RESILIE:   { label: 'Résilié',   badge: 'tag red' },
}

const TVA_OPTIONS = ['0', '9', '19']

const DEFAULT_ARTICLES_CONTRAT = [
    { titre: 'Objet du contrat', contenu: '' },
    { titre: 'Étendue de la mission', contenu: '' },
    { titre: 'Honoraires', contenu: '' },
    { titre: 'Modalités de paiement', contenu: "30% à la signature du contrat.\n20% à la validation de l'APS.\n25% à la remise de l'APD et du permis de construire.\n15% à la remise du DCE.\n10% à la réception définitive des travaux." },
    { titre: 'Durée & délais', contenu: '' },
    { titre: 'Obligations des parties', contenu: "Le Maître d'ouvrage s'engage à fournir les documents nécessaires et à régler les honoraires conformément à l'article sur les modalités de paiement. Le Maître d'œuvre s'engage à exécuter sa mission avec diligence, dans le respect des règles de l'art et des dispositions légales en vigueur en Algérie." },
    { titre: 'Assurance & responsabilité', contenu: "Le Maître d'œuvre déclare avoir souscrit une assurance professionnelle (Garantie Décennale et Responsabilité Civile) couvrant les risques liés à l'exercice de sa mission." },
    { titre: 'Résiliation', contenu: "En cas de manquement grave, le contrat pourra être résilié de plein droit, après mise en demeure restée sans effet pendant 30 jours. Les honoraires des phases déjà réalisées restent acquis au Maître d'œuvre." },
    { titre: 'Litiges & juridiction compétente', contenu: "Tout différend sera, à défaut de règlement amiable, porté devant le Tribunal d'Alger, seul compétent. Le contrat est soumis au droit algérien." },
]

const DEFAULT_ARTICLES_AVENANT = [
    { titre: 'Préambule', contenu: '' },
    { titre: "Objet de l'avenant", contenu: '' },
    { titre: 'Honoraires complémentaires', contenu: '' },
    { titre: 'Dispositions inchangées', contenu: "Toutes les autres clauses du contrat initial non expressément modifiées par le présent avenant demeurent en vigueur." },
]

function mkArticles(type) {
    const src = type === 'AVENANT' ? DEFAULT_ARTICLES_AVENANT : DEFAULT_ARTICLES_CONTRAT
    return src.map(a => ({ ...a }))
}

const EMPTY_FORM = {
    type: 'CONTRAT', projet: '', client: '',
    objet: '', missions: [],
    montant_ht: '', tva: '19',
    contrat_parent: '',
    date_debut: '', date_fin: '', date_signature: '',
    statut: 'BROUILLON', notes: '',
    articles: mkArticles('CONTRAT'),
}

function ArticlesEditor({ articles, onChange }) {
    const add = () => onChange([...articles, { titre: '', contenu: '' }])
    const remove = (i) => onChange(articles.filter((_, idx) => idx !== i))
    const update = (i, key, val) => onChange(articles.map((a, idx) => idx === i ? { ...a, [key]: val } : a))
    const moveUp = (i) => {
        if (i === 0) return
        const arr = [...articles];
        [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]
        onChange(arr)
    }
    const moveDown = (i) => {
        if (i === articles.length - 1) return
        const arr = [...articles];
        [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]
        onChange(arr)
    }

    return (
        <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Articles du contrat</span>
                <button type="button" onClick={add}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: 'var(--indigo)', background: 'var(--indigo-soft)', border: 'none', borderRadius: 7, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
                    <Plus size={12} /> Article
                </button>
            </div>
            {articles.length === 0 && (
                <div style={{ padding: '18px', textAlign: 'center', color: '#94A3B8', fontSize: 12, fontStyle: 'italic', border: '1.5px dashed #E2E8F0', borderRadius: 10 }}>
                    Aucun article — cliquez sur « Article » pour en ajouter
                </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {articles.map((a, i) => (
                    <div key={i} style={{ border: '1.5px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', background: '#F8FAFC', padding: '6px 10px', gap: 6, borderBottom: '1px solid #F1F5F9' }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', background: '#E2E8F0', borderRadius: 4, padding: '2px 6px', fontFamily: 'monospace', minWidth: 24, textAlign: 'center' }}>{String(i + 1).padStart(2, '0')}</span>
                            <input value={a.titre} onChange={e => update(i, 'titre', e.target.value)}
                                placeholder="Titre de l'article..."
                                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 12, fontWeight: 600, color: '#0F172A', fontFamily: 'inherit', background: 'transparent', padding: 0 }} />
                            <button type="button" onClick={() => moveUp(i)} disabled={i === 0}
                                style={{ width: 20, height: 20, borderRadius: 4, background: 'none', border: 'none', cursor: i === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: i === 0 ? '#CBD5E1' : '#64748B', fontSize: 13, lineHeight: 1 }}>↑</button>
                            <button type="button" onClick={() => moveDown(i)} disabled={i === articles.length - 1}
                                style={{ width: 20, height: 20, borderRadius: 4, background: 'none', border: 'none', cursor: i === articles.length - 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: i === articles.length - 1 ? '#CBD5E1' : '#64748B', fontSize: 13, lineHeight: 1 }}>↓</button>
                            <button type="button" onClick={() => remove(i)}
                                style={{ width: 20, height: 20, borderRadius: 5, background: '#FEF2F2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
                                <X size={10} />
                            </button>
                        </div>
                        <textarea value={a.contenu} onChange={e => update(i, 'contenu', e.target.value)}
                            placeholder="Contenu de l'article (laissez vide pour remplir plus tard)..."
                            rows={3}
                            style={{ width: '100%', border: 'none', outline: 'none', fontSize: 12, color: '#334155', fontFamily: 'inherit', background: 'white', padding: '8px 10px', resize: 'vertical', display: 'block' }} />
                    </div>
                ))}
            </div>
        </div>
    )
}

export default function Contrats() {
    const qc = useQueryClient()
    const { toast } = useToast()
    const [tab, setTab]           = useState('tous')
    const [open, setOpen]         = useState(false)
    const [editItem, setEdit]     = useState(null)
    const [form, setForm]         = useState({ ...EMPTY_FORM, articles: mkArticles('CONTRAT') })
    const [confirmDel, setConfirmDel] = useState(null)

    const { data: contrats = [] } = useQuery({ queryKey: ['contrats'], queryFn: () => api.get('/contrats/').then(r => r.data) })
    const { data: projets  = [] } = useQuery({ queryKey: ['projets'],  queryFn: () => api.get('/projets/').then(r => r.data) })
    const { data: clients  = [] } = useQuery({ queryKey: ['clients'],  queryFn: () => api.get('/projets/clients/').then(r => r.data) })
    const { data: cabinetData }   = useQuery({ queryKey: ['cabinet'],  queryFn: () => api.get('/cabinets/mon-cabinet/').then(r => r.data) })

    const isAssujetti = cabinetData?.assujetti_tva !== false

    const saveMut = useMutation({
        mutationFn: (d) => editItem
            ? api.put(`/contrats/${editItem.id}/`, d)
            : api.post('/contrats/', d),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['contrats'] }); closeModal(); toast(editItem ? 'Contrat mis à jour' : 'Contrat créé avec succès') },
        onError: () => toast('Erreur lors de l\'enregistrement', 'error'),
    })

    const delMut = useMutation({
        mutationFn: (id) => api.delete(`/contrats/${id}/`),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['contrats'] }); toast('Contrat supprimé', 'info') },
    })

    const statutMut = useMutation({
        mutationFn: ({ id, statut }) => api.put(`/contrats/${id}/`, { statut }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['contrats'] }); toast('Statut mis à jour') },
        onError: () => toast('Erreur lors de la mise à jour du statut', 'error'),
    })

    const closeModal = () => { setOpen(false); setEdit(null); setForm({ ...EMPTY_FORM, articles: mkArticles('CONTRAT') }) }

    const openCreate = (type = 'CONTRAT') => {
        setEdit(null)
        setForm({ ...EMPTY_FORM, type, tva: isAssujetti ? '19' : '0', articles: mkArticles(type) })
        setOpen(true)
    }

    const openEdit = (c) => {
        setEdit(c)
        setForm({
            type: c.type, projet: c.projet, client: c.client,
            objet: c.objet || '', missions: c.missions || [],
            montant_ht: c.montant_ht || '',
            tva: isAssujetti ? (c.tva != null ? String(c.tva) : '19') : '0',
            contrat_parent: c.contrat_parent || '',
            date_debut: c.date_debut || '', date_fin: c.date_fin || '',
            date_signature: c.date_signature || '',
            statut: c.statut, notes: c.notes || '',
            articles: c.articles?.length
                ? c.articles.map(a => ({ titre: a.titre, contenu: a.contenu || '' }))
                : mkArticles(c.type),
        })

        setOpen(true)
    }

    const upd = (key, val) => setForm(f => {
        const u = { ...f, [key]: val }
        if (key === 'projet') {
            const p = projets.find(x => x.id === Number(val))
            if (p?.client?.id) u.client = p.client.id
        }
        if (key === 'type') {
            u.articles = mkArticles(val)
        }
        return u
    })

    const toggleMission = (key) => setForm(f => ({
        ...f,
        missions: f.missions.includes(key) ? f.missions.filter(m => m !== key) : [...f.missions, key],
    }))

    const montantTtc = () => {
        const ht = parseFloat(form.montant_ht) || 0
        if (!isAssujetti) return ht
        const tva = parseFloat(form.tva) || 0
        return ht * (1 + tva / 100)
    }

    const handleSubmit = () => {
        if (!form.projet) return
        const ttc = montantTtc()
        const payload = {
            type: form.type,
            projet: Number(form.projet),
            client: form.client ? Number(form.client) : null,
            objet: form.objet, missions: form.missions,
            montant_ht: parseFloat(form.montant_ht) || 0,
            tva: parseFloat(form.tva) || 0,
            montant_ttc: ttc,
            contrat_parent: (form.type === 'AVENANT' && form.contrat_parent) ? Number(form.contrat_parent) : null,
            date_debut: form.date_debut || null, date_fin: form.date_fin || null,
            date_signature: form.date_signature || null,
            statut: form.statut, notes: form.notes,
            articles: form.articles
                .filter(a => a.titre.trim())
                .map((a, i) => ({ titre: a.titre.trim(), contenu: a.contenu || '', ordre: i + 1 })),
        }

        saveMut.mutate(payload)
    }

    const openPreview = (c) => {
        const client = clients.find(cl => cl.id === c.client) || null
        printDoc(c.type === 'AVENANT' ? 'avenant' : 'contrat', c, cabinetData || {}, client)
    }

    const filtered = contrats.filter(c =>
        tab === 'tous' ? true : tab === 'contrats' ? c.type === 'CONTRAT' : c.type === 'AVENANT'
    )

    const totalSigne  = contrats.filter(c => c.statut === 'SIGNE').length
    const totalResilie = contrats.filter(c => c.statut === 'RESILIE').length
    const nbContrats  = contrats.filter(c => c.type === 'CONTRAT').length
    const nbAvenants  = contrats.filter(c => c.type === 'AVENANT').length

    const ttc = montantTtc()

    const avenantsByParent = contrats.reduce((acc, c) => {
        if (c.type === 'AVENANT' && c.contrat_parent) {
            if (!acc[c.contrat_parent]) acc[c.contrat_parent] = []
            acc[c.contrat_parent].push(c)
        }
        return acc
    }, {})

    return (
        <Layout>
            <div className="page">
                <div className="page-head">
                    <div>
                        <h1 className="page-title">Contrats & Avenants</h1>
                        <div className="page-sub">Gérez et téléchargez vos contrats de maîtrise d'œuvre</div>
                    </div>
                    <div className="page-head-actions">
                        <button className="btn" onClick={() => openCreate('AVENANT')}>
                            <FilePen size={14} /> Nouvel avenant
                        </button>
                        <button className="btn accent" onClick={() => openCreate('CONTRAT')}>
                            <Plus size={14} /> Nouveau contrat
                        </button>
                    </div>
                </div>

                <div className="stats stats-4">
                    <div className="stat">
                        <div className="stat-icon" style={{ background: 'var(--indigo-soft)' }}><FileText size={18} color="var(--indigo)" /></div>
                        <div className="stat-label">Contrats</div>
                        <div className="stat-val">{nbContrats}</div>
                    </div>
                    <div className="stat">
                        <div className="stat-icon" style={{ background: '#F5F3FF' }}><FilePen size={18} color="#7C3AED" /></div>
                        <div className="stat-label">Avenants</div>
                        <div className="stat-val">{nbAvenants}</div>
                    </div>
                    <div className="stat">
                        <div className="stat-icon" style={{ background: '#ECFDF5' }}><BadgeCheck size={18} color="#10B981" /></div>
                        <div className="stat-label">Signés</div>
                        <div className="stat-val">{totalSigne}</div>
                    </div>
                    <div className="stat">
                        <div className="stat-icon" style={{ background: '#FEF2F2' }}><Building2 size={18} color="#EF4444" /></div>
                        <div className="stat-label">Résiliés</div>
                        <div className="stat-val">{totalResilie}</div>
                    </div>
                </div>

                <div className="filter-tabs">
                    {[['tous', 'Tous'], ['contrats', 'Contrats'], ['avenants', 'Avenants']].map(([k, l]) => (
                        <button key={k} className={'filter-tab' + (tab === k ? ' active' : '')} onClick={() => setTab(k)}>{l}</button>
                    ))}
                </div>

                {filtered.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon" style={{ background: 'var(--indigo-soft)' }}>
                            <FileSignature size={24} color="var(--indigo)" />
                        </div>
                        <div className="empty-title">Aucun document</div>
                        <div className="empty-sub">Créez votre premier contrat de maîtrise d'œuvre</div>
                        <button className="btn accent" onClick={() => openCreate(tab === 'avenants' ? 'AVENANT' : 'CONTRAT')}>
                            <Plus size={14} /> Créer
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {filtered.map(c => {
                            const s = STATUTS[c.statut]
                            const isAvenant = c.type === 'AVENANT'
                            const accentColor = isAvenant ? '#7C3AED' : 'var(--indigo)'
                            const accentBg    = isAvenant ? '#F5F3FF' : 'var(--indigo-soft)'
                            const avenants = !isAvenant ? (avenantsByParent[c.id] || []) : []
                            const avenantsSigne = avenants.filter(a => a.statut === 'SIGNE')
                            const totalEngagement = !isAvenant && avenantsSigne.length > 0
                                ? Number(c.montant_ttc) + avenantsSigne.reduce((s, a) => s + Number(a.montant_ttc), 0)
                                : null
                            const parentContrat = isAvenant && c.contrat_parent
                                ? contrats.find(x => x.id === c.contrat_parent)
                                : null
                            return (
                                <div key={c.id} style={{ background: 'white', borderRadius: 14, border: '1.5px solid #F1F5F9', boxShadow: '0 1px 4px rgba(15,23,42,0.04)', display: 'flex', alignItems: 'stretch', overflow: 'hidden' }}
                                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(15,23,42,0.08)'}
                                    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(15,23,42,0.04)'}>
                                    <div style={{ width: 4, background: accentColor, flexShrink: 0 }} />
                                    <div style={{ display: 'flex', alignItems: 'center', padding: '16px 16px 16px 14px' }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 10, background: accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            {isAvenant ? <FilePen size={18} color={accentColor} /> : <FileSignature size={18} color={accentColor} />}
                                        </div>
                                    </div>
                                    <div style={{ flex: 1, padding: '14px 0', minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                            <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{c.numero}</span>
                                            <span className={`badge ${isAvenant ? 'badge-purple' : 'badge-indigo'}`}>{isAvenant ? 'Avenant' : 'Contrat'}</span>
                                            <span className={s?.badge ?? 'tag neutral'}>{s?.label ?? c.statut}</span>
                                            {isAvenant && c.parent_numero && (
                                                <span style={{ fontSize: 11, fontWeight: 600, color: '#7C3AED', background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 6, padding: '2px 7px' }}>
                                                    ↳ {c.parent_numero}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 2 }}>{c.objet || '—'}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748B' }}>
                                                <Building2 size={11} color="#94A3B8" /> {c.projet_nom}
                                            </div>
                                            {c.client_nom && <div style={{ fontSize: 12, color: '#94A3B8' }}>{c.client_nom}</div>}
                                            {c.date_debut && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#94A3B8' }}>
                                                    <CalendarDays size={11} color="#94A3B8" /> {c.date_debut}
                                                </div>
                                            )}
                                            {Number(c.montant_ttc) > 0 && (
                                                <div style={{ fontSize: 12, fontWeight: 700, color: isAvenant ? '#7C3AED' : 'var(--indigo)' }}>
                                                    {isAvenant ? '+' : ''}{Number(c.montant_ttc).toLocaleString()} DA TTC
                                                </div>
                                            )}
                                            {totalEngagement !== null && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: '#0F172A', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 7, padding: '2px 8px' }}>
                                                    Total engagé : {totalEngagement.toLocaleString()} DA
                                                    <span style={{ fontSize: 10, fontWeight: 600, color: '#16A34A' }}>({avenants.length} avenant{avenants.length > 1 ? 's' : ''})</span>
                                                </div>
                                            )}
                                        </div>
                                        {c.missions?.length > 0 && (
                                            <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                                                {c.missions.map(m => (
                                                    <span key={m} style={{ fontSize: 10, fontWeight: 700, background: 'var(--indigo-soft)', color: 'var(--indigo)', padding: '2px 7px', borderRadius: 5 }}>{m}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, borderLeft: '1px solid #F1F5F9' }}>
                                        {c.statut === 'BROUILLON' && (
                                            <button className="btn sm" onClick={() => statutMut.mutate({ id: c.id, statut: 'ENVOYE' })}
                                                style={{ fontSize: 11, padding: '5px 10px' }}>
                                                Envoyer
                                            </button>
                                        )}
                                        {c.statut === 'ENVOYE' && (
                                            <button className="btn sm" onClick={() => statutMut.mutate({ id: c.id, statut: 'SIGNE' })}
                                                style={{ fontSize: 11, padding: '5px 10px', color: '#10B981', borderColor: '#A7F3D0' }}>
                                                Signer
                                            </button>
                                        )}
                                        {c.statut === 'SIGNE' && (
                                            <button className="btn sm" onClick={() => statutMut.mutate({ id: c.id, statut: 'RESILIE' })}
                                                style={{ fontSize: 11, padding: '5px 10px', color: '#EF4444', borderColor: '#FECACA' }}>
                                                Résilier
                                            </button>
                                        )}
                                        <button onClick={() => openPreview(c)} title="Aperçu / PDF"
                                            style={{ width: 34, height: 34, borderRadius: 9, border: '1.5px solid #E2E8F0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--indigo)' }}
                                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--indigo-soft)'; e.currentTarget.style.borderColor = '#C7D2FE' }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#E2E8F0' }}>
                                            <FileText size={14} />
                                        </button>
                                        <button onClick={() => openEdit(c)} title="Modifier"
                                            style={{ width: 34, height: 34, borderRadius: 9, border: '1.5px solid #E2E8F0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}
                                            onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#0F172A' }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#64748B' }}>
                                            <Pencil size={14} />
                                        </button>
                                        <button onClick={() => setConfirmDel({ id: c.id })} title="Supprimer"
                                            style={{ width: 34, height: 34, borderRadius: 9, border: '1.5px solid #E2E8F0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}
                                            onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.borderColor = '#FECACA'; e.currentTarget.style.color = '#EF4444' }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#94A3B8' }}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {open && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 200, backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={closeModal}>
                    <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 860, boxShadow: '0 24px 80px rgba(0,0,0,0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '92vh' }} onClick={e => e.stopPropagation()}>

                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 11, background: form.type === 'AVENANT' ? '#F5F3FF' : 'var(--indigo-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {form.type === 'AVENANT' ? <FilePen size={19} color="#7C3AED" /> : <FileSignature size={19} color="var(--indigo)" />}
                                </div>
                                <div>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' }}>
                                        {editItem ? 'Modifier le' : 'Nouveau'} {form.type === 'AVENANT' ? 'avenant' : 'contrat'}
                                    </div>
                                    <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 1 }}>Personnalisez librement les articles et les informations</div>
                                </div>
                            </div>
                            <button onClick={closeModal} style={{ width: 34, height: 34, borderRadius: 9, background: '#F8FAFC', border: '1px solid #E2E8F0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                                <X size={15} />
                            </button>
                        </div>

                        <div style={{ padding: '20px 24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                            {/* Type toggle */}
                            <div className="field">
                                <label>Type de document</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {[['CONTRAT', 'Contrat', 'var(--indigo)', 'var(--indigo-soft)'], ['AVENANT', 'Avenant', '#7C3AED', '#F5F3FF']].map(([k, l, col, bg]) => (
                                        <button key={k} onClick={() => upd('type', k)} style={{ flex: 1, padding: '9px 12px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', border: form.type === k ? `2px solid ${col}` : '1.5px solid #E2E8F0', background: form.type === k ? bg : 'white', color: form.type === k ? col : '#64748B', fontWeight: 700, fontSize: 13 }}>{l}</button>
                                    ))}
                                </div>
                            </div>


                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div className="field">
                                    <label>Projet *</label>
                                    <select value={form.projet} onChange={e => upd('projet', e.target.value)}>
                                        <option value="">— Sélectionner un projet —</option>
                                        {projets.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                                    </select>
                                </div>
                                <div className="field">
                                    <label>Statut</label>
                                    <select value={form.statut} onChange={e => upd('statut', e.target.value)}>
                                        <option value="BROUILLON">Brouillon</option>
                                        <option value="ENVOYE">Envoyé</option>
                                        <option value="SIGNE">Signé</option>
                                        <option value="RESILIE">Résilié</option>
                                    </select>
                                </div>
                            </div>

                            <div className="field">
                                <label>Objet du contrat</label>
                                <textarea rows={2} value={form.objet} onChange={e => upd('objet', e.target.value)}
                                    placeholder="Maîtrise d'œuvre complète pour la construction de..." style={{ resize: 'vertical' }} />
                            </div>

                            {/* Honoraires */}
                            <div style={{ display: 'grid', gridTemplateColumns: isAssujetti ? '1fr 80px auto' : '1fr auto', gap: 12, alignItems: 'end' }}>
                                <div className="field">
                                    <label>Montant {isAssujetti ? 'HT' : ''} (DA)</label>
                                    <input type="number" min="0" step="any" value={form.montant_ht} onChange={e => upd('montant_ht', e.target.value)} placeholder="0" />
                                </div>
                                {isAssujetti && (
                                    <div className="field">
                                        <label>TVA (%)</label>
                                        <select value={form.tva} onChange={e => upd('tva', e.target.value)}>
                                            {TVA_OPTIONS.map(t => <option key={t} value={t}>{t}%</option>)}
                                        </select>
                                    </div>
                                )}
                                {(parseFloat(form.montant_ht) || 0) > 0 && (
                                    <div style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 10, padding: '10px 14px', marginBottom: 14, whiteSpace: 'nowrap' }}>
                                        <div style={{ fontSize: 10, color: '#16A34A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>
                                            {isAssujetti ? 'Total TTC' : 'Total'}
                                        </div>
                                        <div style={{ fontSize: 14, fontWeight: 800, color: '#15803D' }}>
                                            {ttc.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })} DA
                                        </div>
                                        {!isAssujetti && (
                                            <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>Non assujetti à la TVA</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {form.type === 'CONTRAT' && (
                                <div className="field">
                                    <label>Missions incluses</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {MISSIONS.map(m => (
                                            <button key={m.key} onClick={() => toggleMission(m.key)} style={{ padding: '5px 11px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', border: form.missions.includes(m.key) ? '2px solid var(--indigo)' : '1.5px solid #E2E8F0', background: form.missions.includes(m.key) ? 'var(--indigo-soft)' : 'white', color: form.missions.includes(m.key) ? 'var(--indigo)' : '#64748B', fontWeight: 700, fontSize: 12 }}>{m.key}</button>
                                        ))}
                                    </div>
                                    {form.missions.length > 0 && (
                                        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 6 }}>
                                            {form.missions.map(k => MISSIONS.find(m => m.key === k)?.label).join(' · ')}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="grid-2">
                                <div className="field"><label>Date de début</label><input type="date" value={form.date_debut} onChange={e => upd('date_debut', e.target.value)} /></div>
                                <div className="field"><label>Date de fin</label><input type="date" value={form.date_fin} onChange={e => upd('date_fin', e.target.value)} /></div>
                            </div>
                            <div className="field">
                                <label>Date de signature</label>
                                <input type="date" value={form.date_signature} onChange={e => upd('date_signature', e.target.value)} />
                            </div>

                            <ArticlesEditor
                                articles={form.articles}
                                onChange={v => setForm(f => ({ ...f, articles: v }))}
                            />

                            <div className="field" style={{ marginBottom: 0 }}>
                                <label>Notes internes <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>(optionnel)</span></label>
                                <textarea rows={2} value={form.notes} onChange={e => upd('notes', e.target.value)}
                                    placeholder="Conditions spécifiques, modalités particulières..." style={{ resize: 'vertical' }} />
                            </div>
                        </div>

                        <div style={{ padding: '14px 24px 20px', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 10, flexShrink: 0 }}>
                            <button onClick={closeModal} style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: 'white', fontSize: 13, fontWeight: 600, color: '#64748B', cursor: 'pointer', fontFamily: 'inherit' }}>
                                Annuler
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={saveMut.isPending || !form.projet}
                                style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: form.type === 'AVENANT' ? 'linear-gradient(135deg,#7C3AED,#6D28D9)' : 'var(--grad)', color: 'white', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: saveMut.isPending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: saveMut.isPending ? 0.7 : 1 }}>
                                {saveMut.isPending ? 'Enregistrement...' : editItem ? 'Mettre à jour' : `Créer le ${form.type === 'AVENANT' ? 'avenant' : 'contrat'}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                open={!!confirmDel}
                title="Supprimer ce contrat ?"
                message="Ce contrat sera supprimé définitivement."
                onConfirm={() => delMut.mutate(confirmDel.id)}
                onCancel={() => setConfirmDel(null)}
            />
        </Layout>
    )
}
