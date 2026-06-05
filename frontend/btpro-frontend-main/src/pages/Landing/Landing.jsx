import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ShieldCheck, FileText, HardHat, Users, TrendingUp, Clock } from 'lucide-react'
import { LandingNav, LandingFooter, DashboardMockup, FEATURES, FloatingCTA } from './LandingShared'
import useSEO from '../../utils/seo'

const VITE_API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

const SCHEMA = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': 'https://planneralger.com/#webpage',
    'name': 'Planner — Logiciel de gestion pour cabinets d\'architecture en Algérie',
    'url': 'https://planneralger.com/',
    'description': 'La plateforme SaaS complète pour architectes algériens : projets, facturation PDF conforme DZ, suivi chantier, planning équipe et rentabilité.',
    'isPartOf': { '@id': 'https://planneralger.com/#website' },
    'about': { '@id': 'https://planneralger.com/#software' },
    'primaryImageOfPage': { '@type': 'ImageObject', 'url': 'https://planneralger.com/og-image.png' },
}

const TRUST_ITEMS = [
    { icon: ShieldCheck, color: '#10B981', bg: '#ECFDF5', title: 'Conforme aux normes DZ', desc: 'Numérotation séquentielle FAC-YYYY-NNNN, TVA 19%, mentions légales fiscales algériennes.' },
    { icon: FileText, color: 'var(--indigo)', bg: '#EEEEFE', title: 'Facturation en dinars', desc: 'Toute la plateforme fonctionne en DA. Aucune conversion, aucune surprise de change.' },
    { icon: HardHat, color: '#F59E0B', bg: '#FFFBEB', title: 'Adapté au terrain', desc: 'Journal de chantier depuis votre téléphone. Remplissez vos rapports directement sur site.' },
    { icon: Users, color: '#8B5CF6', bg: '#F5F3FF', title: 'Multi-utilisateurs', desc: 'Invitez vos collaborateurs et sous-traitants. Chacun accède uniquement à son périmètre.' },
    { icon: TrendingUp, color: '#EF4444', bg: '#FEF2F2', title: 'Rentabilité visible', desc: 'Comparez honoraires perçus vs heures travaillées. Identifiez vos projets les moins rentables.' },
    { icon: Clock, color: '#0EA5E9', bg: '#F0F9FF', title: 'Feuilles de temps', desc: 'Suivez le temps passé par projet et par collaborateur. Calculez votre coût réel automatiquement.' },
]

