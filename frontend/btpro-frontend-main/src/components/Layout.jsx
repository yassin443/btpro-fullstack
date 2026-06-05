import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
    LayoutDashboard, FolderKanban, Users, HardHat,
    Receipt, FileSignature, Files, Bell,
    FileCheck, CalendarDays, Truck,
    Clock, Calendar, Wallet, TrendingUp, BarChart2,
    Settings, ShieldCheck, LogOut, AlertTriangle, Search,
    ClipboardList, X, ArrowRight, Play, CheckCircle2, CheckCheck,
    Menu,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import useStore from '../store/useStore'
import api from '../api/axios'
import Toaster from './Toaster'
import { PlannerLogo } from './PlannerLogo'
import CommandPalette from './CommandPalette'

const PRIORITE_COLOR = { URGENTE: '#EF4444', HAUTE: '#F59E0B', NORMALE: 'var(--indigo)', BASSE: '#94A3B8' }
const PHASE_LABELS = { ESQUISSE: 'Esquisse', APS: 'APS', APD: 'APD', PRO: 'Projet', DCE: 'DCE', EXECUTION: 'Exéc.', RECEPTION: 'Récep.' }
const STATUT_LABEL = { A_FAIRE: 'À faire', EN_COURS: 'En cours', EN_REVIEW: 'En révision', TERMINE: 'Terminé', ANNULE: 'Annulé' }
const STATUT_CLS   = { A_FAIRE: 'tag neutral', EN_COURS: 'tag indigo', EN_REVIEW: 'tag amber', TERMINE: 'tag green', ANNULE: 'tag red' }

