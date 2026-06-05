import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FolderOpen, Plus, X, Download, FileText, ScrollText, FolderKanban, BarChart2, FileSignature, File, Upload, Trash2, Receipt, ClipboardList, Search, LayoutGrid, List, Folder } from 'lucide-react'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import useStore from '../../store/useStore'

const TYPES = ['PLAN', 'PERMIS', 'DCE', 'CCTP', 'RAPPORT', 'CONTRAT', 'AUTRE']
const BASE = window.location.hostname === 'localhost' ? 'http://127.0.0.1:8000' : ''

const TYPE_CONFIG = {
    PLAN:    { icon: FileText,      color: 'var(--indigo)', bg: 'var(--indigo-soft)', label: 'Plan' },
    PERMIS:  { icon: ScrollText,    color: '#10B981',       bg: '#ECFDF5',            label: 'Permis' },
    DCE:     { icon: FolderKanban,  color: '#F59E0B',       bg: '#FFFBEB',            label: 'DCE' },
    CCTP:    { icon: FileText,      color: '#8B5CF6',       bg: '#F5F3FF',            label: 'CCTP' },
    RAPPORT: { icon: BarChart2,     color: '#0EA5E9',       bg: '#F0F9FF',            label: 'Rapport' },
    CONTRAT: { icon: FileSignature, color: '#EC4899',       bg: '#FDF2F8',            label: 'Contrat' },
    AUTRE:   { icon: File,          color: '#64748B',       bg: '#F8FAFC',            label: 'Autre' },
}

const STATUT_FAC = {
    EMISE:                { label: 'Émise',    cls: 'tag indigo' },
    ENVOYEE:              { label: 'Envoyée',  cls: 'tag blue' },
    PARTIELLEMENT_PAYEE:  { label: 'Partiel',  cls: 'tag amber' },
    SOLDEE:               { label: 'Soldée',   cls: 'tag green' },
    ANNULEE:              { label: 'Annulée',  cls: 'tag red' },
}
const STATUT_DEV = {
    BROUILLON: { label: 'Brouillon', cls: 'tag neutral' },
    ENVOYE:    { label: 'Envoyé',    cls: 'tag indigo' },
    ACCEPTE:   { label: 'Accepté',  cls: 'tag green' },
    REFUSE:    { label: 'Refusé',   cls: 'tag red' },
}
const STATUT_CONT = {
    BROUILLON: { label: 'Brouillon', cls: 'tag neutral' },
    ENVOYE:    { label: 'Envoyé',    cls: 'tag indigo' },
    SIGNE:     { label: 'Signé',     cls: 'tag green' },
    RESILIE:   { label: 'Résilié',  cls: 'tag red' },
}

