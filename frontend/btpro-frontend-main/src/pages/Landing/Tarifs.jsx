import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { LandingNav, LandingFooter, PLANS, PlanCard, FloatingCTA } from './LandingShared'
import useSEO from '../../utils/seo'

const COMPARE = [
    { feature: 'Projets illimités', solo: true, cabinet: true, agence: true },
    { feature: 'Phases APS · APD · DCE · DET…', solo: true, cabinet: true, agence: true },
    { feature: 'Gestion des clients', solo: true, cabinet: true, agence: true },
    { feature: 'Factures PDF numérotées auto', solo: true, cabinet: true, agence: true },
    { feature: 'Journal de chantier + photos', solo: true, cabinet: true, agence: true },
    { feature: 'Documents + versioning PDF/DWG', solo: true, cabinet: true, agence: true },
    { feature: 'Contrats et avenants', solo: true, cabinet: true, agence: true },
    { feature: 'Planning équipe', solo: false, cabinet: true, agence: true },
    { feature: 'Feuilles de temps par projet', solo: false, cabinet: true, agence: true },
    { feature: 'Module paie et rémunération', solo: false, cabinet: true, agence: true },
    { feature: 'Sous-traitants et BET', solo: false, cabinet: true, agence: true },
    { feature: 'Rapports terrain PDF auto', solo: false, cabinet: true, agence: true },
    { feature: 'Rentabilité par projet', solo: false, cabinet: true, agence: true },
    { feature: 'Stockage fichiers', solo: false, cabinet: false, agence: '15 GB' },
    { feature: 'Architectes inclus', solo: '1', cabinet: '3', agence: '5' },
]

const SCHEMA = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    'name': 'Tarifs Planner — Logiciel architecture Algérie à partir de 4 900 DA/mois',
    'url': 'https://planneralger.com/tarifs',
    'description': 'Plans et tarifs Planner : Solo 4 900 DA/mois, Cabinet 8 900 DA/mois, Agence 14 900 DA/mois. Paiement en dinars algériens, sans engagement.',
    'isPartOf': { '@id': 'https://planneralger.com/#website' },
}