export default function Layout({ children }) {
    const navigate = useNavigate()
    const location = useLocation()
    const { user, logout } = useStore()
    const queryClient = useQueryClient()
    const [cmdOpen, setCmdOpen] = useState(false)
    const [tachesOpen, setTachesOpen] = useState(false)
    const [notifOpen, setNotifOpen] = useState(false)
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const closeSidebar = () => setSidebarOpen(false)

    useEffect(() => {
        const handle = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                setCmdOpen(o => !o)
            }
        }
        window.addEventListener('keydown', handle)
        return () => window.removeEventListener('keydown', handle)
    }, [])
    const isPatron = user?.is_patron === true

    const { data: abo } = useQuery({
        queryKey: ['abonnement'],
        queryFn: () => api.get('/cabinets/abonnement/').then(r => r.data),
        staleTime: 5 * 60 * 1000,
        retry: false,
    })

    const { data: mesTaches = [] } = useQuery({
        queryKey: ['mes-taches'],
        queryFn: () => api.get('/projets/mes-taches/').then(r => r.data),
        refetchInterval: 60 * 1000,
        retry: false,
    })

    const { data: notifs = [], refetch: refetchNotifs } = useQuery({
        queryKey: ['notifications'],
        queryFn: () => api.get('/projets/notifications/').then(r => r.data),
        refetchInterval: 30 * 1000,
        retry: false,
        enabled: isPatron,
    })
    const nonLues = notifs.filter(n => !n.lu).length

    const marquerToutLu = () => {
        api.post('/projets/notifications/lire/').then(() => refetchNotifs())
    }

    const updateStatutTache = useMutation({
        mutationFn: ({ tacheId, statut }) => api.put(`/projets/taches/${tacheId}/`, { statut }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mes-taches'] })
            queryClient.invalidateQueries({ queryKey: ['taches-projet'] })
        },
    })
    const dateFin = abo?.date_fin ? new Date(abo.date_fin) : null
    const aboExpire = abo && (!abo.actif || (dateFin && dateFin < new Date()))
    const isSettingsPage = location.pathname === '/settings'
    const isSolo = abo?.plan === 'SOLO'
    const hasEquipe = isPatron && !isSolo  // CABINET ou AGENCE seulement

    const SECTIONS = [
        {
            label: 'Principal',
            items: [
                { label: 'Dashboard',    path: '/dashboard',     icon: LayoutDashboard },
                { label: 'Projets',      path: '/projets',       icon: FolderKanban },
                ...(isPatron ? [{ label: 'Clients', path: '/clients', icon: Users }] : []),
                { label: 'Chantier',     path: '/chantier',      icon: HardHat },
            ]
        },
        ...(isPatron ? [{
            label: 'Finance & Docs',
            items: [
                { label: 'Finances',     path: '/finances',      icon: Receipt },
                { label: 'Contrats',     path: '/contrats',      icon: FileSignature },
                { label: 'Documents',    path: '/documents',     icon: Files },
                { label: 'Alertes',      path: '/alertes',       icon: Bell },
            ]
        }] : []),
        ...(isPatron ? [{
            label: 'Projet',
            items: [
                { label: 'Permis',          path: '/permis',          icon: FileCheck },
                { label: 'Réunions',        path: '/reunions',        icon: CalendarDays },
                { label: 'Sous-traitants',  path: '/sous-traitants',  icon: Truck },
            ]
        }] : []),
        {
            label: 'Équipe',
            items: [
                ...(hasEquipe || !isPatron ? [{ label: 'Temps', path: '/temps', icon: Clock }] : []),
                { label: 'Planning', path: '/planning', icon: Calendar },
                ...(hasEquipe ? [{ label: 'Rémunération', path: '/paie', icon: Wallet }] : []),
                ...(!isPatron ? [{ label: 'Ma rémunération', path: '/ma-remuneration', icon: Wallet }] : []),
                ...(isPatron ? [{ label: 'Rentabilité', path: '/rentabilite', icon: TrendingUp }] : []),
                { label: 'Rapports', path: '/rapports', icon: BarChart2 },
            ]
        },
        {
            label: 'Config',
            items: [
                { label: 'Paramètres',   path: '/settings',     icon: Settings },
            ]
        }
    ]

    const initials = `${user?.prenom?.[0] ?? ''}${user?.nom?.[0] ?? ''}`

    if (aboExpire && isPatron && !isSettingsPage) {
        const planLabel = { SOLO: 'Solo', CABINET: 'Cabinet', AGENCE: 'Agence' }[abo?.plan] ?? abo?.plan
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--sans)', padding: 24 }}>
                <div style={{ background: 'var(--surface)', borderRadius: 24, border: '1px solid var(--line)', padding: '48px 40px', maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--amber-soft)', border: '2px solid #FDE047', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <AlertTriangle size={28} color="#A16207" />
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', marginBottom: 8, letterSpacing: '-0.4px' }}>
                        Abonnement expiré
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 8 }}>
                        Votre abonnement <strong style={{ color: 'var(--ink)' }}>{planLabel}</strong> n'est plus actif.
                        Renouvelez pour continuer à utiliser Planner.
                    </div>
                    {dateFin && (
                        <div style={{ fontSize: 12, color: 'var(--muted-2)', marginBottom: 24 }}>
                            Expiré le {dateFin.toLocaleDateString('fr-FR')}
                        </div>
                    )}
                    <button
                        onClick={() => navigate('/settings')}
                        style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: 'var(--grad)', color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'var(--sans)', marginBottom: 12, boxShadow: '0 4px 14px rgba(17,0,255,0.3)' }}>
                        Renouveler mon abonnement
                    </button>
                    <button
                        onClick={() => { logout(); navigate('/login') }}
                        style={{ width: '100%', padding: '11px', borderRadius: 12, border: '1.5px solid var(--line)', background: 'var(--surface)', color: 'var(--muted)', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                        Se déconnecter
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="layout">
            {/* Mobile topbar */}
            <div className="mobile-topbar">
                <button className="mobile-topbar-btn" onClick={() => setSidebarOpen(o => !o)}>
                    <Menu size={18} />
                </button>
                <PlannerLogo size={28} showSub={false} />
                <div style={{ width: 36 }} />
            </div>

            {/* Overlay mobile */}
            {sidebarOpen && <div className="sb-overlay" onClick={closeSidebar} />}

            <aside className={`sb${sidebarOpen ? ' open' : ''}`}>
                {/* Brand */}
                <div className="sb-brand" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
                    <PlannerLogo size={32} showSub={true} />
                </div>

                {/* Search */}
                <div className="sb-search" onClick={() => setCmdOpen(true)} style={{ cursor: 'pointer' }}>
                    <Search size={13} />
                    <span>Rechercher…</span>
                    <kbd>⌘K</kbd>
                </div>

                {/* Nav */}
                <nav className="sb-nav">
                    {SECTIONS.map(section => (
                        <div key={section.label} className="sb-section">
                            <div className="sb-section-label">{section.label}</div>
                            {section.items.map(item => {
                                const active = location.pathname === item.path ||
                                    (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
                                const Icon = item.icon
                                return (
                                    <div
                                        key={item.path}
                                        className={`sb-item${active ? ' active' : ''}`}
                                        onClick={() => { navigate(item.path); closeSidebar() }}
                                    >
                                        <Icon size={15} style={{ flexShrink: 0 }} />
                                        <span className="sb-item-label">{item.label}</span>
                                    </div>
                                )
                            })}
                        </div>
                    ))}
                </nav>

                {/* Super Admin shortcut */}
                {user?.is_superuser && (
                    <div style={{ padding: '0 10px', marginBottom: 8 }}>
                        <div
                            onClick={() => navigate('/superadmin')}
                            className={`sb-item${location.pathname === '/superadmin' ? ' active' : ''}`}
                            style={location.pathname !== '/superadmin' ? { background: 'var(--indigo-soft)', border: '1px solid rgba(17,0,255,0.2)' } : {}}
                        >
                            <ShieldCheck size={15} style={{ flexShrink: 0 }} />
                            <span className="sb-item-label" style={{ color: location.pathname === '/superadmin' ? undefined : 'var(--indigo)' }}>
                                Super Admin
                            </span>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="sb-foot">
                    {isPatron && (
                        <div style={{ padding: '0 4px 6px' }}>
                            <button
                                onClick={() => { setNotifOpen(o => !o); setTachesOpen(false) }}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, border: '1px solid var(--line)', background: notifOpen ? 'var(--indigo-soft)' : 'var(--bg)', cursor: 'pointer', fontFamily: 'inherit' }}>
                                <Bell size={14} color={nonLues > 0 ? 'var(--indigo)' : 'var(--muted)'} style={{ flexShrink: 0 }} />
                                <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: nonLues > 0 ? 'var(--indigo)' : 'var(--muted)', textAlign: 'left' }}>Notifications</span>
                                {nonLues > 0 && (
                                    <span style={{ fontSize: 11, fontWeight: 800, background: '#EF4444', color: '#fff', borderRadius: 20, padding: '1px 7px', flexShrink: 0 }}>{nonLues}</span>
                                )}
                            </button>
                        </div>
                    )}
                    {mesTaches.length > 0 && (
                        <div style={{ padding: '0 4px 6px' }}>
                            <button
                                onClick={() => { setTachesOpen(o => !o); setNotifOpen(false) }}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, border: '1px solid var(--line)', background: tachesOpen ? 'var(--indigo-soft)' : 'var(--bg)', cursor: 'pointer', fontFamily: 'inherit' }}>
                                <ClipboardList size={14} color="var(--indigo)" style={{ flexShrink: 0 }} />
                                <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--indigo)', textAlign: 'left' }}>Mes tâches</span>
                                <span style={{ fontSize: 11, fontWeight: 800, background: 'var(--indigo)', color: '#fff', borderRadius: 20, padding: '1px 7px', flexShrink: 0 }}>{mesTaches.length}</span>
                            </button>
                        </div>
                    )}
                    <div className="sb-user" onClick={() => navigate('/settings')}>
                        <div className="avatar indigo" style={{ width: 30, height: 30, fontSize: 11 }}>{initials}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="sb-user-name">{user?.prenom} {user?.nom}</div>
                            <div className="sb-user-role">
                                {isPatron ? 'Patron' : user?.role}
                            </div>
                        </div>
                        <Settings size={13} style={{ color: 'var(--muted-2)', flexShrink: 0 }} />
                    </div>
                    <div style={{ padding: '4px 4px 0' }}>
                        <button className="sb-logout" onClick={() => { logout(); navigate('/login') }}>
                            <LogOut size={14} />
                            Déconnexion
                        </button>
                    </div>
                </div>
            </aside>

            <div className="layout-content">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        style={{ height: '100%' }}
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </div>

            <Toaster />
            <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />

            {/* ── Panneau Notifications (patron) ── */}
            <AnimatePresence>
                {notifOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setNotifOpen(false)}
                            style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.3)', zIndex: 300, backdropFilter: 'blur(2px)' }}
                        />
                        <motion.div
                            initial={{ x: -280, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -280, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                            style={{ position: 'fixed', top: 0, left: 'var(--sidebar-w)', bottom: 0, width: 'min(340px, 100vw)', background: 'var(--surface)', zIndex: 301, boxShadow: '4px 0 24px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                        >
                            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Bell size={16} color="var(--indigo)" />
                                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Notifications</span>
                                    {nonLues > 0 && (
                                        <span style={{ fontSize: 11, fontWeight: 800, background: '#EF4444', color: '#fff', borderRadius: 20, padding: '1px 7px' }}>{nonLues}</span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    {nonLues > 0 && (
                                        <button
                                            onClick={marquerToutLu}
                                            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: 'var(--indigo)', background: 'var(--indigo-soft)', border: '1px solid rgba(17,0,255,0.15)', borderRadius: 7, padding: '4px 8px', cursor: 'pointer', fontFamily: 'inherit' }}>
                                            <CheckCheck size={11} /> Tout lu
                                        </button>
                                    )}
                                    <button onClick={() => setNotifOpen(false)} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--line)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}><X size={14} /></button>
                                </div>
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {notifs.length === 0 ? (
                                    <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: '40px 0' }}>
                                        Aucune notification
                                    </div>
                                ) : notifs.map(n => (
                                    <div
                                        key={n.id}
                                        onClick={() => { if (n.lien) { navigate(n.lien); setNotifOpen(false) } }}
                                        style={{ background: n.lu ? 'var(--bg)' : 'var(--indigo-soft)', borderRadius: 12, border: `1px solid ${n.lu ? 'var(--line)' : 'rgba(17,0,255,0.18)'}`, padding: '11px 14px', cursor: n.lien ? 'pointer' : 'default', transition: 'background 0.15s' }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                            {!n.lu && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--indigo)', flexShrink: 0, marginTop: 4 }} />}
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 12, fontWeight: n.lu ? 500 : 700, color: 'var(--ink)', lineHeight: 1.45 }}>{n.message}</div>
                                                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                                                    {new Date(n.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                            {n.lien && <ArrowRight size={12} color="var(--muted-2)" style={{ flexShrink: 0, marginTop: 2 }} />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── Panneau "Mes tâches" ── */}
            <AnimatePresence>
                {tachesOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setTachesOpen(false)}
                            style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.3)', zIndex: 300, backdropFilter: 'blur(2px)' }}
                        />
                        <motion.div
                            initial={{ x: -280, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -280, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                            style={{ position: 'fixed', top: 0, left: 'var(--sidebar-w)', bottom: 0, width: 'min(320px, 100vw)', background: 'var(--surface)', zIndex: 301, boxShadow: '4px 0 24px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                        >
                            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <ClipboardList size={16} color="var(--indigo)" />
                                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Mes tâches</span>
                                    <span style={{ fontSize: 11, fontWeight: 800, background: 'var(--indigo)', color: '#fff', borderRadius: 20, padding: '1px 7px' }}>{mesTaches.length}</span>
                                </div>
                                <button onClick={() => setTachesOpen(false)} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--line)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}><X size={14} /></button>
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {mesTaches.map(t => {
                                    const isPending = updateStatutTache.isPending && updateStatutTache.variables?.tacheId === t.id
                                    const isOverdue = t.deadline && new Date(t.deadline) < new Date()
                                    return (
                                        <div key={t.id} style={{ background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--line)', padding: '12px 14px' }}>
                                            {/* titre + priorité */}
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITE_COLOR[t.priorite] || 'var(--indigo)', flexShrink: 0, marginTop: 4 }} />
                                                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', flex: 1, lineHeight: 1.4 }}>{t.titre}</span>
                                            </div>
                                            {/* projet · phase · deadline */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 16, flexWrap: 'wrap', marginBottom: 8 }}>
                                                <span className={STATUT_CLS[t.statut] ?? 'tag neutral'} style={{ fontSize: 10 }}>{STATUT_LABEL[t.statut] ?? t.statut}</span>
                                                <span style={{ fontSize: 10, color: 'var(--muted-2)' }}>·</span>
                                                <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>{t.projet_nom}</span>
                                                <span style={{ fontSize: 10, color: 'var(--muted-2)' }}>·</span>
                                                <span style={{ fontSize: 11, color: 'var(--muted)' }}>{PHASE_LABELS[t.phase_nom] ?? t.phase_nom}</span>
                                                {t.deadline && <span style={{ fontSize: 11, color: isOverdue ? '#EF4444' : 'var(--muted)', fontWeight: 600 }}>⏱ {t.deadline}</span>}
                                            </div>
                                            {/* actions */}
                                            <div style={{ display: 'flex', gap: 6, marginLeft: 16, flexWrap: 'wrap' }}>
                                                {t.statut === 'A_FAIRE' && (
                                                    <button
                                                        disabled={isPending}
                                                        onClick={() => updateStatutTache.mutate({ tacheId: t.id, statut: 'EN_COURS' })}
                                                        style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: 'var(--indigo)', background: 'var(--indigo-soft)', border: '1px solid rgba(17,0,255,0.15)', borderRadius: 7, padding: '4px 9px', cursor: 'pointer', fontFamily: 'inherit', opacity: isPending ? 0.6 : 1 }}>
                                                        <Play size={10} /> Démarrer
                                                    </button>
                                                )}
                                                {(t.statut === 'EN_COURS' || t.statut === 'EN_REVIEW') && (
                                                    <button
                                                        disabled={isPending}
                                                        onClick={() => updateStatutTache.mutate({ tacheId: t.id, statut: 'TERMINE' })}
                                                        style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: 'var(--green)', background: 'var(--green-soft)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 7, padding: '4px 9px', cursor: 'pointer', fontFamily: 'inherit', opacity: isPending ? 0.6 : 1 }}>
                                                        <CheckCircle2 size={10} /> Terminer
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => { navigate(`/projets/${t.projet_id}`); setTachesOpen(false) }}
                                                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', fontFamily: 'inherit' }}>
                                                    Voir le projet <ArrowRight size={10} />
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
