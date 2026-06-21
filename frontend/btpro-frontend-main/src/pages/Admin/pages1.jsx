import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../api/axios'
import {
  cx, Icon, fmtDA, fmtDate, daysUntil, Badge, KPI, Panel, PageHead, AdminBtn,
  SearchInput, Select, Segmented, useTableSort, DataTable, Modal, Drawer, AreaChart, useToast,
} from './_ui'

function Loading() {
  return <div className="py-16 text-center font-mono text-[12px] text-faint">Chargement…</div>
}

/* ---------- 1. Dashboard ---------- */
export function PageDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/superadmin/dashboard/').then(r => r.data),
  })
  if (isLoading || !data) return (<div><PageHead title="Tableau de bord" desc="Vue d'ensemble de la plateforme Planner." /><Loading /></div>)

  const stats = data.stats
  const breakdown = data.plan_breakdown || []
  const totalCab = breakdown.reduce((s, p) => s + p.count, 0) || 1
  const cabinets = data.cabinets || []
  const expiring = cabinets.filter((c) => c.expiration_proche)
  const pctActifs = stats.total_cabinets ? Math.round((stats.cabinets_actifs / stats.total_cabinets) * 100) : 0

  return (
    <div>
      <PageHead title="Tableau de bord" desc="Vue d'ensemble de la plateforme Planner.">
        <Segmented value="30j" onChange={() => {}} options={[{ value: '7j', label: '7 j' }, { value: '30j', label: '30 j' }, { value: '12m', label: '12 mois' }]} size="sm" />
      </PageHead>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KPI label="Cabinets inscrits" value={fmtDA(stats.total_cabinets)} delta={`+${stats.nouveaux_mois} ce mois`} icon="Building2" />
        <KPI label="Abonnements actifs" value={fmtDA(stats.cabinets_actifs)} delta={`${pctActifs}% du parc`} deltaTone="muted" icon="BadgeCheck" />
        <KPI label="MRR" value={fmtDA(stats.ca_mensuel)} unit="DA" delta="mensuel" deltaTone="muted" icon="TrendingUp" />
        <KPI label="ARR (projeté)" value={fmtDA(stats.arr)} unit="DA" delta="projeté" deltaTone="muted" icon="CalendarRange" />
        <KPI label="Utilisateurs totaux" value={fmtDA(stats.total_utilisateurs)} icon="Users" />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
        {breakdown.map((p) => {
          const share = Math.round((p.count / totalCab) * 100)
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
          )
        })}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Panel title="Évolution du MRR" className="lg:col-span-2">
          <AreaChart data={data.revenue_trend || []} height={170} />
        </Panel>
        <div className="flex flex-col gap-3">
          <Panel title="Expirations proches" action={<Badge tone="warn">{'< 30 j'}</Badge>}>
            <div className="flex flex-col gap-2.5">
              {expiring.length === 0 && <div className="text-[12.5px] text-faint">Aucune expiration proche.</div>}
              {expiring.slice(0, 4).map((c) => (
                <div key={c.id} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-semibold text-ink">{c.nom}</div>
                    <div className="font-mono text-[10.5px] text-faint">#{c.id}</div>
                  </div>
                  <Badge tone="warn">{daysUntil(c.date_fin)} j</Badge>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Nouveaux ce mois">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-[rgba(17,0,255,0.06)] text-brand"><Icon name="Sparkles" size={22} /></span>
              <div>
                <div className="font-mono text-[1.6rem] font-bold text-ink">+{stats.nouveaux_mois}</div>
                <div className="text-[12px] text-muted">cabinets ce mois</div>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}

/* ---------- 2. Cabinets ---------- */
const PLAN_LABEL = { SOLO: 'SOLO', CABINET: 'CABINET', AGENCE: 'AGENCE' }

export function PageCabinets() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/superadmin/dashboard/').then(r => r.data),
  })
  const rows = data?.cabinets || []

  const [q, setQ] = React.useState('')
  const [planF, setPlanF] = React.useState('all')
  const [statusF, setStatusF] = React.useState('all')
  const [extend, setExtend] = React.useState(null)
  const [extendMonths, setExtendMonths] = React.useState(6)
  const [del, setDel] = React.useState(null)
  const [members, setMembers] = React.useState(null)
  const toast = useToast()

  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-dashboard'] })
  const changePlan = useMutation({ mutationFn: ({ id, plan }) => api.put(`/superadmin/cabinets/${id}/plan/`, { plan }), onSuccess: () => { refresh(); toast.show('Plan mis à jour') } })
  const toggleActive = useMutation({ mutationFn: (id) => api.patch(`/superadmin/cabinets/${id}/toggle/`), onSuccess: () => { refresh(); toast.show('Statut modifié') } })
  const prolonger = useMutation({ mutationFn: ({ id, mois }) => api.post(`/superadmin/cabinets/${id}/prolonger/`, { mois }), onSuccess: () => { refresh(); toast.show(`Prolongé de ${extendMonths} mois`); setExtend(null) } })
  const supprimer = useMutation({ mutationFn: (id) => api.delete(`/superadmin/cabinets/${id}/delete/`), onSuccess: () => { refresh(); toast.show('Cabinet supprimé', 'danger'); setDel(null) } })

  const { data: memberList = [] } = useQuery({
    queryKey: ['admin-membres', members?.id],
    queryFn: () => api.get(`/superadmin/cabinets/${members.id}/membres/`).then(r => r.data),
    enabled: !!members,
  })

  const filtered = rows.filter((c) => {
    if (q && !(`${c.nom} ${c.email}`.toLowerCase().includes(q.toLowerCase()))) return false
    if (planF !== 'all' && c.plan !== planF) return false
    if (statusF !== 'all' && (statusF === 'actif') !== c.actif) return false
    return true
  })
  const { sorted, sort, toggle } = useTableSort(filtered, { key: 'date_creation', dir: 'desc' })

  const columns = [
    { key: 'nom', label: 'Cabinet', sortable: true, render: (r) => (
      <div className="min-w-[150px]"><div className="font-semibold text-ink">{r.nom}</div><div className="font-mono text-[10.5px] text-faint">#{r.id}{r.wilaya ? ` · ${r.wilaya}` : ''}</div></div>
    ) },
    { key: 'email', label: 'Email patron', sortable: true, render: (r) => <span className="font-mono text-[12px] text-muted">{r.email || r.patron_email}</span> },
    { key: 'plan', label: 'Plan', render: (r) => (
      <select value={r.plan} onChange={(e) => changePlan.mutate({ id: r.id, plan: e.target.value })}
        className="h-7 cursor-pointer appearance-none rounded-md border border-hair bg-white px-2 pr-6 font-mono text-[11px] font-semibold text-ink outline-none transition-colors hover:border-brand/40 focus:border-brand"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 fill=%27none%27 stroke=%27%238A8A99%27 stroke-width=%272%27%3E%3Cpath d=%27M3 4.5 6 7.5 9 4.5%27/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center' }}>
        {Object.entries(PLAN_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    ) },
    { key: 'date_creation', label: 'Inscription', sortable: true, mono: true, nowrap: true, render: (r) => fmtDate(r.date_creation) },
    { key: 'date_fin', label: 'Expiration', sortable: true, nowrap: true, render: (r) => {
      const d = r.date_fin ? daysUntil(r.date_fin) : null
      return <span className="font-mono">{fmtDate(r.date_fin)} {d !== null && d > 0 && d < 30 && <Badge tone="warn">{d}j</Badge>}</span>
    } },
    { key: 'nb_utilisateurs', label: 'Membres', sortable: true, align: 'center', mono: true },
    { key: 'actif', label: 'Statut', align: 'center', render: (r) => <Badge tone={r.actif ? 'success' : 'neutral'} dot>{r.actif ? 'Actif' : 'Inactif'}</Badge> },
    { key: 'actions', label: '', align: 'right', render: (r) => (
      <div className="flex items-center justify-end gap-1">
        <button onClick={() => { setExtend(r); setExtendMonths(6) }} title="Prolonger" className="flex h-7 items-center gap-1 rounded-md px-2 font-mono text-[11px] font-semibold text-brand transition-colors hover:bg-[rgba(17,0,255,0.07)]"><Icon name="CalendarPlus" size={13} /> Prolonger</button>
        <button onClick={() => toggleActive.mutate(r.id)} title={r.actif ? 'Désactiver' : 'Activer'} className="flex h-7 w-7 items-center justify-center rounded-md text-faint transition-colors hover:bg-mist hover:text-ink"><Icon name={r.actif ? 'PauseCircle' : 'PlayCircle'} size={15} /></button>
        <button onClick={() => setMembers(r)} title="Membres" className="flex h-7 w-7 items-center justify-center rounded-md text-faint transition-colors hover:bg-mist hover:text-ink"><Icon name="Users" size={15} /></button>
        <button onClick={() => setDel(r)} title="Supprimer" className="flex h-7 w-7 items-center justify-center rounded-md text-faint transition-colors hover:bg-red-50 hover:text-red-500"><Icon name="Trash2" size={15} /></button>
      </div>
    ) },
  ]

  return (
    <div>
      <PageHead title="Cabinets" desc={`${rows.length} cabinets · ${rows.filter((c) => c.actif).length} actifs`} />
      <Panel pad={false}>
        <div className="flex flex-col gap-2.5 border-b border-hair p-3 sm:flex-row sm:items-center">
          <SearchInput value={q} onChange={setQ} placeholder="Nom ou email…" className="sm:max-w-xs sm:flex-1" />
          <div className="flex gap-2">
            <Select value={planF} onChange={setPlanF} options={[{ value: 'all', label: 'Tous les plans' }, { value: 'SOLO', label: 'SOLO' }, { value: 'CABINET', label: 'CABINET' }, { value: 'AGENCE', label: 'AGENCE' }]} />
            <Select value={statusF} onChange={setStatusF} options={[{ value: 'all', label: 'Tous statuts' }, { value: 'actif', label: 'Actifs' }, { value: 'inactif', label: 'Inactifs' }]} />
          </div>
        </div>
        {isLoading ? <Loading /> : <DataTable columns={columns} rows={sorted} sort={sort} onSort={toggle} rowKey="id" />}
      </Panel>

      <Modal open={!!extend} onClose={() => setExtend(null)} icon="CalendarPlus" title="Prolonger l'abonnement"
        subtitle={extend ? `${extend.nom} — expiration actuelle ${fmtDate(extend.date_fin)}.` : ''}
        footer={<><AdminBtn variant="ghost" onClick={() => setExtend(null)}>Annuler</AdminBtn><AdminBtn onClick={() => prolonger.mutate({ id: extend.id, mois: extendMonths })} icon="Check">Prolonger de {extendMonths} mois</AdminBtn></>}>
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-ink">Durée</span>
            <span className="font-mono text-[13px] font-bold text-brand">{extendMonths} mois</span>
          </div>
          <input type="range" min="1" max="24" value={extendMonths} onChange={(e) => setExtendMonths(+e.target.value)} className="mt-3 w-full accent-brand" />
          <div className="mt-1 flex justify-between font-mono text-[10px] text-faint"><span>1</span><span>12</span><span>24</span></div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {[3, 6, 12, 24].map((m) => (
              <button key={m} onClick={() => setExtendMonths(m)} className={cx('rounded-md px-2.5 py-1 font-mono text-[11px] font-semibold transition-colors', extendMonths === m ? 'bg-brand text-white' : 'bg-mist text-muted hover:text-ink')}>{m} mois</button>
            ))}
          </div>
        </div>
      </Modal>

      <Modal open={!!del} onClose={() => setDel(null)} icon="TriangleAlert" iconTone="danger" title="Supprimer le cabinet ?"
        subtitle={del ? `Cette action est irréversible. Toutes les données de ${del.nom} (#${del.id}) seront définitivement supprimées.` : ''}
        footer={<><AdminBtn variant="ghost" onClick={() => setDel(null)}>Annuler</AdminBtn><AdminBtn danger onClick={() => supprimer.mutate(del.id)} icon="Trash2">Supprimer définitivement</AdminBtn></>} />

      <Drawer open={!!members} onClose={() => setMembers(null)} title={members ? members.nom : ''} subtitle={members ? `${memberList.length} membres · #${members.id}` : ''}>
        <div className="flex flex-col gap-2">
          {memberList.map((m) => {
            const nom = `${m.prenom || ''} ${m.nom || ''}`.trim() || m.email
            return (
              <div key={m.email} className="flex items-center gap-3 rounded-[12px] border border-hair p-3">
                <span className={cx('flex h-9 w-9 items-center justify-center rounded-full font-mono text-[11px] font-bold', m.is_patron ? 'bg-brand text-white' : 'bg-mist text-muted')}>
                  {nom.split(' ').map((x) => x[0]).slice(0, 2).join('')}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><span className="truncate text-[13px] font-semibold text-ink">{nom}</span>{m.is_patron && <Badge tone="info">Patron</Badge>}</div>
                  <div className="truncate font-mono text-[11px] text-faint">{m.email}</div>
                </div>
                <Badge tone="neutral">{m.role}</Badge>
              </div>
            )
          })}
          {members && memberList.length === 0 && <div className="text-[12.5px] text-faint">Aucun membre.</div>}
        </div>
      </Drawer>

      {toast.node}
    </div>
  )
}

/* ---------- 3. Messages ---------- */
export function PageMessages() {
  const qc = useQueryClient()
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['admin-messages'],
    queryFn: () => api.get('/superadmin/contact-messages/').then(r => r.data),
  })
  const [open, setOpen] = React.useState(null)
  const [reply, setReply] = React.useState('')
  const toast = useToast()
  const unread = rows.filter((m) => !m.lu).length

  const markRead = useMutation({ mutationFn: (id) => api.patch(`/superadmin/contact-messages/${id}/lu/`), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-messages'] }) })
  const sendReply = useMutation({
    mutationFn: ({ id, message }) => api.post(`/superadmin/contact-messages/${id}/repondre/`, { message }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-messages'] }); toast.show('Réponse envoyée par email'); setReply(''); setOpen(null) },
  })

  const openMsg = (m) => { setOpen(m); setReply('') }

  const columns = [
    { key: 'nom', label: 'Nom', render: (r) => (
      <div className="flex items-center gap-2.5">
        <span className={cx('h-2 w-2 shrink-0 rounded-full', r.lu ? 'bg-transparent' : 'bg-brand')} />
        <div><div className={cx('text-[13px]', r.lu ? 'font-medium text-muted' : 'font-bold text-ink')}>{r.nom}</div><div className="font-mono text-[10.5px] text-faint">{r.email}</div></div>
      </div>
    ) },
    { key: 'cabinet', label: 'Cabinet', render: (r) => <span className="text-[12.5px] text-muted">{r.cabinet}</span> },
    { key: 'sujet', label: 'Sujet', render: (r) => <span className={cx('text-[13px]', r.lu ? 'text-muted' : 'font-semibold text-ink')}>{r.sujet_label || r.sujet}</span> },
    { key: 'date', label: 'Date', mono: true, nowrap: true, render: (r) => <span className="text-[11.5px] text-faint">{fmtDate(r.created_at)}</span> },
    { key: 'statut', label: 'Statut', align: 'center', render: (r) => <Badge tone={r.repondu ? 'success' : r.lu ? 'neutral' : 'info'} dot>{r.repondu ? 'Répondu' : r.lu ? 'Lu' : 'Non lu'}</Badge> },
  ]

  return (
    <div>
      <PageHead title="Messages" desc={`Boîte de contact — ${unread} non lus sur ${rows.length}`} />
      <Panel pad={false}>
        {isLoading ? <Loading /> : (
          <div className="cursor-pointer">
            <DataTable columns={columns.map((c) => ({ ...c, render: (r) => <div onClick={() => openMsg(r)}>{c.render ? c.render(r) : r[c.key]}</div> }))} rows={rows} sort={{ key: null }} onSort={() => {}} rowKey="id" empty="Aucun message." />
          </div>
        )}
      </Panel>

      <Drawer open={!!open} onClose={() => setOpen(null)} title={open ? (open.sujet_label || open.sujet) : ''} subtitle={open ? `${open.nom} · ${open.cabinet}` : ''} width={480}
        footer={open && (
          <div className="flex flex-col gap-2">
            <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={3} placeholder="Répondre par email…"
              className="w-full resize-none rounded-[12px] border border-hair bg-white px-3 py-2.5 text-[13px] text-ink placeholder:text-faint outline-none transition-all focus:border-brand focus:ring-4 focus:ring-[rgba(17,0,255,0.1)]" />
            <div className="flex items-center justify-between">
              <AdminBtn variant="ghost" size="sm" icon="MailOpen" onClick={() => { markRead.mutate(open.id); toast.show('Marqué comme lu') }}>Marquer comme lu</AdminBtn>
              <AdminBtn icon="Send" onClick={() => sendReply.mutate({ id: open.id, message: reply })} disabled={!reply.trim() || sendReply.isPending}>Envoyer</AdminBtn>
            </div>
          </div>
        )}>
        {open && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-mist px-2.5 py-1 font-mono text-[11px] text-muted ring-1 ring-hair"><Icon name="Mail" size={12} /> {open.email}</span>
              {open.telephone && <span className="inline-flex items-center gap-1.5 rounded-full bg-mist px-2.5 py-1 font-mono text-[11px] text-muted ring-1 ring-hair"><Icon name="Phone" size={12} /> {open.telephone}</span>}
            </div>
            <div className="rounded-[12px] border border-hair bg-mist/40 p-4 text-[13.5px] leading-relaxed text-ink/90">{open.message}</div>
            {open.repondu && open.reponse && (
              <div className="rounded-[12px] border border-emerald-200 bg-emerald-50 p-4 text-[13px] leading-relaxed text-emerald-900">
                <div className="mb-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-emerald-600">Votre réponse</div>
                {open.reponse}
              </div>
            )}
            <div className="font-mono text-[11px] text-faint">Reçu le {fmtDate(open.created_at)}</div>
          </div>
        )}
      </Drawer>
      {toast.node}
    </div>
  )
}

/* ---------- 4. Projets ---------- */
const PHASE_TONE = { Esquisse: 'neutral', APS: 'info', APD: 'info', DCE: 'violet', DET: 'warn', Chantier: 'success' }
export function PageProjets() {
  const { data: projets = [], isLoading } = useQuery({
    queryKey: ['admin-projets'],
    queryFn: () => api.get('/superadmin/projets/').then(r => r.data),
  })
  const [q, setQ] = React.useState('')
  const [cabF, setCabF] = React.useState('all')
  const [statF, setStatF] = React.useState('all')
  const cabinets = [...new Set(projets.map((p) => p.cabinet))]
  const statuts = [...new Set(projets.map((p) => p.statut))]

  const filtered = projets.filter((p) => {
    if (q && !`${p.projet} ${p.cabinet}`.toLowerCase().includes(q.toLowerCase())) return false
    if (cabF !== 'all' && p.cabinet !== cabF) return false
    if (statF !== 'all' && p.statut !== statF) return false
    return true
  })
  const { sorted, sort, toggle } = useTableSort(filtered, { key: 'date', dir: 'desc' })

  const columns = [
    { key: 'cabinet', label: 'Cabinet', sortable: true, render: (r) => <span className="text-[12.5px] font-medium text-muted">{r.cabinet}</span> },
    { key: 'projet', label: 'Projet', sortable: true, render: (r) => <span className="font-semibold text-ink">{r.projet}</span> },
    { key: 'type', label: 'Type', render: (r) => <span className="text-[12.5px] text-muted">{r.type}</span> },
    { key: 'statut', label: 'Statut', align: 'center', render: (r) => <Badge tone={PHASE_TONE[r.statut] || 'neutral'}>{r.statut}</Badge> },
    { key: 'date', label: 'Création', sortable: true, mono: true, nowrap: true, render: (r) => fmtDate(r.date) },
    { key: 'honoraires', label: 'Honoraires', sortable: true, align: 'right', mono: true, render: (r) => `${fmtDA(r.honoraires)} DA` },
  ]

  return (
    <div>
      <PageHead title="Projets" desc={`${projets.length} projets tous cabinets confondus · lecture seule`} />
      <Panel pad={false}>
        <div className="flex flex-col gap-2.5 border-b border-hair p-3 sm:flex-row sm:items-center">
          <SearchInput value={q} onChange={setQ} placeholder="Projet ou cabinet…" className="sm:max-w-xs sm:flex-1" />
          <div className="flex gap-2">
            <Select value={cabF} onChange={setCabF} options={[{ value: 'all', label: 'Tous cabinets' }, ...cabinets.map((c) => ({ value: c, label: c }))]} />
            <Select value={statF} onChange={setStatF} options={[{ value: 'all', label: 'Tous statuts' }, ...statuts.map((s) => ({ value: s, label: s }))]} />
          </div>
        </div>
        {isLoading ? <Loading /> : <DataTable columns={columns} rows={sorted} sort={sort} onSort={toggle} empty="Aucun projet." />}
      </Panel>
    </div>
  )
}
