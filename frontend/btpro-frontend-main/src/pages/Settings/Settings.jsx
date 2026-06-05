import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Building2, UserCog, Users, Receipt, Sparkles, Save, Check, Plus,
    Trash2, KeyRound, AlertCircle, Eye, EyeOff, X,
    CheckCircle2, Upload, ImageIcon, MoreHorizontal,
    Crown, CreditCard,
} from 'lucide-react'
import Layout from '../../components/Layout'
import useStore from '../../store/useStore'
import api from '../../api/axios'
import useToast from '../../store/useToast'
import ConfirmModal from '../../components/ConfirmModal'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const TABS = [
    { key: 'cabinet',     label: 'Cabinet',           icon: Building2, patronOnly: true },
    { key: 'profil',      label: 'Profil & sécurité', icon: UserCog },
    { key: 'equipe',      label: 'Équipe & rôles',    icon: Users,     patronOnly: true },
    { key: 'facturation', label: 'Facturation & TVA', icon: Receipt,   patronOnly: true },
    { key: 'abonnement',  label: 'Abonnement',        icon: Sparkles,  patronOnly: true },
]

const PLAN_META = {
    SOLO:    { label: 'Solo',    prix: '3 900',  color: 'var(--indigo)', bg: 'var(--indigo-soft)', features: ['1 architecte', 'Factures + Devis PDF', 'Journal chantier', '5 GB stockage'] },
    CABINET: { label: 'Cabinet', prix: '7 900',  color: '#16A571', bg: 'var(--green-soft)',  features: ['3 architectes', 'Time tracking', 'Planning équipe', 'Module paie', '10 GB stockage'] },
    AGENCE:  { label: 'Agence',  prix: '14 900', color: '#F59E0B', bg: 'var(--amber-soft)',  features: ['5 architectes', 'Time tracking', 'Planning équipe', 'Module paie', 'Priorité support', '15 GB stockage'] },
}

const AVATAR_PALETTE = ['#1E2E4A','#2563EB','#D97706','#374151','#E11D48','#16A571','#7C3AED','#EA580C','#0EA5E9','#64748B']
function avatarBg(prenom = '', nom = '') {
    const s = prenom + nom
    let h = 0
    for (const c of s) h = (h * 31 + c.charCodeAt(0)) & 0xff
    return AVATAR_PALETTE[h % AVATAR_PALETTE.length]
}

function timeAgo(dateStr) {
    if (!dateStr) return null
    const diff = (Date.now() - new Date(dateStr)) / 1000
    if (diff < 60)    return 'À l\'instant'
    if (diff < 3600)  return `Il y a ${Math.floor(diff/60)} min`
    if (diff < 86400) return `Il y a ${Math.floor(diff/3600)}h`
    const d = Math.floor(diff/86400)
    return `Modifié il y a ${d} jour${d>1?'s':''}`
}

/* ── SHARED COMPONENTS ── */

