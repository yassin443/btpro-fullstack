/* ===================== Unified app shell + screen switcher ===================== */
function ScreenSwitcher({ screen, go }) {
  const tabs = [
    { id: 'landing', label: 'Landing', icon: 'LayoutTemplate' },
    { id: 'login', label: 'Login', icon: 'LogIn' },
    { id: 'register', label: 'Register', icon: 'UserPlus' },
    { id: 'reset', label: 'Reset', icon: 'KeyRound' },
    { id: 'admin', label: 'Admin', icon: 'ShieldCheck' },
  ];
  return (
    <div className="fixed bottom-4 left-1/2 z-[100] -translate-x-1/2">
      <div className="flex items-center gap-1 rounded-full border border-hair bg-white/85 p-1 shadow-[0_8px_30px_-8px_rgba(11,11,20,0.25)] backdrop-blur-xl">
        <span className="hidden px-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-faint sm:block">Aperçu</span>
        {tabs.map((t) => {
          const on = screen === t.id;
          return (
            <button key={t.id} onClick={() => go(t.id)}
              className={cx('tap-ring flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-all duration-200',
                on ? 'bg-brand text-white shadow-[0_6px_16px_-6px_rgba(17,0,255,0.7)]' : 'text-muted hover:bg-mist hover:text-ink')}>
              <Icon name={t.icon} size={14} />
              <span className="hidden xs:inline sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Shell() {
  const [screen, setScreen] = React.useState(() => {
    const h = (location.hash || '').slice(1);
    return ['landing', 'login', 'register', 'reset', 'admin'].includes(h) ? h : 'landing';
  });
  const go = React.useCallback((s) => {
    setScreen(s);
    window.scrollTo(0, 0);
    try { history.replaceState(null, '', '#' + s); } catch (e) {}
  }, []);

  const screens = { landing: Landing, login: LoginPage, register: RegisterPage, reset: ResetPage, admin: AdminApp };
  const Current = screens[screen] || Landing;

  return (
    <NavCtx.Provider value={{ screen, go }}>
      <div key={screen}><Current /></div>
      <ScreenSwitcher screen={screen} go={go} />
    </NavCtx.Provider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Shell />);
