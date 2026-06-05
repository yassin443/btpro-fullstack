import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ArrowRight, Zap } from 'lucide-react'
import { PlannerMark } from '../../components/PlannerLogo'
import {
    FolderKanban, DollarSign, HardHat, Clock, Users, BarChart2,
} from 'lucide-react'

export const FEATURES = [
    { icon: FolderKanban, bg: 'var(--indigo-soft)', color: 'var(--indigo)', title: 'Gestion de projets', desc: 'Suivez vos projets par phases (Esquisse, APS, APD…), clients, avancement et honoraires en temps réel.' },
    { icon: DollarSign, bg: '#ECFDF5', color: '#10B981', title: 'Facturation & Devis PDF', desc: 'Générez des factures conformes aux normes algériennes avec numérotation automatique FAC-2026-0001.' },
    { icon: HardHat, bg: '#FFFBEB', color: '#F59E0B', title: 'Suivi chantier', desc: 'Journal de chantier quotidien, météo, effectif ouvriers, avancement et gestion des réserves.' },
    { icon: Clock, bg: '#F0F9FF', color: '#0EA5E9', title: 'Feuille de temps', desc: 'Trackez les heures de chaque architecte par projet. Calculez votre coût réel automatiquement.' },
    { icon: Users, bg: '#F5F3FF', color: '#8B5CF6', title: 'Planning équipe', desc: 'Visualisez la charge de votre équipe. Évitez les surcharges et gérez les disponibilités.' },
    { icon: BarChart2, bg: '#FEF2F2', color: '#EF4444', title: 'Rentabilité par projet', desc: 'Analysez le profit réel : honoraires vs coûts heures, charges et sous-traitants.' },
]

export const PLANS = [
    {
        key: 'SOLO', label: 'Solo', prix: '4 900', popular: false,
        desc: "Pour l'architecte indépendant",
        limits: ['1 architecte', '5 GB'],
        sections: [
            { label: 'Projets & Clients', items: ['Phases APS · APD · DCE · DET…', 'Tâches, jalons et échéances', 'Gestion des clients', 'Suivi des honoraires'] },
            { label: 'Finances', items: ['Factures PDF numérotées auto', 'Devis + suivi paiements', 'Gestion des charges', 'TVA conforme normes DZ'] },
            { label: 'Chantier & Documents', items: ['Journal de chantier quotidien', 'Photos chantier illimitées', 'Réserves chantier', 'Documents + versioning PDF/DWG'] },
        ]
    },
    {
        key: 'CABINET', label: 'Cabinet', prix: '8 900', popular: true,
        desc: "Pour les cabinets jusqu'à 3 architectes",
        limits: ['3 architectes', '10 GB'],
        sections: [
            { label: 'Tout Solo inclus', items: ['Projets, clients et honoraires', 'Finances et facturation PDF', 'Chantier, réserves et photos', 'Documents avec versioning'] },
            { label: 'Collaboration équipe', items: ['Planning équipe + charge de travail', 'Feuilles de temps par projet', 'Sous-traitants et BET', 'Module paie et rémunération'] },
            { label: 'Analyses', items: ['Rapports terrain PDF automatiques', 'Rentabilité par projet', 'Suivi des impayés', 'Support prioritaire par email'] },
        ]
    },
    {
        key: 'AGENCE', label: 'Agence', prix: '14 900', popular: false,
        desc: "Pour les bureaux jusqu'à 5 architectes",
        limits: ['5 architectes', '15 GB'],
        sections: [
            { label: 'Tout Cabinet inclus', items: ['Projets, équipe et analyses', 'Finances et facturation PDF', 'Chantier, documents et rapports', 'Module paie et rémunération'] },
            { label: 'En plus', items: ['5 architectes (au lieu de 3)', '15 GB de stockage (au lieu de 10)', 'Support prioritaire par email', 'Accès anticipé aux nouvelles fonctions'] },
        ]
    },
]

export const STEPS = [
    { num: '01', title: 'Créez votre cabinet', desc: "Inscrivez-vous en 2 minutes. Configurez votre cabinet, votre logo et vos informations." },
    { num: '02', title: 'Ajoutez vos projets', desc: "Créez vos projets, assignez des phases, invitez vos collaborateurs et importez vos clients." },
    { num: '03', title: 'Gérez et facturez', desc: "Suivez l'avancement, générez vos factures PDF et analysez la rentabilité de chaque projet." },
]