function SField({ label, value, onChange, type = 'text', disabled, hint, error, placeholder }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', letterSpacing: 0.2 }}>{label}</label>
            <input
                type={type} value={value} onChange={onChange} disabled={disabled}
                placeholder={placeholder || label}
                style={{
                    padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${error ? 'var(--red)' : 'var(--line-2)'}`,
                    fontSize: 13.5, color: 'var(--ink)', fontFamily: 'var(--sans)', outline: 'none',
                    background: disabled ? 'var(--bg-2)' : 'var(--surface)', transition: 'border-color 0.15s',
                }}
                onFocus={e => !disabled && (e.target.style.borderColor = 'var(--indigo)')}
                onBlur={e => !disabled && (e.target.style.borderColor = error ? 'var(--red)' : 'var(--line-2)')}
            />
            {hint && !error && <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>{hint}</span>}
            {error && <span style={{ fontSize: 11, color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={11}/>{error}</span>}
        </div>
    )
}

function SFieldPwd({ label, value, onChange, error, placeholder }) {
    const [show, setShow] = useState(false)
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', letterSpacing: 0.2 }}>{label}</label>
            <div style={{ position: 'relative' }}>
                <input
                    type={show ? 'text' : 'password'} value={value} onChange={onChange}
                    placeholder={placeholder || '••••••••'}
                    style={{ width: '100%', padding: '9px 40px 9px 12px', borderRadius: 8, border: `1.5px solid ${error ? 'var(--red)' : 'var(--line-2)'}`, fontSize: 13.5, color: 'var(--ink)', fontFamily: 'var(--sans)', outline: 'none', background: 'var(--surface)' }}
                />
                <button type="button" onClick={() => setShow(s => !s)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-2)', padding: 0 }}>
                    {show ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
            </div>
            {error && <span style={{ fontSize: 11, color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={11}/>{error}</span>}
        </div>
    )
}

function CardFooter({ timeStr, onCancel, onSave, saving, saved }) {
    return (
        <div style={{ borderTop: '1px solid var(--line)', marginTop: 24, paddingTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: 'var(--muted-2)' }}>{timeStr || ''}</span>
            <div style={{ display: 'flex', gap: 8 }}>
                {onCancel && (
                    <button onClick={onCancel} style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid var(--line-2)', background: 'transparent', color: 'var(--muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                        Annuler
                    </button>
                )}
                <button onClick={onSave} disabled={saving}
                    style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: 'var(--ink)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)', opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 7 }}>
                    {saved ? <><Check size={14}/> Enregistré</> : <><Save size={14}/> Enregistrer</>}
                </button>
            </div>
        </div>
    )
}

function SettingsCard({ title, subtitle, children, style }) {
    return (
        <div style={{ background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--line)', padding: '22px 24px', marginBottom: 16, ...style }}>
            {title && (
                <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.2px' }}>{title}</div>
                    {subtitle && <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 3 }}>{subtitle}</div>}
                </div>
            )}
            {children}
        </div>
    )
}


function Modal({ open, onClose, title, subtitle, icon: Icon, children }) {
    if (!open) return null
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,11,20,0.45)', zIndex: 200, backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
            <div style={{ background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 480, boxShadow: '0 24px 80px rgba(0,0,0,0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{title}</div>
                        {subtitle && <div style={{ fontSize: 12, color: 'var(--muted-2)', marginTop: 2 }}>{subtitle}</div>}
                    </div>
                    <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-2)', border: '1px solid var(--line)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
                        <X size={14}/>
                    </button>
                </div>
                <div style={{ padding: 24, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {children}
                </div>
            </div>
        </div>
    )
}

/* ── MAIN COMPONENT ── */

export default function Settings() {
    const storeUser = useStore(s => s.user)
    const setUser   = useStore(s => s.setUser)
    const qc        = useQueryClient()
    const { toast } = useToast()

    const [tab, setTab]               = useState('cabinet')
    const [openMembre, setOpenMembre] = useState(false)
    const [openReset, setOpenReset]   = useState(null)
    const [confirmDel, setConfirmDel] = useState(null)
    const [resetPwd, setResetPwd]     = useState('')
    const [resetPwdErr, setResetPwdErr] = useState('')
    const [planErr, setPlanErr]       = useState('')
    const [payLoading, setPayLoading] = useState(null)
    const [membreErr, setMembreErr]   = useState('')
    const [membreForm, setMembreForm] = useState({ prenom: '', nom: '', email: '', password: '', role: '' })
    const [membreErrors, setMembreErrors] = useState({})
    const [cabinetSaved, setCabinetSaved] = useState(false)
    const [profilSaved,  setProfilSaved]  = useState(false)
    const [profilForm, setProfilForm] = useState({ prenom: '', nom: '' })
    const [logoFile, setLogoFile]     = useState(null)
    const [logoPreview, setLogoPreview] = useState(null)
    const logoRef = useRef()

    const { data: meData } = useQuery({
        queryKey: ['me'],
        queryFn: () => api.get('/users/me/').then(r => r.data),
    })
    useEffect(() => {
        if (meData) {
            setUser(meData)
            setProfilForm({ prenom: meData.prenom ?? '', nom: meData.nom ?? '' })
        }
    }, [meData])
    const currentUser     = meData ?? storeUser
    const isPropriétaire  = currentUser?.is_patron === true
    const userPlan        = (currentUser?.plan === 'PREMIUM' ? 'AGENCE' : currentUser?.plan) ?? 'SOLO'

    useEffect(() => {
        if (!currentUser) return
        const patronOnlyTabs = TABS.filter(t => t.patronOnly).map(t => t.key)
        if (!isPropriétaire && patronOnlyTabs.includes(tab)) setTab('profil')
    }, [currentUser, isPropriétaire, tab])

    const { data: cabinetData } = useQuery({
        queryKey: ['cabinet'],
        queryFn: () => api.get('/cabinets/mon-cabinet/').then(r => r.data),
    })

    const [cabinetForm, setCabinetForm] = useState({
        nom: '', forme_juridique: '', adresse: '', wilaya: '',
        telephone: '', email: '', numero_rc: '', nif: '', nis: '', ai: '',
    })
    const [fiscalSaved, setFiscalSaved] = useState(false)

    useEffect(() => {
        if (!cabinetData) return
        setCabinetForm({
            nom:             cabinetData.nom          || '',
            forme_juridique: cabinetData.activite     || '',
            adresse:         cabinetData.adresse      || '',
            wilaya:          cabinetData.wilaya        || '',
            telephone:       cabinetData.telephone    || '',
            email:           cabinetData.email        || '',
            numero_rc:       cabinetData.numero_rc    || '',
            nif:             cabinetData.nif          || '',
            nis:             cabinetData.nis          || '',
            ai:              cabinetData.ai           || '',
        })
    }, [cabinetData])

    const saveCabinet = useMutation({
        mutationFn: d => {
            const payload = { ...d, activite: d.forme_juridique }
            if (logoFile) {
                const fd = new FormData()
                Object.entries(payload).forEach(([k, v]) => fd.append(k, v))
                fd.append('logo', logoFile)
                return api.put('/cabinets/modifier/', fd, { headers: { 'Content-Type': undefined } })
            }
            return api.put('/cabinets/modifier/', payload)
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['cabinet'] })
            setCabinetSaved(true); setLogoFile(null)
            setTimeout(() => setCabinetSaved(false), 2500)
            toast('Cabinet mis à jour')
        },
        onError: err => toast('Erreur: ' + (err.response?.data ? JSON.stringify(err.response.data) : err.message), 'error'),
    })

    const saveFiscal = useMutation({
        mutationFn: () => api.put('/cabinets/modifier/', {
            activite: cabinetForm.forme_juridique,
            numero_rc: cabinetForm.numero_rc, nif: cabinetForm.nif,
            nis: cabinetForm.nis, ai: cabinetForm.ai,
        }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['cabinet'] })
            setFiscalSaved(true); setTimeout(() => setFiscalSaved(false), 2500)
            toast('Identifiants fiscaux sauvegardés')
        },
        onError: () => toast('Erreur lors de la sauvegarde', 'error'),
    })

    const saveProfil = useMutation({
        mutationFn: d => api.patch('/users/me/', d),
        onSuccess: (res) => {
            setUser(res.data)
            qc.invalidateQueries({ queryKey: ['me'] })
            setProfilSaved(true); setTimeout(() => setProfilSaved(false), 2500)
            toast('Profil mis à jour')
        },
        onError: () => toast('Erreur lors de la sauvegarde', 'error'),
    })

    const { data: membres = [] } = useQuery({
        queryKey: ['membres'],
        queryFn: () => api.get('/users/membres/').then(r => r.data),
    })

    const ajouterMembre = useMutation({
        mutationFn: d => api.post('/users/membres/', d),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['membres'] })
            setOpenMembre(false)
            setMembreForm({ prenom: '', nom: '', email: '', password: '', role: '' })
            setMembreErrors({}); setMembreErr('')
            toast('Membre ajouté')
        },
        onError: err => setMembreErr(err.response?.data?.error ?? "Erreur lors de l'ajout"),
    })

    const toggleAssocieM = useMutation({
        mutationFn: id => api.put(`/users/membres/${id}/associe/`),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['membres'] }); toast('Rôle mis à jour') },
    })

    const supprimerMembre = useMutation({
        mutationFn: id => api.delete(`/users/membres/${id}/`),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['membres'] }); toast('Membre supprimé', 'info') },
    })

    const resetMembre = useMutation({
        mutationFn: d => api.put(`/users/membres/${d.id}/reset-password/`, { password: d.password }),
        onSuccess: () => { setOpenReset(null); setResetPwd(''); setResetPwdErr(''); toast('Mot de passe réinitialisé') },
        onError: () => toast('Erreur lors de la réinitialisation', 'error'),
    })

    const handlePayer = (plan) => {
        setPayLoading(plan); setPlanErr('')
        api.post('/finances/checkout/', { plan })
            .then(res => { window.location.href = res.data.checkout_url })
            .catch(err => { setPlanErr(err.response?.data?.error ?? 'Erreur Chargily'); setTimeout(() => setPlanErr(''), 5000) })
            .finally(() => setPayLoading(null))
    }

    const validateMembre = () => {
        const e = {}
        if (!membreForm.prenom.trim()) e.prenom = 'Obligatoire'
        if (!membreForm.nom.trim())    e.nom    = 'Obligatoire'
        if (!membreForm.email)         e.email  = 'Obligatoire'
        else if (!EMAIL_REGEX.test(membreForm.email)) e.email = 'Email invalide'
        if (!membreForm.password)      e.password = 'Obligatoire'
        else if (membreForm.password.length < 6)      e.password = 'Minimum 6 caractères'
        return e
    }

    const cabinetTimeStr = timeAgo(cabinetData?.updated_at || cabinetData?.date_modification)
    const logoSrc = logoPreview || cabinetData?.logo || null
    const cabinetInitial = (cabinetData?.nom || 'P')[0].toUpperCase()

    /* ── RENDER ── */

    return (
        <Layout>
            <div className="page" style={{ paddingBottom: 48 }}>
                <div className="page-head">
                    <div>
                        <h1 className="page-title">Paramètres</h1>
                        <div className="page-sub">Cabinet, équipe, facturation et intégrations.</div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '216px 1fr', gap: 20, alignItems: 'start' }}>

                    {/* ── LEFT NAV ── */}
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden', position: 'sticky', top: 20 }}>
                        {TABS.filter(t => !t.patronOnly || isPropriétaire).map(t => {
                            const Icon = t.icon
                            const active = tab === t.key
                            return (
                                <div
                                    key={t.key}
                                    onClick={() => setTab(t.key)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '10px 16px', cursor: 'pointer',
                                        background: active ? 'var(--ink)' : 'transparent',
                                        color: active ? '#fff' : 'var(--muted)',
                                        fontSize: 13, fontWeight: active ? 600 : 500,
                                        transition: 'all 0.12s',
                                        borderBottom: '1px solid var(--line)',
                                    }}
                                    onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--bg-2)'; e.currentTarget.style.color = 'var(--ink)' }}}
                                    onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)' }}}
                                >
                                    <Icon size={14} style={{ flexShrink: 0 }}/>
                                    {t.label}
                                </div>
                            )
                        })}
                    </div>

                    {/* ── CONTENT ── */}
                    <div>

                        {/* Guard: patron-only tabs blocked for members */}
                        {!isPropriétaire && TABS.find(t => t.key === tab)?.patronOnly && (
                            <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--muted)' }}>
                                <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>Accès réservé au propriétaire</div>
                                <div style={{ fontSize: 13 }}>Seul le propriétaire du cabinet peut accéder à ces paramètres.</div>
                            </div>
                        )}

                        {/* ── CABINET ── */}
                        {tab === 'cabinet' && (
                            <>
                                {/* Identity */}
                                <SettingsCard title="Identité du cabinet" subtitle="Visible en en-tête de tous vos documents.">
                                    {/* Logo */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                                        <div style={{ width: 72, height: 72, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: logoSrc ? 'var(--bg-2)' : 'var(--grad)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {logoSrc
                                                ? <img src={logoSrc} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }}/>
                                                : <span style={{ color: '#fff', fontSize: 28, fontWeight: 800 }}>{cabinetInitial}</span>}
                                        </div>
                                        <div>
                                            <button
                                                onClick={() => logoRef.current?.click()}
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 8, border: '1.5px solid var(--line-2)', background: 'var(--surface)', color: 'var(--ink)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                                                <Upload size={13}/> Téléverser un logo
                                            </button>
                                            <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }}
                                                onChange={e => { const f = e.target.files[0]; if (!f) return; setLogoFile(f); setLogoPreview(URL.createObjectURL(f)) }}/>
                                            <div style={{ fontSize: 11.5, color: 'var(--muted-2)', marginTop: 5 }}>
                                                SVG, PNG ou JPG · 4 MB max · format carré recommandé
                                            </div>
                                            {logoFile && <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 3 }}>✓ {logoFile.name}</div>}
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>
                                        <SField label="Raison sociale" value={cabinetForm.nom} onChange={e => setCabinetForm(f => ({ ...f, nom: e.target.value }))}/>
                                        <SField label="Forme juridique" value={cabinetForm.forme_juridique} onChange={e => setCabinetForm(f => ({ ...f, forme_juridique: e.target.value }))} placeholder="EURL, SARL, SPA…"/>
                                        <SField label="Adresse" value={cabinetForm.adresse} onChange={e => setCabinetForm(f => ({ ...f, adresse: e.target.value }))}/>
                                        <SField label="Wilaya" value={cabinetForm.wilaya} onChange={e => setCabinetForm(f => ({ ...f, wilaya: e.target.value }))} placeholder="Alger"/>
                                        <SField label="Téléphone" value={cabinetForm.telephone} onChange={e => setCabinetForm(f => ({ ...f, telephone: e.target.value }))}/>
                                        <SField label="Email" type="email" value={cabinetForm.email} onChange={e => setCabinetForm(f => ({ ...f, email: e.target.value }))}/>
                                    </div>

                                    <CardFooter
                                        timeStr={cabinetTimeStr}
                                        onCancel={() => qc.invalidateQueries({ queryKey: ['cabinet'] })}
                                        onSave={() => saveCabinet.mutate(cabinetForm)}
                                        saving={saveCabinet.isPending}
                                        saved={cabinetSaved}
                                    />
                                </SettingsCard>

                                {/* Fiscal */}
                                <SettingsCard title="Identifiants fiscaux" subtitle="Obligatoires sur factures et contrats (cadre algérien).">
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>
                                        <SField label="NIF" value={cabinetForm.nif} onChange={e => setCabinetForm(f => ({ ...f, nif: e.target.value }))}/>
                                        <SField label="NIS" value={cabinetForm.nis} onChange={e => setCabinetForm(f => ({ ...f, nis: e.target.value }))}/>
                                        <SField label="RC" value={cabinetForm.numero_rc} onChange={e => setCabinetForm(f => ({ ...f, numero_rc: e.target.value }))}/>
                                        <SField label="Article d'imposition" value={cabinetForm.ai} onChange={e => setCabinetForm(f => ({ ...f, ai: e.target.value }))}/>
                                    </div>
                                    <CardFooter
                                        onSave={() => saveFiscal.mutate()}
                                        saving={saveFiscal.isPending}
                                        saved={fiscalSaved}
                                    />
                                </SettingsCard>

                                {/* Team */}
                                <TeamCard
                                    membres={membres} currentUser={currentUser}
                                    isPropriétaire={isPropriétaire}
                                    onInvite={() => { setOpenMembre(true); setMembreErr(''); setMembreErrors({}) }}
                                    onToggleRole={id => toggleAssocieM.mutate(id)}
                                    onReset={m => { setOpenReset(m); setResetPwd(''); setResetPwdErr('') }}
                                    onDelete={m => setConfirmDel({ id: m.id, name: `${m.prenom} ${m.nom}` })}
                                />
                            </>
                        )}

                        {/* ── PROFIL ── */}
                        {tab === 'profil' && (
                            <SettingsCard title="Profil & sécurité" subtitle="Vos informations personnelles et mot de passe.">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '4px 0 20px', borderBottom: '1px solid var(--line)', marginBottom: 20 }}>
                                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: avatarBg(currentUser?.prenom, currentUser?.nom), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
                                        {currentUser?.prenom?.[0]}{currentUser?.nom?.[0]}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{currentUser?.prenom} {currentUser?.nom}</div>
                                        <div style={{ fontSize: 12.5, color: 'var(--muted-2)', marginTop: 2 }}>{currentUser?.email}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>
                                    <SField label="Prénom" value={profilForm.prenom}
                                        onChange={e => setProfilForm(f => ({ ...f, prenom: e.target.value }))}/>
                                    <SField label="Nom" value={profilForm.nom}
                                        onChange={e => setProfilForm(f => ({ ...f, nom: e.target.value }))}/>
                                </div>
                                <div style={{ marginTop: 14 }}>
                                    <SField label="Email" type="email" value={currentUser?.email ?? ''} onChange={() => {}} disabled hint="L'email ne peut pas être modifié"/>
                                </div>
                                <CardFooter
                                    onCancel={() => setProfilForm({ prenom: currentUser?.prenom ?? '', nom: currentUser?.nom ?? '' })}
                                    onSave={() => saveProfil.mutate(profilForm)}
                                    saving={saveProfil.isPending}
                                    saved={profilSaved}
                                />
                            </SettingsCard>
                        )}

                        {/* ── ÉQUIPE (standalone) ── */}
                        {tab === 'equipe' && (
                            <TeamCard
                                membres={membres} currentUser={currentUser}
                                isPropriétaire={isPropriétaire}
                                onInvite={() => { setOpenMembre(true); setMembreErr(''); setMembreErrors({}) }}
                                onToggleRole={id => toggleAssocieM.mutate(id)}
                                onReset={m => { setOpenReset(m); setResetPwd(''); setResetPwdErr('') }}
                                onDelete={m => setConfirmDel({ id: m.id, name: `${m.prenom} ${m.nom}` })}
                            />
                        )}

                        {/* ── ABONNEMENT ── */}
                        {tab === 'abonnement' && (
                            <AbonnementTab
                                cabinetData={cabinetData}
                                userPlan={userPlan}
                                isPropriétaire={isPropriétaire}
                                planErr={planErr}
                                payLoading={payLoading}
                                onPay={handlePayer}
                            />
                        )}

                        {/* ── FACTURATION & TVA ── */}
                        {tab === 'facturation' && (
                            <FacturationTab cabinetData={cabinetData} qc={qc} toast={toast} isPropriétaire={isPropriétaire} />
                        )}

                    </div>
                </div>
            </div>

            {/* ── MODAL INVITER ── */}
            <Modal open={openMembre} onClose={() => setOpenMembre(false)} title="Inviter un architecte" subtitle="Nouveau membre du cabinet">
                {membreErr && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--red-soft)', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', color: 'var(--red)', fontSize: 13 }}>
                        <AlertCircle size={13}/> {membreErr}
                    </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <SField label="Prénom *" value={membreForm.prenom} onChange={e => { setMembreForm(f => ({ ...f, prenom: e.target.value })); setMembreErrors(e2 => ({ ...e2, prenom: '' })) }} error={membreErrors.prenom}/>
                    <SField label="Nom *" value={membreForm.nom} onChange={e => { setMembreForm(f => ({ ...f, nom: e.target.value })); setMembreErrors(e2 => ({ ...e2, nom: '' })) }} error={membreErrors.nom}/>
                </div>
                <SField label="Email *" type="email" value={membreForm.email} onChange={e => { setMembreForm(f => ({ ...f, email: e.target.value })); setMembreErrors(e2 => ({ ...e2, email: '' })) }} error={membreErrors.email} placeholder="architecte@cabinet.dz"/>
                <SField label="Titre / Rôle" value={membreForm.role} onChange={e => setMembreForm(f => ({ ...f, role: e.target.value }))} placeholder="Architecte Senior, Chef de projet…"/>
                <SFieldPwd label="Mot de passe *" value={membreForm.password} onChange={e => { setMembreForm(f => ({ ...f, password: e.target.value })); setMembreErrors(e2 => ({ ...e2, password: '' })) }} error={membreErrors.password}/>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                    <button onClick={() => setOpenMembre(false)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1.5px solid var(--line-2)', background: 'transparent', color: 'var(--muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)' }}>Annuler</button>
                    <button onClick={() => { const e = validateMembre(); if (Object.keys(e).length) { setMembreErrors(e); return } ajouterMembre.mutate(membreForm) }}
                        disabled={ajouterMembre.isPending}
                        style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: 'var(--ink)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                        {ajouterMembre.isPending ? 'Ajout…' : '+ Inviter'}
                    </button>
                </div>
            </Modal>

            {/* ── MODAL RESET PWD ── */}
            <Modal open={!!openReset} onClose={() => setOpenReset(null)} title="Réinitialiser le mot de passe" subtitle={openReset ? `${openReset.prenom} ${openReset.nom}` : ''}>
                {openReset && (
                    <>
                        <SFieldPwd label="Nouveau mot de passe" value={resetPwd} onChange={e => { setResetPwd(e.target.value); setResetPwdErr('') }} error={resetPwdErr} placeholder="Minimum 6 caractères"/>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setOpenReset(null)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1.5px solid var(--line-2)', background: 'transparent', color: 'var(--muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)' }}>Annuler</button>
                            <button onClick={() => { if (!resetPwd) { setResetPwdErr('Obligatoire'); return } if (resetPwd.length < 6) { setResetPwdErr('Minimum 6 caractères'); return } resetMembre.mutate({ id: openReset.id, password: resetPwd }) }}
                                disabled={resetMembre.isPending}
                                style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: 'var(--grad)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                                {resetMembre.isPending ? 'En cours…' : 'Réinitialiser'}
                            </button>
                        </div>
                    </>
                )}
            </Modal>

            <ConfirmModal
                open={!!confirmDel}
                title={`Supprimer ${confirmDel?.name ?? 'ce membre'} ?`}
                message="Ce membre n'aura plus accès au cabinet."
                onConfirm={() => supprimerMembre.mutate(confirmDel.id)}
                onCancel={() => setConfirmDel(null)}
            />
        </Layout>
    )
}

/* ── TEAM CARD ── */

function TeamCard({ membres, currentUser, isPropriétaire, onInvite, onToggleRole, onReset, onDelete }) {
    const [menuOpen, setMenuOpen] = useState(null)
    const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })

    const handleMenuBtn = (e, id) => {
        if (menuOpen === id) { setMenuOpen(null); return }
        const rect = e.currentTarget.getBoundingClientRect()
        setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
        setMenuOpen(id)
    }

    const getRoleBadge = (m) => {
        if (m.id === currentUser?.id && m.is_patron) return { label: 'Propriétaire', dark: true }
        if (m.is_patron) return { label: 'Admin', dark: false }
        return { label: 'Membre', dark: false }
    }

    return (
        <div style={{ background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--line)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink)' }}>Équipe</div>
                {isPropriétaire && (
                    <button onClick={onInvite}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1.5px solid var(--line-2)', background: 'var(--surface)', color: 'var(--ink)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                        <Plus size={13}/> Inviter
                    </button>
                )}
            </div>
            {membres.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--muted-2)', fontSize: 13 }}>
                    Aucun membre · invitez votre équipe
                </div>
            ) : membres.map((m, idx) => {
                const badge = getRoleBadge(m)
                const bg = avatarBg(m.prenom, m.nom)
                const isMe = m.id === currentUser?.id
                const title = m.is_patron ? (isMe ? 'Architecte Patron' : 'Architecte Associé') : 'Architecte'
                return (
                    <div key={m.id}
                        style={{ display: 'flex', alignItems: 'center', padding: '13px 20px', borderBottom: idx < membres.length-1 ? '1px solid var(--line)' : 'none', gap: 12, position: 'relative' }}>
                        {/* Avatar */}
                        <div style={{ width: 38, height: 38, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                            {m.prenom?.[0]}{m.nom?.[0]}
                        </div>
                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                {m.prenom} {m.nom}
                                {isMe && <span style={{ fontSize: 11, color: 'var(--muted-2)', fontWeight: 400 }}>(vous)</span>}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--muted-2)', marginTop: 1 }}>{title}</div>
                        </div>
                        {/* Badge */}
                        <span style={{
                            padding: '4px 12px', borderRadius: 20, fontSize: 11.5, fontWeight: 600,
                            background: badge.dark ? 'var(--ink)' : 'var(--bg-2)',
                            color: badge.dark ? '#fff' : 'var(--muted)',
                        }}>
                            {badge.label}
                        </span>
                        {/* Menu */}
                        {!isMe && isPropriétaire && (
                            <div>
                                <button onClick={e => handleMenuBtn(e, m.id)}
                                    style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid var(--line)', background: 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
                                    <MoreHorizontal size={14}/>
                                </button>
                                {menuOpen === m.id && (
                                    <>
                                        <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={() => setMenuOpen(null)}/>
                                        <div style={{ position: 'fixed', top: menuPos.top, right: menuPos.right, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, zIndex: 200, minWidth: 200, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
                                            <button onClick={() => { onToggleRole(m.id); setMenuOpen(null) }}
                                                style={{ width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 9, border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--ink)', fontFamily: 'var(--sans)', textAlign: 'left' }}>
                                                <Crown size={13} style={{ color: 'var(--amber)' }}/> {m.is_patron ? 'Retirer Admin' : 'Promouvoir Admin'}
                                            </button>
                                            <button onClick={() => { onReset(m); setMenuOpen(null) }}
                                                style={{ width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 9, border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--ink)', fontFamily: 'var(--sans)', textAlign: 'left' }}>
                                                <KeyRound size={13} style={{ color: 'var(--indigo)' }}/> Réinitialiser le mot de passe
                                            </button>
                                            <div style={{ height: 1, background: 'var(--line)', margin: '2px 0' }}/>
                                            <button onClick={() => { onDelete(m); setMenuOpen(null) }}
                                                style={{ width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 9, border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--red)', fontFamily: 'var(--sans)', textAlign: 'left' }}>
                                                <Trash2 size={13}/> Supprimer
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

/* ── FACTURATION TAB ── */

function FacturationTab({ cabinetData, qc, toast, isPropriétaire }) {
    const [tva, setTva] = useState(cabinetData?.assujetti_tva !== false)
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        if (cabinetData) setTva(cabinetData.assujetti_tva !== false)
    }, [cabinetData])

    const saveMutation = useMutation({
        mutationFn: () => api.put('/cabinets/modifier/', { assujetti_tva: tva }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['cabinet'] })
            setSaved(true); setTimeout(() => setSaved(false), 2500)
            toast('Paramètres TVA sauvegardés')
        },
        onError: () => toast('Erreur lors de la sauvegarde', 'error'),
    })

    return (
        <SettingsCard title="TVA & Facturation" subtitle="Paramètres fiscaux appliqués à tous vos devis et factures.">
            {!isPropriétaire && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, background: 'var(--bg-2)', border: '1px solid var(--line)', marginBottom: 14, fontSize: 12.5, color: 'var(--muted)' }}>
                    <span>🔒</span>
                    Seul le propriétaire du cabinet peut modifier les paramètres de TVA.
                </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--line)', opacity: isPropriétaire ? 1 : 0.5 }}>
                <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>Assujetti à la TVA</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>
                        {tva
                            ? 'La TVA apparaît sur tous vos documents (colonnes, totaux).'
                            : 'La mention « Non assujetti à la TVA » sera inscrite sur vos documents, sans colonne TVA.'}
                    </div>
                </div>
                <button
                    onClick={() => isPropriétaire && setTva(v => !v)}
                    style={{
                        width: 46, height: 26, borderRadius: 13, border: 'none', flexShrink: 0,
                        cursor: isPropriétaire ? 'pointer' : 'not-allowed',
                        background: tva ? 'var(--indigo)' : 'var(--line-2)',
                        position: 'relative', transition: 'background 0.2s',
                    }}
                >
                    <span style={{
                        position: 'absolute', top: 3, left: tva ? 23 : 3,
                        width: 20, height: 20, borderRadius: '50%', background: '#fff',
                        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                </button>
            </div>
            {isPropriétaire && (
                <CardFooter
                    onSave={() => saveMutation.mutate()}
                    saving={saveMutation.isPending}
                    saved={saved}
                />
            )}
        </SettingsCard>
    )
}

/* ── ABONNEMENT TAB ── */

function AbonnementTab({ cabinetData, userPlan, isPropriétaire, planErr, payLoading, onPay }) {
    const abo = cabinetData?.abonnement
    const dateFin = abo?.date_fin ? new Date(abo.date_fin) : null
    const aboActif = abo?.actif && (!dateFin || dateFin > new Date())
    const joursRestants = dateFin ? Math.ceil((dateFin - new Date()) / 86400000) : null

    return (
        <>
            {/* Status banner */}
            <div style={{ background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--line)', padding: '18px 22px', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink)', marginBottom: 3 }}>Plan actuel</div>
                        <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                            {PLAN_META[userPlan]?.label ?? userPlan} · {PLAN_META[userPlan]?.prix ?? '—'} DA/mois
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {aboActif ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--green-soft)', color: 'var(--green)', fontSize: 12.5, fontWeight: 600, padding: '6px 14px', borderRadius: 20 }}>
                                <CheckCircle2 size={13}/> Actif
                                {dateFin && <span style={{ opacity: 0.75 }}>· {joursRestants}j restants</span>}
                            </span>
                        ) : abo ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--amber-soft)', color: 'var(--amber)', fontSize: 12.5, fontWeight: 600, padding: '6px 14px', borderRadius: 20 }}>
                                <AlertCircle size={13}/> Expiré
                            </span>
                        ) : null}
                    </div>
                </div>
                {aboActif && dateFin && (
                    <div style={{ marginTop: 10, fontSize: 12, color: 'var(--muted-2)', padding: '8px 12px', background: 'var(--bg-2)', borderRadius: 8 }}>
                        Expire le <strong style={{ color: 'var(--ink)' }}>{dateFin.toLocaleDateString('fr-FR')}</strong>. Le changement de plan sera possible à partir de cette date.
                    </div>
                )}
                {!isPropriétaire && (
                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--amber-soft)', borderRadius: 8, padding: '8px 12px', fontSize: 12.5, color: 'var(--amber)' }}>
                        <AlertCircle size={13}/> Seul le propriétaire peut gérer l'abonnement.
                    </div>
                )}
                {planErr && (
                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--red-soft)', borderRadius: 8, padding: '8px 12px', fontSize: 12.5, color: 'var(--red)' }}>
                        <AlertCircle size={13}/> {planErr}
                    </div>
                )}
            </div>

            {/* Plan cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                {Object.entries(PLAN_META).map(([key, plan]) => {
                    const isCurrent = key === userPlan
                    const isLocked  = isPropriétaire && aboActif
                    return (
                        <div key={key} style={{
                            background: 'var(--surface)', borderRadius: 12,
                            border: isCurrent ? `2px solid ${plan.color}` : '1px solid var(--line)',
                            padding: '20px', position: 'relative',
                            opacity: isLocked ? 0.55 : 1,
                        }}>
                            {isCurrent && (
                                <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', background: plan.color, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 12px', borderRadius: 20, whiteSpace: 'nowrap', letterSpacing: 0.5 }}>
                                    ACTUEL
                                </div>
                            )}
                            <div style={{ fontSize: 11, fontWeight: 700, color: plan.color, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>{plan.label}</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 14 }}>
                                <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-1px', lineHeight: 1 }}>{plan.prix}</span>
                                <span style={{ fontSize: 12, color: 'var(--muted-2)' }}>DA/mois</span>
                            </div>
                            <div style={{ marginBottom: 16 }}>
                                {plan.features.map(f => (
                                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5, fontSize: 12, color: 'var(--muted)' }}>
                                        <Check size={11} color={plan.color} style={{ flexShrink: 0 }}/> {f}
                                    </div>
                                ))}
                            </div>
                            {isPropriétaire && (
                                <button
                                    onClick={() => !isLocked && onPay(key)}
                                    disabled={payLoading === key || isLocked}
                                    title={isLocked ? (dateFin ? `Disponible après le ${dateFin.toLocaleDateString('fr-FR')}` : 'Abonnement en cours') : ''}
                                    style={{
                                        width: '100%', padding: '9px', borderRadius: 8, border: 'none',
                                        background: isLocked ? 'var(--bg-2)' : isCurrent ? plan.bg : plan.color,
                                        color: isLocked ? 'var(--muted-2)' : isCurrent ? plan.color : '#fff',
                                        fontWeight: 600, fontSize: 12.5, cursor: (isLocked || payLoading === key) ? 'not-allowed' : 'pointer',
                                        fontFamily: 'var(--sans)', opacity: payLoading === key ? 0.7 : 1,
                                        transition: 'all 0.12s',
                                    }}>
                                    {payLoading === key ? 'Redirection…'
                                        : isLocked ? (dateFin ? `Bloqué jusqu'au ${dateFin.toLocaleDateString('fr-FR')}` : 'Abonnement actif')
                                        : isCurrent ? 'Renouveler'
                                        : 'Souscrire · Chargily'}
                                </button>
                            )}
                        </div>
                    )
                })}
            </div>
        </>
    )
}
