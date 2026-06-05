import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronUp, ArrowRight } from 'lucide-react'
import { LandingNav, LandingFooter, FAQS } from './LandingShared'

const EXTRA_FAQS = [
    { q: "Puis-je utiliser Planner depuis mon téléphone ?", a: "Oui. Planner est conçu responsive et fonctionne depuis n'importe quel navigateur mobile. Idéal pour remplir votre journal de chantier sur le terrain." },
    { q: "Y a-t-il une limite sur le nombre de clients ?", a: "Non. Vous pouvez créer un nombre illimité de clients sur tous les plans." },
    { q: "Comment exporter mes données ?", a: "Vous pouvez exporter vos factures, devis, rapports de chantier et planning en PDF à tout moment. L'export complet des données est disponible depuis les paramètres." },
    { q: "Est-ce que Planner fonctionne hors connexion ?", a: "Planner est une application web et nécessite une connexion internet. Cependant, les PDF générés et téléchargés restent accessibles hors ligne." },
]

const ALL_FAQS = [...FAQS, ...EXTRA_FAQS]

const CATEGORIES = [
    { label: 'Conformité & légal', faqs: [ALL_FAQS[0]] },
    { label: 'Inscription & compte', faqs: [ALL_FAQS[1], ALL_FAQS[7]] },
    { label: 'Projets & données', faqs: [ALL_FAQS[2], ALL_FAQS[3], ALL_FAQS[8], ALL_FAQS[9]] },
    { label: 'Facturation & tarifs', faqs: [ALL_FAQS[4], ALL_FAQS[6]] },
    { label: 'Sécurité', faqs: [ALL_FAQS[5]] },
    { label: 'Mobile & export', faqs: [ALL_FAQS[7], ALL_FAQS[10]] },
]

export default function Faq() {
    const navigate = useNavigate()
    const [openFaq, setOpenFaq] = useState(null)

    useEffect(() => {
        document.title = 'FAQ — Planner, logiciel gestion cabinet architecture Algérie'
        const meta = document.querySelector('meta[name="description"]')
        if (meta) meta.setAttribute('content', 'Réponses aux questions fréquentes sur Planner : conformité normes algériennes, inscription, tarifs, sécurité des données, stockage, mobile, export.')
    }, [])

    return (
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: '#fff' }}>
            <LandingNav />

            {/* Hero */}
            <section className="ln-section" style={{ paddingTop: 80, paddingBottom: 32, textAlign: 'center' }}>
                <div className="ln-container">
                    <div className="ln-section-tag">FAQ</div>
                    <h1 className="ln-section-h2" style={{ fontSize: 42, letterSpacing: '-1.5px', marginBottom: 16 }}>
                        Questions fréquentes
                    </h1>
                    <p className="ln-section-p" style={{ maxWidth: 480, margin: '0 auto' }}>
                        Tout ce que vous devez savoir sur Planner. Vous ne trouvez pas votre réponse ?{' '}
                        <a href="mailto:contact@planner.dz" style={{ color: 'var(--indigo)', textDecoration: 'none', fontWeight: 600 }}>Contactez-nous</a>.
                    </p>
                </div>
            </section>

            {/* All FAQs */}
            <section className="ln-section ln-section-grey">
                <div className="ln-container" style={{ maxWidth: 720 }}>
                    {ALL_FAQS.map((faq, i) => (
                        <div key={i} className="ln-faq-item">
                            <div className="ln-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                                {faq.q}
                                {openFaq === i
                                    ? <ChevronUp size={18} color="var(--indigo)" style={{ flexShrink: 0 }} />
                                    : <ChevronDown size={18} color="#94A3B8" style={{ flexShrink: 0 }} />}
                            </div>
                            {openFaq === i && <div className="ln-faq-a">{faq.a}</div>}
                        </div>
                    ))}
                </div>
            </section>

            {/* Contact block */}
            <section className="ln-section">
                <div className="ln-container" style={{ maxWidth: 600, textAlign: 'center' }}>
                    <div style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 20, padding: '48px 40px' }}>
                        <div style={{ fontSize: 32, marginBottom: 16 }}>💬</div>
                        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px', marginBottom: 10 }}>Vous n'avez pas trouvé votre réponse ?</h2>
                        <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, marginBottom: 24 }}>Notre équipe est disponible pour répondre à toutes vos questions sur Planner.</p>
                        <a href="mailto:contact@planner.dz" style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            padding: '12px 24px', borderRadius: 12,
                            background: 'var(--indigo)', color: 'white',
                            fontSize: 14, fontWeight: 700, textDecoration: 'none',
                        }}>
                            Envoyer un email <ArrowRight size={15} />
                        </a>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="ln-cta">
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <h2>Prêt à démarrer ?</h2>
                    <p>Rejoignez les cabinets d'architecture algériens sur Planner.</p>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button className="btn-ln-primary" style={{ margin: 0 }} onClick={() => navigate('/register')}>
                            Créer mon compte <ArrowRight size={16} />
                        </button>
                        <button onClick={() => navigate('/tarifs')} style={{ padding: '14px 28px', borderRadius: 12, border: '1.5px solid rgba(255,255,255,0.3)', background: 'transparent', color: 'white', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                            Voir les tarifs
                        </button>
                    </div>
                </div>
            </section>

            <LandingFooter />
        </div>
    )
}
