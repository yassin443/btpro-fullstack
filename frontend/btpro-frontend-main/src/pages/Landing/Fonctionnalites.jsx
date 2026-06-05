import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { LandingNav, LandingFooter, FEATURES, STEPS, FloatingCTA } from './LandingShared'
import useSEO from '../../utils/seo'

const SCHEMA = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    'name': 'Fonctionnalités — Planner, logiciel gestion cabinet architecture Algérie',
    'url': 'https://planneralger.com/fonctionnalites',
    'description': 'Toutes les fonctionnalités de Planner : gestion de projets par phases APS/APD/DCE, facturation PDF conforme DZ, suivi chantier, planning équipe, feuilles de temps et rentabilité.',
    'isPartOf': { '@id': 'https://planneralger.com/#website' },
    'about': { '@id': 'https://planneralger.com/#software' },
}

const DETAIL_BLOCKS = [
    {
        tag: 'Projets',
        title: 'Phases normalisées pour l\'architecture algérienne',
        body: 'Planner structure chaque projet selon les phases officielles : Esquisse, APS (Avant-Projet Sommaire), APD (Avant-Projet Détaillé), DCE (Dossier de Consultation des Entreprises), DET (Direction d\'Exécution des Travaux) et VISA. Chaque phase dispose de ses propres tâches, jalons et pourcentage d\'avancement. Le suivi des honoraires est calculé automatiquement en fonction de l\'avancement réel.',
        tags: ['Esquisse', 'APS', 'APD', 'DCE', 'DET', 'VISA', 'Tâches & jalons', 'Honoraires automatiques'],
        color: 'var(--indigo)',
        bg: '#EEEEFE',
    },
    {
        tag: 'Finances',
        title: 'Facturation PDF conforme aux normes fiscales algériennes',
        body: 'Générez des factures et devis en un clic, avec numérotation séquentielle automatique (FAC-2026-0001 / DEV-2026-0001). Chaque document intègre les mentions légales complètes : NIF, NIS, RC, AI, TVA 19% ou mention "Non assujetti à la TVA". Suivez les paiements, les encaissements partiels et les impayés. Convertissez un devis accepté en contrat en un seul clic.',
        tags: ['FAC-YYYY-NNNN', 'TVA conforme', 'Devis → Contrat', 'Suivi encaissements', 'Impayés'],
        color: '#10B981',
        bg: '#ECFDF5',
    },
    {
        tag: 'Chantier',
        title: 'Journal de chantier numérique, depuis le terrain',
        body: 'Remplissez votre journal de chantier directement depuis votre téléphone sur le chantier. Enregistrez la météo, l\'effectif ouvriers, l\'avancement des travaux, les photos et les réserves. Générez des rapports terrain PDF professionnels à envoyer aux maîtres d\'ouvrage. Le suivi des réserves permet de tracer chaque observation jusqu\'à sa levée.',
        tags: ['Journal quotidien', 'Photos illimitées', 'Réserves traçables', 'Rapports PDF auto', 'Mobile-ready'],
        color: '#F59E0B',
        bg: '#FFFBEB',
    },
    {
        tag: 'Équipe',
        title: 'Planning et feuilles de temps pour toute l\'équipe',
        body: 'Visualisez la charge de travail de chaque membre de votre équipe sur un planning hebdomadaire. Évitez les surcharges et les temps morts. Les feuilles de temps permettent à chaque collaborateur d\'enregistrer ses heures par projet. Croisez ces données avec les honoraires perçus pour calculer la rentabilité réelle de chaque mission.',
        tags: ['Planning visuel', 'Charge de travail', 'Feuilles de temps', 'Rentabilité réelle', 'Collaborateurs'],
        color: '#8B5CF6',
        bg: '#F5F3FF',
    },
]

