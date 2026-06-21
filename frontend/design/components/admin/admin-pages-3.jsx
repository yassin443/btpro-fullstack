/* ===================== Admin pages — batch 3 ===================== */

/* ---------- 9. Erreurs système ---------- */
const ERR_TONE = { Error: 'danger', Warning: 'warn', Info: 'info' };
function PageErreurs() {
  const [levelF, setLevelF] = React.useState('all');
  const [open, setOpen] = React.useState(null);
  const filtered = A.erreurs.filter((e) => levelF === 'all' || e.niveau === levelF);
  const counts = { Error: A.erreurs.filter((e) => e.niveau === 'Error').length, Warning: A.erreurs.filter((e) => e.niveau === 'Warning').length, Info: A.erreurs.filter((e) => e.niveau === 'Info').length };

  const columns = [
    { key: 'niveau', label: 'Niveau', render: (r) => <Badge tone={ERR_TONE[r.niveau]} dot>{r.niveau}</Badge> },
    { key: 'message', label: 'Message', render: (r) => <button onClick={() => setOpen(r)} className="text-left text-[13px] font-semibold text-ink hover:text-brand">{r.message}</button> },
    { key: 'source', label: 'Source', mono: true, render: (r) => <span className="text-[12px] text-muted">{r.source}</span> },
    { key: 'date', label: 'Date', mono: true, nowrap: true, render: (r) => <span className="text-[11.5px] text-faint">{r.date}</span> },
    { key: 'occ', label: 'Occ.', align: 'center', mono: true, render: (r) => <Badge tone={r.occ > 5 ? 'danger' : 'neutral'}>{r.occ}×</Badge> },
  ];

  return (
    <div>
      <PageHead title="Erreurs système" desc="Journal des incidents techniques de la plateforme." />
      <div className="mb-3 grid grid-cols-3 gap-3">
        <KPI label="Erreurs" value={counts.Error} delta="24h" deltaTone="brand" icon="CircleX" />
        <KPI label="Avertissements" value={counts.Warning} delta="24h" deltaTone="muted" icon="TriangleAlert" />
        <KPI label="Infos" value={counts.Info} delta="24h" deltaTone="muted" icon="Info" />
      </div>
      <Panel pad={false}>
        <div className="flex items-center gap-2 border-b border-hair p-3">
          <Select value={levelF} onChange={setLevelF} options={[{ value: 'all', label: 'Tous niveaux' }, { value: 'Error', label: 'Error' }, { value: 'Warning', label: 'Warning' }, { value: 'Info', label: 'Info' }]} className="max-w-[180px]" />
        </div>
        <DataTable columns={columns} rows={filtered} sort={{ key: null }} onSort={() => {}} />
      </Panel>

      <Drawer open={!!open} onClose={() => setOpen(null)} title={open ? open.message : ''} subtitle={open ? `${open.source} · ${open.date}` : ''} width={480}>
        {open && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={ERR_TONE[open.niveau]} dot>{open.niveau}</Badge>
              <Badge tone="neutral">{open.occ} occurrences</Badge>
            </div>
            <div>
              <div className="mb-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-faint">Contexte / stack</div>
              <pre className="overflow-x-auto rounded-[12px] border border-hair bg-mist/50 p-3.5 font-mono text-[11.5px] leading-relaxed text-ink/80 whitespace-pre-wrap">{open.ctx}</pre>
            </div>
            <div className="flex gap-2">
              <AdminBtn variant="ghost" size="sm" icon="Check">Marquer résolu</AdminBtn>
              <AdminBtn variant="soft" size="sm" icon="Bell">Créer une alerte</AdminBtn>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

/* ---------- 10. Logs d'activité ---------- */
function PageLogs() {
  const [q, setQ] = React.useState('');
  const filtered = A.logs.filter((l) => !q || `${l.user} ${l.action} ${l.cible}`.toLowerCase().includes(q.toLowerCase()));
  const isAdmin = (u) => u === 'yassint902@gmail.com';
  return (
    <div>
      <PageHead title="Logs d'activité" desc="Piste d'audit des actions sur la plateforme." />
      <Panel pad={false}>
        <div className="flex flex-col gap-2.5 border-b border-hair p-3 sm:flex-row sm:items-center">
          <SearchInput value={q} onChange={setQ} placeholder="Utilisateur, action ou cible…" className="sm:max-w-sm sm:flex-1" />
          <Select value="7j" onChange={() => {}} options={[{ value: '24h', label: 'Dernières 24h' }, { value: '7j', label: '7 derniers jours' }, { value: '30j', label: '30 derniers jours' }]} />
        </div>
        <div className="divide-y divide-hair/70">
          {filtered.map((l, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-mist/50">
              <span className={cx('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full', isAdmin(l.user) ? 'bg-brand text-white' : 'bg-mist text-muted')}>
                <Icon name={isAdmin(l.user) ? 'ShieldCheck' : 'User'} size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] text-ink">
                  <span className="font-mono font-semibold">{l.user}</span>
                  <span className="text-muted"> {l.action.toLowerCase()} </span>
                  <span className="font-semibold">{l.cible}</span>
                </div>
                <div className="mt-0.5 flex items-center gap-2 font-mono text-[10.5px] text-faint">
                  <span>{l.date}</span><span>·</span><span className="inline-flex items-center gap-1"><Icon name="MapPin" size={10} /> {l.ip}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* ---------- 11. Plans & tarifs ---------- */
function PagePlans() {
  const [plans, setPlans] = React.useState(A.plansConfig);
  const [newFeat, setNewFeat] = React.useState({});
  const toast = useToast();

  const upd = (id, patch) => setPlans((p) => p.map((x) => x.id === id ? { ...x, ...patch } : x));
  const setPopular = (id) => setPlans((p) => p.map((x) => ({ ...x, populaire: x.id === id })));
  const addFeat = (id) => { const v = (newFeat[id] || '').trim(); if (!v) return; upd(id, { features: [...plans.find((x) => x.id === id).features, v] }); setNewFeat((n) => ({ ...n, [id]: '' })); };
  const rmFeat = (id, idx) => upd(id, { features: plans.find((x) => x.id === id).features.filter((_, i) => i !== idx) });

  return (
    <div>
      <PageHead title="Plans & tarifs" desc="Configurez les formules proposées aux cabinets.">
        <AdminBtn icon="Save" onClick={() => toast.show('Plans enregistrés')}>Enregistrer</AdminBtn>
      </PageHead>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {plans.map((p) => (
          <div key={p.id} className={cx('rounded-[14px] border bg-white p-5 transition-shadow', p.populaire ? 'border-brand ring-1 ring-brand/30' : 'border-hair')}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[13px] font-bold uppercase tracking-[0.12em] text-brand">{p.name}</span>
              <label className="flex items-center gap-2">
                <span className="font-mono text-[10.5px] text-faint">Populaire</span>
                <Switch checked={p.populaire} onChange={() => setPopular(p.id)} label="Populaire" />
              </label>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <label className="block">
                <span className="mb-1 block font-mono text-[10.5px] uppercase tracking-[0.08em] text-faint">Prix mensuel (DA)</span>
                <div className="flex items-center rounded-[10px] border border-hair px-3 focus-within:border-brand focus-within:ring-4 focus-within:ring-[rgba(17,0,255,0.1)]">
                  <input type="number" value={p.prix} onChange={(e) => upd(p.id, { prix: +e.target.value })} className="h-9 w-full bg-transparent font-mono text-[14px] font-bold text-ink outline-none" />
                  <span className="font-mono text-[11px] text-faint">/mois</span>
                </div>
              </label>
              <label className="block">
                <span className="mb-1 block font-mono text-[10.5px] uppercase tracking-[0.08em] text-faint">Prix annuel (DA)</span>
                <div className="flex items-center rounded-[10px] border border-hair px-3 focus-within:border-brand focus-within:ring-4 focus-within:ring-[rgba(17,0,255,0.1)]">
                  <input type="number" value={p.annuel} onChange={(e) => upd(p.id, { annuel: +e.target.value })} className="h-9 w-full bg-transparent font-mono text-[14px] font-bold text-ink outline-none" />
                  <span className="font-mono text-[11px] text-faint">/an</span>
                </div>
              </label>
            </div>

            <div className="mt-4">
              <div className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.08em] text-faint">Fonctionnalités</div>
              <div className="flex flex-col gap-1.5">
                {p.features.map((f, i) => (
                  <div key={i} className="group flex items-center gap-2 rounded-lg bg-mist/60 px-2.5 py-1.5">
                    <Icon name="Check" size={13} className="shrink-0 text-brand" />
                    <span className="flex-1 text-[12.5px] text-ink">{f}</span>
                    <button onClick={() => rmFeat(p.id, i)} className="text-faint opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100" aria-label="Retirer"><Icon name="X" size={13} /></button>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-1.5">
                <input value={newFeat[p.id] || ''} onChange={(e) => setNewFeat((n) => ({ ...n, [p.id]: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeat(p.id))} placeholder="Ajouter…"
                  className="h-8 w-full rounded-lg border border-hair bg-white px-2.5 text-[12.5px] outline-none focus:border-brand" />
                <button onClick={() => addFeat(p.id)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgba(17,0,255,0.06)] text-brand transition-colors hover:bg-[rgba(17,0,255,0.12)]"><Icon name="Plus" size={15} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {toast.node}
    </div>
  );
}

/* ---------- 12. Limites par plan ---------- */
function PageLimites() {
  const [limits, setLimits] = React.useState(A.limits);
  const toast = useToast();
  const upd = (plan, patch) => setLimits((l) => l.map((x) => x.plan === plan ? { ...x, ...patch } : x));
  const featCols = [['planning', 'Planning équipe'], ['soustraitants', 'Sous-traitants'], ['exportCompta', 'Export comptable'], ['ia', 'Assistant IA']];

  return (
    <div>
      <PageHead title="Limites par plan" desc="Quotas et fonctionnalités activées pour chaque formule.">
        <AdminBtn icon="Save" onClick={() => toast.show('Limites enregistrées')}>Enregistrer</AdminBtn>
      </PageHead>
      <Panel pad={false}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-hair">
                <th className="px-4 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-faint">Paramètre</th>
                {limits.map((l) => (
                  <th key={l.plan} className="px-4 py-3 text-center font-mono text-[12px] font-bold uppercase tracking-[0.1em] text-brand">{l.plan}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[['Projets max', 'projets'], ['Utilisateurs max', 'users'], ['Stockage (GB)', 'stockage']].map(([label, key]) => (
                <tr key={key} className="border-b border-hair/70">
                  <td className="px-4 py-3 text-[13px] font-medium text-ink">{label}</td>
                  {limits.map((l) => (
                    <td key={l.plan} className="px-4 py-3 text-center">
                      {key === 'projets'
                        ? <span className="font-mono text-[13px] font-semibold text-muted">{l.projets}</span>
                        : <input type="number" value={l[key]} onChange={(e) => upd(l.plan, { [key]: +e.target.value })}
                            className="mx-auto h-8 w-20 rounded-lg border border-hair bg-white text-center font-mono text-[13px] font-semibold text-ink outline-none focus:border-brand focus:ring-2 focus:ring-[rgba(17,0,255,0.12)]" />}
                    </td>
                  ))}
                </tr>
              ))}
              {featCols.map(([key, label]) => (
                <tr key={key} className="border-b border-hair/70 last:border-0">
                  <td className="px-4 py-3 text-[13px] font-medium text-ink">{label}</td>
                  {limits.map((l) => (
                    <td key={l.plan} className="px-4 py-3">
                      <div className="flex justify-center"><Switch checked={l[key]} onChange={(v) => upd(l.plan, { [key]: v })} label={`${label} ${l.plan}`} /></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

/* ---------- 13. Paramètres généraux ---------- */
function PageParametres() {
  const [s, setS] = React.useState({ nom: 'Planner', email: 'contact@planner.dz', devise: 'DA', tva: '19', maintenance: false, inscriptions: true });
  const toast = useToast();
  return (
    <div>
      <PageHead title="Paramètres généraux" desc="Configuration globale de la plateforme.">
        <AdminBtn icon="Save" onClick={() => toast.show('Paramètres enregistrés')}>Enregistrer</AdminBtn>
      </PageHead>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel title="Identité">
          <div className="flex flex-col gap-3.5">
            <LabeledInput label="Nom de la plateforme" value={s.nom} onChange={(v) => setS({ ...s, nom: v })} />
            <LabeledInput label="Email de contact" type="email" value={s.email} onChange={(v) => setS({ ...s, email: v })} />
            <div className="grid grid-cols-2 gap-3.5">
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-semibold text-ink">Devise</span>
                <Select value={s.devise} onChange={(v) => setS({ ...s, devise: v })} options={[{ value: 'DA', label: 'Dinar algérien (DA)' }]} />
              </label>
              <LabeledInput label="TVA par défaut (%)" type="number" mono value={s.tva} onChange={(v) => setS({ ...s, tva: v })} />
            </div>
          </div>
        </Panel>
        <Panel title="Accès & disponibilité">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between rounded-[12px] border border-hair px-3.5 py-3">
              <div><div className="text-[13px] font-semibold text-ink">Mode maintenance</div><div className="text-[11.5px] text-muted">Bloque l'accès à l'application pour tous les cabinets.</div></div>
              <Switch checked={s.maintenance} onChange={(v) => { setS({ ...s, maintenance: v }); }} label="Maintenance" />
            </div>
            <div className="flex items-center justify-between rounded-[12px] border border-hair px-3.5 py-3">
              <div><div className="text-[13px] font-semibold text-ink">Inscriptions ouvertes</div><div className="text-[11.5px] text-muted">Autoriser la création de nouveaux cabinets.</div></div>
              <Switch checked={s.inscriptions} onChange={(v) => setS({ ...s, inscriptions: v })} label="Inscriptions" />
            </div>
            {s.maintenance && (
              <div className="flex items-center gap-2 rounded-[12px] bg-amber-50 px-3.5 py-3 text-[12.5px] text-amber-700">
                <Icon name="TriangleAlert" size={15} className="shrink-0" /> Le mode maintenance est actif : les cabinets ne peuvent plus se connecter.
              </div>
            )}
          </div>
        </Panel>
      </div>
      {toast.node}
    </div>
  );
}

Object.assign(window, { PageErreurs, PageLogs, PagePlans, PageLimites, PageParametres });
