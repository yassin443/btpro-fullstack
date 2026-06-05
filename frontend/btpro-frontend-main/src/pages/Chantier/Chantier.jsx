import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    HardHat, ClipboardList, AlertTriangle, Plus, X, Users,
    Sun, Cloud, CloudRain, Wind, CheckCircle, Camera, Upload,
    Trash2, ZoomIn, ChevronLeft, ChevronRight, ShieldAlert, UserCheck, Pencil
} from 'lucide-react'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import ConfirmModal from '../../components/ConfirmModal'

const BACKEND = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api').replace('/api', '')
const mediaUrl = (url) => !url ? null : url.startsWith('http') ? url : BACKEND + url

const METEOS = ['SOLEIL', 'NUAGEUX', 'PLUIE', 'VENT']
const METEO_ICONS  = { SOLEIL: Sun, NUAGEUX: Cloud, PLUIE: CloudRain, VENT: Wind }
const METEO_LABELS = { SOLEIL: 'Soleil', NUAGEUX: 'Nuageux', PLUIE: 'Pluie', VENT: 'Vent' }
const METEO_COLORS = { SOLEIL: '#F59E0B', NUAGEUX: '#64748B', PLUIE: '#3B82F6', VENT: '#8B5CF6' }

function Lightbox({ photos, startIndex, onClose }) {
    const [idx, setIdx] = useState(startIndex)
    const photo = photos[idx]
    const prev = () => setIdx(i => (i - 1 + photos.length) % photos.length)
    const next = () => setIdx(i => (i + 1) % photos.length)

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
            <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <X size={20} />
            </button>
            <div style={{ position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600 }}>
                {idx + 1} / {photos.length}
            </div>
            {photos.length > 1 && (
                <button onClick={e => { e.stopPropagation(); prev() }} style={{ position: 'absolute', left: 20, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 48, height: 48, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <ChevronLeft size={24} />
                </button>
            )}
            <div onClick={e => e.stopPropagation()} style={{ maxWidth: '85vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <img src={mediaUrl(photo.image)} alt={photo.legende || 'Photo chantier'} style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: 12, boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }} />
                {photo.legende && (
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 500, textAlign: 'center' }}>{photo.legende}</div>
                )}
            </div>
            {photos.length > 1 && (
                <button onClick={e => { e.stopPropagation(); next() }} style={{ position: 'absolute', right: 20, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 48, height: 48, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <ChevronRight size={24} />
                </button>
            )}
        </div>
    )
}

export default function Chantier() {
    const queryClient = useQueryClient()
    const [projetId, setProjetId]   = useState('')
    const [open, setOpen]           = useState(false)
    const [tab, setTab]             = useState('journaux')
    const [form, setForm]           = useState({ date: '', meteo: 'SOLEIL', effectif: '', avancement: 0, travaux_realises: '', observations: '' })
    const [pendingPhotos, setPendingPhotos] = useState([])
    const [lightbox, setLightbox]   = useState(null)
    const [uploadingJournalId, setUploadingJournalId] = useState(null)
    const [legende, setLegende]     = useState('')
    const [selectedFile, setSelectedFile] = useState(null)
    const [openReserve, setOpenReserve]   = useState(false)
    const [reserveForm, setReserveForm]   = useState({ description: '', responsable: '' })
    const [confirmDelPhoto, setConfirmDelPhoto] = useState(null)
    const [editLegendPhoto, setEditLegendPhoto] = useState(null)
    const [editLegendVal, setEditLegendVal] = useState('')
    const [editJournal, setEditJournal] = useState(null)
    const [editJournalForm, setEditJournalForm] = useState({ date: '', meteo: 'SOLEIL', effectif: '', avancement: 0, travaux_realises: '', observations: '' })

    const { data: projets = [] } = useQuery({ queryKey: ['projets'], queryFn: () => api.get('/projets/').then(r => r.data) })
    const { data: journaux = [], isLoading } = useQuery({ queryKey: ['journaux', projetId], queryFn: () => api.get(`/chantier/${projetId}/journaux/`).then(r => r.data), enabled: !!projetId })
    const { data: reserves = [] } = useQuery({ queryKey: ['reserves', projetId], queryFn: () => api.get(`/chantier/${projetId}/reserves/`).then(r => r.data), enabled: !!projetId })

    const mutation = useMutation({
        mutationFn: (data) => api.post(`/chantier/${projetId}/journaux/`, data),
        onSuccess: async (res) => {
            const journalId = res.data.id
            for (const { file, legende } of pendingPhotos) {
                const fd = new FormData()
                fd.append('image', file)
                if (legende) fd.append('legende', legende)
                await api.post(`/chantier/journaux/${journalId}/photos/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
            }
            queryClient.invalidateQueries({ queryKey: ['journaux', projetId] })
            setOpen(false)
            setForm({ date: '', meteo: 'SOLEIL', effectif: '', avancement: 0, travaux_realises: '', observations: '' })
            setPendingPhotos([])
        }
    })

    const uploadPhoto = useMutation({
        mutationFn: ({ journalId, file, legende }) => {
            const fd = new FormData()
            fd.append('image', file)
            if (legende) fd.append('legende', legende)
            return api.post(`/chantier/journaux/${journalId}/photos/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['journaux', projetId] })
            setUploadingJournalId(null); setSelectedFile(null); setLegende('')
        }
    })

    const deletePhoto = useMutation({
        mutationFn: (photoId) => api.delete(`/chantier/photos/${photoId}/`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['journaux', projetId] })
    })

    const updatePhotoLegende = useMutation({
        mutationFn: ({ id, legende }) => api.patch(`/chantier/photos/${id}/`, { legende }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['journaux', projetId] })
            setEditLegendPhoto(null)
        }
    })

    const createReserve = useMutation({
        mutationFn: (data) => api.post(`/chantier/${projetId}/reserves/`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reserves', projetId] })
            setOpenReserve(false); setReserveForm({ description: '', responsable: '' })
        }
    })

    const leverReserve = useMutation({
        mutationFn: (pk) => api.put(`/chantier/reserves/${pk}/lever/`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reserves', projetId] })
    })

    const updateJournalMutation = useMutation({
        mutationFn: ({ id, data }) => api.patch(`/chantier/journaux/${id}/`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['journaux', projetId] })
            setEditJournal(null)
        }
    })

    const allPhotos = journaux.flatMap(j =>
        (j.photos || []).map(p => ({ ...p, journal_date: j.date, journal_id: j.id }))
    )

    const reservesOuvertes = reserves.filter(r => r.statut !== 'LEVEE').length
    const TABS = [
        { key: 'journaux', label: 'Journaux', icon: ClipboardList },
        { key: 'reserves', label: `Réserves${reservesOuvertes > 0 ? ` · ${reservesOuvertes}` : ''}`, icon: AlertTriangle },
    ]

    return (
        <Layout>
            <div className="page">
                <div className="page-head">
                    <div>
                        <h1 className="page-title">Suivi chantier</h1>
                        <div className="page-sub">Journal quotidien, photos et réserves</div>
                    </div>
                    {projetId && (
                        <div className="page-head-actions">
                            {tab === 'reserves' && (
                                <button className="btn" style={{ color: 'var(--red)', borderColor: 'var(--red-soft)' }} onClick={() => setOpenReserve(true)}>
                                    <ShieldAlert size={15} /> Signaler une réserve
                                </button>
                            )}
                            <button className="btn accent" onClick={() => setOpen(true)}>
                                <Plus size={15} /> Journal du jour
                            </button>
                        </div>
                    )}
                </div>

                {/* Project selector */}
                <div style={{
                    background: 'var(--surface)', borderRadius: 14,
                    border: '1px solid var(--line)', padding: '18px 22px', marginBottom: 24,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                }}>
                    <div className="field" style={{ marginBottom: 0 }}>
                        <label>Sélectionner un projet</label>
                        <select value={projetId} onChange={e => { setProjetId(e.target.value); setTab('journaux') }}>
                            <option value="">— Choisir un projet —</option>
                            {projets.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                        </select>
                    </div>
                </div>

                {!projetId ? (
                    <div className="empty-state">
                        <div className="empty-icon" style={{ background: 'var(--indigo-soft)' }}><HardHat size={28} color="var(--indigo)" /></div>
                        <div className="empty-title">Sélectionnez un projet</div>
                        <div className="empty-sub">Choisissez un projet pour accéder au suivi chantier</div>
                    </div>
                ) : (
                    <>
                        <div className="filter-tabs">
                            {TABS.map(t => (
                                <button key={t.key} className={'filter-tab' + (tab === t.key ? ' active' : '')} onClick={() => setTab(t.key)}
                                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <t.icon size={13} /> {t.label}
                                </button>
                            ))}
                        </div>

                        {/* ── JOURNAUX ── */}
                        {tab === 'journaux' && (
                            isLoading ? (
                                <div className="text-center color-slate" style={{ padding: 60 }}>Chargement...</div>
                            ) : journaux.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon" style={{ background: 'var(--indigo-soft)' }}><ClipboardList size={28} color="var(--indigo)" /></div>
                                    <div className="empty-title">Aucun journal</div>
                                    <div className="empty-sub">Commencez le journal de chantier quotidien</div>
                                    <button className="btn accent" onClick={() => setOpen(true)}><Plus size={14} /> Journal du jour</button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {journaux.map(journal => {
                                        const MeteoIcon  = METEO_ICONS[journal.meteo] || Sun
                                        const meteoColor = METEO_COLORS[journal.meteo] || '#F59E0B'
                                        const photosCount = (journal.photos || []).length

                                        return (
                                            <div key={journal.id} style={{
                                                background: 'var(--surface)',
                                                borderRadius: 16,
                                                border: '1px solid var(--line)',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
                                                overflow: 'hidden',
                                                display: 'flex',
                                            }}>
                                                {/* Left meteo accent */}
                                                <div style={{ width: 4, background: meteoColor, flexShrink: 0 }} />

                                                <div style={{ flex: 1 }}>
                                                    {/* Header */}
                                                    <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <div>
                                                            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.3px', marginBottom: 5 }}>
                                                                {new Date(journal.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                                            </div>
                                                            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                                                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6B7280' }}>
                                                                    <Users size={12} color="#9CA3AF" /> {journal.effectif} ouvriers
                                                                </span>
                                                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: meteoColor, fontWeight: 600 }}>
                                                                    <MeteoIcon size={12} /> {METEO_LABELS[journal.meteo]}
                                                                </span>
                                                                {photosCount > 0 && (
                                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--indigo)', fontWeight: 600 }}>
                                                                        <Camera size={12} /> {photosCount} photo{photosCount > 1 ? 's' : ''}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {/* Avancement */}
                                                        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            <button
                                                                onClick={() => {
                                                                    setEditJournal(journal)
                                                                    setEditJournalForm({ date: journal.date, meteo: journal.meteo || 'SOLEIL', effectif: journal.effectif || '', avancement: journal.avancement, travaux_realises: journal.travaux_realises || '', observations: journal.observations || '' })
                                                                }}
                                                                style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--indigo-soft)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--indigo)', flexShrink: 0 }}>
                                                                <Pencil size={13} />
                                                            </button>
                                                            <div style={{ textAlign: 'right' }}>
                                                                <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--indigo)', letterSpacing: '-1.5px', lineHeight: 1 }}>{journal.avancement}%</div>
                                                                <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: 3 }}>avancement</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Progress bar */}
                                                    <div style={{ height: 4, background: 'var(--line)' }}>
                                                        <div style={{ height: '100%', background: 'var(--indigo)', width: `${journal.avancement}%`, transition: 'width 0.4s ease' }} />
                                                    </div>

                                                    {/* Body */}
                                                    <div style={{ padding: '16px 22px' }}>
                                                        {journal.travaux_realises && (
                                                            <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, marginBottom: journal.observations ? 12 : 0 }}>
                                                                {journal.travaux_realises}
                                                            </div>
                                                        )}
                                                        {journal.observations && (
                                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#92400E', fontWeight: 500, lineHeight: 1.6 }}>
                                                                <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 2, color: '#D97706' }} />
                                                                {journal.observations}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Photos */}
                                                    {(journal.photos || []).length > 0 && (
                                                        <div style={{ padding: '0 22px 18px' }}>
                                                            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
                                                                {journal.photos.map((photo, pi) => (
                                                                    <div key={photo.id} style={{ position: 'relative', flexShrink: 0, cursor: 'pointer', borderRadius: 10, overflow: 'hidden', width: 110, height: 80, border: '1px solid #E5E7EB' }}
                                                                        onClick={() => setLightbox({ photos: allPhotos, index: allPhotos.findIndex(p => p.id === photo.id) })}>
                                                                        <img
                                                                            src={mediaUrl(photo.image)}
                                                                            alt={photo.legende || ''}
                                                                            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.2s' }}
                                                                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                                                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                                                        />
                                                                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent 50%,rgba(0,0,0,0.45))', borderRadius: 10 }} />
                                                                        {/* Actions */}
                                                                        <div style={{ position: 'absolute', top: 5, right: 5, display: 'flex', gap: 3 }}
                                                                            onClick={e => e.stopPropagation()}>
                                                                            <button
                                                                                onClick={() => { setEditLegendPhoto(photo.id); setEditLegendVal(photo.legende || '') }}
                                                                                style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(0,0,0,0.45)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                                <Pencil size={10} color="#fff" />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => setConfirmDelPhoto(photo.id)}
                                                                                style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(220,38,38,0.7)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                                <Trash2 size={10} color="#fff" />
                                                                            </button>
                                                                        </div>
                                                                        {photo.legende && (
                                                                            <div style={{ position: 'absolute', bottom: 4, left: 6, fontSize: 9, color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 94 }}>
                                                                                {photo.legende}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Footer: add photo */}
                                                    <div style={{ padding: '10px 22px 14px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'flex-end' }}>
                                                        <label className="btn sm" style={{ cursor: 'pointer', gap: 6 }}>
                                                            <Camera size={13} /> Ajouter une photo
                                                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                                                                if (e.target.files[0]) { setUploadingJournalId(journal.id); setSelectedFile(e.target.files[0]) }
                                                            }} />
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )
                        )}

                        {/* ── RESERVES ── */}
                        {tab === 'reserves' && (
                            reserves.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon" style={{ background: '#F0FDF4' }}><CheckCircle size={28} color="#16A34A" /></div>
                                    <div className="empty-title">Aucune réserve</div>
                                    <div className="empty-sub">Aucun problème signalé sur ce chantier</div>
                                    <button className="btn" style={{ color: 'var(--red)', borderColor: 'var(--red-soft)' }} onClick={() => setOpenReserve(true)}>
                                        <ShieldAlert size={15} /> Signaler une réserve
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    {/* Summary */}
                                    <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                                        {[
                                            { label: 'Ouvertes',  count: reserves.filter(r => r.statut === 'OUVERTE').length,   color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
                                            { label: 'En cours',  count: reserves.filter(r => r.statut === 'EN_COURS').length,   color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
                                            { label: 'Levées',    count: reserves.filter(r => r.statut === 'LEVEE').length,      color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
                                        ].map(s => (
                                            <div key={s.label} style={{
                                                flex: 1, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, padding: '14px 18px',
                                                display: 'flex', alignItems: 'center', gap: 12,
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                                            }}>
                                                <div style={{ fontSize: 32, fontWeight: 800, color: s.color, letterSpacing: '-1.5px', lineHeight: 1 }}>{s.count}</div>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: '#6B7280' }}>{s.label}</div>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {reserves.map(reserve => {
                                            const isLevee   = reserve.statut === 'LEVEE'
                                            const isEnCours = reserve.statut === 'EN_COURS'
                                            const accentColor = isLevee ? '#16A34A' : isEnCours ? '#D97706' : '#DC2626'

                                            return (
                                                <div key={reserve.id} style={{
                                                    background: '#fff', borderRadius: 14,
                                                    border: '1px solid #E5E7EB',
                                                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                                                    display: 'flex', overflow: 'hidden',
                                                }}>
                                                    <div style={{ width: 4, background: accentColor, flexShrink: 0 }} />
                                                    <div style={{ flex: 1, padding: '16px 20px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 }}>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{
                                                                    fontSize: 14, fontWeight: 700, color: isLevee ? '#9CA3AF' : '#111827',
                                                                    marginBottom: 6, letterSpacing: '-0.2px', lineHeight: 1.4,
                                                                    textDecoration: isLevee ? 'line-through' : 'none',
                                                                }}>
                                                                    {reserve.description}
                                                                </div>
                                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6B7280' }}>
                                                                        <UserCheck size={12} color="#9CA3AF" /> {reserve.responsable}
                                                                    </span>
                                                                    <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                                                                        Constaté le {reserve.date_constat}
                                                                    </span>
                                                                    {reserve.date_levee && (
                                                                        <span style={{ fontSize: 12, color: '#16A34A', fontWeight: 600 }}>
                                                                            ✓ Levée le {reserve.date_levee}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                                                                <div style={{
                                                                    display: 'flex', alignItems: 'center', gap: 5,
                                                                    padding: '4px 10px', borderRadius: 20,
                                                                    background: isLevee ? '#F0FDF4' : isEnCours ? '#FFFBEB' : '#FEF2F2',
                                                                    color: accentColor,
                                                                    fontSize: 11, fontWeight: 700,
                                                                    border: `1px solid ${isLevee ? '#BBF7D0' : isEnCours ? '#FDE68A' : '#FECACA'}`,
                                                                }}>
                                                                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: accentColor }} />
                                                                    {isLevee ? 'Levée' : isEnCours ? 'En cours' : 'Ouverte'}
                                                                </div>
                                                                {!isLevee && (
                                                                    <button
                                                                        onClick={() => leverReserve.mutate(reserve.id)}
                                                                        disabled={leverReserve.isPending}
                                                                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1px solid #BBF7D0', background: '#F0FDF4', color: '#16A34A', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s' }}
                                                                        onMouseEnter={e => { e.currentTarget.style.background = '#16A34A'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#16A34A' }}
                                                                        onMouseLeave={e => { e.currentTarget.style.background = '#F0FDF4'; e.currentTarget.style.color = '#16A34A'; e.currentTarget.style.borderColor = '#BBF7D0' }}>
                                                                        <CheckCircle size={13} /> Lever
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        )}
                    </>
                )}
            </div>

            {/* Upload photo modal */}
            {uploadingJournalId && selectedFile && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 200, backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => { setUploadingJournalId(null); setSelectedFile(null); setLegende('') }}>
                    <div style={{ background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: 420, boxShadow: '0 24px 80px rgba(0,0,0,0.2)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '22px 26px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--indigo-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Camera size={18} color="var(--indigo)" />
                                </div>
                                <div>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Ajouter une photo</div>
                                    <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>Légende optionnelle</div>
                                </div>
                            </div>
                            <button onClick={() => { setUploadingJournalId(null); setSelectedFile(null); setLegende('') }} style={{ width: 32, height: 32, borderRadius: 8, background: '#F9FAFB', border: '1px solid #E5E7EB', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>
                                <X size={14} />
                            </button>
                        </div>
                        <div style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div style={{ borderRadius: 12, overflow: 'hidden', background: '#F3F4F6', aspectRatio: '16/9' }}>
                                <img src={URL.createObjectURL(selectedFile)} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            {journaux.length > 1 && (
                                <div className="field" style={{ marginBottom: 0 }}>
                                    <label>Journal</label>
                                    <select value={uploadingJournalId || ''} onChange={e => setUploadingJournalId(e.target.value)}>
                                        {journaux.map(j => (
                                            <option key={j.id} value={j.id}>
                                                {new Date(j.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="field" style={{ marginBottom: 0 }}>
                                <label>Légende</label>
                                <input value={legende} onChange={e => setLegende(e.target.value)} placeholder="Ex: Fondations nord, coulée béton..." />
                            </div>
                        </div>
                        <div style={{ padding: '0 26px 22px', display: 'flex', gap: 10 }}>
                            <button onClick={() => { setUploadingJournalId(null); setSelectedFile(null); setLegende('') }} style={{ padding: '10px 18px', borderRadius: 10, border: '1.5px solid #E5E7EB', background: '#fff', fontSize: 13, fontWeight: 600, color: '#6B7280', cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
                            <button style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: 'var(--grad)', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: uploadPhoto.isPending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: uploadPhoto.isPending ? 0.7 : 1 }}
                                onClick={() => uploadPhoto.mutate({ journalId: uploadingJournalId, file: selectedFile, legende })}
                                disabled={uploadPhoto.isPending}>
                                {uploadPhoto.isPending ? 'Upload...' : <><Upload size={14} /> Enregistrer</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Journal modal */}
            {open && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 200, backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setOpen(false)}>
                    <div style={{ background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: 580, boxShadow: '0 24px 80px rgba(0,0,0,0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '92vh' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '22px 26px 18px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--indigo-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <HardHat size={18} color="var(--indigo)" />
                                </div>
                                <div>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.3px' }}>Journal du jour</div>
                                    <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>Avancement · Travaux · Météo</div>
                                </div>
                            </div>
                            <button onClick={() => { setOpen(false); setPendingPhotos([]) }} style={{ width: 32, height: 32, borderRadius: 8, background: '#F9FAFB', border: '1px solid #E5E7EB', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>
                                <X size={14} />
                            </button>
                        </div>

                        <div style={{ flex: 1, padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</div>
                                    <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 13, fontFamily: 'inherit', color: '#111827', outline: 'none', boxSizing: 'border-box' }}
                                        onFocus={e => e.target.style.borderColor = 'var(--indigo)'} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                                </div>
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ouvriers</div>
                                    <input type="number" value={form.effectif} placeholder="Ex: 12" onChange={e => setForm(f => ({ ...f, effectif: e.target.value }))}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 13, fontFamily: 'inherit', color: '#111827', outline: 'none', boxSizing: 'border-box' }}
                                        onFocus={e => e.target.style.borderColor = 'var(--indigo)'} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                                </div>
                            </div>

                            <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Météo</div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {METEOS.map(m => {
                                        const Icon   = METEO_ICONS[m]
                                        const active = form.meteo === m
                                        const color  = METEO_COLORS[m]
                                        return (
                                            <button key={m} onClick={() => setForm(f => ({ ...f, meteo: m }))} style={{
                                                flex: 1, padding: '11px 6px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
                                                border: `1.5px solid ${active ? color : '#E5E7EB'}`,
                                                background: active ? `${color}12` : '#fff',
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                                                transition: 'all 0.12s',
                                            }}>
                                                <Icon size={20} color={active ? color : '#D1D5DB'} />
                                                <span style={{ fontSize: 10, fontWeight: 700, color: active ? color : '#9CA3AF' }}>{METEO_LABELS[m]}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Avancement</div>
                                    <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--indigo)', letterSpacing: '-0.5px' }}>{form.avancement}%</span>
                                </div>
                                <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                                    {[0, 10, 25, 50, 75, 90, 100].map(v => {
                                        const active = Number(form.avancement) === v
                                        return (
                                            <button key={v} onClick={() => setForm(f => ({ ...f, avancement: v }))} style={{
                                                flex: 1, padding: '6px 2px', borderRadius: 8,
                                                border: `1.5px solid ${active ? 'var(--indigo)' : '#E5E7EB'}`,
                                                background: active ? 'var(--indigo)' : '#fff', color: active ? '#fff' : '#9CA3AF',
                                                fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.1s',
                                            }}>{v}%</button>
                                        )
                                    })}
                                </div>
                                <div style={{ height: 6, background: '#F3F4F6', borderRadius: 20, overflow: 'hidden' }}>
                                    <div style={{ height: '100%', background: 'var(--indigo)', width: `${form.avancement}%`, borderRadius: 20, transition: 'width 0.25s ease' }} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Travaux réalisés</div>
                                    <textarea value={form.travaux_realises} onChange={e => setForm(f => ({ ...f, travaux_realises: e.target.value }))}
                                        placeholder="Décrivez les travaux du jour..."
                                        style={{ minHeight: 88, padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none', color: '#111827', lineHeight: 1.6 }}
                                        onFocus={e => e.target.style.borderColor = 'var(--indigo)'} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Observations</div>
                                    <textarea value={form.observations} onChange={e => setForm(f => ({ ...f, observations: e.target.value }))}
                                        placeholder="Problèmes, alertes..."
                                        style={{ minHeight: 88, padding: '10px 12px', borderRadius: 10, border: '1.5px solid #FDE68A', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none', color: '#92400E', lineHeight: 1.6, background: '#FFFDF7' }}
                                        onFocus={e => e.target.style.borderColor = '#F59E0B'} onBlur={e => e.target.style.borderColor = '#FDE68A'} />
                                </div>
                            </div>

                            <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Photos {pendingPhotos.length > 0 && <span style={{ color: 'var(--indigo)' }}>· {pendingPhotos.length} sélectionnée{pendingPhotos.length > 1 ? 's' : ''}</span>}
                                </div>
                                {pendingPhotos.length > 0 && (
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                                        {pendingPhotos.map((p, i) => (
                                            <div key={i} style={{ position: 'relative', width: 68, height: 68, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
                                                <img src={URL.createObjectURL(p.file)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <button onClick={() => setPendingPhotos(prev => prev.filter((_, j) => j !== i))}
                                                    style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: '50%', background: 'rgba(220,38,38,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', padding: 0 }}>
                                                    <X size={10} />
                                                </button>
                                            </div>
                                        ))}
                                        <label style={{ width: 68, height: 68, borderRadius: 10, border: '2px dashed #C7D2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#F8FAFF', flexShrink: 0 }}>
                                            <Camera size={18} color="var(--indigo)" />
                                            <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => {
                                                const files = Array.from(e.target.files).map(file => ({ file, legende: '' }))
                                                setPendingPhotos(prev => [...prev, ...files])
                                                e.target.value = ''
                                            }} />
                                        </label>
                                    </div>
                                )}
                                {pendingPhotos.length === 0 && (
                                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '18px', borderRadius: 12, border: '2px dashed #C7D2FE', background: '#F8FAFF', cursor: 'pointer', transition: 'all 0.15s' }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#EEF2FF'; e.currentTarget.style.borderColor = 'var(--indigo)' }}
                                        onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFF'; e.currentTarget.style.borderColor = '#C7D2FE' }}>
                                        <Camera size={20} color="var(--indigo)" />
                                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--indigo)' }}>Ajouter des photos</span>
                                        <span style={{ fontSize: 11, color: '#9CA3AF' }}>Optionnel · plusieurs photos possibles</span>
                                        <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => {
                                            const files = Array.from(e.target.files).map(file => ({ file, legende: '' }))
                                            setPendingPhotos(files); e.target.value = ''
                                        }} />
                                    </label>
                                )}
                            </div>
                        </div>

                        <div style={{ padding: '14px 26px 22px', borderTop: '1px solid var(--line)', display: 'flex', gap: 10, flexShrink: 0 }}>
                            <button onClick={() => { setOpen(false); setPendingPhotos([]) }} style={{ padding: '10px 18px', borderRadius: 10, border: '1.5px solid var(--line)', background: 'var(--surface)', fontSize: 13, fontWeight: 600, color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit' }}>
                                Annuler
                            </button>
                            <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending} style={{
                                flex: 1, padding: '11px', borderRadius: 10, border: 'none', cursor: mutation.isPending ? 'not-allowed' : 'pointer',
                                background: 'var(--grad)', color: '#fff', fontSize: 13, fontWeight: 700,
                                fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                                boxShadow: '0 4px 14px rgba(17,0,255,0.25)', opacity: mutation.isPending ? 0.7 : 1,
                            }}>
                                <HardHat size={14} />
                                {mutation.isPending ? 'Enregistrement...' : 'Enregistrer le journal'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Réserve modal */}
            {openReserve && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 200, backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => { setOpenReserve(false); setReserveForm({ description: '', responsable: '' }) }}>
                    <div style={{ background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: 460, boxShadow: '0 24px 80px rgba(0,0,0,0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '22px 26px 18px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #FECACA' }}>
                                    <ShieldAlert size={18} color="#DC2626" />
                                </div>
                                <div>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Signaler une réserve</div>
                                    <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>Problème ou défaut constaté</div>
                                </div>
                            </div>
                            <button onClick={() => { setOpenReserve(false); setReserveForm({ description: '', responsable: '' }) }}
                                style={{ width: 32, height: 32, borderRadius: 8, background: '#F9FAFB', border: '1px solid #E5E7EB', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>
                                <X size={14} />
                            </button>
                        </div>
                        <div style={{ flex: 1, padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
                            <div style={{ padding: '11px 14px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FECACA', fontSize: 13, color: '#991B1B', lineHeight: 1.5 }}>
                                Une réserve doit être levée avant la réception du chantier.
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description du problème</div>
                                <textarea value={reserveForm.description} onChange={e => setReserveForm(f => ({ ...f, description: e.target.value }))}
                                    placeholder="Ex: Fissure dans le mur nord, ferraillage non conforme..."
                                    style={{ flex: 1, padding: '11px 13px', borderRadius: 10, border: '1.5px solid #FECACA', fontSize: 13, fontFamily: 'inherit', resize: 'none', outline: 'none', background: '#FFF8F8', color: '#111827', lineHeight: 1.6, minHeight: 110 }}
                                    onFocus={e => e.target.style.borderColor = '#DC2626'} onBlur={e => e.target.style.borderColor = '#FECACA'} />
                            </div>
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Responsable</div>
                                <input value={reserveForm.responsable} onChange={e => setReserveForm(f => ({ ...f, responsable: e.target.value }))}
                                    placeholder="Ex: Entreprise SARL, M. Benali..."
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 13, fontFamily: 'inherit', outline: 'none', color: '#111827', boxSizing: 'border-box' }}
                                    onFocus={e => e.target.style.borderColor = '#DC2626'} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                            </div>
                        </div>
                        <div style={{ padding: '14px 26px 22px', borderTop: '1px solid var(--line)', display: 'flex', gap: 10, flexShrink: 0 }}>
                            <button onClick={() => { setOpenReserve(false); setReserveForm({ description: '', responsable: '' }) }}
                                style={{ padding: '10px 18px', borderRadius: 10, border: '1.5px solid var(--line)', background: 'var(--surface)', fontSize: 13, fontWeight: 600, color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit' }}>
                                Annuler
                            </button>
                            <button onClick={() => createReserve.mutate(reserveForm)}
                                disabled={!reserveForm.description || !reserveForm.responsable || createReserve.isPending}
                                style={{
                                    flex: 1, padding: '11px', borderRadius: 10, border: 'none', fontFamily: 'inherit',
                                    fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                                    background: reserveForm.description && reserveForm.responsable ? 'linear-gradient(135deg,#DC2626,#B91C1C)' : '#F3F4F6',
                                    color: reserveForm.description && reserveForm.responsable ? '#fff' : '#9CA3AF',
                                    cursor: reserveForm.description && reserveForm.responsable ? 'pointer' : 'not-allowed',
                                    boxShadow: reserveForm.description && reserveForm.responsable ? '0 4px 14px rgba(220,38,38,0.3)' : 'none',
                                }}>
                                <ShieldAlert size={14} />
                                {createReserve.isPending ? 'Enregistrement...' : 'Signaler la réserve'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit journal modal */}
            {editJournal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 300, backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setEditJournal(null)}>
                    <div style={{ background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: 580, boxShadow: '0 24px 80px rgba(0,0,0,0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '92vh' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '22px 26px 18px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--indigo-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Pencil size={18} color="var(--indigo)" />
                                </div>
                                <div>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.3px' }}>Modifier le journal</div>
                                    <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>
                                        {new Date(editJournal.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setEditJournal(null)} style={{ width: 32, height: 32, borderRadius: 8, background: '#F9FAFB', border: '1px solid #E5E7EB', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>
                                <X size={14} />
                            </button>
                        </div>

                        <div style={{ flex: 1, padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</div>
                                    <input type="date" value={editJournalForm.date} onChange={e => setEditJournalForm(f => ({ ...f, date: e.target.value }))}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 13, fontFamily: 'inherit', color: '#111827', outline: 'none', boxSizing: 'border-box' }}
                                        onFocus={e => e.target.style.borderColor = 'var(--indigo)'} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                                </div>
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ouvriers</div>
                                    <input type="number" value={editJournalForm.effectif} placeholder="Ex: 12" onChange={e => setEditJournalForm(f => ({ ...f, effectif: e.target.value }))}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 13, fontFamily: 'inherit', color: '#111827', outline: 'none', boxSizing: 'border-box' }}
                                        onFocus={e => e.target.style.borderColor = 'var(--indigo)'} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                                </div>
                            </div>

                            <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Météo</div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {METEOS.map(m => {
                                        const Icon = METEO_ICONS[m]
                                        const active = editJournalForm.meteo === m
                                        const color = METEO_COLORS[m]
                                        return (
                                            <button key={m} onClick={() => setEditJournalForm(f => ({ ...f, meteo: m }))} style={{
                                                flex: 1, padding: '11px 6px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
                                                border: `1.5px solid ${active ? color : '#E5E7EB'}`,
                                                background: active ? `${color}12` : '#fff',
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, transition: 'all 0.12s',
                                            }}>
                                                <Icon size={20} color={active ? color : '#D1D5DB'} />
                                                <span style={{ fontSize: 10, fontWeight: 700, color: active ? color : '#9CA3AF' }}>{METEO_LABELS[m]}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Avancement</div>
                                    <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--indigo)', letterSpacing: '-0.5px' }}>{editJournalForm.avancement}%</span>
                                </div>
                                <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                                    {[0, 10, 25, 50, 75, 90, 100].map(v => {
                                        const active = Number(editJournalForm.avancement) === v
                                        return (
                                            <button key={v} onClick={() => setEditJournalForm(f => ({ ...f, avancement: v }))} style={{
                                                flex: 1, padding: '6px 2px', borderRadius: 8,
                                                border: `1.5px solid ${active ? 'var(--indigo)' : '#E5E7EB'}`,
                                                background: active ? 'var(--indigo)' : '#fff', color: active ? '#fff' : '#9CA3AF',
                                                fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.1s',
                                            }}>{v}%</button>
                                        )
                                    })}
                                </div>
                                <div style={{ height: 6, background: '#F3F4F6', borderRadius: 20, overflow: 'hidden' }}>
                                    <div style={{ height: '100%', background: 'var(--indigo)', width: `${editJournalForm.avancement}%`, borderRadius: 20, transition: 'width 0.25s ease' }} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Travaux réalisés</div>
                                    <textarea value={editJournalForm.travaux_realises} onChange={e => setEditJournalForm(f => ({ ...f, travaux_realises: e.target.value }))}
                                        placeholder="Décrivez les travaux du jour..."
                                        style={{ minHeight: 88, padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none', color: '#111827', lineHeight: 1.6 }}
                                        onFocus={e => e.target.style.borderColor = 'var(--indigo)'} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Observations</div>
                                    <textarea value={editJournalForm.observations} onChange={e => setEditJournalForm(f => ({ ...f, observations: e.target.value }))}
                                        placeholder="Problèmes, alertes..."
                                        style={{ minHeight: 88, padding: '10px 12px', borderRadius: 10, border: '1.5px solid #FDE68A', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none', color: '#92400E', lineHeight: 1.6, background: '#FFFDF7' }}
                                        onFocus={e => e.target.style.borderColor = '#F59E0B'} onBlur={e => e.target.style.borderColor = '#FDE68A'} />
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '14px 26px 22px', borderTop: '1px solid var(--line)', display: 'flex', gap: 10, flexShrink: 0 }}>
                            <button onClick={() => setEditJournal(null)} style={{ padding: '10px 18px', borderRadius: 10, border: '1.5px solid var(--line)', background: 'var(--surface)', fontSize: 13, fontWeight: 600, color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit' }}>
                                Annuler
                            </button>
                            <button onClick={() => updateJournalMutation.mutate({ id: editJournal.id, data: editJournalForm })} disabled={updateJournalMutation.isPending} style={{
                                flex: 1, padding: '11px', borderRadius: 10, border: 'none', cursor: updateJournalMutation.isPending ? 'not-allowed' : 'pointer',
                                background: 'var(--grad)', color: '#fff', fontSize: 13, fontWeight: 700,
                                fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                                boxShadow: '0 4px 14px rgba(17,0,255,0.25)', opacity: updateJournalMutation.isPending ? 0.7 : 1,
                            }}>
                                <HardHat size={14} />
                                {updateJournalMutation.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {lightbox && (
                <Lightbox photos={lightbox.photos} startIndex={lightbox.index} onClose={() => setLightbox(null)} />
            )}

            <ConfirmModal
                open={!!confirmDelPhoto}
                title="Supprimer la photo"
                message="Cette photo sera définitivement supprimée."
                onConfirm={() => deletePhoto.mutate(confirmDelPhoto)}
                onCancel={() => setConfirmDelPhoto(null)}
            />

            {editLegendPhoto && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
                    onClick={() => setEditLegendPhoto(null)}>
                    <div style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', width: '100%', maxWidth: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
                        onClick={e => e.stopPropagation()}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>Modifier la légende</div>
                        <div className="field">
                            <label>Légende</label>
                            <input
                                value={editLegendVal}
                                onChange={e => setEditLegendVal(e.target.value)}
                                placeholder="Description de la photo..."
                                autoFocus
                            />
                        </div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                            <button onClick={() => setEditLegendPhoto(null)}
                                style={{ padding: '10px 18px', borderRadius: 10, border: '1.5px solid var(--line)', background: '#fff', fontSize: 13, fontWeight: 600, color: '#64748B', cursor: 'pointer', fontFamily: 'inherit' }}>
                                Annuler
                            </button>
                            <button
                                onClick={() => updatePhotoLegende.mutate({ id: editLegendPhoto, legende: editLegendVal })}
                                disabled={updatePhotoLegende.isPending}
                                style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: 'var(--grad)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                                {updatePhotoLegende.isPending ? 'Enregistrement...' : 'Enregistrer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    )
}
