import React from 'react'
import { cx, Icon, Button, Container, Reveal, BlueprintGrid, BorderBeam, Logomark, useNav } from '../_ui'

/* --- Mini dashboard mockup (placeholder app UI) --- */
function DashboardMock() {
  const nav = [
    { icon: 'LayoutDashboard', label: 'Tableau de bord', active: true },
    { icon: 'FolderKanban', label: 'Projets' },
    { icon: 'FileText', label: 'Facturation' },
    { icon: 'HardHat', label: 'Chantiers' },
    { icon: 'Clock', label: 'Feuilles de temps' },
    { icon: 'TrendingUp', label: 'Rentabilité' },
  ]
  const kpis = [
    { label: 'Projets actifs', value: '12', delta: '+3', icon: 'FolderKanban' },
    { label: 'À facturer', value: '1,84 M', unit: 'DA', delta: '+12%', icon: 'FileText' },
    { label: 'Encaissé (mois)', value: '3,20 M', unit: 'DA', delta: '+8%', icon: 'Wallet' },
    { label: 'Marge moyenne', value: '34', unit: '%', delta: '+2 pts', icon: 'TrendingUp' },
  ]
  const bars = [42, 58, 39, 66, 51, 74, 63, 88, 70, 92, 81, 96]

  return (
    <div className="flex h-full w-full overflow-hidden bg-white text-left">
      <aside className="hidden w-[208px] shrink-0 flex-col border-r border-hair bg-mist/60 p-3.5 sm:flex">
        <div className="flex items-center gap-2 px-1.5 pb-4 pt-1">
          <Logomark size={22} />
          <span className="text-[0.95rem] font-bold tracking-tight text-ink">Planner</span>
        </div>
        <div className="flex flex-col gap-0.5">
          {nav.map((n) => (
            <div key={n.label}
              className={cx('flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] font-medium',
                n.active ? 'bg-white text-brand shadow-soft ring-1 ring-hair' : 'text-muted')}>
              <Icon name={n.icon} size={15} className={n.active ? 'text-brand' : 'text-faint'} />
              {n.label}
            </div>
          ))}
        </div>
        <div className="mt-auto rounded-xl bg-white p-3 ring-1 ring-hair">
          <div className="text-[11px] font-semibold text-ink">Cabinet Méridien</div>
          <div className="mt-0.5 font-mono text-[10px] text-faint">Plan Cabinet · 5 sièges</div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-hair px-4 py-3">
          <div>
            <div className="text-[13px] font-bold text-ink">Tableau de bord</div>
            <div className="font-mono text-[10px] text-faint">Juin 2026 · vue d'ensemble</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-1.5 rounded-full bg-mist px-2.5 py-1.5 text-[11px] text-faint ring-1 ring-hair sm:flex">
              <Icon name="Search" size={12} /> Rechercher
            </div>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">SM</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 p-4 lg:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-xl border border-hair bg-white p-3">
              <div className="flex items-center justify-between">
                <Icon name={k.icon} size={14} className="text-brand" />
                <span className="font-mono text-[9.5px] font-semibold text-emerald-600">{k.delta}</span>
              </div>
              <div className="mt-2.5 flex items-baseline gap-1">
                <span className="text-[18px] font-bold tracking-tight text-ink">{k.value}</span>
                {k.unit && <span className="text-[10px] font-medium text-faint">{k.unit}</span>}
              </div>
              <div className="mt-0.5 text-[10.5px] text-muted">{k.label}</div>
            </div>
          ))}
        </div>

        <div className="grid flex-1 grid-cols-1 gap-2.5 px-4 pb-4 lg:grid-cols-5">
          <div className="rounded-xl border border-hair bg-white p-3.5 lg:col-span-3">
            <div className="flex items-center justify-between">
              <div className="text-[12px] font-semibold text-ink">Chiffre d'affaires</div>
              <div className="font-mono text-[10px] text-faint">12 mois · DA</div>
            </div>
            <div className="mt-3 flex h-[120px] items-end gap-1.5">
              {bars.map((b, i) => (
                <div key={i} className="flex flex-1 flex-col justify-end">
                  <div className="rounded-t-[3px] bg-gradient-to-t from-brand/30 to-brand" style={{ height: `${b}%` }} />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-hair bg-white p-3.5 lg:col-span-2">
            <div className="text-[12px] font-semibold text-ink">Projets par phase</div>
            <div className="mt-3 flex flex-col gap-2.5">
              {[['Esquisse', 30, 'bg-brand/30'], ['APD', 55, 'bg-brand/55'], ['DCE', 72, 'bg-brand/75'], ['Chantier', 90, 'bg-brand']].map(([n, w, c]) => (
                <div key={n}>
                  <div className="mb-1 flex items-center justify-between text-[10.5px]">
                    <span className="text-muted">{n}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-mist">
                    <div className={cx('h-full rounded-full', c)} style={{ width: `${w}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* --- Browser frame --- */
function BrowserFrame({ children }) {
  return (
    <div className="overflow-hidden rounded-[14px] bg-white">
      <div className="flex items-center gap-2 border-b border-hair bg-mist/80 px-3.5 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#E5E5EC]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#E5E5EC]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#E5E5EC]" />
        </div>
        <div className="mx-auto flex h-6 max-w-[260px] flex-1 items-center justify-center gap-1.5 rounded-md bg-white px-3 font-mono text-[10.5px] text-faint ring-1 ring-hair">
          <Icon name="Lock" size={10} className="text-emerald-500" />
          app.planner.dz
        </div>
        <div className="w-[52px]" />
      </div>
      <div className="h-[300px] sm:h-[420px]">{children}</div>
    </div>
  )
}

export default function Hero() {
  const { go } = useNav()
  return (
    <section id="top" className="relative overflow-hidden bg-white pt-28 sm:pt-32">
      <BlueprintGrid cols={18} rows={11} className="h-[640px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[640px]"
        style={{ background: 'radial-gradient(60% 50% at 50% 0%, rgba(17,0,255,0.06), transparent 70%)' }} />

      <Container className="relative">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-hair bg-white/70 px-3.5 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-brand backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              Gestion de cabinet d'architecture
            </span>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="mt-6 text-balance text-[clamp(2.3rem,6vw,4.25rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-ink">
              Gérez votre cabinet d'architecture{' '}
              <span className="relative whitespace-nowrap text-brand">
                algérien
                <svg className="absolute -bottom-1.5 left-0 h-2.5 w-full" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M2 8 C 50 2, 150 2, 198 7" stroke="#1100FF" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.35" />
                </svg>
              </span>.
            </h1>
          </Reveal>

          <Reveal delay={150}>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-[1.0625rem] leading-relaxed text-muted sm:text-[1.15rem]">
              De la création du projet jusqu'à la dernière facture encaissée — Planner couvre tout le cycle de vie
              de votre cabinet, sans jongler entre plusieurs outils.
            </p>
          </Reveal>

          <Reveal delay={220}>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button as="button" onClick={() => go('register')} variant="solid" size="lg" icon="ArrowRight" className="w-full sm:w-auto">Démarrer gratuitement</Button>
              <Button as="a" href="#demo" variant="ghost" size="lg" icon="Play" className="w-full sm:w-auto">Voir une démonstration</Button>
            </div>
          </Reveal>

          <Reveal delay={280}>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-[11.5px] text-faint">
              <span className="inline-flex items-center gap-1.5"><Icon name="Check" size={13} className="text-brand" /> 14 jours d'essai</span>
              <span className="inline-flex items-center gap-1.5"><Icon name="Check" size={13} className="text-brand" /> Sans carte bancaire</span>
              <span className="inline-flex items-center gap-1.5"><Icon name="Check" size={13} className="text-brand" /> Paiement via Chargily Pay</span>
            </div>
          </Reveal>
        </div>

        <Reveal delay={340} className="relative mx-auto mt-14 max-w-[980px] pb-24">
          <div className="float-soft">
            <BorderBeam radius={18} duration={7} borderClass="ring-1 ring-hair shadow-glow" className="bg-white p-1.5 sm:p-2">
              <BrowserFrame><DashboardMock /></BrowserFrame>
            </BorderBeam>
          </div>
          <div className="pointer-events-none absolute inset-x-10 -bottom-2 h-24"
            style={{ background: 'radial-gradient(50% 100% at 50% 0%, rgba(17,0,255,0.10), transparent 70%)' }} />
        </Reveal>
      </Container>
    </section>
  )
}
