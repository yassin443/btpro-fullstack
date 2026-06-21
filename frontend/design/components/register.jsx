/* ===================== Register screen (3 steps) ===================== */

const WILAYAS = [
  'Adrar','Chlef','Laghouat','Oum El Bouaghi','Batna','Béjaïa','Biskra','Béchar','Blida','Bouira',
  'Tamanrasset','Tébessa','Tlemcen','Tiaret','Tizi Ouzou','Alger','Djelfa','Jijel','Sétif','Saïda',
  'Skikda','Sidi Bel Abbès','Annaba','Guelma','Constantine','Médéa','Mostaganem','M\'Sila','Mascara','Ouargla',
  'Oran','El Bayadh','Illizi','Bordj Bou Arréridj','Boumerdès','El Tarf','Tindouf','Tissemsilt','El Oued','Khenchela',
  'Souk Ahras','Tipaza','Mila','Aïn Defla','Naâma','Aïn Témouchent','Ghardaïa','Relizane','Timimoun','Bordj Badji Mokhtar',
  'Ouled Djellal','Béni Abbès','In Salah','In Guezzam','Touggourt','Djanet','El M\'Ghair','El Meniaa',
];

const REG_PLANS = [
  { id: 'solo', name: 'SOLO', price: 4900, tagline: '1 architecte · 5 GB' },
  { id: 'cabinet', name: 'CABINET', price: 8900, tagline: '5 architectes · 50 GB', popular: true },
  { id: 'agence', name: 'AGENCE', price: 14900, tagline: '10 architectes · 200 GB' },
];

