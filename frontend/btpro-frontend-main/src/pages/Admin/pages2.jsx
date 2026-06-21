import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../api/axios'
import {
  cx, Icon, fmtDA, fmtDate, Badge, KPI, Panel, PageHead, AdminBtn,
  SearchInput, Select, LabeledInput, Switch, Segmented, useTableSort, DataTable, AreaChart, BarRow, useToast,
} from './_ui'

function Loading() {
  return <div className="py-16 text-center font-mono text-[12px] text-faint">Chargement…</div>
}

/* ---------- 5. Factures ---------- */
const INV_TONE = { 'Payée': 'success', 'Soldée': 'success', 'Émise': 'warn', 'Envoyée': 'warn', 'En attente': 'warn', 'Partiellement payée': 'info', 'Impayée': 'danger', 'Annulée': 'neutral', 'Brouillon': 'neutral' }
export function PageFactures() {
  const { data: factures = [], isLoading } = useQuery({
    queryKey: ['admin-factures'],
    queryFn: () => api.get('/superadmin/factures/').then(r => r.data),
  })
  const [q, setQ] = React.useState('')
  const [statF, setStatF] = React.useState('all')
  const total = factures.reduce((s, f) => s + f.montant, 0)
  const encaisse = factures.filter((f) => f.statut === 'Soldée' || f.statut === 'Payée').reduce((s, f) => s + f.montant, 0)
  const impaye = factures.filter((f) => f.statut === 'Impayée').reduce((s, f) => s + f.montant, 0)
  const statuts = [...new Set(factures.map((f) => f.statut))]

  const filtered = factures.filter((f) => {
    if (q && !`${f.num} ${f.cabinet} ${f.client}`.toLowerCase().includes(q.toLowerCase())) return false
    if (statF !== 'all' && f.statut !== statF) return false
    return true
  })
  const { sorted, sort, toggle } = useTableSort(filtered, { key: 'echeance', dir: 'desc' })

  const columns = [
    { key: 'num', label: 'Numéro', sortable: true, mono: true, render: (r) => <span className="font-semibold text-ink">{r.num}</span> },
    { key: 'cabinet', label: 'Cabinet', sortable: true, render: (r) => <span className="text-[12.5px] text-muted">{r.cabinet}</span> },
    { key: 'client', label: 'Client', render: (r) => <span className="text-[12.5px] text-ink">{r.client}</span> },
    { key: 'montant', label: 'Montant TTC', sortable: true, align: 'right', mono: true, render: (r) => `${fmtDA(r.montant)} DA` },
    { key: 'statut', label: 'Statut', align: 'center', render: (r) => <Badge tone={INV_TONE[r.statut] || 'neutral'} dot>{r.statut}</Badge> },
    { key: 'echeance', label: 'Échéance', sortable: true, mono: true, nowrap: true, render: (r) => fmtDate(r.echeance) },
  ]

  return (
    <div>
      <PageHead title="Factures" desc={`${factures.length} factures tous cabinets · lecture seule`} />
      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KPI label="Total facturé" value={fmtDA(total)} unit="DA" icon="Receipt" deltaTone="muted" />
        <KPI label="Encaissé" value={fmtDA(encaisse)} unit="DA" delta={total ? `${Math.round((encaisse / total) * 100)}%` : '0%'} icon="CircleCheck" />
        <KPI label="Impayé" value={fmtDA(impaye)} unit="DA" delta="à relancer" deltaTone="brand" icon="CircleAlert" />
      </div>
      <Panel pad={false}>
        <div className="flex flex-col gap-2.5 border-b border-hair p-3 sm:flex-row sm:items-center">
          <SearchInput value={q} onChange={setQ} placeholder="Numéro, cabinet ou client…" className="sm:max-w-xs sm:flex-1" />
          <Select value={statF} onChange={setStatF} options={[{ value: 'all', label: 'Tous statuts' }, ...statuts.map((s) => ({ value: s, label: s }))]} />
        </div>
        {isLoading ? <Loading /> : <DataTable columns={columns} rows={sorted} sort={sort} onSort={toggle} rowKey="num" empty="Aucune facture." />}
      </Panel>
    </div>
  )
}