export default function Landing() {
    const navigate = useNavigate()
    const [publicStats, setPublicStats] = useState(null)

    useSEO({
        title: 'Planner — Logiciel de gestion pour cabinets d\'architecture en Algérie',
        description: 'Planner est le logiciel SaaS conçu pour les architectes algériens. Projets par phases APS/APD/DCE, facturation PDF conforme, suivi chantier, planning équipe et rentabilité. À partir de 4 900 DA/mois.',
        path: '/',
        schema: SCHEMA,
    })

    useEffect(() => {
        fetch(`${VITE_API}/cabinets/stats-publiques/`)
            .then(r => r.ok ? r.json() : null)
            .then(data => { if (data) setPublicStats(data) })
            .catch(() => {})
    }, [])

    return (
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: '#fff' }}>
            <LandingNav />

            {/* ── HERO ── */}
            <section className="ln-hero">
                <div className="ln-container" style={{ textAlign: 'center' }}>
                    <div className="ln-badge">
                        <span>✦</span> Conçu pour les architectes algériens
                    </div>
                    <h1 className="ln-headline">
                        Gérez votre cabinet<br />
                        <span className="ln-headline-grad">d'architecture algérien.</span>
                    </h1>
                    <p className="ln-hero-sub">
                        La plateforme tout-en-un pour les cabinets d'architecture en Algérie — projets, facturation PDF conforme, suivi chantier, planning équipe et analyse de rentabilité.
                    </p>
                    <div className="ln-hero-ctas">
                        <button className="btn-ln-primary" onClick={() => navigate('/register')}>
                            Démarrer gratuitement <ArrowRight size={16} />
                        </button>
                        <button className="btn-ln-ghost" onClick={() => navigate('/tarifs')}>Voir les tarifs</button>
                    </div>
                    <DashboardMockup />
                </div>
            </section>

            {/* ── STATS ── */}
            {publicStats && publicStats.nb_cabinets >= 100 && (
                <section className="ln-section-sm ln-section-dark">
                    <div className="ln-container">
                        <div className="ln-stats-bar">
                            <div className="ln-stat-item">
                                <div className="ln-stat-num">+{publicStats.nb_cabinets}</div>
                                <div className="ln-stat-lbl">Cabinets actifs</div>
                            </div>
                            <div className="ln-stat-item">
                                <div className="ln-stat-num">{publicStats.nb_projets > 1000 ? `${(publicStats.nb_projets / 1000).toFixed(0)} 000+` : `${publicStats.nb_projets}+`}</div>
                                <div className="ln-stat-lbl">Projets gérés</div>
                            </div>
                            <div className="ln-stat-item">
                                <div className="ln-stat-num">+{publicStats.nb_architectes}</div>
                                <div className="ln-stat-lbl">Architectes inscrits</div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* ── POURQUOI PLANNER ── */}
            <section className="ln-section">
                <div className="ln-container" style={{ maxWidth: 860 }}>
                    <div className="ln-text-center" style={{ marginBottom: 48 }}>
                        <div className="ln-section-tag">Pourquoi Planner</div>
                        <h2 className="ln-section-h2">Le seul logiciel pensé<br />pour la réalité algérienne.</h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'center' }}>
                        <div>
                            <p style={{ fontSize: 16, color: '#374151', lineHeight: 1.8, marginBottom: 20 }}>
                                Les cabinets d'architecture en Algérie font face à des contraintes spécifiques : phases réglementaires propres au contexte local (Esquisse, APS, APD, DCE, DET), facturation en dinars algériens avec TVA, suivi de chantiers sur le terrain et gestion d'équipes parfois réparties sur plusieurs wilayas.
                            </p>
                            <p style={{ fontSize: 16, color: '#374151', lineHeight: 1.8, marginBottom: 28 }}>
                                Planner est conçu autour de ces réalités. Pas de fonctionnalités inutiles importées d'autres marchés. Chaque écran, chaque document, chaque calcul est adapté au contexte algérien.
                            </p>
                            <button onClick={() => navigate('/fonctionnalites')} style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: 'var(--indigo)', color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 14px rgba(91,91,246,0.3)' }}>
                                Voir toutes les fonctionnalités <ArrowRight size={15} />
                            </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            {TRUST_ITEMS.map((item, i) => {
                                const Icon = item.icon
                                return (
                                    <div key={i} style={{ background: '#F8FAFC', borderRadius: 14, padding: '18px 16px', border: '1.5px solid #F1F5F9' }}>
                                        <div style={{ width: 36, height: 36, borderRadius: 10, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                                            <Icon size={18} color={item.color} />
                                        </div>
                                        <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>{item.title}</div>
                                        <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.5 }}>{item.desc}</div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FEATURES ── */}
            <section className="ln-section ln-section-grey">
                <div className="ln-container">
                    <div className="ln-text-center mb-24" style={{ marginBottom: 56 }}>
                        <div className="ln-section-tag">Fonctionnalités</div>
                        <h2 className="ln-section-h2">Tout le cycle de vie<br />de votre cabinet, en un seul outil.</h2>
                        <p className="ln-section-p">De la création du projet jusqu'à la dernière facture, Planner vous accompagne à chaque étape sans multiplier les outils.</p>
                    </div>
                    <div className="ln-features-grid">
                        {FEATURES.map((f, i) => {
                            const Icon = f.icon
                            return (
                                <div key={i} className="ln-feat">
                                    <div className="ln-feat-icon" style={{ background: f.bg }}>
                                        <Icon size={22} color={f.color} />
                                    </div>
                                    <div className="ln-feat-title">{f.title}</div>
                                    <div className="ln-feat-desc">{f.desc}</div>
                                </div>
                            )
                        })}
                    </div>
                    <div style={{ textAlign: 'center', marginTop: 40 }}>
                        <button onClick={() => navigate('/fonctionnalites')} style={{ padding: '12px 28px', borderRadius: 12, border: '1.5px solid #E2E8F0', background: 'white', color: '#0F172A', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            Explorer les fonctionnalités en détail <ArrowRight size={15} />
                        </button>
                    </div>
                </div>
            </section>

            {/* ── CONFORMITE DZ ── */}
            <section className="ln-section">
                <div className="ln-container" style={{ maxWidth: 860 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center' }}>
                        <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', borderRadius: 20, padding: '36px 32px', color: '#fff' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 16 }}>Conformité</div>
                            <h3 style={{ fontSize: 22, fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.5px', marginBottom: 16 }}>Factures conformes<br />au cadre fiscal algérien.</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {[
                                    'Numérotation séquentielle FAC-2026-0001',
                                    'TVA 19% ou mention "Non assujetti à la TVA"',
                                    'Mentions légales : NIF, NIS, RC, AI',
                                    'Devis DEV-YYYY-NNNN avec suivi d\'acceptation',
                                    'Historique inaltérable de tous les documents',
                                ].map((item, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#CBD5E1' }}>
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366F1', flexShrink: 0 }} />
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <div className="ln-section-tag" style={{ marginBottom: 16 }}>Pour qui</div>
                            <h2 className="ln-section-h2" style={{ fontSize: 28, marginBottom: 16 }}>Architectes indépendants<br />ou cabinets d'équipe.</h2>
                            <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.75, marginBottom: 20 }}>
                                Que vous soyez architecte seul en pratique libérale ou à la tête d'un cabinet de 5 personnes, Planner s'adapte. Le plan Solo couvre tous les essentiels. Les plans Cabinet et Agence ajoutent la collaboration en équipe, le suivi de la charge et la gestion de la paie.
                            </p>
                            <button onClick={() => navigate('/tarifs')} style={{ padding: '11px 22px', borderRadius: 12, border: '1.5px solid var(--indigo)', background: 'transparent', color: 'var(--indigo)', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                Comparer les plans <ArrowRight size={15} />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── PRICING TEASER ── */}
            <section className="ln-section ln-section-grey">
                <div className="ln-container" style={{ textAlign: 'center', maxWidth: 640 }}>
                    <div className="ln-section-tag">Tarifs</div>
                    <h2 className="ln-section-h2">Des prix clairs en dinars,<br />sans engagement.</h2>
                    <p className="ln-section-p" style={{ marginBottom: 8 }}>
                        Payez mensuellement en DA. Changez ou annulez à tout moment depuis vos paramètres.
                    </p>
                    <p style={{ fontSize: 16, color: '#0F172A', fontWeight: 700, marginBottom: 28 }}>
                        Solo <span style={{ color: 'var(--indigo)' }}>4 900 DA</span>/mois · Cabinet <span style={{ color: '#10B981' }}>8 900 DA</span>/mois · Agence <span style={{ color: '#8B5CF6' }}>14 900 DA</span>/mois
                    </p>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button className="btn-ln-primary" style={{ margin: 0 }} onClick={() => navigate('/register')}>
                            Démarrer gratuitement <ArrowRight size={16} />
                        </button>
                        <button onClick={() => navigate('/tarifs')} style={{ padding: '14px 24px', borderRadius: 12, border: '1.5px solid #E2E8F0', background: 'white', color: '#0F172A', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                            Comparer les plans
                        </button>
                    </div>
                </div>
            </section>

            {/* ── CTA FINAL ── */}
            <section className="ln-cta">
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <h2>Prêt à lancer votre cabinet ?</h2>
                    <p>Rejoignez les cabinets d'architecture algériens qui gèrent leurs projets avec Planner.</p>
                    <button className="btn-ln-primary" style={{ margin: '0 auto' }} onClick={() => navigate('/register')}>
                        Créer mon compte <ArrowRight size={16} />
                    </button>
                </div>
            </section>

            <LandingFooter />
            <FloatingCTA />
        </div>
    )
}