function StepIndicator({ step }) {
  const steps = ['Créer votre compte', 'Informations cabinet', 'Choisir et payer'];
  return (
    <ol className="mt-9 flex flex-col gap-1">
      {steps.map((label, i) => {
        const n = i + 1;
        const done = step > n;
        const active = step === n;
        return (
          <li key={label} className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <span className={cx(
                'flex h-9 w-9 items-center justify-center rounded-full font-mono text-[13px] font-semibold transition-all duration-300',
                active ? 'bg-brand text-white shadow-[0_6px_18px_-6px_rgba(17,0,255,0.7)]'
                : done ? 'bg-brand/10 text-brand' : 'bg-white text-faint ring-1 ring-hair'
              )}>
                {done ? <Icon name="Check" size={15} strokeWidth={3} /> : n}
              </span>
              {i < 2 && <span className={cx('my-1 h-9 w-px transition-colors duration-300', done ? 'bg-brand/40' : 'bg-hair')} />}
            </div>
            <div className="pt-1.5">
              <div className={cx('text-[0.95rem] font-semibold transition-colors', active || done ? 'text-ink' : 'text-faint')}>{label}</div>
              <div className="font-mono text-[10.5px] text-faint">Étape {n}</div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function PrimaryBtn({ children, disabled, onClick, type = 'button', loading, className = '' }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading}
      className={cx('tap-ring flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-brand text-[0.95rem] font-semibold leading-none text-white shadow-[0_8px_22px_-10px_rgba(17,0,255,0.7)] transition-all duration-200 hover:bg-brand-dark hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none', className)}>
      {loading && <Spinner />}{children}
    </button>
  );
}
function GhostBtn({ children, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className="tap-ring flex h-12 shrink-0 items-center justify-center gap-2 rounded-full border border-hair bg-white px-5 text-[0.95rem] font-semibold leading-none text-ink transition-all duration-200 hover:bg-mist hover:-translate-y-0.5">
      {children}
    </button>
  );
}

function RegisterPage() {
  const { go } = useNav();
  const [step, setStep] = React.useState(1);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [payLoading, setPayLoading] = React.useState(false);

  // step 1
  const [f, setF] = React.useState({ prenom: '', nom: '', email: '', pw: '', pw2: '' });
  // step 2
  const [c, setC] = React.useState({ cabinet: '', tel: '', wilaya: '', adresse: '' });
  // step 3
  const [plan, setPlan] = React.useState('cabinet');
  const [touched, setTouched] = React.useState({});

  const set = (obj, setter) => (k) => (e) => setter({ ...obj, [k]: e.target.value });
  const setFV = set(f, setF);
  const setCV = set(c, setC);
  const blur = (k) => () => setTouched((t) => ({ ...t, [k]: true }));

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email);
  const pwStrong = strengthScore(f.pw) >= 2 && f.pw.length >= 8;
  const pwMatch = f.pw && f.pw === f.pw2;
  const step1Valid = f.prenom.trim() && f.nom.trim() && emailValid && pwStrong && pwMatch;
  const telValid = /^[0-9\s]{8,}$/.test(c.tel.trim());
  const step2Valid = c.cabinet.trim() && telValid && c.wilaya;

  const selectedPlan = REG_PLANS.find((p) => p.id === plan);

  const google = () => {
    setGoogleLoading(true);
    setTimeout(() => {
      setGoogleLoading(false);
      setF((v) => ({ ...v, prenom: 'Yacine', nom: 'Benali', email: 'yacine.benali@cabinet.dz', pw: 'Architecte2026!', pw2: 'Architecte2026!' }));
      setStep(2);
    }, 1500);
  };
  const pay = () => { setPayLoading(true); setTimeout(() => setPayLoading(false), 1800); };

  const left = (
    <React.Fragment>
      <Reveal>
        <h1 className="text-balance text-[clamp(1.7rem,2.6vw,2.3rem)] font-extrabold leading-[1.1] tracking-[-0.03em] text-ink">
          Créez votre cabinet sur <span className="text-brand">Planner</span> en quelques minutes.
        </h1>
      </Reveal>
      <Reveal delay={120}><StepIndicator step={step} /></Reveal>
    </React.Fragment>
  );

  return (
    <AuthLayout left={left} trust="Sans engagement · annulez à tout moment." maxW={460}>
      {/* mobile step pills */}
      <div className="mb-6 flex items-center gap-2 lg:hidden">
        {[1, 2, 3].map((n) => (
          <span key={n} className={cx('h-1.5 flex-1 rounded-full transition-colors', step >= n ? 'bg-brand' : 'bg-hair')} />
        ))}
      </div>

      <div key={step} className="animate-[step-in_.4s_cubic-bezier(.16,1,.3,1)]">
        {step === 1 && (
          <div>
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-brand">Étape 1 / 3</span>
            <h2 className="mt-2 text-[1.6rem] font-extrabold tracking-[-0.02em] text-ink">Créer votre compte</h2>
            <p className="mt-1.5 text-[0.95rem] text-muted">Vos informations personnelles d'accès.</p>

            <div className="mt-6">
              <GoogleButton onClick={google} loading={googleLoading} />
              <Divider label="ou remplir manuellement" />

              <form onSubmit={(e) => { e.preventDefault(); setTouched({ prenom: 1, nom: 1, email: 1, pw: 1, pw2: 1 }); if (step1Valid) setStep(2); }} noValidate className="flex flex-col gap-1">
                <div className="grid grid-cols-2 gap-3">
                  <Field id="prenom" label="Prénom" placeholder="Yacine" autoComplete="given-name" value={f.prenom} onChange={setFV('prenom')} onBlur={blur('prenom')} error={touched.prenom && !f.prenom.trim() ? 'Requis' : ''} />
                  <Field id="nom" label="Nom" placeholder="Benali" autoComplete="family-name" value={f.nom} onChange={setFV('nom')} onBlur={blur('nom')} error={touched.nom && !f.nom.trim() ? 'Requis' : ''} />
                </div>
                <Field id="r-email" label="Adresse email" type="email" placeholder="nom@cabinet.dz" autoComplete="email" value={f.email} onChange={setFV('email')} onBlur={blur('email')}
                  error={touched.email && !emailValid ? 'Adresse email invalide.' : ''} />
                <PasswordField id="r-pw" label="Mot de passe" autoComplete="new-password" meter value={f.pw} onChange={setFV('pw')} onBlur={blur('pw')}
                  error={touched.pw && !pwStrong ? '8 caractères min., avec majuscule et chiffre.' : ''} />
                <Field id="r-pw2" label="Confirmer le mot de passe" type="password" placeholder="••••••••" autoComplete="new-password" value={f.pw2} onChange={setFV('pw2')} onBlur={blur('pw2')}
                  error={touched.pw2 && !pwMatch ? 'Les mots de passe ne correspondent pas.' : ''}
                  rightSlot={pwMatch ? <span className="flex h-8 w-8 items-center justify-center text-brand"><Icon name="CircleCheck" size={18} /></span> : null} />

                <PrimaryBtn type="submit" disabled={!step1Valid} className="mt-2 w-full">Continuer<Icon name="ArrowRight" size={16} /></PrimaryBtn>
              </form>

              <p className="mt-6 text-center text-[0.9rem] text-muted">
                Déjà un compte ? <button onClick={() => go('login')} className="tap-ring rounded font-semibold text-brand hover:underline">Se connecter</button>
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-brand">Étape 2 / 3</span>
            <h2 className="mt-2 text-[1.6rem] font-extrabold tracking-[-0.02em] text-ink">Informations cabinet</h2>
            <p className="mt-1.5 text-[0.95rem] text-muted">Parlez-nous de votre structure.</p>

            <form onSubmit={(e) => { e.preventDefault(); setTouched((t) => ({ ...t, cabinet: 1, tel: 1, wilaya: 1 })); if (step2Valid) setStep(3); }} noValidate className="mt-6 flex flex-col gap-1">
              <Field id="cabinet" label="Nom du cabinet" placeholder="Cabinet Méridien" value={c.cabinet} onChange={setCV('cabinet')} onBlur={blur('cabinet')} error={touched.cabinet && !c.cabinet.trim() ? 'Requis' : ''} />

              <Field id="tel" label="Téléphone" type="tel" inputMode="tel" placeholder="555 12 34 56" value={c.tel} onChange={setCV('tel')} onBlur={blur('tel')}
                error={touched.tel && !telValid ? 'Numéro invalide.' : ''}
                leftSlot={
                  <span className="flex h-9 items-center gap-1.5 rounded-[8px] bg-mist px-2.5 font-mono text-[12px] font-medium text-ink ring-1 ring-hair">
                    <span className="flex h-3.5 w-5 overflow-hidden rounded-[2px] ring-1 ring-black/5"><span className="h-full w-1/2 bg-[#0a8a4a]" /><span className="h-full w-1/2 bg-white" /></span>
                    +213
                  </span>
                } />

              <div>
                <label htmlFor="wilaya" className="mb-1.5 block text-[0.85rem] font-semibold text-ink">Wilaya</label>
                <div className="relative">
                  <select id="wilaya" value={c.wilaya} onChange={setCV('wilaya')} onBlur={blur('wilaya')}
                    className={cx('h-12 w-full appearance-none rounded-[12px] border bg-white px-3.5 pr-10 text-[0.95rem] outline-none transition-all duration-200',
                      c.wilaya ? 'text-ink' : 'text-faint',
                      touched.wilaya && !c.wilaya ? 'border-red-400 focus:ring-4 focus:ring-red-500/10' : 'border-hair focus:border-brand focus:ring-4 focus:ring-[rgba(17,0,255,0.12)]')}>
                    <option value="" disabled>Sélectionnez une wilaya</option>
                    {WILAYAS.map((w, i) => <option key={w} value={w}>{String(i + 1).padStart(2, '0')} — {w}</option>)}
                  </select>
                  <Icon name="ChevronDown" size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-faint" />
                </div>
                <div className="min-h-[18px]">{touched.wilaya && !c.wilaya && <p className="mt-1 flex items-center gap-1 text-[0.78rem] font-medium text-red-500"><Icon name="CircleAlert" size={12} /> Veuillez choisir votre wilaya.</p>}</div>
              </div>

              <Field id="adresse" label="Adresse (optionnel)" placeholder="12 rue Didouche Mourad" value={c.adresse} onChange={setCV('adresse')} />

              <div className="mt-2 flex gap-3">
                <GhostBtn onClick={() => setStep(1)}><Icon name="ArrowLeft" size={16} /> Retour</GhostBtn>
                <PrimaryBtn type="submit" disabled={!step2Valid} className="flex-1">Continuer<Icon name="ArrowRight" size={16} /></PrimaryBtn>
              </div>
            </form>
          </div>
        )}

        {step === 3 && (
          <div>
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-brand">Étape 3 / 3</span>
            <h2 className="mt-2 text-[1.6rem] font-extrabold tracking-[-0.02em] text-ink">Choisir et payer</h2>
            <p className="mt-1.5 text-[0.95rem] text-muted">Sélectionnez la formule adaptée à votre cabinet.</p>

            <div className="mt-6 flex flex-col gap-2.5">
              {REG_PLANS.map((p) => {
                const on = plan === p.id;
                return (
                  <button key={p.id} type="button" onClick={() => setPlan(p.id)}
                    className={cx('group relative flex items-center justify-between rounded-[14px] border p-4 text-left transition-all duration-200',
                      on ? 'border-brand bg-[rgba(17,0,255,0.04)] ring-2 ring-brand/30' : 'border-hair bg-white hover:border-brand/30 hover:bg-mist/50')}>
                    <div className="flex items-center gap-3">
                      <span className={cx('flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors', on ? 'border-brand bg-brand text-white' : 'border-hair text-transparent')}>
                        <Icon name="Check" size={11} strokeWidth={3} />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[12px] font-semibold uppercase tracking-[0.12em] text-ink">{p.name}</span>
                          {p.popular && <span className="rounded-full bg-brand px-2 py-0.5 font-mono text-[9px] font-semibold text-white">Le plus populaire</span>}
                        </div>
                        <div className="mt-0.5 text-[0.82rem] text-muted">{p.tagline}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-[1.05rem] font-bold text-ink">{p.price.toLocaleString('fr-FR')}</span>
                      <span className="ml-1 font-mono text-[10px] text-faint">DA/mois</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-[14px] bg-mist px-4 py-3 ring-1 ring-hair">
              <span className="text-[0.9rem] text-muted">Total mensuel</span>
              <span className="font-mono text-[1.1rem] font-bold text-ink">{selectedPlan.price.toLocaleString('fr-FR')} <span className="text-[11px] font-medium text-faint">DA</span></span>
            </div>

            <div className="mt-4 flex gap-3">
              <GhostBtn onClick={() => setStep(2)}><Icon name="ArrowLeft" size={16} /> Retour</GhostBtn>
              <PrimaryBtn onClick={pay} loading={payLoading} className="flex-1">{payLoading ? 'Redirection…' : <React.Fragment><Icon name="Lock" size={15} /> Payer {selectedPlan.price.toLocaleString('fr-FR')} DA</React.Fragment>}</PrimaryBtn>
            </div>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-center font-mono text-[11px] text-faint">
              <Icon name="ShieldCheck" size={13} className="text-brand" /> Paiement sécurisé via Chargily Pay.
            </p>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}

window.RegisterPage = RegisterPage;
