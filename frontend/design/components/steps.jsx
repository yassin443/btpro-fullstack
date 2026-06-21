/* ===================== Steps — Opérationnel en moins de 10 minutes ===================== */
function Steps() {
  const steps = [
    { n: '01', icon: 'Building2', title: 'Créez votre cabinet', desc: 'Renseignez votre cabinet et invitez votre équipe. Configuration guidée en quelques minutes.' },
    { n: '02', icon: 'FolderPlus', title: 'Ajoutez vos projets', desc: 'Importez vos missions en cours et organisez-les par phase, client et échéance.' },
    { n: '03', icon: 'Receipt', title: 'Gérez et facturez', desc: 'Suivez le terrain, saisissez les heures et générez vos factures conformes.' },
  ];
  return (
    <section className="bg-white py-20 sm:py-28">
      <Container>
        <SectionHeader
          eyebrow="Mise en route"
          title={<>Opérationnel en moins de 10&nbsp;minutes.</>}
          subtitle="Pas de migration complexe, pas de formation interminable. Vous démarrez aujourd'hui."
        />

        <div className="relative mt-16">
          {/* connecting animated line (desktop) */}
          <div className="absolute left-[16%] right-[16%] top-[34px] hidden h-0.5 step-line md:block" aria-hidden="true" />
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-6">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 110} className="relative flex flex-col items-center text-center">
                <div className="relative z-10 flex h-[68px] w-[68px] items-center justify-center rounded-2xl border border-hair bg-white text-brand shadow-soft">
                  <Icon name={s.icon} size={26} />
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand font-mono text-[10px] font-bold text-white">{s.n}</span>
                </div>
                <h3 className="mt-5 text-[1.15rem] font-bold tracking-[-0.01em] text-ink">{s.title}</h3>
                <p className="mt-2 max-w-[280px] text-[0.95rem] leading-relaxed text-muted">{s.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

Object.assign(window, { Steps });
