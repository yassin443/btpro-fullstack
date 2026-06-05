import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronUp, Mail, Phone, MapPin, Send, CheckCircle2, ArrowRight } from 'lucide-react'
import { LandingNav, LandingFooter, FAQS, FloatingCTA } from './LandingShared'
import api from '../../api/axios'
import useSEO from '../../utils/seo'

const CONTACT_SCHEMA = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    'name': 'Contact Planner — Logiciel architecture Algérie',
    'url': 'https://planneralger.com/contact',
    'description': 'Contactez l\'équipe Planner pour une démo, une question tarifaire ou du support. Réponse sous 24h.',
    'isPartOf': { '@id': 'https://planneralger.com/#website' },
    'mainEntity': {
        '@type': 'Organization',
        '@id': 'https://planneralger.com/#organization',
        'contactPoint': {
            '@type': 'ContactPoint',
            'contactType': 'customer support',
            'email': 'contact@planner.dz',
            'availableLanguage': 'French',
            'areaServed': 'DZ',
            'contactOption': 'TollFree',
        }
    }
}

const SUBJECTS = [
    { value: 'DEMO', label: 'Demande de démo' },
    { value: 'TARIF', label: 'Question tarifaire' },
    { value: 'SUPPORT', label: 'Support technique' },
    { value: 'PARTENARIAT', label: 'Partenariat' },
    { value: 'AUTRE', label: 'Autre' },
]

const EXTRA_FAQS = [
    { q: "Puis-je utiliser Planner depuis mon téléphone ?", a: "Oui. Planner est conçu responsive et fonctionne depuis n'importe quel navigateur mobile. Idéal pour remplir votre journal de chantier sur le terrain." },
    { q: "Y a-t-il une limite sur le nombre de clients ?", a: "Non. Vous pouvez créer un nombre illimité de clients sur tous les plans." },
    { q: "Comment exporter mes données ?", a: "Vous pouvez exporter vos factures, devis, rapports de chantier et planning en PDF à tout moment." },
    { q: "Est-ce que Planner fonctionne hors connexion ?", a: "Planner est une application web et nécessite une connexion internet. Les PDF générés restent accessibles hors ligne une fois téléchargés." },
]

const ALL_FAQS = [...FAQS, ...EXTRA_FAQS]

const EMPTY = { nom: '', cabinet: '', email: '', telephone: '', sujet: 'DEMO', message: '' }

