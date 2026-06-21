import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../api/axios'
import {
  cx, Icon, fmtDate, Badge, KPI, Panel, PageHead, AdminBtn,
  SearchInput, Select, LabeledInput, Switch, DataTable, Drawer, useToast,
} from './_ui'

function Loading() {
  return <div className="py-16 text-center font-mono text-[12px] text-faint">Chargement…</div>
}

/* ---------- 9. Erreurs système ---------- */
const ERR_TONE = { Error: 'danger', Warning: 'warn', Info: 'info' }
export function PageErreurs() {
  const { data: erreurs = [], isLoading } = useQuery({
    queryKey: ['admin-erreurs'],
    queryFn: () => api.get('/superadmin/erreurs/').then(r => r.data),
  })
  const [levelF, setLevelF] = React.useState('all')
  const [open, setOpen] = React.useState(null)
  const filtered = erreurs.filter((e) => levelF === 'all' || e.niveau === levelF)
  const counts = { Error: erreurs.filter((e) => e.niveau === 'Error').length, Warning: erreurs.filter((e) => e.niveau === 'Warning').length, Info: erreurs.filter((e) => e.niveau === 'Info').length }

  const columns = [
    { key: 'niveau', label: 'Niveau', render: (r) => <Badge tone={ERR_TONE[r.niveau]} dot>{r.niveau}</Badge> },
    { key: 'message', label: 'Message', render: (r) => <button onClick={() => setOpen(r)} className="text-left text-[13px] font-semibold text-ink hover:text-brand">{r.message}</button> },
    { key: 'source', label: 'Source', mono: true, render: (r) => <span className="text-[12px] text-muted">{r.source}</span> },
    { key: 'date', label: 'Date', mono: true, nowrap: true, render: (r) => <span className="text-[11.5px] text-faint">{r.date}</span> },
    { key: 'occ', label: 'Occ.', align: 'center', mono: true, render: (r) => <Badge tone={r.occ > 5 ? 'danger' : 'neutral'}>{r.occ}×</Badge> },
  ]

  return (
    <div>
      <PageHead title="Erreurs système" desc="Journal des incidents techniques de la plateforme." />
      <div className="mb-3 grid grid-cols-3 gap-3">
        <KPI label="Erreurs" value={counts.Error} delta="total" deltaTone="brand" icon="CircleX" />
        <KPI label="Avertissements" value={counts.Warning} delta="total" deltaTone="muted" icon="TriangleAlert" />
        <KPI label="Infos" value={counts.Info} delta="total" deltaTone="muted" icon="Info" />
      </div>
      <Panel pad={false}>
        <div className="flex items-center gap-2 border-b border-hair p-3">
          <Select value={levelF} onChange={setLevelF} options={[{ value: 'all', label: 'Tous niveaux' }, { value: 'Error', label: 'Error' }, { value: 'Warning', label: 'Warning' }, { value: 'Info', label: 'Info' }]} className="max-w-[180px]" />
        </div>
        {isLoading ? <Loading /> : <DataTable columns={columns} rows={filtered} sort={{ key: null }} onSort={() => {}} rowKey="id" empty="Aucune erreur enregistrée. 🎉" />}
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
          </div>
        )}
      </Drawer>
    </div>
  )
}