export default function Tarifs() {
    const navigate = useNavigate()

    useSEO({
        title: 'Tarifs Planner — Logiciel architecture Algérie à partir de 4 900 DA/mois',
        description: 'Plans et tarifs Planner : Solo 4 900 DA/mois, Cabinet 8 900 DA/mois, Agence 14 900 DA/mois. Paiement en dinars algériens, sans engagement, annulation à tout moment.',
        path: '/tarifs',
        schema: SCHEMA,
    })

    return (
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: '#fff' }}>
            <LandingNav />

            {/* Hero */}
            <section className="ln-section" style={{ paddingTop: 80, paddingBottom: 40, textAlign: 'center' }}>
                <div className="ln-container">
                    <div className="ln-section-tag">Tarifs</div>
                    <h1 className="ln-section-h2" style={{ fontSize: 42, letterSpacing: '-1.5px', marginBottom: 16 }}>
                        Des prix clairs en dinars,<br />sans mauvaise surprise.
                    </h1>
                    <p className="ln-section-p" style={{ maxWidth: 520, margin: '0 auto 12px' }}>
                        Payez mensuellement en dinars algériens. Aucune carte internationale requise. Changez de plan ou annulez à tout moment depuis vos paramètres.
                    </p>
                    <p style={{ fontSize: 13, color: '#94A3B8', maxWidth: 440, margin: '0 auto' }}>
                        Paiement via Chargily Pay — la passerelle de paiement algérienne.
                    </p>
                </div>
            </section>

            {/* Pricing cards */}
            <section className="ln-section" style={{ paddingTop: 0 }}>
                <div className="ln-container">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, alignItems: 'stretch', maxWidth: 1060, margin: '0 auto' }}>
                        {PLANS.map(p => <PlanCard key={p.key} p={p} />)}
                    </div>

                    {/* Enterprise banner */}
                    <div style={{
                        maxWidth: 1060, margin: '20px auto 0',
                        borderRadius: 20,
                        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                        border: '1.5px solid #334155',
                        padding: '32px 40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 32,
                        flexWrap: 'wrap',
                    }}>
                        <div style={{ flex: 1, minWidth: 260 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 10 }}>Entreprise</div>
                            <div style={{ fontSize: 24, fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.5px', marginBottom: 8 }}>Plus de 5 architectes ?</div>
                            <div style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.6 }}>Bureau d'études ou agence multi-équipes ? Contactez-nous pour une offre sur mesure adaptée à votre structure et vos besoins spécifiques.</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                            <button onClick={() => navigate('/contact')} style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                padding: '14px 28px', borderRadius: 12,
                                background: 'var(--indigo)', border: 'none',
                                color: 'white', fontSize: 15, fontWeight: 700,
                                cursor: 'pointer', fontFamily: 'inherit',
                                whiteSpace: 'nowrap',
                                boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
                            }}>
                                Nous contacter <ArrowRight size={16} />
                            </button>
                            <span style={{ fontSize: 12, color: '#64748B' }}>Réponse sous 24h</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Value section */}
            <section className="ln-section">
                <div className="ln-container" style={{ maxWidth: 780, textAlign: 'center' }}>
                    <div className="ln-section-tag">Pourquoi Planner vaut son prix</div>
                    <h2 className="ln-section-h2" style={{ fontSize: 30, marginBottom: 20 }}>Remplacez 4 outils par 1 seul.</h2>
                    <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.8, marginBottom: 16, textAlign: 'left' }}>
                        La plupart des cabinets algériens jonglent entre un tableur Excel pour les projets, Word pour les factures, WhatsApp pour coordonner l'équipe et un cahier sur le chantier. Planner centralise tout — et chaque minute économisée se traduit directement en heures facturables.
                    </p>
                    <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.8, textAlign: 'left' }}>
                        Pour un cabinet qui facture à 2 000 DA/heure, économiser 2 heures par semaine sur l'administratif représente plus de 16 000 DA récupérés par mois — soit largement de quoi couvrir votre abonnement, quel que soit le plan choisi.
                    </p>
                </div>
            </section>

            {/* Comparison table */}
            <section className="ln-section ln-section-grey">
                <div className="ln-container" style={{ maxWidth: 860 }}>
                    <div className="ln-text-center" style={{ marginBottom: 48 }}>
                        <div className="ln-section-tag">Comparatif détaillé</div>
                        <h2 className="ln-section-h2">Ce qui est inclus dans chaque plan</h2>
                        <p className="ln-section-p" style={{ marginTop: 8 }}>Tous les plans incluent les fonctionnalités essentielles. Les plans supérieurs ajoutent la collaboration et l'analyse.</p>
                    </div>
                    <div style={{ borderRadius: 16, overflow: 'hidden', border: '1.5px solid #E2E8F0', background: '#fff' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0' }}>
                            <div style={{ padding: '14px 20px', fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Fonctionnalité</div>
                            {['Solo', 'Cabinet', 'Agence'].map(l => (
                                <div key={l} style={{ padding: '14px 20px', fontSize: 13, fontWeight: 800, color: l === 'Cabinet' ? 'var(--indigo)' : '#0F172A', textAlign: 'center' }}>
                                    {l} {l === 'Cabinet' && <span style={{ fontSize: 10, background: 'var(--indigo)', color: 'white', borderRadius: 10, padding: '2px 7px', verticalAlign: 'middle' }}>⭐</span>}
                                </div>
                            ))}
                        </div>
                        {COMPARE.map((row, i) => (
                            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', borderBottom: i < COMPARE.length - 1 ? '1px solid #F1F5F9' : 'none', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                                <div style={{ padding: '12px 20px', fontSize: 13, color: '#374151', fontWeight: 500 }}>{row.feature}</div>
                                {['solo', 'cabinet', 'agence'].map(plan => (
                                    <div key={plan} style={{ padding: '12px 20px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {typeof row[plan] === 'boolean' ? (
                                            row[plan]
                                                ? <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={11} color="#10B981" strokeWidth={3} /></div>
                                                : <div style={{ width: 16, height: 2, background: '#E2E8F0', borderRadius: 2 }} />
                                        ) : (
                                            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{row[plan]}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Questions section */}
            <section className="ln-section">
                <div className="ln-container" style={{ maxWidth: 720, textAlign: 'center' }}>
                    <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px', marginBottom: 12 }}>Des questions sur les tarifs ?</h2>
                    <p style={{ fontSize: 15, color: '#64748B', marginBottom: 24 }}>
                        Consultez notre page Contact pour discuter du plan le mieux adapté à votre cabinet, ou envoyez-nous un message directement.
                    </p>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button onClick={() => navigate('/contact')} style={{ padding: '12px 24px', borderRadius: 12, border: '1.5px solid #E2E8F0', background: 'white', color: '#0F172A', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                            Nous contacter
                        </button>
                        <button onClick={() => navigate('/register')} style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: 'var(--indigo)', color: 'white', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            Démarrer gratuitement <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="ln-cta">
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <h2>Prêt à démarrer ?</h2>
                    <p>Créez votre cabinet en 2 minutes. Facturé en dinars algériens.</p>
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
