import { Icon, Container, Reveal, Eyebrow, Button, Wordmark, useNav } from '../_ui'

export function FinalCta() {
  const { go } = useNav()
  return (
    <section id="demo" className="bg-white py-20 sm:py-28">
      <Container>
        <Reveal>
          <div className="relative overflow-hidden rounded-[28px] border border-hair bg-mist/50 px-6 py-16 text-center sm:px-16 sm:py-20">
            <div className="blueprint-bg blueprint-fade pointer-events-none absolute inset-0 opacity-80" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-full"
              style={{ background: 'radial-gradient(60% 60% at 50% 0%, rgba(17,0,255,0.08), transparent 70%)' }} />
            <div className="relative">
              <Eyebrow>Commencez aujourd'hui</Eyebrow>
              <h2 className="mx-auto mt-5 max-w-2xl text-balance text-[clamp(2rem,4.5vw,3.2rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-ink">
                Prêt à moderniser votre cabinet ?
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-[1.05rem] leading-relaxed text-muted">
                Rejoignez les cabinets d'architecture algériens qui pilotent tout leur cycle de vie avec Planner.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button as="button" onClick={() => go('register')} variant="solid" size="lg" icon="ArrowRight" className="w-full sm:w-auto">Démarrer gratuitement</Button>
                <Button as="a" href="#tarifs" variant="ghost" size="lg" className="w-full sm:w-auto">Voir les tarifs</Button>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}

export function Footer() {
  const { go } = useNav()
  const cols = [
    { title: 'Produit', links: [['Fonctionnalités', '#fonctionnalites'], ['Tarifs', '#tarifs'], ['Contact', '#contact']] },
    { title: 'Société', links: [['Connexion', 'nav:login'], ['Créer un compte', 'nav:register']] },
  ]
  return (
    <footer id="contact" className="border-t border-hair bg-white">
      <Container className="py-16">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2">
            <Wordmark size={30} />
            <p className="mt-4 max-w-xs text-[0.95rem] leading-relaxed text-muted">
              La plateforme de gestion pensée pour les cabinets d'architecture algériens.
            </p>
            <a href="mailto:contact@planner.dz" className="mt-5 inline-flex items-center gap-2 font-mono text-[13px] text-ink transition-colors hover:text-brand">
              <Icon name="Mail" size={15} className="text-brand" /> contact@planner.dz
            </a>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-faint">{c.title}</h4>
              <ul className="mt-4 flex flex-col gap-3">
                {c.links.map(([l, h]) => (
                  <li key={l}>
                    {h.startsWith('nav:')
                      ? <button onClick={() => go(h.slice(4))} className="tap-ring rounded text-[0.95rem] text-muted transition-colors hover:text-ink">{l}</button>
                      : <a href={h} className="text-[0.95rem] text-muted transition-colors hover:text-ink">{l}</a>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h4 className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-faint">Paiement</h4>
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-hair px-3 py-2 text-[0.9rem] font-medium text-ink">
              <Icon name="CreditCard" size={15} className="text-brand" /> Chargily Pay
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-hair pt-8 sm:flex-row">
          <p className="font-mono text-[12px] text-faint">© 2026 Planner. Tous droits réservés.</p>
          <p className="flex items-center gap-1.5 text-[0.9rem] text-muted">
            Fait pour les architectes algériens
            <Icon name="MapPin" size={14} className="text-brand" />
          </p>
        </div>
      </Container>
    </footer>
  )
}
