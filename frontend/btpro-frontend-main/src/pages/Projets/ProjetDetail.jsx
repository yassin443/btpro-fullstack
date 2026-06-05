import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, MapPin, Calendar, CheckCircle, Plus, X, FileText, Pencil, Trash2, Users, Receipt, ClipboardList } from 'lucide-react'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import useStore from '../../store/useStore'
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
const TYPES = ['LOGEMENT','COMMERCE','INDUSTRIEL','EQUIPEMENT','PAYSAGISME','AUTRE']

const STATUTS_PROJET = {
    EN_COURS: { label: 'En cours', badge: 'tag indigo' },
    TERMINE:  { label: 'Terminé',  badge: 'tag green' },
    SUSPENDU: { label: 'Suspendu', badge: 'tag amber' },
    ANNULE:   { label: 'Annulé',   badge: 'tag red' },
}

const PHASES_ORDRE = ['ESQUISSE', 'APS', 'APD', 'PRO', 'DCE', 'EXECUTION', 'RECEPTION']
const PHASE_CONFIG = {
    ESQUISSE:  { label: 'Esquisse' },
    APS:       { label: 'Avant-projet sommaire' },
    APD:       { label: 'Avant-projet détaillé' },
    PRO:       { label: 'Projet' },
    DCE:       { label: 'Dossier DCE' },
    EXECUTION: { label: 'Exécution' },
    RECEPTION: { label: 'Réception' },
}

const ST_TYPES = [
    { key: 'BET_STRUCTURE', label: 'BET Structure' }, { key: 'BET_FLUIDES', label: 'BET Fluides' },
    { key: 'ECONOMISTE', label: 'Économiste' }, { key: 'GEOMETRE', label: 'Géomètre' },
    { key: 'GEOTECHNIQUE', label: 'Géotechnique' }, { key: 'ELECTRICIEN', label: 'Électricien' },
    { key: 'PLOMBIER', label: 'Plombier' }, { key: 'MENUISIER', label: 'Menuisier' },
    { key: 'PEINTRE', label: 'Peintre' }, { key: 'AUTRE', label: 'Autre' },
]
const ST_STATUTS = {
    ACTIF:    { label: 'Actif',     cls: 'tag indigo' },
    TERMINE:  { label: 'Terminé',  cls: 'tag green'  },
    SUSPENDU: { label: 'Suspendu', cls: 'tag neutral' },
}
const EMPTY_ST = { nom: '', type_prestation: 'BET_STRUCTURE', telephone: '', email: '', montant: '', statut: 'ACTIF', date_debut: '', date_fin: '', notes: '' }

const AVATAR_COLORS = ['indigo', 'green', 'terra', 'amber']

const PRIORITE_COLOR = { URGENTE: '#EF4444', HAUTE: '#F59E0B', NORMALE: 'var(--indigo)', BASSE: '#94A3B8' }
const STATUT_TACHE_LABEL = { A_FAIRE: 'À faire', EN_COURS: 'En cours', EN_REVIEW: 'En révision', TERMINE: 'Terminé', ANNULE: 'Annulé' }
const STATUT_TACHE_CLS   = { A_FAIRE: 'tag neutral', EN_COURS: 'tag indigo', EN_REVIEW: 'tag amber', TERMINE: 'tag green', ANNULE: 'tag red' }


