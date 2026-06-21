import { cx, Icon, Container, SectionHeader, useReveal } from '../_ui'

function BentoTile({ className = '', icon, title, desc, children }) {
  const ref = useReveal()
  return (
    <div ref={ref}
      className={cx(
        'reveal group relative flex flex-col overflow-hidden rounded-[18px] border border-hair bg-white p-5 transition-all duration-300',
        'hover:-translate-y-1 hover:border-brand/20 hover:shadow-lift sm:p-6',
        className
      )}>
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[rgba(17,0,255,0.06)] text-brand ring-1 ring-brand/10 transition-colors group-hover:bg-brand group-hover:text-white">
          <Icon name={icon} size={17} />
        </span>
        <h3 className="text-[1.05rem] font-bold tracking-[-0.01em] text-ink">{title}</h3>
      </div>
      <p className="mt-2.5 text-[0.9rem] leading-relaxed text-muted">{desc}</p>
      <div className="mt-5 flex-1">{children}</div>
    </div>
  )
}

function SnippetPhases() {
  const phases = ['Esquisse', 'APS', 'APD', 'DCE', 'DET']
  return (
    <div className="rounded-xl border border-hair bg-mist/50 p-3.5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11.5px] font-semibold text-ink">Villa R+1 · Hydra</span>
        <span className="font-mono text-[10px] text-faint">phase 3 / 5</span>
      </div>
      <div className="flex items-center gap-1.5">
        {phases.map((p, i) => (
          <div key={p} className="flex flex-1 flex-col items-center gap-1.5">
            <div className={cx('h-1.5 w-full rounded-full', i <= 2 ? 'bg-brand' : 'bg-hair')} />
            <span className={cx('font-mono text-[9px]', i <= 2 ? 'text-brand' : 'text-faint')}>{p}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SnippetInvoice() {
  return (
    <div className="rounded-xl border border-hair bg-mist/50 p-3.5">
      <div className="flex items-center justify-between border-b border-hair pb-2.5">
        <div>
          <div className="text-[11.5px] font-bold text-ink">Facture FA-2026-014</div>
          <div className="font-mono text-[9.5px] text-faint">TVA 19% · timbre fiscal</div>
        </div>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-mono text-[9px] font-semibold text-emerald-600">Payée</span>
      </div>
      <div className="mt-2.5 space-y-1.5 font-mono text-[10.5px]">
        <div className="flex justify-between text-muted"><span>Honoraires APD</span><span>620 000</span></div>
        <div className="flex justify-between text-muted"><span>TVA 19%</span><span>117 800</span></div>
        <div className="flex justify-between border-t border-hair pt-1.5 font-semibold text-ink"><span>Total TTC</span><span>738 800 DA</span></div>
      </div>
    </div>
  )
}

function SnippetChantier() {
  return (
    <div className="rounded-xl border border-hair bg-mist/50 p-3.5">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[11.5px] font-semibold text-ink">Journal de chantier</span>
        <span className="font-mono text-[10px] text-faint">12 juin</span>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="aspect-[4/3] rounded-md bg-gradient-to-br from-hair to-mist ring-1 ring-hair">
            <div className="flex h-full items-center justify-center">
              <Icon name="Image" size={14} className="text-faint" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1.5">
        <Icon name="TriangleAlert" size={12} className="text-amber-500" />
        <span className="text-[10.5px] text-amber-700">2 réserves ouvertes</span>
      </div>
    </div>
  )
}

function SnippetTimesheet() {
  const rows = [['Esquisse', 8], ['Réunion MOA', 3], ['Plans DCE', 12]]
  return (
    <div className="rounded-xl border border-hair bg-mist/50 p-3.5">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[11.5px] font-semibold text-ink">Semaine 24</span>
        <span className="font-mono text-[10px] text-brand">23 h</span>
      </div>
      <div className="space-y-2">
        {rows.map(([t, h]) => (
          <div key={t} className="flex items-center gap-2">
            <span className="w-20 truncate text-[10.5px] text-muted">{t}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-hair">
              <div className="h-full rounded-full bg-brand/70" style={{ width: `${(h / 12) * 100}%` }} />
            </div>
            <span className="w-7 text-right font-mono text-[10px] text-faint">{h}h</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SnippetPlanning() {
  const people = [['AM', 80, 'bg-brand'], ['KB', 55, 'bg-brand/60'], ['NS', 95, 'bg-brand']]
  return (
    <div className="rounded-xl border border-hair bg-mist/50 p-3.5">
      <div className="mb-2.5 text-[11.5px] font-semibold text-ink">Charge de l'équipe</div>
      <div className="space-y-2.5">
        {people.map(([n, w, c]) => (
          <div key={n} className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand/10 font-mono text-[8.5px] font-bold text-brand">{n}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-hair">
              <div className={cx('h-full rounded-full', c)} style={{ width: `${w}%` }} />
            </div>
            <span className="w-8 text-right font-mono text-[9.5px] text-faint">{w}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SnippetProfit() {
  return (
    <div className="rounded-xl border border-hair bg-mist/50 p-3.5">
      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] text-faint">Bénéfice net</div>
          <div className="mt-0.5 text-[18px] font-bold tracking-tight text-ink">+ 1,12 M <span className="text-[11px] font-medium text-faint">DA</span></div>
        </div>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-mono text-[9.5px] font-semibold text-emerald-600">marge 34%</span>
      </div>
      <div className="mt-3 flex h-9 items-end gap-1">
        {[40, 55, 48, 62, 70, 66, 82].map((b, i) => (
          <div key={i} className="flex-1 rounded-t-[2px] bg-gradient-to-t from-brand/25 to-brand" style={{ height: `${b}%` }} />
        ))}
      </div>
    </div>
  )
}

export default function Features() {
  return (
    <section id="fonctionnalites" className="relative bg-mist/40 py-20 sm:py-28">
      <Container>
        <SectionHeader
          eyebrow="Fonctionnalités"
          title={<>Tout ce dont votre cabinet a besoin.</>}
          subtitle="Un seul outil pour piloter projets, finances et terrain — pensé autour du métier d'architecte."
        />

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <BentoTile className="lg:col-span-2" icon="FolderKanban" title="Gestion de projets"
            desc="Suivez chaque mission par phase — de l'esquisse au DET — avec échéances, livrables et intervenants.">
            <SnippetPhases />
          </BentoTile>

          <BentoTile icon="FileText" title="Facturation & Devis PDF"
            desc="Devis et factures conformes aux normes fiscales algériennes, en quelques clics.">
            <SnippetInvoice />
          </BentoTile>

          <BentoTile icon="HardHat" title="Suivi de chantier"
            desc="Journal terrain, photos et réserves centralisés, accessibles depuis le site.">
            <SnippetChantier />
          </BentoTile>

          <BentoTile icon="Clock" title="Feuille de temps & Paie"
            desc="Heures saisies par projet, base directe pour la rémunération de l'équipe.">
            <SnippetTimesheet />
          </BentoTile>

          <BentoTile icon="CalendarDays" title="Planning équipe"
            desc="Visualisez charge et disponibilité pour répartir le travail sereinement.">
            <SnippetPlanning />
          </BentoTile>

          <BentoTile className="lg:col-span-3" icon="TrendingUp" title="Rentabilité par projet"
            desc="Marge, coûts et bénéfice en temps réel : sachez exactement quels projets vous rapportent.">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <SnippetProfit />
              <div className="flex flex-col justify-center gap-3 rounded-xl border border-hair bg-mist/50 p-4">
                {[['Honoraires encaissés', '3,20 M DA'], ['Coûts salariaux', '1,48 M DA'], ['Frais & sous-traitance', '0,60 M DA']].map(([l, v]) => (
                  <div key={l} className="flex items-center justify-between text-[12px]">
                    <span className="text-muted">{l}</span>
                    <span className="font-mono font-semibold text-ink">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </BentoTile>
        </div>
      </Container>
    </section>
  )
}
