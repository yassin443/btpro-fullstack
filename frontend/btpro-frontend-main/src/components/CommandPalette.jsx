import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, FolderKanban, Plus, Receipt, CalendarDays, Upload, LayoutDashboard, Settings } from 'lucide-react'
import api from '../api/axios'

const ACTIONS = [
    { icon: Plus,          label: 'Créer un nouveau projet', sub: 'Démarrer en quelques secondes', k: '⌘N', path: '/projets' },
    { icon: Receipt,       label: 'Nouvelle facture',        sub: 'À partir d\'un devis existant', k: '⌘F', path: '/finances' },
    { icon: CalendarDays,  label: 'Planifier une réunion',   sub: 'Inviter le client + équipe',    k: '⌘R', path: '/reunions' },
    { icon: Upload,        label: 'Téléverser un document',  sub: 'PDF, DWG, photos…',             k: '⌘U', path: '/documents' },
]

const NAV = [
    { icon: LayoutDashboard, label: 'Aller au Dashboard',    k: 'G D', path: '/dashboard' },
    { icon: FolderKanban,    label: 'Aller aux Projets',     k: 'G P', path: '/projets' },
    { icon: Receipt,         label: 'Aller aux Finances',    k: 'G F', path: '/finances' },
    { icon: Settings,        label: 'Ouvrir les Paramètres', k: 'G S', path: '/settings' },
]