export default function Fonctionnalites() {
    const navigate = useNavigate()

    useSEO({
        title: 'Fonctionnalités — Planner, logiciel gestion cabinet architecture Algérie',
        description: 'Découvrez toutes les fonctionnalités de Planner : gestion de projets par phases APS/APD/DCE, facturation PDF conforme aux normes algériennes, suivi chantier, planning équipe, feuilles de temps et analyse de rentabilité.',
        path: '/fonctionnalites',
        schema: SCHEMA,
    })

    return (
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: '#fff' }}>
            <LandingNav />

            {/* Hero */}
            <section className="ln-section" style={{ paddingTop: 80, paddingBottom: 32, textAlign: 'center' }}>
                <div className="ln-container">
                    <div className="ln-section-tag">Fonctionnalités</div>
                    <h1 className="ln-section-h2" style={{ fontSize: 42, letterSpacing: '-1.5px', marginBottom: 16 }}>
                        Tout ce dont votre cabinet<br />d'architecture a besoin.
                    </h1>
                    <p className="ln-section-p" style={{ maxWidth: 580, margin: '0 auto 16px' }}>
                        De la création du projet jusqu'à la dernière facture encaissée, Planner couvre l'intégralité du cycle de vie d'un cabinet d'architecture — sans jongler entre plusieurs outils.
                    </p>
                    <p className="ln-section-p" style={{ maxWidth: 540, margin: '0 auto 32px', color: '#94A3B8', fontSize: 14 }}>
                        Phases normalisées, facturation conforme aux normes fiscales algériennes, suivi de chantier terrain, gestion d'équipe et analyse de rentabilité par projet.
                    </p>
                    <button className="btn-ln-primary" style={{ margin: '0 auto' }} onClick={() => navigate('/register')}>
                        Essayer gratuitement <ArrowRight size={16} />
                    </button>
                </div>
            </section>

            {/* Features grid */}
            <section className="ln-section ln-section-grey">
                <div className="ln-container">
                    <div className="ln-features-grid">
                        {FEATURES.map((f, i) => {
                            const Icon = f.icon
                            return (
                                <div key={i} className="ln-feat" style={{ padding: '28px 24px' }}>
                                    <div className="ln-feat-icon" style={{ background: f.bg, width: 52, height: 52, marginBottom: 16 }}>
                                        <Icon size={24} color={f.color} />
                                    </div>
                                    <div className="ln-feat-title" style={{ fontSize: 16, marginBottom: 10 }}>{f.title}</div>
                                    <div className="ln-feat-desc" style={{ fontSize: 14, lineHeight: 1.6 }}>{f.desc}</div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* Detail blocks */}
            <section className="ln-section">
                <div className="ln-container" style={{ maxWidth: 860 }}>
                    <div className="ln-text-center" style={{ marginBottom: 56 }}>
                        <div className="ln-section-tag">En détail</div>
                        <h2 className="ln-section-h2">Chaque fonctionnalité,<br />pensée pour les architectes.</h2>
                    </div>
                    {DETAIL_BLOCKS.map((block, i) => (
                        <div key={i} style={{ borderBottom: i < DETAIL_BLOCKS.length - 1 ? '1px solid #F1F5F9' : 'none', paddingBottom: 52, marginBottom: 52 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                                <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: block.bg, color: block.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{block.tag}</span>
                            </div>
                            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px', marginBottom: 14 }}>{block.title}</h2>
                            <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.75, marginBottom: 20 }}>{block.body}</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {block.tags.map((tag, ti) => (
                                    <span key={ti} style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 20, background: block.bg, color: block.color, border: `1px solid ${block.color}22` }}>{tag}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* How it works */}
            <section className="ln-section ln-section-grey">
                <div className="ln-container">
                    <div className="ln-text-center" style={{ marginBottom: 64 }}>
                        <div className="ln-section-tag">Démarrage</div>
                        <h2 className="ln-section-h2">Opérationnel en moins<br />de 10 minutes.</h2>
                        <p className="ln-section-p">Pas d'installation, pas de formation longue. Créez votre cabinet, importez vos données et commencez à facturer.</p>
                    </div>
                    <div className="ln-steps">
                        {STEPS.map((s, i) => (
                            <div key={i} className="ln-step">
                                <div className="ln-step-num">{s.num}</div>
                                <div className="ln-step-title">{s.title}</div>
                                <div className="ln-step-desc">{s.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="ln-cta">
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <h2>Prêt à moderniser votre cabinet ?</h2>
                    <p>Rejoignez les cabinets d'architecture algériens qui gèrent leurs projets avec Planner.</p>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button className="btn-ln-primary" style={{ margin: 0 }} onClick={() => navigate('/register')}>
                            Démarrer gratuitement <ArrowRight size={16} />
                        </button>
                        <button onClick={() => navigate('/tarifs')} style={{ padding: '14px 28px', borderRadius: 12, border: '1.5px solid rgba(255,255,255,0.3)', background: 'transparent', color: 'white', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                            Voir les tarifs
                        </button>
                    </div>
                </div>
            </section>

            <LandingFooter />
            <FloatingCTA />
        </div>
    )
}