export default function Documents() {
    const queryClient = useQueryClient()
    const storeUser = useStore(s => s.user)
    const isPatron = storeUser?.is_patron
    const [projetId, setProjetId] = useState('')
    const [section, setSection] = useState('fichiers')
    const [view, setView] = useState('grid')
    const [search, setSearch] = useState('')
    const [open, setOpen] = useState(false)
    const [viewDoc, setViewDoc] = useState(null)
    const [fichier, setFichier] = useState(null)
    const [form, setForm] = useState({ nom: '', type_document: 'PLAN', description: '', projet: '' })
    const [openVersion, setOpenVersion] = useState(false)
    const [versionFichier, setVersionFichier] = useState(null)
    const [versionCommentaire, setVersionCommentaire] = useState('')

    const { data: projets } = useQuery({ queryKey: ['projets'], queryFn: () => api.get('/projets/').then(r => r.data) })
    const { data: documents, isLoading } = useQuery({ queryKey: ['documents', projetId], queryFn: () => api.get(`/documents/${projetId}/`).then(r => r.data), enabled: !!projetId && section === 'fichiers' })
    const { data: factures = [] } = useQuery({ queryKey: ['doc-factures', projetId], queryFn: () => api.get(`/finances/factures/${projetId ? `?projet=${projetId}` : ''}`).then(r => r.data) })
    const { data: devis = [] } = useQuery({ queryKey: ['doc-devis', projetId], queryFn: () => api.get(`/finances/devis/${projetId ? `?projet=${projetId}` : ''}`).then(r => r.data) })
    const { data: contrats = [] } = useQuery({ queryKey: ['doc-contrats', projetId], queryFn: () => api.get(`/contrats/${projetId ? `?projet=${projetId}` : ''}`).then(r => r.data) })

    const mutation = useMutation({
        mutationFn: (data) => {
            const pid = data.projet || projetId
            const formData = new FormData()
            formData.append('nom', data.nom)
            formData.append('type_document', data.type_document)
            formData.append('description', data.description)
            if (fichier) formData.append('fichier', fichier)
            return api.post(`/documents/${pid}/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        },
        onSuccess: (_, data) => {
            const pid = data.projet || projetId
            if (pid && pid !== projetId) setProjetId(pid)
            queryClient.invalidateQueries({ queryKey: ['documents', pid] })
            setOpen(false)
            setForm({ nom: '', type_document: 'PLAN', description: '', projet: '' })
            setFichier(null)
        }
    })

    const versionMutation = useMutation({
        mutationFn: () => {
            const formData = new FormData()
            formData.append('fichier', versionFichier)
            if (versionCommentaire) formData.append('commentaire', versionCommentaire)
            return api.post(`/documents/${viewDoc.id}/versions/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        },
        onSuccess: async () => {
            const updated = await api.get(`/documents/${viewDoc.id}/detail/`).then(r => r.data)
            setViewDoc(updated)
            queryClient.invalidateQueries({ queryKey: ['documents', projetId] })
            setOpenVersion(false)
            setVersionFichier(null)
            setVersionCommentaire('')
        }
    })

    const projetsList = projets || []
    const docsList = documents || []
    const filteredDocs = search ? docsList.filter(d => d.nom.toLowerCase().includes(search.toLowerCase())) : docsList

    const SIDEBAR_ITEMS = [
        { key: 'fichiers', label: 'Fichiers',  count: projetId ? docsList.length : null },
        { key: 'devis',    label: 'Devis',     count: devis.length || null },
        { key: 'factures', label: 'Factures',  count: factures.length || null },
        { key: 'contrats', label: 'Contrats',  count: contrats.length || null },
    ]

    return (
        <Layout>
            <div className="page">
                <div className="page-head" style={{ marginBottom: 24 }}>
                    <div>
                        <h1 className="page-title">Documents</h1>
                        <div className="page-sub">Plans, permis, DCE, devis et contrats</div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, alignItems: 'start' }}>

                    {/* ── Sidebar ── */}
                    <div className="card" style={{ padding: 12 }}>
                        <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '6px 8px', fontWeight: 600 }}>Dossiers</div>
                        {SIDEBAR_ITEMS.map(item => (
                            <div key={item.key}
                                className={'sb-item' + (section === item.key ? ' active' : '')}
                                onClick={() => { setSection(item.key); setViewDoc(null); setSearch('') }}>
                                <Folder size={14} />
                                <span>{item.label}</span>
                                {item.count !== null && <span className="count">{item.count}</span>}
                            </div>
                        ))}

                        {/* Project filter */}
                        {section === 'fichiers' && projetsList.length > 0 && (
                            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
                                <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 8px 6px', fontWeight: 600 }}>Projet</div>
                                <select
                                    value={projetId}
                                    onChange={e => { setProjetId(e.target.value); setViewDoc(null) }}
                                    style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--bg)', fontSize: 12, color: 'var(--ink)', cursor: 'pointer', fontFamily: 'inherit' }}
                                >
                                    <option value="">Tous les projets</option>
                                    {projetsList.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* ── Main area ── */}
                    <div>
                        {/* Toolbar */}
                        {!viewDoc && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                                <div className="input" style={{ width: 260, padding: 0, height: 34 }}>
                                    <Search size={14} style={{ marginLeft: 10, color: 'var(--muted)', flexShrink: 0 }} />
                                    <input
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder="Rechercher…"
                                        style={{ padding: '0 10px', fontSize: 13 }}
                                    />
                                </div>
                                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                                    {section === 'fichiers' && (
                                        <div className="seg">
                                            <button className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')}><LayoutGrid size={13} /></button>
                                            <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}><List size={13} /></button>
                                        </div>
                                    )}
                                    {section === 'fichiers' && (
                                        <button className="btn accent" onClick={() => { setForm({ nom: '', type_document: 'PLAN', description: '', projet: projetId }); setOpen(true) }}>
                                            <Plus size={14} /> Nouveau document
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── Fichiers ── */}
                        {section === 'fichiers' && !viewDoc && (
                            !projetId ? (
                                <div className="empty-state">
                                    <div className="empty-icon" style={{ background: 'var(--indigo-soft)' }}><FolderOpen size={24} color="var(--indigo)" /></div>
                                    <div className="empty-title">Sélectionnez un projet</div>
                                    <div className="empty-sub">Choisissez un projet dans la barre latérale pour voir ses fichiers</div>
                                </div>
                            ) : isLoading ? (
                                <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 60 }}>Chargement...</div>
                            ) : filteredDocs.length === 0 ? (
                                docsList.length === 0 ? (
                                    <div className="empty-state">
                                        <div className="empty-icon" style={{ background: 'var(--indigo-soft)' }}><FolderOpen size={24} color="var(--indigo)" /></div>
                                        <div className="empty-title">Aucun document</div>
                                        <div className="empty-sub">Uploadez votre premier document</div>
                                        <button className="btn accent" onClick={() => { setForm({ nom: '', type_document: 'PLAN', description: '', projet: projetId }); setOpen(true) }}><Plus size={14} /> Nouveau document</button>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 40, fontSize: 13 }}>Aucun résultat pour « {search} »</div>
                                )
                            ) : view === 'grid' ? (
                                <>
                                    <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, fontWeight: 600 }}>
                                        Fichiers ({filteredDocs.length})
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: 12 }}>
                                        {filteredDocs.map(doc => {
                                            const config = TYPE_CONFIG[doc.type_document] || TYPE_CONFIG.AUTRE
                                            const Ico = config.icon
                                            return (
                                                <div key={doc.id}
                                                    onClick={() => setViewDoc(doc)}
                                                    style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, padding: 14, cursor: 'pointer', transition: 'all 0.15s' }}
                                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = config.color }}
                                                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = 'var(--line)' }}>
                                                    <div style={{ height: 80, background: config.bg, borderRadius: 8, display: 'grid', placeItems: 'center', marginBottom: 10 }}>
                                                        <Ico size={28} color={config.color} />
                                                    </div>
                                                    <div style={{ fontSize: 12.5, fontWeight: 500, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{doc.nom}</div>
                                                    <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 3, display: 'flex', justifyContent: 'space-between' }}>
                                                        <span>{config.label}</span>
                                                        <span style={{ fontFamily: 'var(--mono)' }}>{doc.versions?.length ?? 0}v</span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </>
                            ) : (
                                <div className="card">
                                    <table className="tbl">
                                        <thead><tr>
                                            <th>Nom</th><th>Type</th><th>Versions</th><th></th>
                                        </tr></thead>
                                        <tbody>
                                            {filteredDocs.map(doc => {
                                                const config = TYPE_CONFIG[doc.type_document] || TYPE_CONFIG.AUTRE
                                                const Ico = config.icon
                                                return (
                                                    <tr key={doc.id} style={{ cursor: 'pointer' }} onClick={() => setViewDoc(doc)}>
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                                <div style={{ width: 32, height: 32, borderRadius: 8, background: config.bg, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                                                                    <Ico size={14} color={config.color} />
                                                                </div>
                                                                <span style={{ fontWeight: 500, fontSize: 13 }}>{doc.nom}</span>
                                                            </div>
                                                        </td>
                                                        <td><span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: config.bg, color: config.color }}>{config.label}</span></td>
                                                        <td style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>{doc.versions?.length ?? 0} version(s)</td>
                                                        <td style={{ color: 'var(--muted)', fontSize: 12 }}>Voir →</td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        )}

                        {/* ── Document detail ── */}
                        {section === 'fichiers' && viewDoc && (
                            <div>
                                <button className="btn sm" style={{ marginBottom: 16 }} onClick={() => setViewDoc(null)}>
                                    ← Retour
                                </button>
                                <div className="card">
                                    <div className="card-body">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                                {(() => {
                                                    const cfg = TYPE_CONFIG[viewDoc.type_document] || TYPE_CONFIG.AUTRE
                                                    const IC = cfg.icon
                                                    return (
                                                        <div style={{ width: 52, height: 52, borderRadius: 13, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                            <IC size={24} color={cfg.color} />
                                                        </div>
                                                    )
                                                })()}
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--ink)', marginBottom: 6 }}>{viewDoc.nom}</div>
                                                    {(() => {
                                                        const cfg = TYPE_CONFIG[viewDoc.type_document] || TYPE_CONFIG.AUTRE
                                                        return <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                                                    })()}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                {viewDoc.derniere_version?.fichier && (
                                                    <button className="btn accent sm" onClick={() => window.open(BASE + viewDoc.derniere_version.fichier, '_blank')}>
                                                        <Download size={13} /> Télécharger
                                                    </button>
                                                )}
                                                <button className="btn sm" onClick={() => setOpenVersion(true)}>
                                                    <Upload size={13} /> Nouvelle version
                                                </button>
                                                {isPatron && (
                                                    <button className="btn sm" style={{ color: 'var(--red)', borderColor: 'var(--red-soft)' }}
                                                        onClick={() => api.delete(`/documents/${viewDoc.id}/detail/`).then(() => { queryClient.invalidateQueries({ queryKey: ['documents', projetId] }); setViewDoc(null) })}>
                                                        <Trash2 size={13} /> Supprimer
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {viewDoc.description && (
                                            <div style={{ marginBottom: 20, padding: 14, borderRadius: 10, background: 'var(--bg)', fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
                                                {viewDoc.description}
                                            </div>
                                        )}

                                        {viewDoc.derniere_version?.fichier && (
                                            <div style={{ marginBottom: 20 }}>
                                                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, color: 'var(--ink)' }}>Prévisualisation</div>
                                                <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--line)', height: 500 }}>
                                                    <iframe src={BASE + viewDoc.derniere_version.fichier} style={{ width: '100%', height: '100%', border: 'none' }} title={viewDoc.nom} />
                                                </div>
                                            </div>
                                        )}

                                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, color: 'var(--ink)' }}>Historique des versions</div>
                                        {!viewDoc.versions?.length ? (
                                            <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 30, fontSize: 13 }}>Aucune version uploadée</div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                {viewDoc.versions.map(v => (
                                                    <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--bg)' }}>
                                                        <div className="avatar indigo" style={{ width: 36, height: 36, fontSize: 12, borderRadius: 8 }}>v{v.numero_version}</div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>Version {v.numero_version}</div>
                                                            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{v.commentaire || 'Pas de commentaire'} · {v.date_upload?.split('T')[0]}</div>
                                                        </div>
                                                        {v.fichier && (
                                                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--indigo)', padding: 6 }} onClick={() => window.open(BASE + v.fichier, '_blank')}>
                                                                <Download size={15} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Factures ── */}
                        {section === 'factures' && (
                            factures.length === 0
                                ? <div className="empty-state"><div className="empty-icon" style={{ background: 'var(--indigo-soft)' }}><Receipt size={24} color="var(--indigo)" /></div><div className="empty-title">Aucune facture</div><div className="empty-sub">Les factures créées dans Finances apparaîtront ici</div></div>
                                : <div className="card"><table className="tbl"><thead><tr><th>Numéro</th><th>Projet</th><th>Client</th><th>Montant TTC</th><th>Statut</th><th>Échéance</th></tr></thead><tbody>
                                    {factures.filter(f => !search || f.numero?.toLowerCase().includes(search.toLowerCase()) || f.projet_nom?.toLowerCase().includes(search.toLowerCase())).map(f => {
                                        const s = STATUT_FAC[f.statut]
                                        return <tr key={f.id}><td style={{ fontWeight: 700 }}>{f.numero}</td><td style={{ color: 'var(--muted)' }}>{f.projet_nom ?? '—'}</td><td style={{ color: 'var(--muted)' }}>{f.client_nom ?? '—'}</td><td style={{ fontWeight: 700 }}>{Number(f.montant_ttc).toLocaleString()} DA</td><td><span className={s?.cls ?? 'tag neutral'}>{s?.label ?? f.statut}</span></td><td style={{ color: 'var(--muted)' }}>{f.date_echeance || '—'}</td></tr>
                                    })}
                                </tbody></table></div>
                        )}

                        {/* ── Devis ── */}
                        {section === 'devis' && (
                            devis.length === 0
                                ? <div className="empty-state"><div className="empty-icon" style={{ background: '#ECFDF5' }}><ClipboardList size={24} color="#10B981" /></div><div className="empty-title">Aucun devis</div><div className="empty-sub">Les devis créés dans Finances apparaîtront ici</div></div>
                                : <div className="card"><table className="tbl"><thead><tr><th>Numéro</th><th>Projet</th><th>Client</th><th>Montant TTC</th><th>Statut</th><th>Validité</th></tr></thead><tbody>
                                    {devis.filter(d => !search || d.numero?.toLowerCase().includes(search.toLowerCase()) || d.projet_nom?.toLowerCase().includes(search.toLowerCase())).map(d => {
                                        const s = STATUT_DEV[d.statut]
                                        return <tr key={d.id}><td style={{ fontWeight: 700 }}>{d.numero}</td><td style={{ color: 'var(--muted)' }}>{d.projet_nom ?? '—'}</td><td style={{ color: 'var(--muted)' }}>{d.client_nom ?? '—'}</td><td style={{ fontWeight: 700 }}>{Number(d.montant_ttc).toLocaleString()} DA</td><td><span className={s?.cls ?? 'tag neutral'}>{s?.label ?? d.statut}</span></td><td style={{ color: 'var(--muted)' }}>{d.date_validite || '—'}</td></tr>
                                    })}
                                </tbody></table></div>
                        )}

                        {/* ── Contrats ── */}
                        {section === 'contrats' && (
                            contrats.length === 0
                                ? <div className="empty-state"><div className="empty-icon" style={{ background: 'var(--indigo-soft)' }}><FileSignature size={24} color="var(--indigo)" /></div><div className="empty-title">Aucun contrat</div><div className="empty-sub">Les contrats créés dans Contrats apparaîtront ici</div></div>
                                : <div className="card"><table className="tbl"><thead><tr><th>Numéro</th><th>Projet</th><th>Type</th><th>Statut</th><th>Objet</th><th>Date signature</th></tr></thead><tbody>
                                    {contrats.filter(c => !search || c.numero?.toLowerCase().includes(search.toLowerCase()) || c.projet_nom?.toLowerCase().includes(search.toLowerCase())).map(c => {
                                        const s = STATUT_CONT[c.statut]
                                        return <tr key={c.id}><td style={{ fontWeight: 700 }}>{c.numero}</td><td style={{ color: 'var(--muted)' }}>{c.projet_nom ?? '—'}</td><td><span className="tag indigo">{c.type === 'AVENANT' ? 'Avenant' : 'Contrat'}</span></td><td><span className={s?.cls ?? 'tag neutral'}>{s?.label ?? c.statut}</span></td><td style={{ color: 'var(--muted)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.objet || '—'}</td><td style={{ color: 'var(--muted)' }}>{c.date_signature || '—'}</td></tr>
                                    })}
                                </tbody></table></div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Modal: nouvelle version ── */}
            {openVersion && viewDoc && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 200, backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => { setOpenVersion(false); setVersionFichier(null); setVersionCommentaire('') }}>
                    <div style={{ background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: 460, boxShadow: '0 24px 80px rgba(0,0,0,0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--indigo-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Upload size={20} color="var(--indigo)" />
                                </div>
                                <div>
                                    <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.3px' }}>Nouvelle version</div>
                                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>{viewDoc.nom} · v{(viewDoc.versions?.length ?? 0) + 1}</div>
                                </div>
                            </div>
                            <button onClick={() => { setOpenVersion(false); setVersionFichier(null); setVersionCommentaire('') }} style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--bg)', border: '1px solid var(--line)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
                                <X size={15} />
                            </button>
                        </div>
                        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div className="field" style={{ marginBottom: 0 }}>
                                <label>Fichier</label>
                                <div onClick={() => document.getElementById('version-file-input').click()}
                                    style={{ border: `2px dashed ${versionFichier ? 'var(--indigo)' : 'var(--line)'}`, borderRadius: 10, padding: 20, textAlign: 'center', cursor: 'pointer', background: versionFichier ? 'var(--indigo-soft)' : 'var(--bg)' }}>
                                    <Upload size={20} color={versionFichier ? 'var(--indigo)' : 'var(--muted)'} style={{ margin: '0 auto 8px' }} />
                                    <div style={{ fontWeight: 600, fontSize: 13, color: versionFichier ? 'var(--indigo)' : 'var(--muted)' }}>
                                        {versionFichier ? versionFichier.name : 'Cliquez pour sélectionner'}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>PDF, DWG, DOC — max 10MB</div>
                                    <input id="version-file-input" type="file" accept=".pdf,.dwg,.doc,.docx,.jpg,.png" style={{ display: 'none' }} onChange={e => setVersionFichier(e.target.files[0])} />
                                </div>
                            </div>
                            <div className="field" style={{ marginBottom: 0 }}>
                                <label>Commentaire <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(optionnel)</span></label>
                                <input value={versionCommentaire} onChange={e => setVersionCommentaire(e.target.value)} placeholder="Ex: Correction suite visa bureau de contrôle" />
                            </div>
                        </div>
                        <div style={{ padding: '0 28px 24px', display: 'flex', gap: 10 }}>
                            <button onClick={() => { setOpenVersion(false); setVersionFichier(null); setVersionCommentaire('') }} style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid var(--line)', background: 'var(--surface)', fontSize: 13, fontWeight: 600, color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
                            <button style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: !versionFichier ? 'var(--bg-2)' : 'var(--grad)', color: !versionFichier ? 'var(--muted)' : '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: !versionFichier || versionMutation.isPending ? 'not-allowed' : 'pointer', boxShadow: versionFichier ? '0 4px 14px rgba(17,0,255,0.25)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
                                onClick={() => versionMutation.mutate()} disabled={!versionFichier || versionMutation.isPending}>
                                {versionMutation.isPending ? 'Upload...' : 'Uploader la version'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal: nouveau document ── */}
            {open && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 200, backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setOpen(false)}>
                    <div style={{ background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: 500, boxShadow: '0 24px 80px rgba(0,0,0,0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--indigo-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FolderOpen size={20} color="var(--indigo)" />
                                </div>
                                <div>
                                    <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.3px' }}>Nouveau document</div>
                                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>Plan, permis, rapport ou contrat</div>
                                </div>
                            </div>
                            <button onClick={() => setOpen(false)} style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--bg)', border: '1px solid var(--line)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
                                <X size={15} />
                            </button>
                        </div>
                        <div style={{ padding: '24px 28px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
                            {!projetId && (
                                <div className="field">
                                    <label>Projet <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span></label>
                                    <select value={form.projet} onChange={e => setForm(f => ({ ...f, projet: e.target.value }))}>
                                        <option value="">Sélectionner un projet</option>
                                        {projetsList.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                                    </select>
                                </div>
                            )}
                            <div className="field"><label>Nom</label><input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} /></div>
                            <div className="field">
                                <label>Type</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {TYPES.map(t => {
                                        const cfg = TYPE_CONFIG[t]
                                        const Ico = cfg.icon
                                        return (
                                            <button key={t} onClick={() => setForm(f => ({ ...f, type_document: t }))}
                                                style={{ padding: '7px 11px', borderRadius: 9, cursor: 'pointer', background: form.type_document === t ? cfg.bg : 'var(--bg)', border: `1.5px solid ${form.type_document === t ? cfg.color : 'var(--line)'}`, color: form.type_document === t ? cfg.color : 'var(--muted)', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit' }}>
                                                <Ico size={12} /> {cfg.label}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                            <div className="field"><label>Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} style={{ resize: 'vertical' }} /></div>
                            <div className="field" style={{ marginBottom: 0 }}>
                                <label>Fichier (PDF)</label>
                                <div onClick={() => document.getElementById('file-input').click()}
                                    style={{ border: `2px dashed ${fichier ? 'var(--indigo)' : 'var(--line)'}`, borderRadius: 10, padding: 20, textAlign: 'center', cursor: 'pointer', background: fichier ? 'var(--indigo-soft)' : 'var(--bg)' }}>
                                    <Upload size={20} color={fichier ? 'var(--indigo)' : 'var(--muted)'} style={{ margin: '0 auto 8px' }} />
                                    <div style={{ fontWeight: 600, fontSize: 13, color: fichier ? 'var(--indigo)' : 'var(--muted)' }}>
                                        {fichier ? fichier.name : 'Cliquez pour sélectionner un fichier'}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>PDF, DWG, DOC — max 10MB</div>
                                    <input id="file-input" type="file" accept=".pdf,.dwg,.doc,.docx,.jpg,.png" style={{ display: 'none' }} onChange={e => setFichier(e.target.files[0])} />
                                </div>
                            </div>
                        </div>
                        <div style={{ padding: '16px 28px 24px', borderTop: '1px solid var(--line)', display: 'flex', gap: 10, flexShrink: 0 }}>
                            <button onClick={() => setOpen(false)} style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid var(--line)', background: 'var(--surface)', fontSize: 13, fontWeight: 600, color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
                            {(() => {
                                const disabled = mutation.isPending || !form.nom || !(projetId || form.projet)
                                return (
                                    <button style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: disabled ? 'var(--bg-2)' : 'var(--grad)', color: disabled ? 'var(--muted)' : '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: disabled ? 'not-allowed' : 'pointer', boxShadow: disabled ? 'none' : '0 4px 14px rgba(17,0,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
                                        onClick={() => !disabled && mutation.mutate(form)} disabled={disabled}>
                                        {mutation.isPending ? 'Upload...' : 'Uploader'}
                                    </button>
                                )
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    )
}