export const FAQS = [
    { q: 'Est-ce que Planner est conforme aux normes algériennes ?', a: "Oui. Les factures et devis respectent les exigences fiscales algériennes : mentions légales, TVA et numérotation séquentielle automatique (FAC-2026-0001)." },
    { q: "Comment fonctionne l'inscription ?", a: "Créez votre compte en 2 minutes, choisissez votre plan et accédez immédiatement à toutes les fonctionnalités. Vous pouvez changer de plan ou annuler à tout moment." },
    { q: 'Combien de projets puis-je créer ?', a: "Le nombre de projets est illimité sur tous les plans. Créez autant de projets que nécessaire sans restriction." },
    { q: 'Combien de stockage est inclus ?', a: "Solo : 5 GB, Cabinet : 10 GB, Agence : 15 GB. À titre indicatif, 100 documents PDF de plans représentent environ 300 MB. Les photos chantier sont stockées séparément et ne consomment pas votre quota." },
    { q: 'Comment fonctionne la facturation ?', a: "Vous êtes facturé mensuellement en dinars algériens (DA). Vous pouvez changer de plan ou annuler à tout moment depuis vos paramètres." },
    { q: 'Mes données sont-elles sécurisées ?', a: "Toutes les données sont hébergées sur des serveurs sécurisés avec chiffrement SSL. Vos fichiers (plans, factures, contrats) sont stockés en toute confidentialité et accessibles uniquement par votre cabinet." },
    { q: 'Puis-je changer de plan à tout moment ?', a: "Oui. Vous pouvez passer à un plan supérieur ou inférieur à n'importe quel moment. Le changement prend effet immédiatement." },
]

export function LandingNav() {
    const navigate = useNavigate()
    return (
        <nav className="ln-nav">
            <div className="ln-container">
                <div className="ln-nav-inner">
                    <div className="ln-nav-logo" onClick={() => navigate('/')}>
                        <PlannerMark size={34} />
                        <span className="ln-nav-logo-name">Planner</span>
                    </div>
                    <div className="ln-nav-links">
                        <span className="ln-nav-link" style={{ cursor: 'pointer' }} onClick={() => navigate('/fonctionnalites')}>Fonctionnalités</span>
                        <span className="ln-nav-link" style={{ cursor: 'pointer' }} onClick={() => navigate('/tarifs')}>Tarifs</span>
                        <span className="ln-nav-link" style={{ cursor: 'pointer' }} onClick={() => navigate('/contact')}>Contact</span>
                    </div>
                    <div className="ln-nav-actions">
                        <button className="btn sm" onClick={() => navigate('/login')}>Connexion</button>
                        <button className="btn accent sm" onClick={() => navigate('/register')}>Démarrer gratuitement</button>
                    </div>
                </div>
            </div>
        </nav>
    )
}

export function LandingFooter() {
    const navigate = useNavigate()
    return (
        <footer className="ln-footer">
            <div className="ln-footer-inner">
                <div className="ln-footer-top">
                    <div>
                        <div className="ln-footer-logo">
                            <PlannerMark size={34} />
                            <span className="ln-footer-logo-name">Planner</span>
                        </div>
                        <p className="ln-footer-tagline">La plateforme de gestion pour les cabinets d'architecture algériens. Conçu et hébergé en Algérie.</p>
                    </div>
                    <div>
                        <div className="ln-footer-col-title">Produit</div>
                        <span className="ln-footer-link" style={{ cursor: 'pointer' }} onClick={() => navigate('/fonctionnalites')}>Fonctionnalités</span>
                        <span className="ln-footer-link" style={{ cursor: 'pointer' }} onClick={() => navigate('/tarifs')}>Tarifs</span>
                        <span className="ln-footer-link" style={{ cursor: 'pointer' }} onClick={() => navigate('/contact')}>Contact</span>
                    </div>
                    <div>
                        <div className="ln-footer-col-title">Compte</div>
                        <span className="ln-footer-link" style={{ cursor: 'pointer' }} onClick={() => navigate('/login')}>Connexion</span>
                        <span className="ln-footer-link" style={{ cursor: 'pointer' }} onClick={() => navigate('/register')}>Créer un compte</span>
                    </div>
                </div>
                <div className="ln-footer-bottom">
                    <span className="ln-footer-copy">© 2026 Planner. Tous droits réservés.</span>
                    <span className="ln-footer-made">Fait avec ♥ pour les architectes algériens</span>
                </div>
            </div>
        </footer>
    )
}