/* ---------- 6. Statistiques IA ---------- */
const IA_ACCENTS = ['bg-brand', 'bg-emerald-500', 'bg-violet-500']
export function PageStatsIA() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-ia-stats'],
    queryFn: () => api.get('/superadmin/ia-stats/').then(r => r.data),
  })
  if (isLoading || !data) return (<div><PageHead title="Statistiques IA" desc="Utilisation des assistants IA sur la plateforme." /><Loading /></div>)

  const tools = (data.tools || []).map((t, i) => ({ ...t, accent: IA_ACCENTS[i % IA_ACCENTS.length] }))
  const topCabinets = data.topCabinets || []
  const maxTool = Math.max(1, ...tools.map((t) => t.value))
  const maxCab = Math.max(1, ...topCabinets.map((c) => c.value))

  return (
    <div>
      <PageHead title="Statistiques IA" desc="Utilisation des assistants IA sur la plateforme." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KPI label="Requêtes totales" value={fmtDA(data.total)} icon="Sparkles" deltaTone="muted" />
        {tools.map((t) => (
          <KPI key={t.name} label={t.name} value={fmtDA(t.value)} delta={data.total ? `${Math.round((t.value / data.total) * 100)}%` : '0%'} deltaTone="muted" icon="Bot" />
        ))}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel title="Requêtes par outil">
          <div className="flex flex-col gap-4 pt-1">
            {tools.map((t) => <BarRow key={t.name} label={t.name} value={t.value} max={maxTool} barClass={t.accent} />)}
          </div>
        </Panel>
        <Panel title="Top cabinets par usage">
          <div className="flex flex-col gap-4 pt-1">
            {topCabinets.length === 0 && <div className="text-[12.5px] text-faint">Aucune utilisation enregistrée.</div>}
            {topCabinets.map((c, i) => (
              <div key={c.nom + i} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mist font-mono text-[11px] font-bold text-muted">{i + 1}</span>
                <div className="min-w-0 flex-1"><BarRow label={c.nom} value={c.value} max={maxCab} suffix=" req." /></div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Évolution de l'usage (12 mois)" className="mt-3">
        <AreaChart data={(data.overTime || []).map((v) => ({ v }))} height={170} />
      </Panel>
    </div>
  )
}

/* ---------- 7. Revenus & Charges ---------- */
const CAT_ICON = { 'Hébergement': 'Server', 'Email/Resend': 'Mail', 'Cloudflare R2': 'Cloud', 'Domaine': 'Globe', 'Salaires': 'Users', 'Marketing': 'Megaphone', 'Autre': 'Package' }
const EXPENSE_CATS = ['Hébergement', 'Email/Resend', 'Cloudflare R2', 'Domaine', 'Salaires', 'Marketing', 'Autre']
export function PageRevenus() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['admin-charges'],
    queryFn: () => api.get('/superadmin/charges-plateforme/').then(r => r.data),
  })
  const [form, setForm] = React.useState({ cat: 'Hébergement', libelle: '', montant: '', recurrent: true })
  const toast = useToast()

  const addExpense = useMutation({
    mutationFn: (body) => api.post('/superadmin/charges-plateforme/', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-charges'] }); setForm({ cat: 'Hébergement', libelle: '', montant: '', recurrent: true }); toast.show('Charge ajoutée') },
  })

  const submit = (e) => {
    e.preventDefault()
    if (!form.libelle.trim() || !form.montant) return
    addExpense.mutate({ categorie: form.cat, libelle: form.libelle, montant: +form.montant, recurrent: form.recurrent })
  }

  if (isLoading || !data) return (<div><PageHead title="Revenus & Charges" desc="Compte de résultat de la plateforme Planner." /><Loading /></div>)

  const { revenus, charges, benefice, marge } = data
  const byCat = (data.par_categorie || [])
  const maxCat = Math.max(1, ...byCat.map((c) => c.total))
  const liste = data.liste || []

  return (
    <div>
      <PageHead title="Revenus & Charges" desc="Compte de résultat de la plateforme Planner." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KPI label="Revenus (MRR)" value={fmtDA(revenus)} unit="DA" delta="abonnements" deltaTone="muted" icon="TrendingUp" />
        <KPI label="Charges totales" value={fmtDA(charges)} unit="DA" delta="mensuelles" deltaTone="brand" icon="TrendingDown" />
        <KPI label="Bénéfice net" value={fmtDA(benefice)} unit="DA" delta={`marge ${marge}%`} icon="Wallet" />
        <KPI label="Marge nette" value={marge} unit="%" icon="Percent" deltaTone="muted" />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-5">
        <Panel title="Ajouter une charge" className="lg:col-span-2">
          <form onSubmit={submit} className="flex flex-col gap-3">
            <label className="block">
              <span className="mb-1.5 block text-[12.5px] font-semibold text-ink">Catégorie</span>
              <Select value={form.cat} onChange={(v) => setForm({ ...form, cat: v })} options={EXPENSE_CATS.map((c) => ({ value: c, label: c }))} />
            </label>
            <LabeledInput label="Libellé" value={form.libelle} onChange={(v) => setForm({ ...form, libelle: v })} placeholder="Ex. Serveurs applicatifs" />
            <LabeledInput label="Montant (DA)" type="number" mono value={form.montant} onChange={(v) => setForm({ ...form, montant: v })} placeholder="0" />
            <div className="flex items-center justify-between rounded-[10px] bg-mist/60 px-3 py-2.5">
              <span className="text-[12.5px] font-medium text-ink">Récurrent (mensuel)</span>
              <Switch checked={form.recurrent} onChange={(v) => setForm({ ...form, recurrent: v })} label="Récurrent" />
            </div>
            <AdminBtn type="submit" size="lg" icon="Plus" className="w-full" disabled={addExpense.isPending}>Ajouter la charge</AdminBtn>
          </form>
        </Panel>

        <div className="flex flex-col gap-3 lg:col-span-3">
          <Panel title="Revenus vs Charges">
            <div className="flex items-end gap-6 px-2 pt-2">
              {[['Revenus', revenus, 'bg-brand'], ['Charges', charges, 'bg-red-400'], ['Bénéfice', benefice, 'bg-emerald-500']].map(([label, val, c]) => {
                const max = Math.max(1, revenus, charges, benefice)
                return (
                  <div key={label} className="flex flex-1 flex-col items-center gap-2">
                    <span className="font-mono text-[12px] font-bold text-ink">{fmtDA(val)}</span>
                    <div className="flex h-32 w-full items-end">
                      <div className={cx('w-full rounded-t-[6px]', c)} style={{ height: `${Math.max(0, (val / max) * 100)}%` }} />
                    </div>
                    <span className="text-[12px] font-medium text-muted">{label}</span>
                  </div>
                )
              })}
            </div>
          </Panel>
          <Panel title="Charges par catégorie">
            <div className="flex flex-col gap-3 pt-1">
              {byCat.length === 0 && <div className="text-[12.5px] text-faint">Aucune charge enregistrée.</div>}
              {byCat.map((c) => <BarRow key={c.categorie} label={c.categorie} value={c.total} max={maxCat} suffix=" DA" barClass="bg-brand/70" />)}
            </div>
          </Panel>
        </div>
      </div>

      <Panel title="Détail des charges" className="mt-3" pad={false} action={<Badge tone="neutral">{liste.length} lignes</Badge>}>
        <DataTable
          rows={liste}
          sort={{ key: null }} onSort={() => {}}
          rowKey="id"
          empty="Aucune charge."
          columns={[
            { key: 'categorie_label', label: 'Catégorie', render: (r) => (
              <span className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-ink"><span className="flex h-6 w-6 items-center justify-center rounded-md bg-[rgba(17,0,255,0.06)] text-brand"><Icon name={CAT_ICON[r.categorie_label] || 'Package'} size={13} /></span>{r.categorie_label}</span>
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
  )
}

/* ---------- 8. Annonces ---------- */
export function PageAnnonces() {
  const qc = useQueryClient()
  const { data: history = [] } = useQuery({
    queryKey: ['admin-annonces'],
    queryFn: () => api.get('/superadmin/annonces/').then(r => r.data),
  })
  const [titre, setTitre] = React.useState('')
  const [message, setMessage] = React.useState('')
  const [canal, setCanal] = React.useState('Les deux')
  const [cible, setCible] = React.useState('Tous')
  const toast = useToast()

  const send = useMutation({
    mutationFn: (body) => api.post('/superadmin/annonces/', body).then(r => r.data),
    onSuccess: (res) => { qc.invalidateQueries({ queryKey: ['admin-annonces'] }); setTitre(''); setMessage(''); toast.show(`Annonce envoyée à ${res.dest} destinataires`) },
  })

  const submit = (e) => {
    e.preventDefault()
    if (!titre.trim() || !message.trim()) return
    send.mutate({ titre, message, canal, cible })
  }

  return (
    <div>
      <PageHead title="Annonces" desc="Diffusez un message à vos cabinets." />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
        <Panel title="Composer une annonce" className="lg:col-span-3">
          <form onSubmit={submit} className="flex flex-col gap-3.5">
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
            <AdminBtn type="submit" size="lg" icon="Send" className="w-full" disabled={send.isPending}>Envoyer l'annonce</AdminBtn>
          </form>
        </Panel>

        <Panel title="Historique" className="lg:col-span-2" pad={false}>
          <div className="flex flex-col">
            {history.length === 0 && <div className="px-4 py-6 text-[12.5px] text-faint">Aucune annonce envoyée.</div>}
            {history.map((a) => (
              <div key={a.id} className="border-b border-hair/70 px-4 py-3 last:border-0">
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
  )
}
