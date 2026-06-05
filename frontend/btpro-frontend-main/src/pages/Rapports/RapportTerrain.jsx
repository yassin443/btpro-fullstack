import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    ClipboardCheck, Plus, X, Sun, Cloud, CloudRain, Wind,
    CheckCircle, XCircle, AlertTriangle, MapPin, Calendar, User,
    Download, Pencil, Trash2,
} from 'lucide-react'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import useToast from '../../store/useToast'
import DocPreviewModal from '../../components/documents/DocPreviewModal'
import ConfirmModal from '../../components/ConfirmModal'

const WILAYAS = [
    '01 - Adrar', '02 - Chlef', '03 - Laghouat', '04 - Oum El Bouaghi', '05 - Batna',
    '06 - Béjaïa', '07 - Biskra', '08 - Béchar', '09 - Blida', '10 - Bouira',
    '11 - Tamanrasset', '12 - Tébessa', '13 - Tlemcen', '14 - Tiaret', '15 - Tizi Ouzou',
    '16 - Alger', '17 - Djelfa', '18 - Jijel', '19 - Sétif', '20 - Saïda',
    '21 - Skikda', '22 - Sidi Bel Abbès', '23 - Annaba', '24 - Guelma', '25 - Constantine',
    '26 - Médéa', '27 - Mostaganem', "28 - M'Sila", '29 - Mascara', '30 - Ouargla',
    '31 - Oran', '32 - El Bayadh', '33 - Illizi', '34 - Bordj Bou Arréridj', '35 - Boumerdès',
    '36 - El Tarf', '37 - Tindouf', '38 - Tissemsilt', '39 - El Oued', '40 - Khenchela',
    '41 - Souk Ahras', '42 - Tipaza', '43 - Mila', '44 - Aïn Defla', '45 - Naâma',
    '46 - Aïn Témouchent', '47 - Ghardaïa', '48 - Relizane', '49 - Timimoun',
    '50 - Bordj Badji Mokhtar', '51 - Ouled Djellal', '52 - Béni Abbès', '53 - In Salah',
    "54 - In Guezzam", '55 - Touggourt', '56 - Djanet', "57 - El M'Ghair", '58 - El Meniaa',
]

