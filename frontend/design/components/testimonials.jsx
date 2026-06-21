/* ===================== Animated testimonials (anonymous) ===================== */
function Testimonials() {
  const items = [
    {
      quote: "Avant Planner, je perdais un après-midi par mois sur mes factures. Maintenant elles sont conformes et prêtes en quelques minutes — je me concentre enfin sur la conception.",
      role: 'Architecte indépendant', city: 'Alger', mono: 'AI', hue: 0,
    },
    {
      quote: "La facturation suit les normes fiscales algériennes sans que j'aie à y penser. TVA, timbre, tout est calculé. C'est exactement l'outil qui manquait à notre métier.",
      role: 'Gérante de cabinet', city: 'Oran', mono: 'GC', hue: 18,
    },
    {
      quote: "Voir la rentabilité de chaque projet en temps réel a changé notre façon de travailler. On sait quand un chantier dérape avant qu'il ne soit trop tard.",
      role: 'Architecte associé', city: 'Constantine', mono: 'AA', hue: -18,
    },
  ];
  const [i, setI] = React.useState(0);
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => {
    if (paused) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const t = setInterval(() => setI((v) => (v + 1) % items.length), 5500);
    return () => clearInterval(t);
  }, [paused, items.length]);

  const go = (n) => setI((n + items.length) % items.length);
  const active = items[i];

  return (
    <section className="bg-white py-20 sm:py-28">
      <Container>
        <SectionHeader eyebrow="Témoignages" title={<>Ce qu'en disent les cabinets.</>} />

        <div
          className="mt-14 grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-14"
          onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>

          {/* Visual — stacked monogram cards */}
          <Reveal className="relative mx-auto h-[320px] w-full max-w-[360px]">
            {items.map((it, idx) => {
              const offset = ((idx - i) + items.length) % items.length;
              const isActive = idx === i;
              return (
                <div key={idx}
                  className="absolute inset-0 overflow-hidden rounded-[20px] border border-hair bg-mist shadow-soft transition-all duration-700 ease-[cubic-bezier(.16,1,.3,1)]"
                  style={{
                    transform: `rotate(${isActive ? 0 : (offset === 1 ? 5 : -5)}deg) scale(${isActive ? 1 : 0.94}) translateY(${isActive ? 0 : 10}px)`,
                    opacity: offset > 1 ? 0 : 1,
                    zIndex: isActive ? 30 : 20 - offset,
                  }}>
                  {/* blueprint backdrop */}
                  <div className="blueprint-bg absolute inset-0 opacity-60" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full text-2xl font-extrabold text-white shadow-lg"
                      style={{ background: `linear-gradient(135deg, oklch(0.5 0.25 ${265 + it.hue}), oklch(0.42 0.27 ${265 + it.hue}))` }}>
                      {it.mono}
                    </div>
                    <div className="text-center">
                      <div className="text-[0.95rem] font-bold text-ink">{it.role}</div>
                      <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">{it.city}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </Reveal>

          {/* Quote */}
          <Reveal delay={80} className="flex flex-col">
            <Icon name="Quote" size={36} className="text-brand/25" />
            <blockquote key={i} className="mt-4 text-balance text-[1.25rem] font-medium leading-snug tracking-[-0.01em] text-ink sm:text-[1.4rem]"
              style={{ animation: 'fadein .6s ease' }}>
              {active.quote}
            </blockquote>
            <div className="mt-6">
              <div className="text-[0.95rem] font-bold text-ink">{active.role}</div>
              <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-brand">{active.city}</div>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <button onClick={() => go(i - 1)} aria-label="Précédent"
                className="tap-ring flex h-10 w-10 items-center justify-center rounded-full border border-hair text-ink transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:text-brand">
                <Icon name="ArrowLeft" size={18} />
              </button>
              <button onClick={() => go(i + 1)} aria-label="Suivant"
                className="tap-ring flex h-10 w-10 items-center justify-center rounded-full border border-hair text-ink transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:text-brand">
                <Icon name="ArrowRight" size={18} />
              </button>
              <div className="ml-2 flex gap-1.5">
                {items.map((_, idx) => (
                  <button key={idx} onClick={() => go(idx)} aria-label={`Témoignage ${idx + 1}`}
                    className={cx('h-1.5 rounded-full transition-all duration-300', idx === i ? 'w-6 bg-brand' : 'w-1.5 bg-hair hover:bg-brand/40')} />
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </Container>

      <style>{`@keyframes fadein { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }`}</style>
    </section>
  );
}

Object.assign(window, { Testimonials });