/* ---------- 10. Logs d'activité ---------- */
export function PageLogs() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['admin-logs'],
    queryFn: () => api.get('/superadmin/logs/').then(r => r.data),
  })
  const [q, setQ] = React.useState('')
  const filtered = logs.filter((l) => !q || `${l.user} ${l.action} ${l.cible}`.toLowerCase().includes(q.toLowerCase()))
  const isAdmin = (u) => (u || '').includes('admin') || (u || '').includes('super')

  return (
    <div>
      <PageHead title="Logs d'activité" desc="Piste d'audit des actions sur la plateforme." />
      <Panel pad={false}>
        <div className="flex flex-col gap-2.5 border-b border-hair p-3 sm:flex-row sm:items-center">
          <SearchInput value={q} onChange={setQ} placeholder="Utilisateur, action ou cible…" className="sm:max-w-sm sm:flex-1" />
          <Select value="7j" onChange={() => {}} options={[{ value: '24h', label: 'Dernières 24h' }, { value: '7j', label: '7 derniers jours' }, { value: '30j', label: '30 derniers jours' }]} />
        </div>
        {isLoading ? <Loading /> : (
          <div className="divide-y divide-hair/70">
            {filtered.length === 0 && <div className="px-4 py-6 text-[12.5px] text-faint">Aucune activité.</div>}
            {filtered.map((l, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-mist/50">
                <span className={cx('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full', isAdmin(l.user) ? 'bg-brand text-white' : 'bg-mist text-muted')}>
                  <Icon name={isAdmin(l.user) ? 'ShieldCheck' : 'User'} size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] text-ink">
                    <span className="font-mono font-semibold">{l.user}</span>
                    <span className="text-muted"> {(l.action || '').toLowerCase()} </span>
                    <span className="font-semibold">{l.cible}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 font-mono text-[10.5px] text-faint">
                    <span>{l.date}</span><span>·</span><span className="inline-flex items-center gap-1"><Icon name="MapPin" size={10} /> {l.ip}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}

/* ---------- 11. Plans & tarifs ---------- */
export function PagePlans() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['admin-plans'], queryFn: () => api.get('/superadmin/plans/').then(r => r.data) })
  const [plans, setPlans] = React.useState([])
  const [newFeat, setNewFeat] = React.useState({})
  const toast = useToast()
  React.useEffect(() => { if (data) setPlans(data) }, [data])

  const save = useMutation({
    mutationFn: () => api.put('/superadmin/plans/', plans.map((p) => ({ code: p.code, prix: p.prix, annuel: p.annuel, populaire: p.populaire, features: p.features }))),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-plans'] }); toast.show('Plans enregistrés') },
  })

  const upd = (code, patch) => setPlans((p) => p.map((x) => x.code === code ? { ...x, ...patch } : x))
  const setPopular = (code) => setPlans((p) => p.map((x) => ({ ...x, populaire: x.code === code })))
  const addFeat = (code) => { const v = (newFeat[code] || '').trim(); if (!v) return; upd(code, { features: [...plans.find((x) => x.code === code).features, v] }); setNewFeat((n) => ({ ...n, [code]: '' })) }
  const rmFeat = (code, idx) => upd(code, { features: plans.find((x) => x.code === code).features.filter((_, i) => i !== idx) })

  return (
    <div>
      <PageHead title="Plans & tarifs" desc="Configurez les formules proposées aux cabinets.">
        <AdminBtn icon="Save" onClick={() => save.mutate()} disabled={save.isPending}>Enregistrer</AdminBtn>
      </PageHead>
      {isLoading ? <Loading /> : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {plans.map((p) => (
            <div key={p.code} className={cx('rounded-[14px] border bg-white p-5 transition-shadow', p.populaire ? 'border-brand ring-1 ring-brand/30' : 'border-hair')}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[13px] font-bold uppercase tracking-[0.12em] text-brand">{p.name}</span>
                <label className="flex items-center gap-2">
                  <span className="font-mono text-[10.5px] text-faint">Populaire</span>
                  <Switch checked={p.populaire} onChange={() => setPopular(p.code)} label="Populaire" />
                </label>
              </div>

              <div className="mt-4 flex flex-col gap-3">
                <label className="block">
                  <span className="mb-1 block font-mono text-[10.5px] uppercase tracking-[0.08em] text-faint">Prix mensuel (DA)</span>
                  <div className="flex items-center rounded-[10px] border border-hair px-3 focus-within:border-brand focus-within:ring-4 focus-within:ring-[rgba(17,0,255,0.1)]">
                    <input type="number" value={p.prix} onChange={(e) => upd(p.code, { prix: +e.target.value })} className="h-9 w-full bg-transparent font-mono text-[14px] font-bold text-ink outline-none" />
                    <span className="font-mono text-[11px] text-faint">/mois</span>
                  </div>
                </label>
                <label className="block">
                  <span className="mb-1 block font-mono text-[10.5px] uppercase tracking-[0.08em] text-faint">Prix annuel (DA)</span>
                  <div className="flex items-center rounded-[10px] border border-hair px-3 focus-within:border-brand focus-within:ring-4 focus-within:ring-[rgba(17,0,255,0.1)]">
                    <input type="number" value={p.annuel} onChange={(e) => upd(p.code, { annuel: +e.target.value })} className="h-9 w-full bg-transparent font-mono text-[14px] font-bold text-ink outline-none" />
                    <span className="font-mono text-[11px] text-faint">/an</span>
                  </div>
                </label>
              </div>

              <div className="mt-4">
                <div className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.08em] text-faint">Fonctionnalités</div>
                <div className="flex flex-col gap-1.5">
                  {(p.features || []).map((f, i) => (
                    <div key={i} className="group flex items-center gap-2 rounded-lg bg-mist/60 px-2.5 py-1.5">
                      <Icon name="Check" size={13} className="shrink-0 text-brand" />
                      <span className="flex-1 text-[12.5px] text-ink">{f}</span>
                      <button onClick={() => rmFeat(p.code, i)} className="text-faint opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100" aria-label="Retirer"><Icon name="X" size={13} /></button>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex gap-1.5">
                  <input value={newFeat[p.code] || ''} onChange={(e) => setNewFeat((n) => ({ ...n, [p.code]: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFeat(p.code) } }} placeholder="Ajouter…"
                    className="h-8 w-full rounded-lg border border-hair bg-white px-2.5 text-[12.5px] outline-none focus:border-brand" />
                  <button onClick={() => addFeat(p.code)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgba(17,0,255,0.06)] text-brand transition-colors hover:bg-[rgba(17,0,255,0.12)]"><Icon name="Plus" size={15} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {toast.node}
    </div>
  )
}

/* ---------- 12. Limites par plan ---------- */
export function PageLimites() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['admin-limites'], queryFn: () => api.get('/superadmin/limites/').then(r => r.data) })
  const [limits, setLimits] = React.useState([])
  const toast = useToast()
  React.useEffect(() => { if (data) setLimits(data) }, [data])

  const save = useMutation({
    mutationFn: () => api.put('/superadmin/limites/', limits),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-limites'] }); toast.show('Limites enregistrées') },
  })
  const upd = (code, patch) => setLimits((l) => l.map((x) => x.code === code ? { ...x, ...patch } : x))
  const featCols = [['planning', 'Planning équipe'], ['soustraitants', 'Sous-traitants'], ['exportCompta', 'Export comptable'], ['ia', 'Assistant IA']]

  return (
    <div>
      <PageHead title="Limites par plan" desc="Quotas et fonctionnalités activées pour chaque formule.">
        <AdminBtn icon="Save" onClick={() => save.mutate()} disabled={save.isPending}>Enregistrer</AdminBtn>
      </PageHead>
      <Panel pad={false}>
        {isLoading ? <Loading /> : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-hair">
                  <th className="px-4 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-faint">Paramètre</th>
                  {limits.map((l) => (
                    <th key={l.code} className="px-4 py-3 text-center font-mono text-[12px] font-bold uppercase tracking-[0.1em] text-brand">{l.plan}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[['Projets max', 'projets'], ['Utilisateurs max', 'users'], ['Stockage (GB)', 'stockage']].map(([label, key]) => (
                  <tr key={key} className="border-b border-hair/70">
                    <td className="px-4 py-3 text-[13px] font-medium text-ink">{label}</td>
                    {limits.map((l) => (
                      <td key={l.code} className="px-4 py-3 text-center">
                        <input type="number" value={l[key]} onChange={(e) => upd(l.code, { [key]: +e.target.value })}
                          className="mx-auto h-8 w-20 rounded-lg border border-hair bg-white text-center font-mono text-[13px] font-semibold text-ink outline-none focus:border-brand focus:ring-2 focus:ring-[rgba(17,0,255,0.12)]" />
                      </td>
                    ))}
                  </tr>
                ))}
                {featCols.map(([key, label]) => (
                  <tr key={key} className="border-b border-hair/70 last:border-0">
                    <td className="px-4 py-3 text-[13px] font-medium text-ink">{label}</td>
                    {limits.map((l) => (
                      <td key={l.code} className="px-4 py-3">
                        <div className="flex justify-center"><Switch checked={l[key]} onChange={(v) => upd(l.code, { [key]: v })} label={`${label} ${l.plan}`} /></div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <p className="mt-2 px-1 font-mono text-[10.5px] text-faint">Projets max : 0 ou négatif = illimité.</p>
      {toast.node}
    </div>
  )
}

/* ---------- 13. Paramètres généraux ---------- */
export function PageParametres() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['admin-parametres'], queryFn: () => api.get('/superadmin/parametres/').then(r => r.data) })
  const [s, setS] = React.useState(null)
  const toast = useToast()
  React.useEffect(() => { if (data) setS(data) }, [data])

  const save = useMutation({
    mutationFn: () => api.put('/superadmin/parametres/', s),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-parametres'] }); toast.show('Paramètres enregistrés') },
  })

  if (isLoading || !s) return (<div><PageHead title="Paramètres généraux" desc="Configuration globale de la plateforme." /><Loading /></div>)

  return (
    <div>
      <PageHead title="Paramètres généraux" desc="Configuration globale de la plateforme.">
        <AdminBtn icon="Save" onClick={() => save.mutate()} disabled={save.isPending}>Enregistrer</AdminBtn>
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
              <Switch checked={s.maintenance} onChange={(v) => setS({ ...s, maintenance: v })} label="Maintenance" />
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
  )
}