const ETAT_CONFIG = {
    BON:        { label: 'Bon',        color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
    ACCEPTABLE: { label: 'Acceptable', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
    MAUVAIS:    { label: 'Mauvais',    color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
    CRITIQUE:   { label: 'Critique',   color: '#7F1D1D', bg: '#FEE2E2', border: '#FCA5A5' },
}

const METEOS = [
    { key: 'SOLEIL',  label: 'Soleil',  Icon: Sun,       color: '#F59E0B' },
    { key: 'NUAGEUX', label: 'Nuageux', Icon: Cloud,     color: '#64748B' },
    { key: 'PLUIE',   label: 'Pluie',   Icon: CloudRain, color: '#3B82F6' },
    { key: 'VENT',    label: 'Vent',    Icon: Wind,      color: '#8B5CF6' },
]

const METEO_MAP    = { SOLEIL: Sun, NUAGEUX: Cloud, PLUIE: CloudRain, VENT: Wind }
const METEO_COLORS = { SOLEIL: '#F59E0B', NUAGEUX: '#64748B', PLUIE: '#3B82F6', VENT: '#8B5CF6' }

const DEFAULT_POINTS = [
    { label: 'Sécurité',    statut: 'OK' },
    { label: 'Structure',   statut: 'OK' },
    { label: 'Électricité', statut: 'OK' },
    { label: 'Plomberie',   statut: 'OK' },
    { label: 'Étanchéité',  statut: 'OK' },
    { label: 'Finitions',   statut: 'OK' },
]

function mkPoints() { return DEFAULT_POINTS.map(p => ({ ...p })) }

const EMPTY_FORM = {
    projet: '', date: '', titre: '', lieu: '', meteo: 'SOLEIL',
    etat_general: 'BON', observations: '', actions_requises: '',
    points_controle: mkPoints(),
}

function PointsEditor({ points, onChange }) {
    const upd = (i, field, val) => onChange(points.map((p, j) => j === i ? { ...p, [field]: val } : p))
    const del = (i) => onChange(points.filter((_, j) => j !== i))
    const add = () => onChange([...points, { label: '', statut: 'OK' }])

    const btnStyle = (p, s) => ({
        padding: '6px 10px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 12,
        fontFamily: 'inherit', transition: 'all 0.1s',
        border: p.statut === s ? '2px solid currentColor' : '1.5px solid #E5E7EB',
        background: p.statut === s
            ? (s === 'OK' ? '#F0FDF4' : s === 'NOK' ? '#FEF2F2' : '#F9FAFB')
            : '#fff',
        color: p.statut === s
            ? (s === 'OK' ? '#16A34A' : s === 'NOK' ? '#DC2626' : '#6B7280')
            : '#9CA3AF',
    })

    return (
        <div>
            {points.map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'center', marginBottom: 7 }}>
                    <input
                        value={p.label}
                        onChange={e => upd(i, 'label', e.target.value)}
                        placeholder="Point de contrôle..."
                        style={{ flex: 1, padding: '8px 12px', borderRadius: 9, border: '1.5px solid #E5E7EB', fontSize: 13, fontFamily: 'inherit', outline: 'none', color: '#111827' }}
                    />
                    {['OK', 'NOK', 'NA'].map(s => (
                        <button key={s} type="button" onClick={() => upd(i, 'statut', s)} style={btnStyle(p, s)}>
                            {s}
                        </button>
                    ))}
                    <button type="button" onClick={() => del(i)}
                        style={{ padding: '7px 8px', borderRadius: 8, border: '1px solid #FECACA', background: '#FEF2F2', cursor: 'pointer', color: '#DC2626', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                        <Trash2 size={13} />
                    </button>
                </div>
            ))}
            <button type="button" onClick={add}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--indigo)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0', fontFamily: 'inherit', marginTop: 2 }}>
                <Plus size={14} /> Ajouter un point
            </button>
        </div>
    )
}

