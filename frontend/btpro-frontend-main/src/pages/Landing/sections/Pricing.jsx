import React from 'react'
import { cx, Icon, Button, Container, SectionHeader, Reveal, BorderBeam, useNav } from '../_ui'

export default function Pricing() {
  const { go } = useNav()
  const [annual, setAnnual] = React.useState(false)

  const tiers = [
    {
      name: 'SOLO', monthly: 4900, tagline: "Pour l'architecte indépendant",
      seats: '1 architecte', storage: '5 GB',
      features: ['Projets illimités', 'Facturation & devis PDF', 'Suivi de chantier', 'Feuille de temps', 'Paiement Chargily Pay'],
    },
    {
      name: 'CABINET', monthly: 8900, tagline: 'Pour les cabinets en croissance', popular: true,
      seats: '5 architectes', storage: '50 GB',
      features: ['Tout de SOLO', "Planning d'équipe", 'Rentabilité par projet', 'Gestion de la paie', 'Rôles & permissions', 'Support prioritaire'],
    },
    {
      name: 'AGENCE', monthly: 14900, tagline: 'Pour les structures établies',
      seats: '10 architectes', storage: '200 GB',
      features: ['Tout de CABINET', 'Tableaux de bord avancés', 'Exports comptables', 'Multi-agences', 'Accompagnement dédié'],
    },
  ]

  const price = (m) => {
    const v = annual ? Math.round(m * 10) : m // 2 mois offerts
    return v.toLocaleString('fr-FR')
  }

  return (
    <section id="tarifs" className="relative bg-mist/40 py-20 sm:py-28">
      <Container>
        <SectionHeader
          eyebrow="Tarifs"
          title={<>Des prix clairs en dinars, sans mauvaise surprise.</>}
          subtitle="Choisissez le plan adapté à votre cabinet. Changez ou annulez à tout moment."
        />

        <Reveal delay={120}>
          <div className="mt-9 flex items-center justify-center gap-3">
            <div role="radiogroup" aria-label="Période de facturation"
              className="relative inline-flex items-center rounded-full bg-mist p-1 ring-1 ring-hair">
              <span aria-hidden="true"
                className="absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-brand shadow-[0_6px_16px_-6px_rgba(17,0,255,0.7)] transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)]"
                style={{ transform: annual ? 'translateX(100%)' : 'translateX(0)' }} />
              <button type="button" role="radio" aria-checked={!annual} onClick={() => setAnnual(false)}
                className={cx('relative z-10 rounded-full px-5 py-1.5 text-[0.875rem] font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-mist',
                  !annual ? 'text-white' : 'text-muted hover:text-ink')}>
                Mensuel
              </button>
              <button type="button" role="radio" aria-checked={annual} onClick={() => setAnnual(true)}
                className={cx('relative z-10 rounded-full px-5 py-1.5 text-[0.875rem] font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-mist',
                  annual ? 'text-white' : 'text-muted hover:text-ink')}>
                Annuel
              </button>
            </div>
            <span className="rounded-full bg-[rgba(17,0,255,0.08)] px-2.5 py-1 font-mono text-[10px] font-semibold text-brand">2 mois offerts</span>
          </div>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
          {tiers.map((t, i) => {
            const card = (
              <div className={cx(
                'flex h-full flex-col rounded-[18px] bg-white p-7 transition-all duration-300',
                t.popular ? 'ring-2 ring-brand shadow-glow lg:scale-[1.03]' : 'border border-hair hover:-translate-y-1 hover:shadow-lift'
              )}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[12px] font-semibold uppercase tracking-[0.16em] text-brand">{t.name}</span>
                  {t.popular && <span className="rounded-full bg-brand px-2.5 py-1 font-mono text-[10px] font-semibold text-white">Le plus populaire</span>}
                </div>
                <p className="mt-2 text-[0.9rem] text-muted">{t.tagline}</p>

                <div className="mt-5 flex items-end gap-1.5">
                  <span className="text-[2.6rem] font-extrabold leading-none tracking-[-0.03em] text-ink">{price(t.monthly)}</span>
                  <span className="mb-1.5 font-mono text-[12px] text-faint">DA / {annual ? 'an' : 'mois'}</span>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-mist px-2.5 py-1 text-[11.5px] font-medium text-muted ring-1 ring-hair">
                    <Icon name="Users" size={12} /> {t.seats}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-mist px-2.5 py-1 text-[11.5px] font-medium text-muted ring-1 ring-hair">
                    <Icon name="Database" size={12} /> {t.storage}
                  </span>
                </div>

                <Button as="button" onClick={() => go('register')} variant={t.popular ? 'solid' : 'ghost'} size="lg" className="mt-6 w-full">
                  Démarrer gratuitement
                </Button>

                <div className="my-6 h-px bg-hair" />
                <ul className="flex flex-1 flex-col gap-3">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[0.9rem] text-ink/90">
                      <span className={cx('mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full', t.popular ? 'bg-brand text-white' : 'bg-[rgba(17,0,255,0.1)] text-brand')}>
                        <Icon name="Check" size={11} strokeWidth={3} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )
            return (
              <Reveal key={t.name} delay={i * 100} className="h-full">
                {t.popular
                  ? <BorderBeam radius={18} duration={6} borderClass="" className="h-full">{card}</BorderBeam>
                  : card}
              </Reveal>
            )
          })}
        </div>

        <Reveal delay={120}>
          <p className="mx-auto mt-10 flex max-w-xl items-center justify-center gap-2 text-center text-[0.9rem] text-muted">
            <Icon name="ShieldCheck" size={16} className="shrink-0 text-brand" />
            Paiement via <strong className="font-semibold text-ink">Chargily Pay</strong> — la passerelle algérienne. Aucune carte internationale requise.
          </p>
        </Reveal>
      </Container>
    </section>
  )
}
