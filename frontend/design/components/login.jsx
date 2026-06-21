/* ===================== Login screen ===================== */
function LoginPage() {
  const { go } = useNav();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [remember, setRemember] = React.useState(true);
  const [touched, setTouched] = React.useState({});
  const [loading, setLoading] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [banner, setBanner] = React.useState('');

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const emailError = touched.email && !email
    ? 'Veuillez saisir votre adresse email.'
    : touched.email && !emailValid
    ? 'Adresse email invalide — vérifiez le format (ex. nom@cabinet.dz).'
    : '';
  const passwordError = touched.password && !password ? 'Veuillez saisir votre mot de passe.' : '';

  const submit = (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    setBanner('');
    if (!emailValid || !password) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setBanner('Email ou mot de passe incorrect. Veuillez réessayer.');
    }, 1600);
  };
  const google = () => { setGoogleLoading(true); setTimeout(() => setGoogleLoading(false), 1600); };

  const left = (
    <React.Fragment>
      <Reveal>
        <h1 className="text-balance text-[clamp(1.9rem,3vw,2.6rem)] font-extrabold leading-[1.08] tracking-[-0.03em] text-ink">
          La plateforme de gestion pour les cabinets d'architecture <span className="text-brand">algériens</span>.
        </h1>
      </Reveal>
      <BulletList items={['Gestion complète de vos projets', 'Suivi chantier en temps réel', 'Facturation conforme aux normes algériennes', 'Analyse de rentabilité']} />
    </React.Fragment>
  );

  return (
    <AuthLayout left={left} trust="Paiement via Chargily Pay · données hébergées en sécurité.">
      <span className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-brand">Espace cabinet</span>
      <h2 className="mt-2 flex items-center gap-2 text-[1.75rem] font-extrabold tracking-[-0.02em] text-ink">
        Bon retour <Icon name="Hand" size={24} className="text-brand" />
      </h2>
      <p className="mt-1.5 text-[0.95rem] text-muted">Connectez-vous à votre espace cabinet.</p>

      <div className="mt-7">
        <GoogleButton onClick={google} loading={googleLoading} disabled={loading} />
        <Divider />
        <ErrorBanner message={banner} />

        <form onSubmit={submit} noValidate className="flex flex-col gap-1">
          <Field id="email" label="Adresse email" type="email" placeholder="nom@cabinet.dz" autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))} error={emailError} />
          <PasswordField id="password" label="Mot de passe" value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))} error={passwordError} />

          <div className="mb-1 mt-1 flex items-center justify-between">
            <label className="tap-ring flex cursor-pointer select-none items-center gap-2 text-[0.85rem] text-muted">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="peer sr-only" />
              <span className="flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border border-hair bg-white transition-all peer-checked:border-brand peer-checked:bg-brand peer-focus-visible:ring-4 peer-focus-visible:ring-[rgba(17,0,255,0.12)]">
                {remember && <Icon name="Check" size={12} strokeWidth={3} className="text-white" />}
              </span>
              Se souvenir de moi
            </label>
            <button type="button" onClick={() => go('reset')} className="tap-ring rounded text-[0.85rem] font-semibold text-brand hover:underline">Mot de passe oublié ?</button>
          </div>

          <button type="submit" disabled={loading}
            className="tap-ring mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-[0.95rem] font-semibold text-white shadow-[0_8px_22px_-10px_rgba(17,0,255,0.7)] transition-all duration-200 hover:bg-brand-dark hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-80 disabled:translate-y-0">
            {loading && <Spinner />}
            {loading ? 'Connexion en cours…' : 'Se connecter'}
          </button>
        </form>

        <p className="mt-6 text-center text-[0.9rem] text-muted">
          Pas encore de compte ?{' '}
          <button onClick={() => go('register')} className="tap-ring rounded font-semibold text-brand hover:underline">S'inscrire</button>
        </p>
      </div>
    </AuthLayout>
  );
}

window.LoginPage = LoginPage;
if (!window.__UNIFIED) {
  ReactDOM.createRoot(document.getElementById('root')).render(<LoginPage />);
}
