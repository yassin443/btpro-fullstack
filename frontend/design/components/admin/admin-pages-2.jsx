/* ===================== Admin pages — batch 2 ===================== */

/* ---------- 5. Factures ---------- */
const INV_TONE = { 'Payée': 'success', 'En attente': 'warn', 'Impayée': 'danger' };
function PageFactures() {
  const [q, setQ] = React.useState('');
  const [statF, setStatF] = React.useState('all');
  const total = A.factures.reduce((s, f) => s + f.montant, 0);
  const encaisse = A.factures.filter((f) => f.statut === 'Payée').reduce((s, f) => s + f.montant, 0);
  const impaye = A.factures.filter((f) => f.statut === 'Impayée').reduce((s, f) => s + f.montant, 0);

  const filtered = A.factures.filter((f) => {
    if (q && !`${f.num} ${f.cabinet} ${f.client}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (statF !== 'all' && f.statut !== statF) return false;
    return true;
  });
  const { sorted, sort, toggle } = useTableSort(filtered, { key: 'echeance', dir: 'desc' });

  const columns = [
    { key: 'num', label: 'Numéro', sortable: true, mono: true, render: (r) => <span className="font-semibold text-ink">{r.num}</span> },
    { key: 'cabinet', label: 'Cabinet', sortable: true, render: (r) => <span className="text-[12.5px] text-muted">{r.cabinet}</span> },
    { key: 'client', label: 'Client', render: (r) => <span className="text-[12.5px] text-ink">{r.client}</span> },
    { key: 'montant', label: 'Montant TTC', sortable: true, align: 'right', mono: true, render: (r) => `${fmtDA(r.montant)} DA` },
    { key: 'statut', label: 'Statut', align: 'center', render: (r) => <Badge tone={INV_TONE[r.statut]} dot>{r.statut}</Badge> },
    { key: 'echeance', label: 'Échéance', sortable: true, mono: true, nowrap: true, render: (r) => fmtDate(r.echeance) },
  ];

  return (
    <div>
      <PageHead title="Factures" desc={`${A.factures.length} factures tous cabinets · lecture seule`} />
      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KPI label="Total facturé" value={fmtDA(total)} unit="DA" icon="Receipt" deltaTone="muted" />
        <KPI label="Encaissé" value={fmtDA(encaisse)} unit="DA" delta={`${Math.round((encaisse / total) * 100)}%`} icon="CircleCheck" />
        <KPI label="Impayé" value={fmtDA(impaye)} unit="DA" delta="à relancer" deltaTone="brand" icon="CircleAlert" />
      </div>
      <Panel pad={false}>
        <div className="flex flex-col gap-2.5 border-b border-hair p-3 sm:flex-row sm:items-center">
          <SearchInput value={q} onChange={setQ} placeholder="Numéro, cabinet ou client…" className="sm:max-w-xs sm:flex-1" />
          <Select value={statF} onChange={setStatF} options={[{ value: 'all', label: 'Tous statuts' }, { value: 'Payée', label: 'Payée' }, { value: 'En attente', label: 'En attente' }, { value: 'Impayée', label: 'Impayée' }]} />
        </div>
        <DataTable columns={columns} rows={sorted} sort={sort} onSort={toggle} rowKey="num" />
      </Panel>
    </div>
  );
}

/* ---------- 6. Statistiques IA ---------- */
function PageStatsIA() {
  const maxTool = Math.max(...A.aiUsage.tools.map((t) => t.value));
  const maxCab = Math.max(...A.aiUsage.topCabinets.map((c) => c.value));
  return (
    <div>
      <PageHead title="Statistiques IA" desc="Utilisation des assistants IA sur la plateforme." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KPI label="Requêtes totales" value={fmtDA(A.aiUsage.total)} delta="+18% ce mois" icon="Sparkles" />
        {A.aiUsage.tools.map((t) => (
          <KPI key={t.name} label={t.name} value={fmtDA(t.value)} delta={`${Math.round((t.value / A.aiUsage.total) * 100)}%`} deltaTone="muted" icon="Bot" />
        ))}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel title="Requêtes par outil">
          <div className="flex flex-col gap-4 pt-1">
            {A.aiUsage.tools.map((t) => (
              <BarRow key={t.name} label={t.name} value={t.value} max={maxTool} barClass={t.accent} />
            ))}
          </div>
        </Panel>
        <Panel title="Top cabinets par usage">
          <div className="flex flex-col gap-4 pt-1">
            {A.aiUsage.topCabinets.map((c, i) => (
              <div key={c.nom} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mist font-mono text-[11px] font-bold text-muted">{i + 1}</span>
                <div className="min-w-0 flex-1"><BarRow label={c.nom} value={c.value} max={maxCab} suffix=" req." /></div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Évolution de l'usage (12 mois)" className="mt-3" action={<Badge tone="success" dot>croissance</Badge>}>
        <AreaChart data={A.aiUsage.overTime} height={170} fmt={(v) => `${fmtDA(v)} req.`} />
      </Panel>
    </div>
  );
}

/* ---------- 7. Revenus & Charges ---------- */
const CAT_ICON = { 'Hébergement': 'Server', 'Email/Resend': 'Mail', 'Cloudflare R2': 'Cloud', 'Domaine': 'Globe', 'Salaires': 'Users', 'Marketing': 'Megaphone', 'Autre': 'Package' };
function PageRevenus() {
  const [expenses, setExpenses] = React.useState(A.expenses);
  const [form, setForm] = React.useState({ cat: 'Hébergement', libelle: '', montant: '', recurrent: true });
  const toast = useToast();

  const revenus = A.kpis.mrr;
  const charges = expenses.reduce((s, e) => s + e.montant, 0);
  const benefice = revenus - charges;
  const marge = Math.round((benefice / revenus) * 100);

  const byCat = A.expenseCats.map((cat) => ({ cat, total: expenses.filter((e) => e.cat === cat).reduce((s, e) => s + e.montant, 0) })).filter((c) => c.total > 0).sort((a, b) => b.total - a.total);
  const maxCat = Math.max(...byCat.map((c) => c.total), 1);

  const addExpense = (e) => {
    e.preventDefault();
    if (!form.libelle.trim() || !form.montant) return;
    setExpenses((x) => [{ cat: form.cat, libelle: form.libelle, montant: +form.montant, date: '2026-06-21', recurrent: form.recurrent }, ...x]);
    setForm({ cat: 'Hébergement', libelle: '', montant: '', recurrent: true });
    toast.show('Charge ajoutée');
  };

  return (
    <div>
      <PageHead title="Revenus & Charges" desc="Compte de résultat de la plateforme Planner — juin 2026." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KPI label="Revenus (MRR)" value={fmtDA(revenus)} unit="DA" delta="abonnements" deltaTone="muted" icon="TrendingUp" />
        <KPI label="Charges totales" value={fmtDA(charges)} unit="DA" delta="mensuelles" deltaTone="brand" icon="TrendingDown" />
        <KPI label="Bénéfice net" value={fmtDA(benefice)} unit="DA" delta={`marge ${marge}%`} icon="Wallet" />
        <KPI label="Marge nette" value={marge} unit="%" delta="saine" icon="Percent" />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-5">
        {/* Add expense */}
        <Panel title="Ajouter une charge" className="lg:col-span-2">
          <form onSubmit={addExpense} className="flex flex-col gap-3">
            <label className="block">
              <span className="mb-1.5 block text-[12.5px] font-semibold text-ink">Catégorie</span>
              <Select value={form.cat} onChange={(v) => setForm({ ...form, cat: v })} options={A.expenseCats.map((c) => ({ value: c, label: c }))} />
            </label>
            <LabeledInput label="Libellé" value={form.libelle} onChange={(v) => setForm({ ...form, libelle: v })} placeholder="Ex. Serveurs applicatifs" />
            <LabeledInput label="Montant (DA)" type="number" mono value={form.montant} onChange={(v) => setForm({ ...form, montant: v })} placeholder="0" />
            <div className="flex items-center justify-between rounded-[10px] bg-mist/60 px-3 py-2.5">
              <span className="text-[12.5px] font-medium text-ink">Récurrent (mensuel)</span>
              <Switch checked={form.recurrent} onChange={(v) => setForm({ ...form, recurrent: v })} label="Récurrent" />
            </div>
            <AdminBtn type="submit" size="lg" icon="Plus" className="w-full">Ajouter la charge</AdminBtn>
          </form>
        </Panel>

        {/* P&L + chart */}
        <div className="flex flex-col gap-3 lg:col-span-3">
          <Panel title="Revenus vs Charges">
            <div className="flex items-end gap-6 px-2 pt-2">
              {[['Revenus', revenus, 'bg-brand'], ['Charges', charges, 'bg-red-400'], ['Bénéfice', benefice, 'bg-emerald-500']].map(([label, val, c]) => {
                const max = Math.max(revenus, charges, benefice);
                return (
                  <div key={label} className="flex flex-1 flex-col items-center gap-2">
                    <span className="font-mono text-[12px] font-bold text-ink">{fmtDA(val)}</span>
                    <div className="flex h-32 w-full items-end">
                      <div className={cx('w-full rounded-t-[6px]', c)} style={{ height: `${(val / max) * 100}%` }} />
                    </div>
                    <span className="text-[12px] font-medium text-muted">{label}</span>
                  </div>
                );
              })}
            </div>
          </Panel>
          <Panel title="Charges par catégorie">
            <div className="flex flex-col gap-3 pt-1">
              {byCat.map((c) => (
                <BarRow key={c.cat} label={c.cat} value={c.total} max={maxCat} suffix=" DA" barClass="bg-brand/70" />
              ))}
            </div>
          </Panel>
        </div>
      </div>

      {/* Expense list */}
      <Panel title="Détail des charges" className="mt-3" pad={false} action={<Badge tone="neutral">{expenses.length} lignes</Badge>}>
        <DataTable
          rows={expenses}
          sort={{ key: null }} onSort={() => {}}
          columns={[
            { key: 'cat', label: 'Catégorie', render: (r) => (
              <span className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-ink"><span className="flex h-6 w-6 items-center justify-center rounded-md bg-[rgba(17,0,255,0.06)] text-brand"><Icon name={CAT_ICON[r.cat] || 'Package'} size={13} /></span>{r.cat}</span>
            ) },
            { key: 'libelle', label: 'Libellé', render: (r) => <span className="text-[13px] text-muted">{r.libelle}</span> },
            { key: 'recurrent', label: 'Type', align: 'center', render: (r) => <Badge tone={r.recurrent ? 'info' : 'neutral'}>{r.recurrent ? 'Mensuel' : 'Ponctuel'}</Badge> },
            { key: 'date', label: 'Date', mono: true, nowrap: true, render: (r) => fmtDate(r.date) },
            { key: 'montant', label: 'Montant', align: 'right', mono: true, render: (r) => <span className="font-semibold text-ink">{fmtDA(r.montant)} DA</span> },
          ]}
        />
      </Panel>
      {toast.node}
    </div>
  );
}

/* ---------- 8. Annonces ---------- */
function PageAnnonces() {
  const [history, setHistory] = React.useState(A.annonces);
  const [titre, setTitre] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [canal, setCanal] = React.useState('Les deux');
  const [cible, setCible] = React.useState('Tous');
  const toast = useToast();

  const cibleCount = { 'Tous': 128, 'SOLO': 71, 'CABINET': 42, 'AGENCE': 15 }[cible];
  const send = (e) => {
    e.preventDefault();
    if (!titre.trim() || !message.trim()) return;
    setHistory((h) => [{ titre, canal, cible, dest: cibleCount, date: '2026-06-21' }, ...h]);
    setTitre(''); setMessage('');
    toast.show(`Annonce envoyée à ${cibleCount} destinataires`);
  };

  return (
    <div>
      <PageHead title="Annonces" desc="Diffusez un message à vos cabinets." />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
        <Panel title="Composer une annonce" className="lg:col-span-3">
          <form onSubmit={send} className="flex flex-col gap-3.5">
            <LabeledInput label="Titre" value={titre} onChange={setTitre} placeholder="Ex. Maintenance planifiée dimanche" />
            <label className="block">
              <span className="mb-1.5 block text-[12.5px] font-semibold text-ink">Message</span>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} placeholder="Rédigez votre annonce…"
                className="w-full resize-none rounded-[10px] border border-hair bg-white px-3 py-2.5 text-[13px] text-ink placeholder:text-faint outline-none transition-all focus:border-brand focus:ring-4 focus:ring-[rgba(17,0,255,0.1)]" />
            </label>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <span className="mb-1.5 block text-[12.5px] font-semibold text-ink">Canal</span>
                <Segmented value={canal} onChange={setCanal} options={[{ value: 'In-app', label: 'In-app' }, { value: 'Email', label: 'Email' }, { value: 'Les deux', label: 'Les deux' }]} />
              </div>
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-semibold text-ink">Cible</span>
                <Select value={cible} onChange={setCible} options={[{ value: 'Tous', label: 'Tous les cabinets' }, { value: 'SOLO', label: 'Plan SOLO' }, { value: 'CABINET', label: 'Plan CABINET' }, { value: 'AGENCE', label: 'Plan AGENCE' }]} />
              </label>
            </div>
            <div className="flex items-center justify-between rounded-[10px] bg-mist/60 px-3.5 py-2.5">
              <span className="inline-flex items-center gap-2 text-[12.5px] text-muted"><Icon name="Users" size={14} className="text-brand" /> Destinataires estimés</span>
              <span className="font-mono text-[14px] font-bold text-ink">{cibleCount}</span>
            </div>
            <AdminBtn type="submit" size="lg" icon="Send" className="w-full">Envoyer l'annonce</AdminBtn>
          </form>
        </Panel>

        <Panel title="Historique" className="lg:col-span-2" pad={false}>
          <div className="flex flex-col">
            {history.map((a, i) => (
              <div key={i} className="border-b border-hair/70 px-4 py-3 last:border-0">
                <div className="text-[13px] font-semibold text-ink">{a.titre}</div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <Badge tone="info">{a.canal}</Badge>
                  <Badge tone="neutral">{a.cible}</Badge>
                  <span className="font-mono text-[10.5px] text-faint">{a.dest} dest. · {fmtDate(a.date)}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      {toast.node}
    </div>
  );
}

Object.assign(window, { PageFactures, PageStatsIA, PageRevenus, PageAnnonces });