const fmtDA = (n) => {
    if (!n) return '—'
    const num = Number(n)
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)} M DA`
    if (num >= 1_000) return `${(num / 1_000).toFixed(0)} K DA`
    return `${num.toLocaleString()} DA`
}

export default function ProjetDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { user: currentUser } = useStore()
    const isPatron = currentUser?.is_patron === true

    const [tab, setTab] = useState('apercu')
    const [openPhase, setOpenPhase] = useState(false)
    const [phaseForm, setPhaseForm] = useState({ nom: 'ESQUISSE', date_debut: '', date_fin: '' })
    const [showStatusMenu, setShowStatusMenu] = useState(false)
    const [openEdit, setOpenEdit] = useState(false)
    const [editForm, setEditForm] = useState({})
    const [openST, setOpenST] = useState(false)
    const [editST, setEditST] = useState(null)
    const [stForm, setStForm] = useState(EMPTY_ST)

    const [confirmDelete, setConfirmDelete] = useState(false)
    const [confirmAnnuler, setConfirmAnnuler] = useState(false)
    const [confirmSTId, setConfirmSTId] = useState(null)
    const [editPhase, setEditPhase] = useState(null)
    const [editPhaseForm, setEditPhaseForm] = useState({ nom: 'ESQUISSE', date_debut: '', date_fin: '' })
    const [confirmDeletePhaseId, setConfirmDeletePhaseId] = useState(null)
    const [facturePhaseModal, setFacturePhaseModal] = useState(null)

    const [addingTachePhaseId, setAddingTachePhaseId] = useState(null)
    const [tacheForm, setTacheForm] = useState({ titre: '', assignee: '', priorite: 'NORMALE', deadline: '' })

    const projId = Number(id)

    const { data: projet, isLoading } = useQuery({ queryKey: ['projet', id], queryFn: () => api.get(`/projets/${id}/`).then(r => r.data) })
    const { data: phases } = useQuery({ queryKey: ['phases', id], queryFn: () => api.get(`/projets/${id}/phases/`).then(r => r.data) })
    const { data: facturesProjet = [] } = useQuery({ queryKey: ['factures-projet', id], queryFn: () => api.get(`/finances/factures/?projet=${id}`).then(r => r.data), enabled: isPatron })
    const { data: allST = [] } = useQuery({ queryKey: ['sous-traitants'], queryFn: () => api.get('/projets/sous-traitants/').then(r => r.data), enabled: isPatron })
    const { data: membres = [] } = useQuery({ queryKey: ['membres'], queryFn: () => api.get('/users/membres/').then(r => r.data) })
    const { data: toutesLesTaches = [] } = useQuery({
        queryKey: ['taches-projet', id],
        queryFn: () => api.get(`/projets/taches/?projet=${id}`).then(r => r.data),
    })
    const tachesParPhase = toutesLesTaches.reduce((acc, t) => {
        if (!acc[t.phase]) acc[t.phase] = []
        acc[t.phase].push(t)
        return acc
    }, {})

    const facturesParPhase = facturesProjet.reduce((acc, f) => {
        const key = f.phase ?? '__sans_phase__'
        if (!acc[key]) acc[key] = []
        acc[key].push(f)
        return acc
    }, {})

    const projST = allST.filter(st => Number(st.projet) === projId)

    const updateStatut = useMutation({
        mutationFn: (statut) => api.put(`/projets/${id}/`, { statut }),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projet', id] }); queryClient.invalidateQueries({ queryKey: ['projets'] }); setShowStatusMenu(false) }
    })
    const editMutation = useMutation({
        mutationFn: (data) => api.put(`/projets/${id}/`, data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projet', id] }); queryClient.invalidateQueries({ queryKey: ['projets'] }); setOpenEdit(false) }
    })
    const deleteMutation = useMutation({
        mutationFn: () => api.delete(`/projets/${id}/`),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projets'] }); navigate('/projets') }
    })

    const phaseMutation = useMutation({
        mutationFn: (data) => api.post(`/projets/${id}/phases/`, data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['phases', id] }); setOpenPhase(false); setPhaseForm({ nom: 'ESQUISSE', date_debut: '', date_fin: '' }) }
    })
    const completePhase = useMutation({
        mutationFn: (phaseId) => api.put(`/projets/phases/${phaseId}/`, { complete: true }),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['phases', id] }); queryClient.invalidateQueries({ queryKey: ['projet', id] }); queryClient.invalidateQueries({ queryKey: ['projets'] }) }
    })
    const updatePhaseMutation = useMutation({
        mutationFn: ({ phaseId, data }) => api.put(`/projets/phases/${phaseId}/`, data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['phases', id] }); queryClient.invalidateQueries({ queryKey: ['projet', id] }); queryClient.invalidateQueries({ queryKey: ['projets'] }); setEditPhase(null) }
    })
    const deletePhaseMutation = useMutation({
        mutationFn: (phaseId) => api.delete(`/projets/phases/${phaseId}/`),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['phases', id] }); queryClient.invalidateQueries({ queryKey: ['projet', id] }); queryClient.invalidateQueries({ queryKey: ['projets'] }); setConfirmDeletePhaseId(null) }
    })

    const createSTMutation = useMutation({
        mutationFn: (data) => api.post('/projets/sous-traitants/', { ...data, projet: projId }),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sous-traitants'] }); setOpenST(false); setStForm(EMPTY_ST) }
    })
    const editSTMutation = useMutation({
        mutationFn: ({ stId, data }) => api.put(`/projets/sous-traitants/${stId}/`, data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sous-traitants'] }); setOpenST(false); setEditST(null); setStForm(EMPTY_ST) }
    })
    const deleteSTMutation = useMutation({
        mutationFn: (stId) => api.delete(`/projets/sous-traitants/${stId}/`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sous-traitants'] })
    })

    const createTacheMutation = useMutation({
        mutationFn: ({ phaseId, data }) => api.post(`/projets/${phaseId}/taches/`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['taches-projet', id] })
            queryClient.invalidateQueries({ queryKey: ['mes-taches'] })
            setAddingTachePhaseId(null)
            setTacheForm({ titre: '', assignee: '', priorite: 'NORMALE', deadline: '' })
        },
    })
    const deleteTacheMutation = useMutation({
        mutationFn: (tacheId) => api.delete(`/projets/taches/${tacheId}/`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['taches-projet', id] })
            queryClient.invalidateQueries({ queryKey: ['mes-taches'] })
        },
    })

    const facturePhasesMutation = useMutation({
        mutationFn: ({ docType, phaseId, montantHT, clientId, phaseLabel }) => {
            const validite = new Date(); validite.setDate(validite.getDate() + 30)
            const payload = {
                client: clientId, projet: projId,
                remise: 0, conditions_paiement: '30J',
                date_validite: validite.toISOString().split('T')[0],
                lignes: [{ designation: `Honoraires — Phase ${phaseLabel}`, quantite: 1, prix_unitaire: montantHT, tva: 0 }],
            }
            if (docType === 'facture') payload.phase = phaseId
            return api.post(docType === 'devis' ? '/finances/devis/' : '/finances/factures/', payload)
        },
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: [vars.docType === 'devis' ? 'devis' : 'factures'] })
            setFacturePhaseModal(null)
        },
    })

    const phasesList = phases || []
    const phasesCompletes = phasesList.filter(p => p.complete).length
    const progression = phasesList.length > 0 ? Math.round((phasesCompletes / phasesList.length) * 100) : 0
    const honorairesBase = Number(projet?.devis_accepte?.montant_ttc || projet?.honoraires_total || 0)

    if (isLoading) return <Layout><div className="page" style={{ textAlign: 'center', color: 'var(--muted)' }}>Chargement...</div></Layout>

    const effectiveStatut = (phasesList.length > 0 && progression === 100) ? 'TERMINE' : projet?.statut
    const sp = projet ? (STATUTS_PROJET[effectiveStatut] ?? {}) : {}

    return (
        <Layout>
            <div className="page">

                {/* ── Actions bar ── */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
                    <button
                        onClick={() => navigate('/projets')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--muted)', padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        <ArrowLeft size={15} /> Projets
                    </button>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button className="btn" style={{ color: 'var(--red)', borderColor: 'var(--red-soft)' }} onClick={() => setConfirmDelete(true)}>
                            <Trash2 size={14} /> Supprimer
                        </button>
                        <button className="btn" onClick={() => { setEditForm({ nom: projet?.nom || '', type_projet: projet?.type_projet || 'LOGEMENT', wilaya: projet?.wilaya || '', adresse_chantier: projet?.adresse_chantier || '', date_debut: projet?.date_debut || '' }); setOpenEdit(true) }}>
                            <Pencil size={14} /> Modifier
                        </button>
                        {effectiveStatut !== 'TERMINE' && (
                            <div style={{ position: 'relative' }}>
                                <button className="btn" onClick={() => setShowStatusMenu(s => !s)}>⋯ Statut</button>
                                {showStatusMenu && (
                                    <>
                                        <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowStatusMenu(false)} />
                                        <div style={{ position: 'absolute', top: '110%', right: 0, zIndex: 100, background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--line)', boxShadow: '0 12px 40px rgba(0,0,0,0.14)', minWidth: 190, overflow: 'hidden' }}>
                                            {effectiveStatut !== 'EN_COURS' && (
                                                <button onClick={() => updateStatut.mutate('EN_COURS')} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '13px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--indigo)', fontFamily: 'inherit' }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--indigo-soft)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--indigo)', flexShrink: 0 }} />Remettre en cours
                                                </button>
                                            )}
                                            {effectiveStatut !== 'SUSPENDU' && (
                                                <button onClick={() => updateStatut.mutate('SUSPENDU')} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '13px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--amber)', fontFamily: 'inherit' }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--amber-soft)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--amber)', flexShrink: 0 }} />Suspendre le projet
                                                </button>
                                            )}
                                            {effectiveStatut !== 'ANNULE' && (
                                                <button onClick={() => { setShowStatusMenu(false); setConfirmAnnuler(true) }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '13px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--red)', fontFamily: 'inherit' }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--red-soft)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--red)', flexShrink: 0 }} />Annuler le projet
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                        <button className="btn accent" onClick={() => setOpenPhase(true)}>
                            <Plus size={15} /> Phase
                        </button>
                    </div>
                </div>

                {/* ── Hero card ── */}
                <div className="pd-hero">
                    <div className="pd-hero-content">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <span className="pd-eyebrow">PROJET · {projet?.type_projet}</span>
                            <span className={sp.badge ?? 'tag neutral'}>
                                <span className="dot" />{sp.label ?? effectiveStatut}
                            </span>
                        </div>
                        <h2>{projet?.nom}</h2>
                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                            {projet?.client?.nom && <>{projet.client.nom} · </>}{projet?.wilaya}
                        </div>
                        <div className="pd-hero-meta">
                            <div className="pd-meta-cell">
                                <div className="lab">Avancement</div>
                                <div className="val" style={{ fontFamily: 'var(--mono)' }}>{progression}%</div>
                            </div>
                            <div className="pd-meta-cell">
                                <div className="lab">Phases</div>
                                <div className="val">{phasesCompletes} / {phasesList.length}</div>
                            </div>
                            {membres.length > 0 && (
                                <div className="pd-meta-cell">
                                    <div className="lab">Équipe</div>
                                    <div className="val">{membres.length} collaborateurs</div>
                                </div>
                            )}
                            {projet?.date_debut && (
                                <div className="pd-meta-cell">
                                    <div className="lab">Début</div>
                                    <div className="val" style={{ fontFamily: 'var(--mono)' }}>{projet.date_debut}</div>
                                </div>
                            )}
                            {projet?.date_fin_prevue && (
                                <div className="pd-meta-cell">
                                    <div className="lab">Livraison</div>
                                    <div className="val" style={{ fontFamily: 'var(--mono)' }}>{projet.date_fin_prevue}</div>
                                </div>
                            )}
                            {isPatron && (projet?.devis_accepte?.montant_ttc || projet?.honoraires_total) && (
                                <div className="pd-meta-cell">
                                    <div className="lab">Honoraires{projet?.devis_accepte ? ' (devis accepté)' : ''}</div>
                                    <div className="val" style={{ fontFamily: 'var(--mono)' }}>{fmtDA(projet.devis_accepte?.montant_ttc || projet.honoraires_total)}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Tabs ── */}
                <div className="tabs">
                    <button className={tab === 'apercu' ? 'active' : ''} onClick={() => setTab('apercu')}>Aperçu</button>
                    <button className={tab === 'phases' ? 'active' : ''} onClick={() => setTab('phases')}>
                        Phases <span style={{ opacity: 0.55, fontSize: 11, fontFamily: 'var(--mono)' }}>· {phasesList.length}</span>
                    </button>
                    {isPatron && (
                        <button className={tab === 'st' ? 'active' : ''} onClick={() => setTab('st')}>
                            Sous-traitants <span style={{ opacity: 0.55, fontSize: 11, fontFamily: 'var(--mono)' }}>· {projST.length}</span>
                        </button>
                    )}
                </div>

                {/* ── Aperçu ── */}
                {tab === 'apercu' && (
                    <div className="grid-66-33">
                        {/* Left: phases overview */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div className="card">
                                <div className="card-head">
                                    <div className="card-title">Phases du projet</div>
                                    <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
                                        {phasesCompletes} / {phasesList.length} terminées
                                    </div>
                                </div>
                                {phasesList.length === 0 ? (
                                    <div className="card-body" style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, paddingTop: 28, paddingBottom: 28 }}>
                                        Aucune phase —{' '}
                                        <button onClick={() => setOpenPhase(true)} style={{ background: 'none', border: 'none', color: 'var(--indigo)', fontWeight: 600, cursor: 'pointer', fontSize: 13, padding: 0, fontFamily: 'inherit' }}>
                                            Ajouter
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ padding: '0 18px' }}>
                                        {phasesList.map((ph, i) => {
                                            const isCurrent = !ph.complete && phasesList.slice(0, i).every(p => p.complete)
                                            const v = ph.complete ? 100 : 0
                                            const meterCls = 'meter' + (ph.complete ? ' green' : isCurrent ? ' indigo' : '')
                                            const isLast = i === phasesList.length - 1
                                            return (
                                                <div key={ph.id} className="gantt-row" style={{ paddingTop: 12, paddingBottom: 12, borderBottom: isLast ? 'none' : '1px solid var(--line)' }}>
                                                    <div>
                                                        <div style={{ fontWeight: isCurrent ? 600 : 500, fontSize: 13, color: ph.complete ? 'var(--muted)' : 'var(--ink)', textDecoration: ph.complete ? 'line-through' : 'none', textDecorationColor: 'var(--line)' }}>
                                                            {PHASE_CONFIG[ph.nom]?.label ?? ph.nom}
                                                        </div>
                                                        {(ph.date_debut || ph.date_fin) && (
                                                            <div style={{ fontSize: 10.5, color: 'var(--muted)', fontFamily: 'var(--mono)', marginTop: 2 }}>
                                                                {ph.date_debut}{ph.date_debut && ph.date_fin ? ' → ' : ''}{ph.date_fin}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className={meterCls}>
                                                            <span style={{ width: v + '%' }} />
                                                        </div>
                                                        <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 4, fontFamily: 'var(--mono)' }}>
                                                            {ph.complete ? 'Terminée' : isCurrent ? 'En cours' : '—'}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: info + équipe */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div className="card">
                                <div className="card-head">
                                    <div className="card-title">Informations</div>
                                </div>
                                <div style={{ padding: '4px 18px 16px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                        <div>
                                            <div style={{ color: 'var(--muted)', textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.06em', fontWeight: 600 }}>Type</div>
                                            <div style={{ marginTop: 3, fontSize: 12.5, fontWeight: 500 }}>{projet?.type_projet || '—'}</div>
                                        </div>
                                        <div>
                                            <div style={{ color: 'var(--muted)', textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.06em', fontWeight: 600 }}>Wilaya</div>
                                            <div style={{ marginTop: 3, fontSize: 12.5, fontWeight: 500 }}>{projet?.wilaya || '—'}</div>
                                        </div>
                                        <div>
                                            <div style={{ color: 'var(--muted)', textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.06em', fontWeight: 600 }}>Début</div>
                                            <div style={{ marginTop: 3, fontSize: 11.5, fontFamily: 'var(--mono)', color: 'var(--ink)' }}>{projet?.date_debut || '—'}</div>
                                        </div>
                                        <div>
                                            <div style={{ color: 'var(--muted)', textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.06em', fontWeight: 600 }}>Livraison prévue</div>
                                            <div style={{ marginTop: 3, fontSize: 11.5, fontFamily: 'var(--mono)', color: 'var(--ink)' }}>{projet?.date_fin_prevue || '—'}</div>
                                        </div>
                                    </div>
                                    {projet?.adresse_chantier && (
                                        <div style={{ marginTop: 14, padding: '10px 12px', background: 'var(--bg)', borderRadius: 8, fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                                            <MapPin size={11} style={{ marginTop: 2, flexShrink: 0 }} />
                                            <span>{projet.adresse_chantier}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {membres.length > 0 && (
                                <div className="card">
                                    <div className="card-head">
                                        <div className="card-title">Équipe</div>
                                    </div>
                                    <div style={{ paddingBottom: 8 }}>
                                        {membres.slice(0, 5).map((m, i) => (
                                            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 18px' }}>
                                                <div className={`avatar ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`} style={{ width: 34, height: 34, fontSize: 12 }}>
                                                    {((m.prenom?.[0] || '') + (m.nom?.[0] || '')).toUpperCase() || m.email?.[0]?.toUpperCase() || '?'}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: 12.5, fontWeight: 500 }}>{m.prenom} {m.nom}</div>
                                                    <div style={{ fontSize: 10.5, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.role || m.email}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Phases (management) ── */}
                {tab === 'phases' && (
                    phasesList.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon" style={{ background: 'var(--indigo-soft)' }}><FileText size={24} color="var(--indigo)" /></div>
                            <div className="empty-title">Aucune phase</div>
                            <div className="empty-sub">Ajoutez les phases de votre projet</div>
                            <button className="btn accent" onClick={() => setOpenPhase(true)}><Plus size={14} /> Ajouter une phase</button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {phasesList.map((phase, idx) => {
                                const isLast    = idx === phasesList.length - 1
                                const isCurrent = !phase.complete && phasesList.slice(0, idx).every(p => p.complete)

                                const nodeColor  = phase.complete ? 'var(--green)' : isCurrent ? 'var(--indigo)' : 'var(--line)'
                                const nodeBg     = phase.complete ? 'var(--green)' : isCurrent ? 'var(--indigo)' : 'var(--bg)'
                                const lineColor  = phase.complete ? 'var(--green)' : 'var(--line)'
                                const cardBorder = phase.complete ? 'var(--green-soft)' : isCurrent ? 'var(--indigo-soft)' : 'var(--line)'
                                const cardAccent = phase.complete ? 'var(--green)' : isCurrent ? 'var(--indigo)' : 'var(--line)'

                                return (
                                    <div key={phase.id} style={{ display: 'flex', gap: 0, alignItems: 'stretch' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 48, flexShrink: 0, paddingTop: 4 }}>
                                            <div style={{
                                                width: 32, height: 32, borderRadius: '50%',
                                                background: nodeBg,
                                                border: `2px solid ${nodeColor}`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                flexShrink: 0, zIndex: 1,
                                                boxShadow: isCurrent ? '0 0 0 4px rgba(17,0,255,0.08)' : 'none',
                                            }}>
                                                {phase.complete
                                                    ? <CheckCircle size={15} color="#fff" strokeWidth={2.5} style={{ fill: 'var(--green)' }} />
                                                    : <span style={{ fontSize: 12, fontWeight: 700, color: isCurrent ? '#fff' : 'var(--muted)' }}>{idx + 1}</span>
                                                }
                                            </div>
                                            {!isLast && (
                                                <div style={{ width: 2, flex: 1, minHeight: 16, marginTop: 4, marginBottom: 4, background: lineColor, borderRadius: 2 }} />
                                            )}
                                        </div>

                                        <div style={{
                                            flex: 1, marginBottom: isLast ? 0 : 10, marginLeft: 10,
                                            background: 'var(--surface)', borderRadius: 14, overflow: 'hidden',
                                            border: `1px solid ${cardBorder}`,
                                            boxShadow: isCurrent ? '0 2px 8px rgba(17,0,255,0.06)' : '0 1px 2px rgba(0,0,0,0.04)',
                                            display: 'flex',
                                        }}>
                                            <div style={{ width: 3, background: cardAccent, flexShrink: 0 }} />
                                            <div style={{ flex: 1, padding: '14px 16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 5 }}>
                                                            <span style={{
                                                                fontSize: 14, fontWeight: 700,
                                                                color: phase.complete ? 'var(--muted)' : 'var(--ink)',
                                                                textDecoration: phase.complete ? 'line-through' : 'none',
                                                                textDecorationColor: 'var(--line)',
                                                            }}>
                                                                {PHASE_CONFIG[phase.nom]?.label ?? phase.nom}
                                                            </span>
                                                            {phase.complete && <span className="tag green"><span className="dot" />Terminée</span>}
                                                            {isCurrent && <span className="tag indigo"><span className="dot" />En cours</span>}
                                                        </div>
                                                        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                                                            {phase.date_debut && (
                                                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--muted)' }}>
                                                                    <Calendar size={11} />
                                                                    {phase.date_debut}
                                                                    {phase.date_fin && <><span style={{ margin: '0 2px' }}>→</span>{phase.date_fin}</>}
                                                                </span>
                                                            )}
                                                            {isPatron && parseFloat(phase.pourcentage_honoraires) > 0 && (
                                                                <span style={{ fontSize: 12, fontWeight: 600, color: isCurrent ? 'var(--indigo)' : 'var(--muted)' }}>
                                                                    {phase.pourcentage_honoraires}% honoraires
                                                                    {honorairesBase > 0 && (
                                                                        <span style={{ fontWeight: 400, color: 'var(--muted)', marginLeft: 4 }}>
                                                                            ({fmtDA(Math.round(parseFloat(phase.pourcentage_honoraires) / 100 * honorairesBase))})
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            )}
                                                            {isPatron && honorairesBase > 0 && (() => {
                                                                const montantPhase = Math.round(parseFloat(phase.pourcentage_honoraires || 0) / 100 * honorairesBase)
                                                                if (!montantPhase) return null
                                                                const facs = facturesParPhase[phase.id] || []
                                                                const encaisse = facs.filter(f => f.statut === 'SOLDEE').reduce((s, f) => s + Number(f.montant_ttc), 0)
                                                                const facture = facs.reduce((s, f) => s + Number(f.montant_ttc), 0)
                                                                const reste = montantPhase - encaisse
                                                                if (facs.length === 0) return null
                                                                const soldee = encaisse >= montantPhase
                                                                return (
                                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600 }}>
                                                                        {soldee
                                                                            ? <span style={{ color: '#10B981', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 5, padding: '1px 6px' }}>✓ Soldée</span>
                                                                            : <>
                                                                                <span style={{ color: '#10B981' }}>Encaissé {fmtDA(encaisse)}</span>
                                                                                <span style={{ color: 'var(--muted)' }}>·</span>
                                                                                <span style={{ color: '#F59E0B' }}>Reste {fmtDA(reste)}</span>
                                                                              </>
                                                                        }
                                                                    </span>
                                                                )
                                                            })()}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                                        {isPatron && parseFloat(phase.pourcentage_honoraires) > 0 && honorairesBase > 0 && (
                                                            <button
                                                                onClick={() => setFacturePhaseModal({ phase, montantHT: Math.round(parseFloat(phase.pourcentage_honoraires) / 100 * honorairesBase), docType: 'devis' })}
                                                                style={{ padding: '7px 12px', borderRadius: 9, border: '1px solid var(--indigo)', background: 'var(--indigo-soft)', color: 'var(--indigo)', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit' }}>
                                                                <Receipt size={12} /> Facturer
                                                            </button>
                                                        )}
                                                        {phase.complete ? (
                                                            <button
                                                                onClick={() => updatePhaseMutation.mutate({ phaseId: phase.id, data: { complete: false } })}
                                                                style={{ padding: '7px 12px', borderRadius: 9, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit' }}>
                                                                Rouvrir
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => completePhase.mutate(phase.id)}
                                                                disabled={completePhase.isPending}
                                                                style={{ padding: '7px 12px', borderRadius: 9, border: 'none', background: isCurrent ? 'var(--green)' : 'var(--bg-2)', color: isCurrent ? '#fff' : 'var(--muted)', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit' }}>
                                                                <CheckCircle size={12} /> Terminer
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => { setEditPhase(phase); setEditPhaseForm({ nom: phase.nom, date_debut: phase.date_debut || '', date_fin: phase.date_fin || '' }) }}
                                                            style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--line)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', flexShrink: 0 }}>
                                                            <Pencil size={13} />
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmDeletePhaseId(phase.id)}
                                                            style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--line)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', flexShrink: 0 }}>
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* ── Tâches de la phase ── */}
                                                <div style={{ borderTop: '1px solid var(--line)', marginTop: 10, paddingTop: 8 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <ClipboardList size={13} color="var(--muted)" />
                                                            <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Tâches</span>
                                                            {(tachesParPhase[phase.id] || []).length > 0 && (
                                                                <span style={{ fontSize: 11, fontWeight: 700, background: 'var(--indigo-soft)', color: 'var(--indigo)', borderRadius: 20, padding: '1px 7px' }}>{(tachesParPhase[phase.id] || []).length}</span>
                                                            )}
                                                        </div>
                                                        {isPatron && addingTachePhaseId !== phase.id && (
                                                            <button
                                                                onClick={() => { setAddingTachePhaseId(phase.id); setTacheForm({ titre: '', assignee: '', priorite: 'NORMALE', deadline: '' }) }}
                                                                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: 'var(--indigo)', background: 'var(--indigo-soft)', border: '1px solid rgba(17,0,255,0.15)', borderRadius: 7, padding: '4px 9px', cursor: 'pointer', fontFamily: 'inherit' }}>
                                                                <Plus size={11} /> Tâche
                                                            </button>
                                                        )}
                                                    </div>

                                                    {(tachesParPhase[phase.id] || []).map(t => {
                                                        const assigneeMembre = membres.find(m => m.id === t.assignee)
                                                        return (
                                                            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--bg)' }}>
                                                                <div style={{ width: 7, height: 7, borderRadius: '50%', background: PRIORITE_COLOR[t.priorite] || 'var(--indigo)', flexShrink: 0 }} />
                                                                <span style={{ flex: 1, fontSize: 12.5, fontWeight: 500, color: t.statut === 'TERMINE' ? 'var(--muted)' : 'var(--ink)', textDecoration: t.statut === 'TERMINE' ? 'line-through' : 'none' }}>{t.titre}</span>
                                                                <span className={STATUT_TACHE_CLS[t.statut] || 'tag neutral'} style={{ fontSize: 10, flexShrink: 0 }}>{STATUT_TACHE_LABEL[t.statut]}</span>
                                                                {assigneeMembre && <span style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>{assigneeMembre.prenom}</span>}
                                                                {t.deadline && <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)', flexShrink: 0 }}>{t.deadline}</span>}
                                                                {isPatron && (
                                                                    <button onClick={() => deleteTacheMutation.mutate(t.id)} style={{ width: 22, height: 22, borderRadius: 6, border: '1px solid var(--line)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', flexShrink: 0 }}><Trash2 size={10} /></button>
                                                                )}
                                                            </div>
                                                        )
                                                    })}

                                                    {isPatron && addingTachePhaseId === phase.id && (
                                                        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 7 }}>
                                                            <input
                                                                autoFocus
                                                                value={tacheForm.titre}
                                                                onChange={e => setTacheForm(f => ({ ...f, titre: e.target.value }))}
                                                                onKeyDown={e => {
                                                                    if (e.key === 'Enter' && tacheForm.titre) {
                                                                        const data = { titre: tacheForm.titre, priorite: tacheForm.priorite }
                                                                        if (tacheForm.assignee) data.assignee = Number(tacheForm.assignee)
                                                                        if (tacheForm.deadline) data.deadline = tacheForm.deadline
                                                                        createTacheMutation.mutate({ phaseId: phase.id, data })
                                                                    }
                                                                }}
                                                                placeholder="Titre de la tâche *"
                                                                style={{ padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--indigo)', fontSize: 13, fontFamily: 'inherit', outline: 'none', background: 'var(--surface)', color: 'var(--ink)', width: '100%', boxSizing: 'border-box' }}
                                                            />
                                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                                <select value={tacheForm.assignee} onChange={e => setTacheForm(f => ({ ...f, assignee: e.target.value }))} style={{ flex: 1, minWidth: 120, padding: '7px 9px', borderRadius: 8, border: '1.5px solid var(--line)', fontSize: 12, fontFamily: 'inherit', background: 'var(--surface)', color: 'var(--ink)' }}>
                                                                    <option value="">Assigner à... (optionnel)</option>
                                                                    {membres.map(m => <option key={m.id} value={m.id}>{m.prenom} {m.nom}</option>)}
                                                                </select>
                                                                <select value={tacheForm.priorite} onChange={e => setTacheForm(f => ({ ...f, priorite: e.target.value }))} style={{ padding: '7px 9px', borderRadius: 8, border: '1.5px solid var(--line)', fontSize: 12, fontFamily: 'inherit', background: 'var(--surface)', color: 'var(--ink)' }}>
                                                                    <option value="BASSE">Basse</option>
                                                                    <option value="NORMALE">Normale</option>
                                                                    <option value="HAUTE">Haute</option>
                                                                    <option value="URGENTE">Urgente</option>
                                                                </select>
                                                                <input type="date" value={tacheForm.deadline} onChange={e => setTacheForm(f => ({ ...f, deadline: e.target.value }))} style={{ padding: '7px 9px', borderRadius: 8, border: '1.5px solid var(--line)', fontSize: 12, fontFamily: 'inherit', background: 'var(--surface)', color: 'var(--ink)' }} />
                                                            </div>
                                                            <div style={{ display: 'flex', gap: 6 }}>
                                                                <button onClick={() => setAddingTachePhaseId(null)} style={{ padding: '7px 14px', borderRadius: 8, border: '1.5px solid var(--line)', background: 'var(--surface)', fontSize: 12, fontWeight: 600, color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
                                                                <button
                                                                    disabled={!tacheForm.titre || createTacheMutation.isPending}
                                                                    onClick={() => {
                                                                        const data = { titre: tacheForm.titre, priorite: tacheForm.priorite }
                                                                        if (tacheForm.assignee) data.assignee = Number(tacheForm.assignee)
                                                                        if (tacheForm.deadline) data.deadline = tacheForm.deadline
                                                                        createTacheMutation.mutate({ phaseId: phase.id, data })
                                                                    }}
                                                                    style={{ flex: 1, padding: '7px 14px', borderRadius: 8, border: 'none', background: 'var(--grad)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: createTacheMutation.isPending ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: createTacheMutation.isPending ? 0.7 : 1 }}>
                                                                    {createTacheMutation.isPending ? 'Ajout...' : 'Ajouter'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )
                )}

                {/* ── Sous-traitants ── */}
                {isPatron && tab === 'st' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>Sous-traitants ({projST.length})</div>
                            <button className="btn accent" onClick={() => { setEditST(null); setStForm(EMPTY_ST); setOpenST(true) }}>
                                <Plus size={14} /> Ajouter un sous-traitant
                            </button>
                        </div>

                        {projST.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon" style={{ background: 'var(--indigo-soft)' }}><Users size={24} color="var(--indigo)" /></div>
                                <div className="empty-title">Aucun sous-traitant</div>
                                <div className="empty-sub">Ajoutez les sous-traitants intervenant sur ce projet</div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {projST.map(st => {
                                    const ss   = ST_STATUTS[st.statut]
                                    const type = ST_TYPES.find(t => t.key === st.type_prestation)
                                    return (
                                        <div key={st.id} style={{
                                            background: 'var(--surface)', borderRadius: 14,
                                            border: '1px solid var(--line)',
                                            display: 'flex', alignItems: 'stretch', overflow: 'hidden',
                                        }}>
                                            <div style={{ width: 4, background: 'var(--indigo)', flexShrink: 0 }} />
                                            <div style={{ flex: 1, padding: '14px 18px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{st.nom}</span>
                                                    <span className="tag indigo" style={{ fontSize: 10 }}>{type?.label ?? st.type_prestation}</span>
                                                    <span className={ss?.cls ?? 'tag neutral'}>{ss?.label ?? st.statut}</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
                                                    <div>
                                                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted-2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Montant contrat</div>
                                                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{Number(st.montant).toLocaleString()} DA</div>
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted-2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Paiement</div>
                                                        <div style={{ fontSize: 13, fontWeight: 700, color: st.paye ? 'var(--green)' : 'var(--amber)' }}>{st.paye ? 'Payé ✓' : 'Non payé'}</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 6, borderLeft: '1px solid var(--line)', flexShrink: 0 }}>
                                                <button onClick={() => { setEditST(st); setStForm({ nom: st.nom, type_prestation: st.type_prestation, telephone: st.telephone || '', email: st.email || '', montant: st.montant || '', statut: st.statut, date_debut: st.date_debut || '', date_fin: st.date_fin || '', notes: st.notes || '' }); setOpenST(true) }} style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid var(--line)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}><Pencil size={14} /></button>
                                                <button onClick={() => setConfirmSTId(st.id)} style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid var(--line)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Confirm modals ── */}
            <ConfirmModal
                open={confirmDelete}
                title="Supprimer ce projet ?"
                message="Cette action est irréversible. Toutes les phases et données liées seront supprimées."
                onConfirm={() => deleteMutation.mutate()}
                onCancel={() => setConfirmDelete(false)}
            />
            <ConfirmModal
                open={confirmAnnuler}
                title="Annuler ce projet ?"
                message="Le projet sera marqué comme annulé. Vous pourrez le remettre en cours si nécessaire."
                danger={false}
                onConfirm={() => updateStatut.mutate('ANNULE')}
                onCancel={() => setConfirmAnnuler(false)}
            />
            <ConfirmModal
                open={confirmSTId !== null}
                title="Supprimer ce sous-traitant ?"
                message="Cette action est irréversible."
                onConfirm={() => deleteSTMutation.mutate(confirmSTId)}
                onCancel={() => setConfirmSTId(null)}
            />
            <ConfirmModal
                open={confirmDeletePhaseId !== null}
                title="Supprimer cette phase ?"
                message="Cette action est irréversible."
                onConfirm={() => deletePhaseMutation.mutate(confirmDeletePhaseId)}
                onCancel={() => setConfirmDeletePhaseId(null)}
            />

            {/* ── Modal: facturer une phase ── */}
            {facturePhaseModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 200, backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setFacturePhaseModal(null)}>
                    <div style={{ background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: 440, boxShadow: '0 24px 80px rgba(0,0,0,0.2)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '22px 26px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--indigo-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Receipt size={20} color="var(--indigo)" /></div>
                                <div>
                                    <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.3px' }}>Facturer la phase</div>
                                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>{PHASE_CONFIG[facturePhaseModal.phase.nom]?.label ?? facturePhaseModal.phase.nom} — {facturePhaseModal.phase.pourcentage_honoraires}% honoraires</div>
                                </div>
                            </div>
                            <button onClick={() => setFacturePhaseModal(null)} style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--bg)', border: '1px solid var(--line)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}><X size={15} /></button>
                        </div>
                        <div style={{ padding: '20px 26px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div className="field">
                                <label>Type de document</label>
                                <select value={facturePhaseModal.docType} onChange={e => setFacturePhaseModal(m => ({ ...m, docType: e.target.value }))}>
                                    <option value="devis">Devis</option>
                                    <option value="facture">Facture</option>
                                </select>
                            </div>
                            <div className="field">
                                <label>Montant HT (DA)</label>
                                <input
                                    type="number"
                                    value={facturePhaseModal.montantHT}
                                    onChange={e => setFacturePhaseModal(m => ({ ...m, montantHT: e.target.value }))}
                                />
                            </div>
                            <div style={{ background: 'var(--indigo-soft)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: 'var(--indigo)' }}>
                                Le document sera créé avec une ligne <strong>{PHASE_CONFIG[facturePhaseModal.phase.nom]?.label ?? facturePhaseModal.phase.nom}</strong> et lié à cette phase. Vous pourrez l'éditer dans Finances.
                            </div>
                        </div>
                        <div style={{ padding: '14px 26px 22px', borderTop: '1px solid var(--line)', display: 'flex', gap: 10 }}>
                            <button onClick={() => setFacturePhaseModal(null)} style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid var(--line)', background: 'var(--surface)', fontSize: 13, fontWeight: 600, color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
                            <button
                                disabled={facturePhasesMutation.isPending || !facturePhaseModal.montantHT}
                                onClick={() => facturePhasesMutation.mutate({ docType: facturePhaseModal.docType, phaseId: facturePhaseModal.phase.id, montantHT: Number(facturePhaseModal.montantHT), clientId: projet.client, phaseLabel: PHASE_CONFIG[facturePhaseModal.phase.nom]?.label ?? facturePhaseModal.phase.nom })}
                                style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: 'var(--grad)', color: 'white', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: facturePhasesMutation.isPending ? 'not-allowed' : 'pointer', opacity: facturePhasesMutation.isPending ? 0.7 : 1 }}>
                                {facturePhasesMutation.isPending ? 'Création...' : `Créer le ${facturePhaseModal.docType}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal: nouvelle phase ── */}
            {openPhase && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 200, backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setOpenPhase(false)}>
                    <div style={{ background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: 480, boxShadow: '0 24px 80px rgba(0,0,0,0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--indigo-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={20} color="var(--indigo)" /></div>
                                <div>
                                    <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.3px' }}>Nouvelle phase</div>
                                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>Sélectionnez une phase du projet</div>
                                </div>
                            </div>
                            <button onClick={() => setOpenPhase(false)} style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--bg)', border: '1px solid var(--line)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}><X size={15} /></button>
                        </div>
                        <div style={{ padding: '24px 28px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                            <div className="field">
                                <label>Phase</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {PHASES_ORDRE.map(p => (
                                        <button key={p} onClick={() => setPhaseForm(f => ({ ...f, nom: p }))} style={{ padding: '10px 14px', borderRadius: 9, cursor: 'pointer', border: phaseForm.nom === p ? '2px solid var(--indigo)' : '1.5px solid var(--line)', background: phaseForm.nom === p ? 'var(--indigo-soft)' : 'var(--surface)', color: phaseForm.nom === p ? 'var(--indigo)' : 'var(--ink)', fontWeight: 600, fontSize: 13, textAlign: 'left', fontFamily: 'inherit' }}>
                                            {PHASE_CONFIG[p]?.label ?? p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid-2">
                                <div className="field"><label>Date début</label><input type="date" value={phaseForm.date_debut} onChange={e => setPhaseForm(f => ({ ...f, date_debut: e.target.value }))} /></div>
                                <div className="field"><label>Date fin</label><input type="date" value={phaseForm.date_fin} onChange={e => setPhaseForm(f => ({ ...f, date_fin: e.target.value }))} /></div>
                            </div>
                        </div>
                        <div style={{ padding: '16px 28px 24px', borderTop: '1px solid var(--line)', display: 'flex', gap: 10, flexShrink: 0 }}>
                            <button onClick={() => setOpenPhase(false)} style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid var(--line)', background: 'var(--surface)', fontSize: 13, fontWeight: 600, color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
                            <button style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: 'var(--grad)', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: phaseMutation.isPending ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(17,0,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: phaseMutation.isPending ? 0.7 : 1 }}
                                disabled={phaseMutation.isPending}
                                onClick={() => { const data = { nom: phaseForm.nom }; if (phaseForm.date_debut) data.date_debut = phaseForm.date_debut; if (phaseForm.date_fin) data.date_fin = phaseForm.date_fin; phaseMutation.mutate(data) }}>
                                {phaseMutation.isPending ? 'Création...' : 'Créer la phase'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal: modifier phase ── */}
            {editPhase && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 200, backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setEditPhase(null)}>
                    <div style={{ background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: 480, boxShadow: '0 24px 80px rgba(0,0,0,0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--indigo-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Pencil size={20} color="var(--indigo)" /></div>
                                <div>
                                    <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.3px' }}>Modifier la phase</div>
                                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>{PHASE_CONFIG[editPhase.nom]?.label ?? editPhase.nom}</div>
                                </div>
                            </div>
                            <button onClick={() => setEditPhase(null)} style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--bg)', border: '1px solid var(--line)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}><X size={15} /></button>
                        </div>
                        <div style={{ padding: '24px 28px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                            <div className="field">
                                <label>Phase</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {PHASES_ORDRE.map(p => (
                                        <button key={p} onClick={() => setEditPhaseForm(f => ({ ...f, nom: p }))} style={{ padding: '10px 14px', borderRadius: 9, cursor: 'pointer', border: editPhaseForm.nom === p ? '2px solid var(--indigo)' : '1.5px solid var(--line)', background: editPhaseForm.nom === p ? 'var(--indigo-soft)' : 'var(--surface)', color: editPhaseForm.nom === p ? 'var(--indigo)' : 'var(--ink)', fontWeight: 600, fontSize: 13, textAlign: 'left', fontFamily: 'inherit' }}>
                                            {PHASE_CONFIG[p]?.label ?? p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid-2">
                                <div className="field"><label>Date début</label><input type="date" value={editPhaseForm.date_debut} onChange={e => setEditPhaseForm(f => ({ ...f, date_debut: e.target.value }))} /></div>
                                <div className="field"><label>Date fin</label><input type="date" value={editPhaseForm.date_fin} onChange={e => setEditPhaseForm(f => ({ ...f, date_fin: e.target.value }))} /></div>
                            </div>
                        </div>
                        <div style={{ padding: '16px 28px 24px', borderTop: '1px solid var(--line)', display: 'flex', gap: 10, flexShrink: 0 }}>
                            <button onClick={() => setEditPhase(null)} style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid var(--line)', background: 'var(--surface)', fontSize: 13, fontWeight: 600, color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
                            <button
                                disabled={updatePhaseMutation.isPending}
                                onClick={() => {
                                    const data = { nom: editPhaseForm.nom }
                                    if (editPhaseForm.date_debut) data.date_debut = editPhaseForm.date_debut
                                    if (editPhaseForm.date_fin) data.date_fin = editPhaseForm.date_fin
                                    updatePhaseMutation.mutate({ phaseId: editPhase.id, data })
                                }}
                                style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: 'var(--grad)', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: updatePhaseMutation.isPending ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(17,0,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: updatePhaseMutation.isPending ? 0.7 : 1 }}>
                                {updatePhaseMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal: modifier projet ── */}
            {openEdit && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 200, backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setOpenEdit(false)}>
                    <div style={{ background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: 520, boxShadow: '0 24px 80px rgba(0,0,0,0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--indigo-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Pencil size={20} color="var(--indigo)" /></div>
                                <div>
                                    <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.3px' }}>Modifier le projet</div>
                                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>Modifiez les informations du projet</div>
                                </div>
                            </div>
                            <button onClick={() => setOpenEdit(false)} style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--bg)', border: '1px solid var(--line)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}><X size={15} /></button>
                        </div>
                        <div style={{ padding: '24px 28px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                            <div className="field"><label>Nom du projet</label><input value={editForm.nom} onChange={e => setEditForm(f => ({ ...f, nom: e.target.value }))} /></div>
                            <div className="field"><label>Type de projet</label><select value={editForm.type_projet} onChange={e => setEditForm(f => ({ ...f, type_projet: e.target.value }))}>{TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                            <div className="field"><label>Wilaya</label><select value={editForm.wilaya} onChange={e => setEditForm(f => ({ ...f, wilaya: e.target.value }))}><option value="">Sélectionner une wilaya</option>{WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}</select></div>
                            <div className="field"><label>Adresse chantier</label><input value={editForm.adresse_chantier} onChange={e => setEditForm(f => ({ ...f, adresse_chantier: e.target.value }))} /></div>
                            <div className="field" style={{ marginBottom: 0 }}><label>Date de début</label><input type="date" value={editForm.date_debut} onChange={e => setEditForm(f => ({ ...f, date_debut: e.target.value }))} /></div>
                        </div>
                        <div style={{ padding: '16px 28px 24px', borderTop: '1px solid var(--line)', display: 'flex', gap: 10, flexShrink: 0 }}>
                            <button onClick={() => setOpenEdit(false)} style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid var(--line)', background: 'var(--surface)', fontSize: 13, fontWeight: 600, color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
                            <button onClick={() => editMutation.mutate(editForm)} disabled={editMutation.isPending || !editForm.nom} style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: 'var(--grad)', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: editMutation.isPending ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(17,0,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: editMutation.isPending ? 0.7 : 1 }}>
                                {editMutation.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal: sous-traitant ── */}
            {openST && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 200, backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => { setOpenST(false); setEditST(null) }}>
                    <div style={{ background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: 540, boxShadow: '0 24px 80px rgba(0,0,0,0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '92vh' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '22px 26px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--indigo-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={20} color="var(--indigo)" /></div>
                                <div>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.3px' }}>{editST ? 'Modifier le sous-traitant' : 'Nouveau sous-traitant'}</div>
                                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>Intervenant sur ce projet</div>
                                </div>
                            </div>
                            <button onClick={() => { setOpenST(false); setEditST(null) }} style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--bg)', border: '1px solid var(--line)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}><X size={15} /></button>
                        </div>
                        <div style={{ padding: '20px 26px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                            <div className="grid-2">
                                <div className="field"><label>Nom *</label><input value={stForm.nom} onChange={e => setStForm(f => ({ ...f, nom: e.target.value }))} placeholder="Ex: BET Dupont" /></div>
                                <div className="field"><label>Type de prestation</label><select value={stForm.type_prestation} onChange={e => setStForm(f => ({ ...f, type_prestation: e.target.value }))}>{ST_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}</select></div>
                            </div>
                            <div className="grid-2">
                                <div className="field"><label>Téléphone</label><input value={stForm.telephone} onChange={e => setStForm(f => ({ ...f, telephone: e.target.value }))} /></div>
                                <div className="field"><label>Email</label><input type="email" value={stForm.email} onChange={e => setStForm(f => ({ ...f, email: e.target.value }))} /></div>
                            </div>
                            <div className="grid-2">
                                <div className="field"><label>Montant du contrat (DA)</label><input type="number" value={stForm.montant} onChange={e => setStForm(f => ({ ...f, montant: e.target.value }))} placeholder="0" /></div>
                                <div className="field">
                                    <label>Statut</label>
                                    <select value={stForm.statut} onChange={e => setStForm(f => ({ ...f, statut: e.target.value }))}>
                                        <option value="ACTIF">Actif</option>
                                        <option value="TERMINE">Terminé</option>
                                        <option value="SUSPENDU">Suspendu</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid-2">
                                <div className="field"><label>Date début</label><input type="date" value={stForm.date_debut} onChange={e => setStForm(f => ({ ...f, date_debut: e.target.value }))} /></div>
                                <div className="field"><label>Date fin</label><input type="date" value={stForm.date_fin} onChange={e => setStForm(f => ({ ...f, date_fin: e.target.value }))} /></div>
                            </div>
                            <div className="field" style={{ marginBottom: 0 }}><label>Notes</label><textarea rows={2} value={stForm.notes} onChange={e => setStForm(f => ({ ...f, notes: e.target.value }))} style={{ resize: 'vertical' }} /></div>
                        </div>
                        <div style={{ padding: '14px 26px 22px', borderTop: '1px solid var(--line)', display: 'flex', gap: 10, flexShrink: 0 }}>
                            <button onClick={() => { setOpenST(false); setEditST(null) }} style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid var(--line)', background: 'var(--surface)', fontSize: 13, fontWeight: 600, color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
                            <button
                                disabled={!stForm.nom || createSTMutation.isPending || editSTMutation.isPending}
                                onClick={() => {
                                    const payload = { nom: stForm.nom, type_prestation: stForm.type_prestation, statut: stForm.statut, montant: stForm.montant || 0 }
                                    if (stForm.telephone) payload.telephone = stForm.telephone
                                    if (stForm.email) payload.email = stForm.email
                                    if (stForm.date_debut) payload.date_debut = stForm.date_debut
                                    if (stForm.date_fin) payload.date_fin = stForm.date_fin
                                    if (stForm.notes) payload.notes = stForm.notes
                                    if (editST) editSTMutation.mutate({ stId: editST.id, data: payload })
                                    else createSTMutation.mutate(payload)
                                }}
                                style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: 'var(--grad)', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(17,0,255,0.25)' }}>
                                {editST ? 'Enregistrer' : 'Ajouter le sous-traitant'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    )
}
