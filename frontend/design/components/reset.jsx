/* ===================== Password reset screen ===================== */
function ResetCard({ children }) {
  const { go } = useNav();
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-white px-5 py-10">
      <div className="blueprint-bg blueprint-fade pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[40vh]" style={{ background: 'radial-gradient(60% 100% at 50% 0%, rgba(17,0,255,0.07), transparent 70%)' }} />
      <Reveal className="relative w-full max-w-[420px]">
        <button onClick={() => go('landing')} className="tap-ring mx-auto mb-8 flex w-fit rounded-lg" aria-label="Accueil">
          <Wordmark size={30} />
        </button>
        <div className="rounded-[18px] border border-hair bg-white p-7 shadow-soft sm:p-8">
          {children}
        </div>
      </Reveal>
    </div>
  );
}

function ResetPage() {
  const { go } = useNav();
  const [view, setView] = React.useState('forgot'); // forgot | newpw
  const [email, setEmail] = React.useState('');
  const [touched, setTouched] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const [pw, setPw] = React.useState('');
  const [pw2, setPw2] = React.useState('');
  const [pwTouched, setPwTouched] = React.useState({});
  const [pwLoading, setPwLoading] = React.useState(false);
  const [pwDone, setPwDone] = React.useState(false);
  const [expired, setExpired] = React.useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const pwStrong = strengthScore(pw) >= 2 && pw.length >= 8;
  const pwMatch = pw && pw === pw2;

  const sendLink = (e) => { e.preventDefault(); setTouched(true); if (!emailValid) return; setLoading(true); setTimeout(() => { setLoading(false); setSent(true); }, 1500); };
  const resetPw = (e) => { e.preventDefault(); setPwTouched({ pw: 1, pw2: 1 }); if (!pwStrong || !pwMatch) return; setPwLoading(true); setTimeout(() => { setPwLoading(false); setPwDone(true); }, 1500); };

  const PreviewSwitch = (
    <div className="mt-7 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 border-t border-hair pt-5 font-mono text-[10.5px] text-faint">
      <span className="uppercase tracking-[0.12em]">Aperçu :</span>
      {[
        ['Demande', () => { setView('forgot'); setSent(false); }],
        ['Lien envoyé', () => { setView('forgot'); setSent(true); }],
        ['Nouveau mot de passe', () => { setView('newpw'); setPwDone(false); setExpired(false); }],
        ['Lien expiré', () => { setView('newpw'); setExpired(true); setPwDone(false); }],
      ].map(([label, fn]) => (
        <button key={label} onClick={fn} className="tap-ring rounded text-brand/70 transition-colors hover:text-brand hover:underline">{label}</button>
      ))}
    </div>
  );

  return (
    <ResetCard>
      <div key={view + sent + pwDone + expired} className="animate-[step-in_.4s_cubic-bezier(.16,1,.3,1)]">
        {/* ---------- View A: forgot ---------- */}
        {view === 'forgot' && !sent && (
          <React.Fragment>
            <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[rgba(17,0,255,0.06)] text-brand ring-1 ring-brand/10"><Icon name="KeyRound" size={20} /></span>
            <h2 className="mt-4 text-[1.5rem] font-extrabold tracking-[-0.02em] text-ink">Mot de passe oublié ?</h2>
            <p className="mt-1.5 text-[0.95rem] text-muted">Entrez votre email — nous vous enverrons un lien de réinitialisation.</p>
            <form onSubmit={sendLink} noValidate className="mt-6">
              <Field id="reset-email" label="Adresse email" type="email" placeholder="nom@cabinet.dz" autoComplete="email"
                value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched(true)}
                error={touched && !emailValid ? 'Adresse email invalide.' : ''} />
              <button type="submit" disabled={loading}
                className="tap-ring mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-[0.95rem] font-semibold text-white shadow-[0_8px_22px_-10px_rgba(17,0,255,0.7)] transition-all duration-200 hover:bg-brand-dark hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-80">
                {loading && <Spinner />}{loading ? 'Envoi en cours…' : 'Envoyer le lien'}
              </button>
            </form>
          </React.Fragment>
        )}

        {/* ---------- View A: sent ---------- */}
        {view === 'forgot' && sent && (
          <div className="text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-brand"><Icon name="MailCheck" size={26} /></span>
            <h2 className="mt-5 text-[1.5rem] font-extrabold tracking-[-0.02em] text-ink">Email envoyé</h2>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">
              Vérifiez votre boîte de réception (et les spams). Le lien expire dans <strong className="font-semibold text-ink">30 minutes</strong>.
            </p>
            <button onClick={() => { setSent(false); }} className="tap-ring mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full border border-hair bg-white text-[0.95rem] font-semibold text-ink transition-all hover:bg-mist hover:-translate-y-0.5">
              <Icon name="RotateCw" size={15} /> Renvoyer l'email
            </button>
          </div>
        )}

        {/* ---------- View B: expired token ---------- */}
        {view === 'newpw' && expired && (
          <div className="text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-500"><Icon name="TriangleAlert" size={26} /></span>
            <h2 className="mt-5 text-[1.5rem] font-extrabold tracking-[-0.02em] text-ink">Lien expiré</h2>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">Ce lien de réinitialisation n'est plus valide. Demandez-en un nouveau pour continuer.</p>
            <button onClick={() => { setView('forgot'); setSent(false); setExpired(false); }} className="tap-ring mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-[0.95rem] font-semibold text-white shadow-[0_8px_22px_-10px_rgba(17,0,255,0.7)] transition-all hover:bg-brand-dark hover:-translate-y-0.5">
              Demander un nouveau lien
            </button>
          </div>
        )}

        {/* ---------- View B: new password ---------- */}
        {view === 'newpw' && !expired && !pwDone && (
          <React.Fragment>
            <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[rgba(17,0,255,0.06)] text-brand ring-1 ring-brand/10"><Icon name="LockKeyhole" size={20} /></span>
            <h2 className="mt-4 text-[1.5rem] font-extrabold tracking-[-0.02em] text-ink">Nouveau mot de passe</h2>
            <p className="mt-1.5 text-[0.95rem] text-muted">Choisissez un mot de passe sûr pour votre compte.</p>
            <form onSubmit={resetPw} noValidate className="mt-6 flex flex-col gap-1">
              <PasswordField id="new-pw" label="Nouveau mot de passe" autoComplete="new-password" meter value={pw}
                onChange={(e) => setPw(e.target.value)} onBlur={() => setPwTouched((t) => ({ ...t, pw: 1 }))}
                error={pwTouched.pw && !pwStrong ? '8 caractères min., avec majuscule et chiffre.' : ''} />
              <Field id="new-pw2" label="Confirmer le mot de passe" type="password" placeholder="••••••••" autoComplete="new-password" value={pw2}
                onChange={(e) => setPw2(e.target.value)} onBlur={() => setPwTouched((t) => ({ ...t, pw2: 1 }))}
                error={pwTouched.pw2 && !pwMatch ? 'Les mots de passe ne correspondent pas.' : ''}
                rightSlot={pwMatch ? <span className="flex h-8 w-8 items-center justify-center text-brand"><Icon name="CircleCheck" size={18} /></span> : null} />
              <button type="submit" disabled={pwLoading}
                className="tap-ring mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-[0.95rem] font-semibold text-white shadow-[0_8px_22px_-10px_rgba(17,0,255,0.7)] transition-all duration-200 hover:bg-brand-dark hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-80">
                {pwLoading && <Spinner />}{pwLoading ? 'Mise à jour…' : 'Réinitialiser le mot de passe'}
              </button>
            </form>
          </React.Fragment>
        )}

        {/* ---------- View B: done ---------- */}
        {view === 'newpw' && !expired && pwDone && (
          <div className="text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-brand"><Icon name="CircleCheck" size={28} /></span>
            <h2 className="mt-5 text-[1.5rem] font-extrabold tracking-[-0.02em] text-ink">Mot de passe mis à jour</h2>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">Votre mot de passe a bien été modifié. Vous pouvez désormais vous connecter.</p>
            <button onClick={() => go('login')} className="tap-ring mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-[0.95rem] font-semibold text-white shadow-[0_8px_22px_-10px_rgba(17,0,255,0.7)] transition-all hover:bg-brand-dark hover:-translate-y-0.5">
              Se connecter <Icon name="ArrowRight" size={16} />
            </button>
          </div>
        )}
      </div>

      {/* back to login */}
      {!(view === 'newpw' && pwDone) && (
        <button onClick={() => go('login')} className="tap-ring mx-auto mt-6 flex items-center gap-1.5 rounded text-[0.88rem] font-semibold text-muted transition-colors hover:text-ink">
          <Icon name="ArrowLeft" size={15} /> Retour à la connexion
        </button>
      )}

      {PreviewSwitch}
    </ResetCard>
  );
}

window.ResetPage = ResetPage;