export default function CommandPalette({ open, onClose }) {
    const navigate = useNavigate()
    const [query, setQuery] = useState('')
    const [activeIdx, setActiveIdx] = useState(0)
    const inputRef = useRef(null)
    const executeRef = useRef(null)

    const { data: projets = [] } = useQuery({
        queryKey: ['projets'],
        queryFn: () => api.get('/projets/').then(r => r.data),
        staleTime: 60_000,
    })

    const filtered = query
        ? projets.filter(p =>
            p.nom.toLowerCase().includes(query.toLowerCase()) ||
            (p.reference ?? '').toLowerCase().includes(query.toLowerCase()))
        : projets.slice(0, 5)

    const projItems = filtered.map((p, i) => ({
        idx: i, icon: FolderKanban, accent: false,
        label: p.nom, sub: `${p.reference || '—'} · ${p.client_nom || '—'}`,
        act: () => navigate(`/projets/${p.id}`),
    }))
    const actItems = ACTIONS.map((a, i) => ({
        idx: projItems.length + i, icon: a.icon, accent: true,
        label: a.label, sub: a.sub, k: a.k,
        act: () => navigate(a.path),
    }))
    const navItems = NAV.map((n, i) => ({
        idx: projItems.length + actItems.length + i, icon: n.icon, accent: false,
        label: n.label, k: n.k,
        act: () => navigate(n.path),
    }))
    const total = projItems.length + actItems.length + navItems.length

    // keep ref in sync with latest state so keyboard handler always works
    executeRef.current = (idx) => {
        const all = [...projItems, ...actItems, ...navItems]
        const item = all[idx ?? activeIdx]
        if (item) { item.act(); onClose() }
    }

    useEffect(() => {
        if (open) {
            setQuery('')
            setActiveIdx(0)
            setTimeout(() => inputRef.current?.focus(), 40)
        }
    }, [open])

    useEffect(() => { setActiveIdx(0) }, [query])

    useEffect(() => {
        if (!open) return
        const handle = (e) => {
            if (e.key === 'Escape') { onClose(); return }
            if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, total - 1)); return }
            if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); return }
            if (e.key === 'Enter')     { e.preventDefault(); executeRef.current(); return }
        }
        window.addEventListener('keydown', handle)
        return () => window.removeEventListener('keydown', handle)
    }, [open, total, onClose])

    const Row = ({ item }) => {
        const Icon = item.icon
        const active = activeIdx === item.idx
        return (
            <div
                onClick={() => executeRef.current(item.idx)}
                onMouseEnter={() => setActiveIdx(item.idx)}
                style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '9px 18px',
                    background: active ? 'var(--bg-2)' : 'transparent', cursor: 'pointer',
                    transition: 'background 0.1s',
                }}
            >
                <div style={{
                    width: 28, height: 28, borderRadius: 6, display: 'grid', placeItems: 'center', flexShrink: 0,
                    background: item.accent ? 'var(--indigo-soft)' : (active ? 'var(--ink)' : 'var(--bg-2)'),
                    color: item.accent ? 'var(--indigo)' : (active ? 'white' : 'var(--muted)'),
                }}>
                    <Icon size={13} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink)' }}>{item.label}</div>
                    {item.sub && <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 1 }}>{item.sub}</div>}
                </div>
                {item.k && (
                    <kbd style={{ fontFamily: 'var(--mono)', fontSize: 10, background: 'var(--bg-2)', padding: '2px 6px', borderRadius: 4, color: 'var(--muted)', border: '1px solid var(--line)', flexShrink: 0 }}>
                        {item.k}
                    </kbd>
                )}
                {!item.k && active && (
                    <kbd style={{ fontFamily: 'var(--mono)', fontSize: 10, background: 'var(--surface)', padding: '2px 6px', borderRadius: 4, color: 'var(--muted)', border: '1px solid var(--line)', flexShrink: 0 }}>↵</kbd>
                )}
            </div>
        )
    }

    const GroupLabel = ({ children, withBorder }) => (
        <div style={{
            padding: '10px 18px 4px',
            fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600,
            ...(withBorder ? { borderTop: '1px solid var(--line)', marginTop: 4 } : {}),
        }}>
            {children}
        </div>
    )

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(11,11,20,0.55)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', justifyContent: 'center', paddingTop: '10vh' }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -10 }}
                        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                            background: 'var(--surface)', borderRadius: 14, width: '100%', maxWidth: 600,
                            boxShadow: '0 32px 80px rgba(0,0,0,0.3), 0 0 0 1px var(--line)',
                            overflow: 'hidden', display: 'flex', flexDirection: 'column',
                            maxHeight: '70vh', alignSelf: 'flex-start',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Search input */}
                        <div style={{ padding: '13px 18px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                            <Search size={16} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Rechercher projets, actions, pages…"
                                style={{ flex: 1, fontSize: 15, fontWeight: 500, outline: 'none', border: 'none', background: 'transparent', color: 'var(--ink)', fontFamily: 'var(--sans)' }}
                            />
                            <kbd
                                onClick={onClose}
                                style={{ fontFamily: 'var(--mono)', fontSize: 10, background: 'var(--bg-2)', padding: '2px 7px', borderRadius: 4, color: 'var(--muted)', cursor: 'pointer', border: '1px solid var(--line)' }}
                            >
                                ESC
                            </kbd>
                        </div>

                        {/* Results */}
                        <div style={{ overflowY: 'auto', flex: 1 }}>
                            {projItems.length > 0 && (
                                <>
                                    <GroupLabel>Projets · {projItems.length} résultat{projItems.length > 1 ? 's' : ''}</GroupLabel>
                                    {projItems.map(item => <Row key={item.idx} item={item} />)}
                                </>
                            )}
                            <GroupLabel withBorder={projItems.length > 0}>Actions</GroupLabel>
                            {actItems.map(item => <Row key={item.idx} item={item} />)}
                            <GroupLabel withBorder>Navigation</GroupLabel>
                            {navItems.map(item => <Row key={item.idx} item={item} />)}
                            <div style={{ height: 8 }} />
                        </div>

                        {/* Footer */}
                        <div style={{ padding: '8px 18px', borderTop: '1px solid var(--line)', background: 'var(--bg)', display: 'flex', alignItems: 'center', gap: 14, fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>
                            {[['↑↓', 'Naviguer'], ['↵', 'Sélectionner'], ['esc', 'Fermer']].map(([k, label]) => (
                                <span key={k}>
                                    <kbd style={{ fontFamily: 'var(--mono)', background: 'var(--surface)', padding: '1px 5px', borderRadius: 3, border: '1px solid var(--line)' }}>{k}</kbd>{' '}{label}
                                </span>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
