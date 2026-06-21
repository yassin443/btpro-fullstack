/* ===================== FAQ accordion ===================== */
function FaqItem({ q, a, open, onToggle, idx }) {
  return (
    <div className="border-b border-hair">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="tap-ring flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span className="flex items-start gap-3 text-[1.02rem] font-semibold tracking-[-0.01em] text-ink">
          <span className="font-mono text-[12px] font-medium text-brand/50 pt-1">{String(idx + 1).padStart(2, '0')}</span>
          {q}
        </span>
        <span className={cx('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-mist text-ink transition-all duration-300', open && 'rotate-180 bg-brand text-white')}>
          <Icon name="ChevronDown" size={16} />
        </span>
      </button>
      <div
        className="grid transition-all duration-300 ease-[cubic-bezier(.16,1,.3,1)]"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <p className="pb-5 pl-8 pr-10 text-[0.96rem] leading-relaxed text-muted">{a}</p>
        </div>
      </div>
    </div>
  );
}

function Faq() {
  const faqs = [
    { q: 'Planner est-il conforme aux normes algériennes ?', a: 'Oui. Les devis et factures intègrent la TVA, le timbre fiscal et les mentions légales attendues par l\'administration algérienne. Vos documents sont prêts à être transmis sans retouche.' },
    { q: 'Comment se passe l\'inscription ?', a: 'Vous créez votre compte, configurez votre cabinet et invitez votre équipe en quelques minutes. Aucune carte bancaire n\'est requise pour démarrer l\'essai de 14 jours.' },
    { q: 'Combien de projets puis-je gérer ?', a: 'Le nombre de projets est illimité sur tous les plans. Vous êtes uniquement limité par le nombre d\'architectes (sièges) inclus dans votre formule.' },
    { q: 'Quel stockage est inclus ?', a: 'De 5 GB sur le plan SOLO jusqu\'à 200 GB sur le plan AGENCE, pour vos plans, photos de chantier et documents de projet.' },
    { q: 'Comment fonctionne le paiement ?', a: 'Les abonnements sont réglés via Chargily Pay, la passerelle de paiement algérienne. Vous payez en dinars, sans carte internationale.' },
    { q: 'Mes données sont-elles en sécurité ?', a: 'Vos données sont chiffrées et sauvegardées quotidiennement. Chaque membre dispose de rôles et de permissions afin de contrôler précisément les accès.' },
    { q: 'Puis-je changer de plan à tout moment ?', a: 'Oui. Vous pouvez passer à un plan supérieur ou inférieur quand vous le souhaitez. Le changement prend effet immédiatement, au prorata.' },
    { q: 'Planner fonctionne-t-il sur mobile ?', a: 'Absolument. L\'interface est entièrement responsive : saisissez vos heures et documentez le chantier directement depuis votre téléphone, sur le terrain.' },
  ];
  const [open, setOpen] = React.useState(0);

  return (
    <section className="bg-mist/40 py-20 sm:py-28">
      <Container className="max-w-3xl">
        <SectionHeader eyebrow="Aide" title={<>Questions fréquentes.</>} />
        <Reveal delay={100} className="mt-12 rounded-[18px] border border-hair bg-white px-5 sm:px-8">
          {faqs.map((f, idx) => (
            <FaqItem key={idx} idx={idx} q={f.q} a={f.a} open={open === idx} onToggle={() => setOpen(open === idx ? -1 : idx)} />
          ))}
        </Reveal>
        <Reveal delay={120}>
          <p className="mt-8 text-center text-[0.95rem] text-muted">
            Une autre question ? <a href="#contact" className="font-semibold text-brand hover:underline">Contactez-nous</a>.
          </p>
        </Reveal>
      </Container>
    </section>
  );
}

Object.assign(window, { Faq });
