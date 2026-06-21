/* ===================== Admin pages — batch 1 ===================== */

/* ---------- 1. Dashboard ---------- */
function PageDashboard() {
  const totalCab = A.planBreakdown.reduce((s, p) => s + p.count, 0);
  const expiring = A.cabinets.filter((c) => { const d = daysUntil(c.expiration); return d > 0 && d < 30; });
  const newThis = A.cabinets.filter((c) => c.inscription >= '2026-06-01');
  return (
    <div>
      <PageHead title="Tableau de bord" desc="Vue d'ensemble de la plateforme Planner — 21 juin 2026.">
        <Segmented value="30j" onChange={() => {}} options={[{ value: '7j', label: '7 j' }, { value: '30j', label: '30 j' }, { value: '12m', label: '12 mois' }]} size="sm" />
      </PageHead>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KPI label="Cabinets inscrits" value={fmtDA(A.kpis.cabinets)} delta={A.kpis.cabinetsDelta} icon="Building2" />
        <KPI label="Abonnements actifs" value={fmtDA(A.kpis.actifs)} delta={A.kpis.actifsDelta} deltaTone="muted" icon="BadgeCheck" />
        <KPI label="MRR" value={fmtDA(A.kpis.mrr)} unit="DA" delta={A.kpis.mrrDelta} icon="TrendingUp" />
        <KPI label="ARR (projeté)" value={fmtDA(A.kpis.arr)} unit="DA" delta={A.kpis.arrDelta} deltaTone="muted" icon="CalendarRange" />
        <KPI label="Utilisateurs totaux" value={fmtDA(A.kpis.users)} delta={A.kpis.usersDelta} icon="Users" />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
        {A.planBreakdown.map((p) => {
          const share = Math.round((p.count / totalCab) * 100);
          return (
            <Panel key={p.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.accent }} />
                  <span className="font-mono text-[12px] font-semibold uppercase tracking-[0.1em] text-ink">{p.name}</span>
                </div>
                <span className="font-mono text-[12px] text-faint">{share}%</span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="font-mono text-[1.6rem] font-bold text-ink">{p.count}</span>
                <span className="font-mono text-[12px] font-semibold text-emerald-600">{fmtDA(p.count * p.price)} DA/mois</span>
              </div>
              <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-mist">
                <div className={cx('h-full rounded-full', p.bar)} style={{ width: `${share}%` }} />
              </div>
            </Panel>
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Panel title="Évolution du MRR" action={<Badge tone="success" dot>+8,4%</Badge>} className="lg:col-span-2">
          <AreaChart data={A.revenueTrend} height={170} />
        </Panel>
        <div className="flex flex-col gap-3">
          <Panel title="Expirations proches" action={<Badge tone="warn">{'< 30 j'}</Badge>}>
            <div className="flex flex-col gap-2.5">
              {expiring.slice(0, 4).map((c) => (
                <div key={c.id} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-semibold text-ink">{c.nom}</div>
                    <div className="font-mono text-[10.5px] text-faint">{c.id}</div>
                  </div>
                  <Badge tone="warn">{daysUntil(c.expiration)} j</Badge>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Nouveaux ce mois">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-[rgba(17,0,255,0.06)] text-brand"><Icon name="Sparkles" size={22} /></span>
              <div>
                <div className="font-mono text-[1.6rem] font-bold text-ink">+{newThis.length}</div>
                <div className="text-[12px] text-muted">cabinets en juin</div>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ---------- 2. Cabinets ---------- */
const PLAN_LABEL = { solo: 'SOLO', cabinet: 'CABINET', agence: 'AGENCE' };
const PLAN_TONE = { solo: 'info', cabinet: 'success', agence: 'violet' };

function PageCabinets() {
  const [rows, setRows] = React.useState(A.cabinets);
  const [q, setQ] = React.useState('');
  const [planF, setPlanF] = React.useState('all');
  const [statusF, setStatusF] = React.useState('all');
  const [extend, setExtend] = React.useState(null);
  const [extendMonths, setExtendMonths] = React.useState(6);
  const [del, setDel] = React.useState(null);
  const [members, setMembers] = React.useState(null);
  const toast = useToast();

  const filtered = rows.filter((c) => {
    if (q && !(`${c.nom} ${c.email}`.toLowerCase().includes(q.toLowerCase()))) return false;
    if (planF !== 'all' && c.plan !== planF) return false;
    if (statusF !== 'all' && (statusF === 'actif') !== c.actif) return false;
    return true;
  });
  const { sorted, sort, toggle } = useTableSort(filtered, { key: 'inscription', dir: 'desc' });

  const changePlan = (id, plan) => { setRows((r) => r.map((c) => c.id === id ? { ...c, plan } : c)); toast.show('Plan mis à jour'); };
  const toggleActive = (id) => { setRows((r) => r.map((c) => c.id === id ? { ...c, actif: !c.actif } : c)); toast.show('Statut modifié'); };
  const doExtend = () => { toast.show(`${extend.nom} prolongé de ${extendMonths} mois`); setExtend(null); };
  const doDelete = () => { setRows((r) => r.filter((c) => c.id !== del.id)); toast.show(`${del.nom} supprimé`, 'danger'); setDel(null); };

  const columns = [
    { key: 'nom', label: 'Cabinet', sortable: true, render: (r) => (
      <div className="min-w-[150px]"><div className="font-semibold text-ink">{r.nom}</div><div className="font-mono text-[10.5px] text-faint">{r.id} · {r.wilaya}</div></div>
    ) },
    { key: 'email', label: 'Email patron', sortable: true, render: (r) => <span className="font-mono text-[12px] text-muted">{r.email}</span> },
    { key: 'plan', label: 'Plan', render: (r) => (
      <select value={r.plan} onChange={(e) => changePlan(r.id, e.target.value)}
        className="h-7 cursor-pointer appearance-none rounded-md border border-hair bg-white px-2 pr-6 font-mono text-[11px] font-semibold text-ink outline-none transition-colors hover:border-brand/40 focus:border-brand"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 fill=%27none%27 stroke=%27%238A8A99%27 stroke-width=%272%27%3E%3Cpath d=%27M3 4.5 6 7.5 9 4.5%27/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center' }}>
        {Object.entries(PLAN_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    ) },
    { key: 'inscription', label: 'Inscription', sortable: true, mono: true, nowrap: true, render: (r) => fmtDate(r.inscription) },
    { key: 'expiration', label: 'Expiration', sortable: true, nowrap: true, render: (r) => {
      const d = daysUntil(r.expiration);
      return <span className="font-mono">{fmtDate(r.expiration)} {d > 0 && d < 30 && <Badge tone="warn">{d}j</Badge>}</span>;
    } },
    { key: 'membres', label: 'Membres', sortable: true, align: 'center', mono: true },
    { key: 'actif', label: 'Statut', align: 'center', render: (r) => <Badge tone={r.actif ? 'success' : 'neutral'} dot>{r.actif ? 'Actif' : 'Inactif'}</Badge> },
    { key: 'actions', label: '', align: 'right', render: (r) => (
      <div className="flex items-center justify-end gap-1">
        <button onClick={() => { setExtend(r); setExtendMonths(6); }} title="Prolonger" className="flex h-7 items-center gap-1 rounded-md px-2 font-mono text-[11px] font-semibold text-brand transition-colors hover:bg-[rgba(17,0,255,0.07)]"><Icon name="CalendarPlus" size={13} /> Prolonger</button>
        <button onClick={() => toggleActive(r.id)} title={r.actif ? 'Désactiver' : 'Activer'} className="flex h-7 w-7 items-center justify-center rounded-md text-faint transition-colors hover:bg-mist hover:text-ink"><Icon name={r.actif ? 'PauseCircle' : 'PlayCircle'} size={15} /></button>
        <button onClick={() => setMembers(r)} title="Membres" className="flex h-7 w-7 items-center justify-center rounded-md text-faint transition-colors hover:bg-mist hover:text-ink"><Icon name="Users" size={15} /></button>
        <button onClick={() => setDel(r)} title="Supprimer" className="flex h-7 w-7 items-center justify-center rounded-md text-faint transition-colors hover:bg-red-50 hover:text-red-500"><Icon name="Trash2" size={15} /></button>
      </div>
    ) },
  ];

  const memberList = members ? (A.membersByCabinet[members.id] || A.defaultMembers) : [];

  return (
    <div>
      <PageHead title="Cabinets" desc={`${rows.length} cabinets · ${rows.filter((c) => c.actif).length} actifs`}>
        <AdminBtn icon="Download" variant="ghost">Exporter</AdminBtn>
        <AdminBtn icon="Plus">Ajouter</AdminBtn>
      </PageHead>

      <Panel pad={false}>
        <div className="flex flex-col gap-2.5 border-b border-hair p-3 sm:flex-row sm:items-center">
          <SearchInput value={q} onChange={setQ} placeholder="Nom ou email…" className="sm:max-w-xs sm:flex-1" />
          <div className="flex gap-2">
            <Select value={planF} onChange={setPlanF} options={[{ value: 'all', label: 'Tous les plans' }, { value: 'solo', label: 'SOLO' }, { value: 'cabinet', label: 'CABINET' }, { value: 'agence', label: 'AGENCE' }]} />
            <Select value={statusF} onChange={setStatusF} options={[{ value: 'all', label: 'Tous statuts' }, { value: 'actif', label: 'Actifs' }, { value: 'inactif', label: 'Inactifs' }]} />
          </div>
        </div>
        <DataTable columns={columns} rows={sorted} sort={sort} onSort={toggle} rowKey="id" />
      </Panel>

      {/* Extend modal */}
      <Modal open={!!extend} onClose={() => setExtend(null)} icon="CalendarPlus" title="Prolonger l'abonnement"
        subtitle={extend ? `${extend.nom} — expiration actuelle ${fmtDate(extend.expiration)}.` : ''}
        footer={<><AdminBtn variant="ghost" onClick={() => setExtend(null)}>Annuler</AdminBtn><AdminBtn onClick={doExtend} icon="Check">Prolonger de {extendMonths} mois</AdminBtn></>}>
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-ink">Durée</span>
            <span className="font-mono text-[13px] font-bold text-brand">{extendMonths} mois</span>
          </div>
          <input type="range" min="1" max="24" value={extendMonths} onChange={(e) => setExtendMonths(+e.target.value)}
            className="mt-3 w-full accent-brand" />
          <div className="mt-1 flex justify-between font-mono text-[10px] text-faint"><span>1</span><span>12</span><span>24</span></div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {[3, 6, 12, 24].map((m) => (
              <button key={m} onClick={() => setExtendMonths(m)} className={cx('rounded-md px-2.5 py-1 font-mono text-[11px] font-semibold transition-colors', extendMonths === m ? 'bg-brand text-white' : 'bg-mist text-muted hover:text-ink')}>{m} mois</button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Delete modal */}
      <Modal open={!!del} onClose={() => setDel(null)} icon="TriangleAlert" iconTone="danger" title="Supprimer le cabinet ?"
        subtitle={del ? `Cette action est irréversible. Toutes les données de ${del.nom} (${del.id}) seront définitivement supprimées.` : ''}
        footer={<><AdminBtn variant="ghost" onClick={() => setDel(null)}>Annuler</AdminBtn><AdminBtn danger onClick={doDelete} icon="Trash2">Supprimer définitivement</AdminBtn></>} />

      {/* Members drawer */}
      <Drawer open={!!members} onClose={() => setMembers(null)} title={members ? members.nom : ''} subtitle={members ? `${memberList.length} membres · ${members.id}` : ''}>
        <div className="flex flex-col gap-2">
          {memberList.map((m) => (
            <div key={m.email} className="flex items-center gap-3 rounded-[12px] border border-hair p-3">
              <span className={cx('flex h-9 w-9 items-center justify-center rounded-full font-mono text-[11px] font-bold', m.patron ? 'bg-brand text-white' : 'bg-mist text-muted')}>
                {m.nom.split(' ').map((x) => x[0]).slice(0, 2).join('')}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2"><span className="truncate text-[13px] font-semibold text-ink">{m.nom}</span>{m.patron && <Badge tone="info">Patron</Badge>}</div>
                <div className="truncate font-mono text-[11px] text-faint">{m.email}</div>
              </div>
              <Badge tone="neutral">{m.role}</Badge>
            </div>
          ))}
        </div>
      </Drawer>

      {toast.node}
    </div>
  );
}

/* ---------- 3. Messages ---------- */
function PageMessages() {
  const [rows, setRows] = React.useState(A.messages);
  const [open, setOpen] = React.useState(null);
  const [reply, setReply] = React.useState('');
  const toast = useToast();
  const unread = rows.filter((m) => !m.lu).length;

  const openMsg = (m) => { setOpen(m); setReply(''); };
  const markRead = (id) => setRows((r) => r.map((m) => m.id === id ? { ...m, lu: true } : m));
  const sendReply = () => { if (!reply.trim()) return; markRead(open.id); toast.show('Réponse envoyée par email'); setReply(''); setOpen(null); };

  const columns = [
    { key: 'nom', label: 'Nom', render: (r) => (
      <div className="flex items-center gap-2.5">
        <span className={cx('h-2 w-2 shrink-0 rounded-full', r.lu ? 'bg-transparent' : 'bg-brand')} />
        <div><div className={cx('text-[13px]', r.lu ? 'font-medium text-muted' : 'font-bold text-ink')}>{r.nom}</div><div className="font-mono text-[10.5px] text-faint">{r.email}</div></div>
      </div>
    ) },
    { key: 'cabinet', label: 'Cabinet', render: (r) => <span className="text-[12.5px] text-muted">{r.cabinet}</span> },
    { key: 'sujet', label: 'Sujet', render: (r) => <span className={cx('text-[13px]', r.lu ? 'text-muted' : 'font-semibold text-ink')}>{r.sujet}</span> },
    { key: 'date', label: 'Date', mono: true, nowrap: true, render: (r) => <span className="text-[11.5px] text-faint">{r.date}</span> },
    { key: 'statut', label: 'Statut', align: 'center', render: (r) => <Badge tone={r.lu ? 'neutral' : 'info'} dot>{r.lu ? 'Lu' : 'Non lu'}</Badge> },
  ];

  return (
    <div>
      <PageHead title="Messages" desc={`Boîte de contact — ${unread} non lus sur ${rows.length}`} />
      <Panel pad={false}>
        <div className="cursor-pointer">
          <DataTable columns={columns.map((c) => ({ ...c, render: (r) => <div onClick={() => openMsg(r)}>{c.render ? c.render(r) : r[c.key]}</div> }))} rows={rows} sort={{ key: null }} onSort={() => {}} rowKey="id" />
        </div>
      </Panel>

      <Drawer open={!!open} onClose={() => setOpen(null)} title={open ? open.sujet : ''} subtitle={open ? `${open.nom} · ${open.cabinet}` : ''} width={480}
        footer={open && (
          <div className="flex flex-col gap-2">
            <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={3} placeholder="Répondre par email…"
              className="w-full resize-none rounded-[12px] border border-hair bg-white px-3 py-2.5 text-[13px] text-ink placeholder:text-faint outline-none transition-all focus:border-brand focus:ring-4 focus:ring-[rgba(17,0,255,0.1)]" />
            <div className="flex items-center justify-between">
              <AdminBtn variant="ghost" size="sm" icon="MailOpen" onClick={() => { markRead(open.id); toast.show('Marqué comme lu'); }}>Marquer comme lu</AdminBtn>
              <AdminBtn icon="Send" onClick={sendReply} disabled={!reply.trim()}>Envoyer</AdminBtn>
            </div>
          </div>
        )}>
        {open && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-mist px-2.5 py-1 font-mono text-[11px] text-muted ring-1 ring-hair"><Icon name="Mail" size={12} /> {open.email}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-mist px-2.5 py-1 font-mono text-[11px] text-muted ring-1 ring-hair"><Icon name="Phone" size={12} /> {open.tel}</span>
            </div>
            <div className="rounded-[12px] border border-hair bg-mist/40 p-4 text-[13.5px] leading-relaxed text-ink/90">{open.corps}</div>
            <div className="font-mono text-[11px] text-faint">Reçu le {open.date}</div>
          </div>
        )}
      </Drawer>
      {toast.node}
    </div>
  );
}

/* ---------- 4. Projets ---------- */
const PHASE_TONE = { Esquisse: 'neutral', APS: 'info', APD: 'info', DCE: 'violet', DET: 'warn', Chantier: 'success' };
function PageProjets() {
  const [q, setQ] = React.useState('');
  const [cabF, setCabF] = React.useState('all');
  const [statF, setStatF] = React.useState('all');
  const cabinets = [...new Set(A.projets.map((p) => p.cabinet))];
  const statuts = [...new Set(A.projets.map((p) => p.statut))];

  const filtered = A.projets.filter((p) => {
    if (q && !`${p.projet} ${p.cabinet}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (cabF !== 'all' && p.cabinet !== cabF) return false;
    if (statF !== 'all' && p.statut !== statF) return false;
    return true;
  });
  const { sorted, sort, toggle } = useTableSort(filtered, { key: 'date', dir: 'desc' });

  const columns = [
    { key: 'cabinet', label: 'Cabinet', sortable: true, render: (r) => <span className="text-[12.5px] font-medium text-muted">{r.cabinet}</span> },
    { key: 'projet', label: 'Projet', sortable: true, render: (r) => <span className="font-semibold text-ink">{r.projet}</span> },
    { key: 'type', label: 'Type', render: (r) => <span className="text-[12.5px] text-muted">{r.type}</span> },
    { key: 'statut', label: 'Statut', align: 'center', render: (r) => <Badge tone={PHASE_TONE[r.statut] || 'neutral'}>{r.statut}</Badge> },
    { key: 'date', label: 'Création', sortable: true, mono: true, nowrap: true, render: (r) => fmtDate(r.date) },
    { key: 'honoraires', label: 'Honoraires', sortable: true, align: 'right', mono: true, render: (r) => `${fmtDA(r.honoraires)} DA` },
  ];

  return (
    <div>
      <PageHead title="Projets" desc={`${A.projets.length} projets tous cabinets confondus · lecture seule`} />
      <Panel pad={false}>
        <div className="flex flex-col gap-2.5 border-b border-hair p-3 sm:flex-row sm:items-center">
          <SearchInput value={q} onChange={setQ} placeholder="Projet ou cabinet…" className="sm:max-w-xs sm:flex-1" />
          <div className="flex gap-2">
            <Select value={cabF} onChange={setCabF} options={[{ value: 'all', label: 'Tous cabinets' }, ...cabinets.map((c) => ({ value: c, label: c }))]} />
            <Select value={statF} onChange={setStatF} options={[{ value: 'all', label: 'Tous statuts' }, ...statuts.map((s) => ({ value: s, label: s }))]} />
          </div>
        </div>
        <DataTable columns={columns} rows={sorted} sort={sort} onSort={toggle} />
      </Panel>
    </div>
  );
}

Object.assign(window, { PageDashboard, PageCabinets, PageMessages, PageProjets, PLAN_LABEL, PLAN_TONE });