export default function Contact() {
    const navigate = useNavigate()
    const [form, setForm] = useState(EMPTY)
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const [error, setError] = useState('')
    const [openFaq, setOpenFaq] = useState(null)

    useSEO({
        title: 'Contact — Planner, logiciel gestion cabinet architecture Algérie',
        description: 'Contactez l\'équipe Planner pour une démo personnalisée, une question sur les tarifs ou du support. Réponse garantie sous 24h.',
        path: '/contact',
        schema: CONTACT_SCHEMA,
    })

    useEffect(() => { window.scrollTo(0, 0) }, [])

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!form.nom.trim() || !form.email.trim() || !form.message.trim()) {
            setError('Veuillez remplir les champs obligatoires.')
            return
        }
        setError('')
        setLoading(true)
        api.post('/cabinets/contact/', form)
            .then(() => { setSent(true); setForm(EMPTY); setLoading(false) })
            .catch(err => {
                setError(err.response?.data?.error || 'Erreur lors de l\'envoi. Réessayez.')
                setLoading(false)
            })
    }

    return (
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: '#fff' }}>
            <LandingNav />

            {/* Hero */}
            <section className="ln-section" style={{ paddingTop: 80, paddingBottom: 40, textAlign: 'center' }}>
                <div className="ln-container">
                    <div className="ln-section-tag">Contact</div>
                    <h1 className="ln-section-h2" style={{ fontSize: 42, letterSpacing: '-1.5px', marginBottom: 16 }}>
                        On vous répond<br />sous 24 heures.
                    </h1>
                    <p className="ln-section-p" style={{ maxWidth: 440, margin: '0 auto' }}>
                        Demande de démo, question tarifaire ou support — écrivez-nous.
                    </p>
                </div>
            </section>

            {/* Main : form + info */}
            <section className="ln-section" style={{ paddingTop: 0, paddingBottom: 60 }}>
                <div className="ln-container" style={{ maxWidth: 1020 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 40, alignItems: 'start' }}>

                        {/* Form */}
                        <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #E2E8F0', padding: '36px 32px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
                            {sent ? (
                                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                        <CheckCircle2 size={32} color="#10B981" />
                                    </div>
                                    <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>Message envoyé !</div>
                                    <div style={{ fontSize: 14, color: '#64748B', marginBottom: 28 }}>Notre équipe vous répondra dans les 24 heures.</div>
                                    <button onClick={() => setSent(false)} style={{ padding: '10px 24px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', color: '#0F172A', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                                        Envoyer un autre message
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit}>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 24 }}>Envoyez-nous un message</div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                                        <div>
                                            <label style={labelStyle}>Nom complet *</label>
                                            <input style={inputStyle} placeholder="Votre nom" value={form.nom} onChange={e => set('nom', e.target.value)} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Cabinet / Entreprise</label>
                                            <input style={inputStyle} placeholder="Optionnel" value={form.cabinet} onChange={e => set('cabinet', e.target.value)} />
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                                        <div>
                                            <label style={labelStyle}>Email *</label>
                                            <input style={inputStyle} type="email" placeholder="vous@cabinet.dz" value={form.email} onChange={e => set('email', e.target.value)} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Téléphone</label>
                                            <input style={inputStyle} placeholder="0550 00 00 00" value={form.telephone} onChange={e => set('telephone', e.target.value)} />
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: 14 }}>
                                        <label style={labelStyle}>Sujet *</label>
                                        <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.sujet} onChange={e => set('sujet', e.target.value)}>
                                            {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                        </select>
                                    </div>

                                    <div style={{ marginBottom: 20 }}>
                                        <label style={labelStyle}>Message *</label>
                                        <textarea
                                            style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
                                            placeholder="Décrivez votre besoin..."
                                            value={form.message}
                                            onChange={e => set('message', e.target.value)}
                                        />
                                    </div>

                                    {error && (
                                        <div style={{ background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#EF4444' }}>
                                            {error}
                                        </div>
                                    )}

                                    <button type="submit" disabled={loading} style={{
                                        width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
                                        background: loading ? '#E2E8F0' : 'var(--indigo)',
                                        color: loading ? '#94A3B8' : '#fff',
                                        fontSize: 15, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
                                        fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                        boxShadow: loading ? 'none' : '0 4px 14px rgba(91,91,246,0.3)',
                                    }}>
                                        <Send size={16} />
                                        {loading ? 'Envoi en cours...' : 'Envoyer le message'}
                                    </button>
                                </form>
                            )}
                        </div>

                        {/* Info + CTA */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {/* Info card */}
                            <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', borderRadius: 20, padding: '32px 28px', color: '#fff' }}>
                                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 24 }}>Informations de contact</div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                                        <div style={iconWrap}><Mail size={16} color="var(--indigo)" /></div>
                                        <div>
                                            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Email</div>
                                            <a href="mailto:contact@planner.dz" style={{ fontSize: 14, color: '#F8FAFC', textDecoration: 'none', fontWeight: 600 }}>contact@planner.dz</a>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                                        <div style={iconWrap}><Phone size={16} color="var(--indigo)" /></div>
                                        <div>
                                            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Téléphone</div>
                                            <span style={{ fontSize: 14, color: '#F8FAFC', fontWeight: 600 }}>Disponible sur demande</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                                        <div style={iconWrap}><MapPin size={16} color="var(--indigo)" /></div>
                                        <div>
                                            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Localisation</div>
                                            <span style={{ fontSize: 14, color: '#F8FAFC', fontWeight: 600 }}>Algérie — disponible partout</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ height: 1, background: '#334155', margin: '24px 0' }} />

                                <div style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.6 }}>
                                    Réponse garantie sous 24h en jours ouvrés.<br />
                                    Pour une démo personnalisée, précisez votre disponibilité dans le message.
                                </div>
                            </div>

                            {/* CTA direct */}
                            <div style={{ background: '#EEEEFE', borderRadius: 20, padding: '24px 28px' }}>
                                <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>Prêt à démarrer ?</div>
                                <div style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>Créez votre compte en 2 minutes, sans engagement.</div>
                                <button onClick={() => navigate('/register')} style={{
                                    width: '100%', padding: '12px 0', borderRadius: 10, border: 'none',
                                    background: 'var(--indigo)', color: '#fff', fontSize: 14, fontWeight: 800,
                                    cursor: 'pointer', fontFamily: 'inherit',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                }}>
                                    Essayer gratuitement <ArrowRight size={15} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="ln-section ln-section-grey">
                <div className="ln-container" style={{ maxWidth: 720 }}>
                    <div className="ln-text-center" style={{ marginBottom: 40 }}>
                        <div className="ln-section-tag">FAQ</div>
                        <h2 className="ln-section-h2">Questions fréquentes</h2>
                    </div>
                    {ALL_FAQS.map((faq, i) => (
                        <div key={i} className="ln-faq-item">
                            <div className="ln-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                                {faq.q}
                                {openFaq === i
                                    ? <ChevronUp size={18} color="var(--indigo)" style={{ flexShrink: 0 }} />
                                    : <ChevronDown size={18} color="#94A3B8" style={{ flexShrink: 0 }} />
                                }
                            </div>
                            {openFaq === i && <div className="ln-faq-a">{faq.a}</div>}
                        </div>
                    ))}
                </div>
            </section>

            <LandingFooter />
            <FloatingCTA />
        </div>
    )
}

const labelStyle = {
    display: 'block', fontSize: 12, fontWeight: 700, color: '#374151',
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px',
}

const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 10,
    border: '1.5px solid #E2E8F0', background: '#F8FAFC',
    fontSize: 14, color: '#0F172A', fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box',
}

const iconWrap = {
    width: 34, height: 34, borderRadius: 10,
    background: 'rgba(91,91,246,0.15)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
}