export default function RapportTerrain() {
    const queryClient = useQueryClient()
    const { toast } = useToast()
    const [open, setOpen]             = useState(false)
    const [editTarget, setTarget]     = useState(null)
    const [form, setForm]             = useState(EMPTY_FORM)
    const [confirmDel, setConfirmDel] = useState(null)
    const [previewRapport, setPreviewRapport] = useState(null)

    const upd = (k, v) => setForm(f => ({ ...f, [k]: v }))

    const { data: rapports, isLoading } = useQuery({
        queryKey: ['rapports'],
        queryFn: () => api.get('/chantier/rapports/').then(r => r.data),
    })
    const { data: projets } = useQuery({
        queryKey: ['projets'],
        queryFn: () => api.get('/projets/').then(r => r.data),
    })
    const { data: cabinetData } = useQuery({
        queryKey: ['cabinet'],
        queryFn: () => api.get('/cabinets/mon-cabinet/').then(r => r.data),
    })

    const createMutation = useMutation({
        mutationFn: (data) => api.post('/chantier/rapports/', data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rapports'] }); closeModal(); toast('Rapport créé', 'success') },
        onError: () => toast('Erreur lors de la création', 'error'),
    })
    const editMutation = useMutation({
        mutationFn: ({ id, data }) => api.put(`/chantier/rapports/${id}/`, data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rapports'] }); closeModal(); toast('Rapport modifié', 'success') },
        onError: () => toast('Erreur lors de la modification', 'error'),
    })
    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/chantier/rapports/${id}/`),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rapports'] }); toast('Rapport supprimé', 'success') },
        onError: () => toast('Erreur lors de la suppression', 'error'),
    })

    function openCreate() {
        setTarget(null)
        setForm({ ...EMPTY_FORM, points_controle: mkPoints() })
        setOpen(true)
    }
    function openEdit(r) {
        setTarget(r)
        setForm({
            projet: r.projet || '',
            date: r.date || '',
            titre: r.titre || '',
            lieu: r.lieu || '',
            meteo: r.meteo || 'SOLEIL',
            etat_general: r.etat_general || 'BON',
            observations: r.observations || '',
            actions_requises: r.actions_requises || '',
            points_controle: r.points_controle && r.points_controle.length ? r.points_controle : mkPoints(),
        })
        setOpen(true)
    }
    function closeModal() { setOpen(false); setTarget(null) }
    function handleSubmit() {
        if (editTarget) editMutation.mutate({ id: editTarget.id, data: form })
        else createMutation.mutate(form)
    }
    function handleDownload(r) {
        setPreviewRapport(r)
    }

    const isPending  = createMutation.isPending || editMutation.isPending
    const list       = rapports || []
    const projetsList = projets || []

    return (
        <Layout>
            <div className="page">
                <div className="page-head">
                    <div>
                        <h1 className="page-title">Rapports de terrain</h1>
                        <div className="page-sub">{list.length} inspection{list.length !== 1 ? 's' : ''} et visite{list.length !== 1 ? 's' : ''} de chantier</div>
                    </div>
                    <div className="page-head-actions">
                        <button className="btn accent" onClick={openCreate}>
                            <Plus size={16} /> Nouveau rapport
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="text-center color-slate" style={{ padding: 80, fontSize: 15 }}>Chargement...</div>
                ) : list.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon" style={{ background: 'var(--indigo-soft)' }}>
                            <ClipboardCheck size={28} color="var(--indigo)" />
                        </div>
                        <div className="empty-title">Aucun rapport de terrain</div>
                        <div className="empty-sub">Documentez vos visites et inspections de chantier</div>
                        <button className="btn accent" onClick={openCreate}>
                            <Plus size={15} /> Créer le premier rapport
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {list.map(rapport => {
                            const etat      = ETAT_CONFIG[rapport.etat_general] || ETAT_CONFIG.BON
                            const MeteoIcon = METEO_MAP[rapport.meteo] || Sun
                            const meteoColor = METEO_COLORS[rapport.meteo] || '#F59E0B'
                            const meteoLabel = METEOS.find(m => m.key === rapport.meteo)?.label
                            const points    = rapport.points_controle?.length ? rapport.points_controle : null
                            const checksOk  = points ? points.filter(p => p.statut === 'OK').length  : 0
                            const checksNok = points ? points.filter(p => p.statut === 'NOK').length : 0

                            return (
                                <div key={rapport.id} style={{
                                    background: '#fff',
                                    borderRadius: 16,
                                    border: '1px solid #E5E7EB',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
                                    display: 'flex',
                                    overflow: 'hidden',
                                }}>
                                    {/* Left status accent */}
                                    <div style={{ width: 4, background: etat.color, flexShrink: 0 }} />

                                    <div style={{ flex: 1, padding: '18px 22px' }}>
                                        {/* Header row */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 17, fontWeight: 700, color: '#111827', letterSpacing: '-0.4px', marginBottom: 6 }}>
                                                    {rapport.titre}
                                                </div>
                                                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6B7280' }}>
                                                        <Calendar size={12} color="#9CA3AF" /> {rapport.date}
                                                    </span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6B7280' }}>
                                                        <User size={12} color="#9CA3AF" /> {rapport.redacteur_nom}
                                                    </span>
                                                    {rapport.projet_nom && (
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--indigo)', fontWeight: 600 }}>
                                                            <MapPin size={12} color="var(--indigo)" /> {rapport.projet_nom}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                                                {/* Meteo */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                                                    <MeteoIcon size={13} color={meteoColor} />
                                                    <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7280' }}>{meteoLabel}</span>
                                                </div>
                                                {/* Etat badge */}
                                                <div style={{
                                                    display: 'flex', alignItems: 'center', gap: 5,
                                                    padding: '5px 11px', borderRadius: 20,
                                                    background: etat.bg, color: etat.color,
                                                    fontSize: 12, fontWeight: 700,
                                                    border: `1px solid ${etat.border}`,
                                                }}>
                                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: etat.color }} />
                                                    {etat.label}
                                                </div>
                                                {/* Actions */}
                                                <button onClick={() => handleDownload(rapport)}
                                                    style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--indigo)' }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--indigo-soft)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                                                    title="Télécharger PDF">
                                                    <Download size={14} />
                                                </button>
                                                <button onClick={() => openEdit(rapport)}
                                                    style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}
                                                    onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                                                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                                                    title="Modifier">
                                                    <Pencil size={14} />
                                                </button>
                                                <button onClick={() => setConfirmDel(rapport)}
                                                    style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #FECACA', background: '#FEF2F2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}
                                                    title="Supprimer">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Points de contrôle */}
                                        {points && (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                                                {points.map((p, i) => {
                                                    const ok = p.statut === 'OK'
                                                    const na = p.statut === 'NA'
                                                    return (
                                                        <span key={i} style={{
                                                            display: 'inline-flex', alignItems: 'center', gap: 4,
                                                            fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 8,
                                                            background: ok ? '#F0FDF4' : na ? '#F9FAFB' : '#FEF2F2',
                                                            color: ok ? '#16A34A' : na ? '#6B7280' : '#DC2626',
                                                            border: `1px solid ${ok ? '#BBF7D0' : na ? '#E5E7EB' : '#FECACA'}`,
                                                        }}>
                                                            {ok ? <CheckCircle size={11} /> : na ? <span style={{ fontSize: 11 }}>—</span> : <XCircle size={11} />}
                                                            {p.label}
                                                        </span>
                                                    )
                                                })}
                                            </div>
                                        )}

                                        {/* Observations */}
                                        {rapport.observations && (
                                            <div style={{
                                                fontSize: 13, color: '#374151', lineHeight: 1.7, marginBottom: 10,
                                                padding: '12px 14px', background: '#F9FAFB', borderRadius: 10, border: '1px solid #F3F4F6',
                                            }}>
                                                {rapport.observations}
                                            </div>
                                        )}

                                        {/* Actions requises */}
                                        {rapport.actions_requises && (
                                            <div style={{
                                                display: 'flex', alignItems: 'flex-start', gap: 9,
                                                background: '#FFFBEB', border: '1px solid #FDE68A',
                                                borderRadius: 10, padding: '10px 14px',
                                                fontSize: 13, color: '#92400E', fontWeight: 500, lineHeight: 1.6,
                                                marginBottom: 10,
                                            }}>
                                                <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 2, color: '#D97706' }} />
                                                <span>{rapport.actions_requises}</span>
                                            </div>
                                        )}

                                        {/* Footer: check counts */}
                                        {points && (checksOk > 0 || checksNok > 0) && (
                                            <div style={{ display: 'flex', gap: 14, paddingTop: 12, borderTop: '1px solid #F3F4F6' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: '#16A34A' }}>
                                                    <CheckCircle size={13} /> {checksOk} OK
                                                </span>
                                                {checksNok > 0 && (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: '#DC2626' }}>
                                                        <XCircle size={13} /> {checksNok} NOK
                                                    </span>
                                                )}
                                                <span style={{ fontSize: 12, color: '#9CA3AF' }}>{points.length} points au total</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Modal */}
            {open && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 200, backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
                    onClick={closeModal}>
                    <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 620, boxShadow: '0 24px 80px rgba(0,0,0,0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '92vh' }}
                        onClick={e => e.stopPropagation()}>

                        <div style={{ padding: '24px 28px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--indigo-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ClipboardCheck size={20} color="var(--indigo)" />
                                </div>
                                <div>
                                    <div style={{ fontSize: 17, fontWeight: 800, color: '#111827', letterSpacing: '-0.3px' }}>
                                        {editTarget ? 'Modifier le rapport' : 'Nouveau rapport'}
                                    </div>
                                    <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>Inspection et visite de chantier</div>
                                </div>
                            </div>
                            <button onClick={closeModal} style={{ width: 34, height: 34, borderRadius: 9, background: '#F9FAFB', border: '1px solid #E5E7EB', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>
                                <X size={15} />
                            </button>
                        </div>

                        <div style={{ padding: '24px 28px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
                            <div className="field">
                                <label>Projet</label>
                                <select value={form.projet} onChange={e => upd('projet', e.target.value)}>
                                    <option value="">Sélectionner un projet</option>
                                    {projetsList.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                                </select>
                            </div>
                            <div className="field">
                                <label>Titre du rapport</label>
                                <input value={form.titre} onChange={e => upd('titre', e.target.value)} placeholder="Ex: Visite inspection fondations" />
                            </div>
                            <div className="grid-2">
                                <div className="field">
                                    <label>Date</label>
                                    <input type="date" value={form.date} onChange={e => upd('date', e.target.value)} />
                                </div>
                                <div className="field">
                                    <label>Lieu (Wilaya)</label>
                                    <select value={form.lieu} onChange={e => upd('lieu', e.target.value)}>
                                        <option value="">Sélectionner une wilaya</option>
                                        {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="field">
                                <label>Météo</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {METEOS.map(m => {
                                        const active = form.meteo === m.key
                                        return (
                                            <button key={m.key} type="button" onClick={() => upd('meteo', m.key)}
                                                style={{ flex: 1, padding: '12px 8px', borderRadius: 12, cursor: 'pointer', border: active ? `2px solid ${m.color}` : '1.5px solid #E5E7EB', background: active ? `${m.color}18` : '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, fontFamily: 'inherit', transition: 'all 0.12s' }}>
                                                <m.Icon size={20} color={active ? m.color : '#9CA3AF'} />
                                                <span style={{ fontSize: 11, fontWeight: 700, color: active ? m.color : '#9CA3AF' }}>{m.label}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                            <div className="field">
                                <label>État général</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {Object.entries(ETAT_CONFIG).map(([key, val]) => {
                                        const active = form.etat_general === key
                                        return (
                                            <button key={key} type="button" onClick={() => upd('etat_general', key)}
                                                style={{ flex: 1, padding: '10px 8px', borderRadius: 10, cursor: 'pointer', border: active ? `2px solid ${val.color}` : '1.5px solid #E5E7EB', background: active ? val.bg : '#fff', color: active ? val.color : '#6B7280', fontWeight: 700, fontSize: 13, fontFamily: 'inherit', transition: 'all 0.12s' }}>
                                                {val.label}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                            <div className="field">
                                <label>Points de contrôle</label>
                                <PointsEditor points={form.points_controle} onChange={v => upd('points_controle', v)} />
                            </div>
                            <div className="field">
                                <label>Observations</label>
                                <textarea value={form.observations} onChange={e => upd('observations', e.target.value)} rows={3} style={{ resize: 'vertical' }} placeholder="Décrivez l'état général du chantier..." />
                            </div>
                            <div className="field" style={{ marginBottom: 0 }}>
                                <label>Actions requises</label>
                                <textarea value={form.actions_requises} onChange={e => upd('actions_requises', e.target.value)} rows={2} style={{ resize: 'vertical' }} placeholder="Actions à entreprendre suite à la visite..." />
                            </div>
                        </div>

                        <div style={{ padding: '16px 28px 24px', borderTop: '1px solid #F3F4F6', display: 'flex', gap: 10, flexShrink: 0 }}>
                            <button onClick={closeModal} style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid #E5E7EB', background: '#fff', fontSize: 13, fontWeight: 600, color: '#6B7280', cursor: 'pointer', fontFamily: 'inherit' }}>
                                Annuler
                            </button>
                            <button onClick={handleSubmit} disabled={isPending}
                                style={{ flex: 1, padding: 11, borderRadius: 10, border: 'none', background: 'var(--grad)', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: isPending ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(17,0,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: isPending ? 0.7 : 1 }}>
                                {isPending ? 'Enregistrement...' : editTarget ? 'Enregistrer les modifications' : 'Créer le rapport'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                open={!!confirmDel}
                title="Supprimer le rapport"
                message={`Supprimer le rapport "${confirmDel?.titre}" ? Cette action est irréversible.`}
                onConfirm={() => { deleteMutation.mutate(confirmDel.id); setConfirmDel(null) }}
                onCancel={() => setConfirmDel(null)}
            />

            {previewRapport && (
                <DocPreviewModal
                    type="rapport"
                    doc={previewRapport}
                    cabinet={cabinetData || {}}
                    onClose={() => setPreviewRapport(null)}
                />
            )}
        </Layout>
    )
}
