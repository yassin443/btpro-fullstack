/* ===================== Social proof — marquee + counters ===================== */

function PartnerLogo({ name, mark }) {
  return (
    <div className="mx-5 flex h-12 shrink-0 items-center gap-2.5 rounded-xl px-5 text-faint transition-colors duration-300 hover:text-ink">
      <span className="flex h-7 w-7 items-center justify-center rounded-md ring-1 ring-hair">
        <Icon name={mark} size={15} />
      </span>
      <span className="whitespace-nowrap text-[0.95rem] font-semibold tracking-tight">{name}</span>
    </div>
  );
}

function useCountUp(target, run) {
  const [val, setVal] = React.useState(0);
  React.useEffect(() => {
    if (!run) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setVal(target); return; }
    let raf; const start = performance.now(); const dur = 1400;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, target]);
  return val;
}

function Counter({ target, suffix = '', label }) {
  const ref = React.useRef(null);
  const [run, setRun] = React.useState(false);
  React.useEffect(() => {
    const io = new IntersectionObserver((e) => e.forEach((x) => x.isIntersecting && setRun(true)), { threshold: 0.5 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  const val = useCountUp(target, run);
  return (
    <div ref={ref} className="text-center">
      <div className="text-[clamp(1.8rem,4vw,2.6rem)] font-extrabold tracking-[-0.02em] text-ink">
        {val.toLocaleString('fr-FR')}<span className="text-brand">{suffix}</span>
      </div>
      <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-faint">{label}</div>
    </div>
  );
}

function SocialProof() {
  const logos = [
    { name: 'Chargily Pay', mark: 'CreditCard' },
    { name: 'Atelier Sud', mark: 'Compass' },
    { name: 'Studio Médina', mark: 'PenTool' },
    { name: 'Cabinet Rive', mark: 'Ruler' },
    { name: 'Forme & Espace', mark: 'Box' },
    { name: 'Arc Nord', mark: 'Triangle' },
    { name: 'Trait & Volume', mark: 'Frame' },
  ];
  const loop = [...logos, ...logos];

  return (
    <section className="border-y border-hair bg-white py-12 sm:py-16">
      <Container>
        <Reveal className="text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
            Conçu pour les cabinets d'architecture algériens
          </p>
        </Reveal>
      </Container>

      <Reveal className="marquee mt-8" delay={80}>
        <div className="marquee-track">
          {loop.map((l, i) => <PartnerLogo key={i} {...l} />)}
        </div>
      </Reveal>

      <Container>
        <Reveal delay={120}>
          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-3 gap-4 rounded-2xl border border-hair bg-mist/50 px-4 py-8 sm:gap-8 sm:px-10">
            <Counter target={120} suffix="+" label="Cabinets" />
            <Counter target={1450} suffix="+" label="Projets gérés" />
            <Counter target={380} suffix="+" label="Architectes" />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

Object.assign(window, { SocialProof });
