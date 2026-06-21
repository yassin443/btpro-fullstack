/* ===================== Sticky Navbar ===================== */
function Navbar() {
  const { go } = useNav();
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const links = [
    { label: 'Fonctionnalités', href: '#fonctionnalites' },
    { label: 'Tarifs', href: '#tarifs' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className={cx('transition-all duration-300', scrolled ? 'pt-3' : 'pt-0')}>
        <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-8">
          <nav
            className={cx(
              'flex items-center justify-between transition-all duration-300',
              scrolled
                ? 'h-14 rounded-full border border-hair/90 bg-white/80 px-4 shadow-soft backdrop-blur-xl sm:px-5'
                : 'h-[68px] border-b border-transparent px-0'
            )}
          >
            <a href="#top" className="tap-ring rounded-lg" aria-label="Planner — accueil">
              <Wordmark size={scrolled ? 26 : 28} />
            </a>

            <div className="hidden items-center gap-1 md:flex">
              {links.map((l) => (
                <a key={l.href} href={l.href}
                  className="tap-ring rounded-full px-3.5 py-2 text-[0.9375rem] font-medium text-muted transition-colors hover:text-ink">
                  {l.label}
                </a>
              ))}
            </div>

            <div className="hidden items-center gap-2 md:flex">
              <Button as="button" onClick={() => go('login')} variant="ghost" size="md" className="!ring-0 !bg-transparent hover:!bg-mist">Connexion</Button>
              <Button as="button" onClick={() => go('register')} variant="solid" size="md">Démarrer gratuitement</Button>
            </div>

            <button
              onClick={() => setOpen((v) => !v)}
              className="tap-ring flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-mist md:hidden"
              aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'} aria-expanded={open}
            >
              <Icon name={open ? 'X' : 'Menu'} size={22} />
            </button>
          </nav>
        </div>
      </div>

      {/* Mobile slide-in */}
      <div className={cx('fixed inset-0 z-40 md:hidden', open ? 'pointer-events-auto' : 'pointer-events-none')}>
        <div
          onClick={() => setOpen(false)}
          className={cx('absolute inset-0 bg-ink/30 backdrop-blur-sm transition-opacity duration-300', open ? 'opacity-100' : 'opacity-0')}
        />
        <div
          className={cx(
            'absolute right-0 top-0 flex h-full w-[82%] max-w-sm flex-col bg-white p-6 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)]',
            open ? 'translate-x-0' : 'translate-x-full'
          )}
        >
          <div className="flex items-center justify-between">
            <Wordmark size={28} />
            <button onClick={() => setOpen(false)} className="tap-ring flex h-10 w-10 items-center justify-center rounded-full hover:bg-mist" aria-label="Fermer">
              <Icon name="X" size={22} />
            </button>
          </div>
          <div className="mt-8 flex flex-col gap-1">
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)}
                className="tap-ring flex items-center justify-between rounded-xl px-4 py-3.5 text-lg font-semibold text-ink transition-colors hover:bg-mist">
                {l.label}
                <Icon name="ArrowUpRight" size={18} className="text-faint" />
              </a>
            ))}
          </div>
          <div className="mt-auto flex flex-col gap-3 pt-8">
            <Button as="button" variant="ghost" size="lg" onClick={() => { setOpen(false); go('login'); }}>Connexion</Button>
            <Button as="button" variant="solid" size="lg" onClick={() => { setOpen(false); go('register'); }}>Démarrer gratuitement</Button>
          </div>
        </div>
      </div>
    </header>
  );
}

Object.assign(window, { Navbar });