export function PlanCard({ p }) {
    const navigate = useNavigate()
    return (
        <div style={{
            borderRadius: 20,
            border: p.popular ? '2px solid var(--indigo)' : '1.5px solid #E2E8F0',
            background: '#fff',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            padding: '32px 26px 28px',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
        }}>
            {p.popular && (
                <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: 'var(--indigo)', color: 'white', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 20, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span>⭐</span> Offre principale
                </div>
            )}
            <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--indigo)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 10 }}>{p.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 6 }}>
                    <span style={{ fontSize: 38, fontWeight: 900, color: '#0F172A', letterSpacing: '-1.5px', lineHeight: 1 }}>{p.prix}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#94A3B8' }}>DA/mois</span>
                </div>
                <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>{p.desc}</div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                {p.limits.map((l, i) => (
                    <span key={i} style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569' }}>{l}</span>
                ))}
            </div>
            <button onClick={() => navigate('/register')} style={{ width: '100%', padding: '11px', borderRadius: 12, border: '1.5px solid #E2E8F0', background: 'white', color: '#0F172A', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', marginBottom: 24, transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'white' }}>
                Commencer avec {p.label}
            </button>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {p.sections.map((s, si) => (
                    <div key={si} style={{ borderTop: '1px solid #F1F5F9', paddingTop: 16, marginBottom: 16 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.7px', color: '#94A3B8', marginBottom: 10 }}>{s.label}</div>
                        {s.items.map((f, fi) => (
                            <div key={fi} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 9 }}>
                                <div style={{ width: 18, height: 18, borderRadius: 5, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                                    <Check size={10} color="#10B981" strokeWidth={3} />
                                </div>
                                <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.45, fontWeight: 500 }}>{f}</span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}

export function DashboardMockup() {
    return (
        <div style={{
            maxWidth: 920, margin: '0 auto',
            borderRadius: 18, overflow: 'hidden',
            border: '1px solid #E2E8F0',
            boxShadow: '0 40px 100px rgba(0,0,0,0.13), 0 8px 24px rgba(0,0,0,0.06)',
        }}>
            <div style={{ background: '#F1F5F9', borderBottom: '1px solid #E2E8F0', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                    <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#FECACA' }} />
                    <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#FDE68A' }} />
                    <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#D1FAE5' }} />
                </div>
                <div style={{ flex: 1, background: '#E2E8F0', borderRadius: 6, height: 22, display: 'flex', alignItems: 'center', paddingLeft: 12, fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>
                    app.planner.dz/dashboard
                </div>
            </div>
            <div style={{ display: 'flex', height: 400, background: '#F8F7FC' }}>
                <div style={{ width: 148, background: '#fff', borderRight: '1px solid #E6E3F0', padding: '12px 8px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', marginBottom: 14 }}>
                        <PlannerMark size={22} />
                        <span style={{ color: '#0B0B14', fontWeight: 800, fontSize: 12 }}>Planner</span>
                    </div>
                    {[
                        { label: 'Dashboard', active: true },
                        { label: 'Projets', active: false },
                        { label: 'Finances', active: false },
                        { label: 'Chantier', active: false },
                        { label: 'Documents', active: false },
                        { label: 'Planning', active: false },
                    ].map(item => (
                        <div key={item.label} style={{
                            padding: '6px 10px', borderRadius: 7, fontSize: 11, fontWeight: item.active ? 600 : 500,
                            color: item.active ? '#fff' : '#6B6878',
                            background: item.active ? '#0B0B14' : 'transparent',
                            display: 'flex', alignItems: 'center', gap: 7, marginBottom: 1,
                        }}>
                            <div style={{ width: 4, height: 4, borderRadius: '50%', background: item.active ? '#fff' : '#9A97A8', flexShrink: 0 }} />
                            {item.label}
                        </div>
                    ))}
                </div>
                <div style={{ flex: 1, padding: '20px 22px', overflow: 'hidden', background: '#F8F7FC' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0B0B14', marginBottom: 16, letterSpacing: '-0.3px' }}>Dashboard</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 }}>
                        {[
                            { label: 'Projets actifs', val: '12', color: 'var(--indigo)', bg: '#EEEEFE' },
                            { label: 'Honoraires', val: '840K', color: '#16A571', bg: '#E5F7EF' },
                            { label: 'Impayés', val: '120K', color: '#F59E0B', bg: '#FEF3D9' },
                            { label: 'Clients', val: '28', color: '#7C3AED', bg: '#F5F3FF' },
                        ].map(s => (
                            <div key={s.label} style={{ background: 'white', borderRadius: 10, border: '1px solid #E2E8F0', padding: '12px 13px' }}>
                                <div style={{ fontSize: 8, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{s.label}</div>
                                <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>{s.val}</div>
                                <div style={{ width: '100%', height: 3, background: '#F1F5F9', borderRadius: 2 }}>
                                    <div style={{ width: '60%', height: '100%', background: s.color, borderRadius: 2 }} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 12 }}>
                        <div style={{ background: 'white', borderRadius: 11, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                            <div style={{ padding: '10px 14px', borderBottom: '1px solid #F1F5F9', fontSize: 11, fontWeight: 700, color: '#0F172A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                Projets récents
                                <div style={{ fontSize: 10, color: 'var(--indigo)', fontWeight: 600 }}>Voir tout →</div>
                            </div>
                            {[
                                { nom: 'Villa Benkaci — Alger', pct: 65, color: 'var(--indigo)', st: 'En cours' },
                                { nom: 'Immeuble R+4 — Oran', pct: 20, color: '#F59E0B', st: 'Esquisse' },
                                { nom: 'Maison individuelle — Blida', pct: 100, color: '#10B981', st: 'Terminé' },
                                { nom: 'Commerce R+2 — Annaba', pct: 45, color: '#8B5CF6', st: 'En cours' },
                            ].map((p, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '8px 14px', borderBottom: '1px solid #F8FAFC', gap: 10 }}>
                                    <div style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--indigo-soft)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--indigo)' }} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 11, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nom}</div>
                                    </div>
                                    <div style={{ width: 50, height: 4, background: '#F1F5F9', borderRadius: 2, flexShrink: 0, overflow: 'hidden' }}>
                                        <div style={{ width: `${p.pct}%`, height: '100%', background: p.color }} />
                                    </div>
                                    <div style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: 'var(--indigo-soft)', color: 'var(--indigo)', flexShrink: 0 }}>{p.st}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ background: 'white', borderRadius: 11, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                            <div style={{ padding: '10px 14px', borderBottom: '1px solid #F1F5F9', fontSize: 11, fontWeight: 700, color: '#0F172A' }}>Tâches du jour</div>
                            {[
                                { titre: 'Rendu APS client', color: '#EF4444', done: false },
                                { titre: 'Facture FAC-2026-0012', color: '#10B981', done: true },
                                { titre: 'Visite chantier Oran', color: '#F59E0B', done: false },
                                { titre: 'Planning semaine', color: 'var(--indigo)', done: false },
                            ].map((t, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '8px 14px', gap: 9, borderBottom: '1px solid #F8FAFC' }}>
                                    <div style={{ width: 14, height: 14, borderRadius: 4, border: `2px solid ${t.done ? '#10B981' : '#E2E8F0'}`, background: t.done ? '#10B981' : 'white', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {t.done && <div style={{ width: 6, height: 6, borderRadius: 1, background: 'white' }} />}
                                    </div>
                                    <span style={{ fontSize: 11, color: t.done ? '#94A3B8' : '#374151', textDecoration: t.done ? 'line-through' : 'none', fontWeight: 500 }}>{t.titre}</span>
                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.color, marginLeft: 'auto', flexShrink: 0 }} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function FloatingCTA() {
    const navigate = useNavigate()
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const onScroll = () => setVisible(window.scrollY > 320)
        window.addEventListener('scroll', onScroll)
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    if (!visible) return null

    return (
        <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 1000 }}>
            <button
                onClick={() => navigate('/register')}
                style={{
                    padding: '13px 22px', borderRadius: 50, border: 'none',
                    background: 'var(--indigo)',
                    color: '#fff', fontSize: 14, fontWeight: 800,
                    cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
                    boxShadow: '0 8px 30px rgba(91,91,246,0.45)',
                    display: 'flex', alignItems: 'center', gap: 8,
                    transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(91,91,246,0.55)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 8px 30px rgba(91,91,246,0.45)' }}
            >
                <Zap size={15} fill="#fff" /> Essayer gratuitement
            </button>
        </div>
    )
}
