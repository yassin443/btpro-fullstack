import '../../styles/design.css'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../../store/useStore'
import { cx, Icon, Logomark } from './_ui'
import { PageDashboard, PageCabinets, PageMessages, PageProjets } from './pages1'
import { PageFactures, PageStatsIA, PageRevenus, PageAnnonces } from './pages2'
import { PageErreurs, PageLogs, PagePlans, PageLimites, PageParametres } from './pages3'

const ADMIN_NAV = [
  { section: "Vue d'ensemble", items: [{ id: 'dashboard', label: 'Tableau de bord', icon: 'LayoutDashboard' }] },
  { section: 'Gestion', items: [
    { id: 'cabinets', label: 'Cabinets', icon: 'Building2' },
    { id: 'messages', label: 'Messages', icon: 'Mail', badge: 2 },
  ] },
  { section: 'Données métier', items: [
    { id: 'projets', label: 'Projets', icon: 'FolderKanban' },
    { id: 'factures', label: 'Factures', icon: 'Receipt' },
    { id: 'stats-ia', label: 'Statistiques IA', icon: 'Sparkles' },
  ] },
  { section: 'Finances', items: [{ id: 'revenus', label: 'Revenus & Charges', icon: 'Wallet' }] },
  { section: 'Notifications', items: [
    { id: 'annonces', label: 'Annonces', icon: 'Megaphone' },
    { id: 'erreurs', label: 'Erreurs système', icon: 'TriangleAlert' },
    { id: 'logs', label: "Logs d'activité", icon: 'ScrollText' },
  ] },
  { section: 'Configuration', items: [
    { id: 'plans', label: 'Plans & tarifs', icon: 'Tags' },
    { id: 'limites', label: 'Limites par plan', icon: 'SlidersHorizontal' },
    { id: 'parametres', label: 'Paramètres', icon: 'Settings' },
  ] },
]

const ADMIN_PAGES = {
  dashboard: PageDashboard, cabinets: PageCabinets, messages: PageMessages,
  projets: PageProjets, factures: PageFactures, 'stats-ia': PageStatsIA,
  revenus: PageRevenus, annonces: PageAnnonces, erreurs: PageErreurs,
  logs: PageLogs, plans: PagePlans, limites: PageLimites, parametres: PageParametres,
}

function AdminSidebar({ active, onPick, onClose }) {
  return (
    <nav className="flex h-full w-[244px] shrink-0 flex-col overflow-y-auto border-r border-hair bg-white">
      <div className="flex items-center gap-2.5 px-4 py-3.5">
        <Logomark size={26} />
        <div className="leading-none">
          <div className="text-[15px] font-extrabold tracking-tight text-ink">Planner</div>
          <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-brand">Super Admin</div>
        </div>
      </div>
      <div className="flex-1 px-2.5 pb-6">
        {ADMIN_NAV.map((grp) => (
          <div key={grp.section} className="mt-4 first:mt-1">
            <div className="px-2.5 pb-1.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.13em] text-faint">{grp.section}</div>
            <div className="flex flex-col gap-0.5">
              {grp.items.map((it) => {
                const on = active === it.id
                return (
                  <button key={it.id} onClick={() => { onPick(it.id); onClose && onClose() }}
                    className={cx('group flex items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-[13px] font-medium transition-colors',
                      on ? 'bg-[rgba(17,0,255,0.07)] text-brand' : 'text-muted hover:bg-mist hover:text-ink')}>
                    <Icon name={it.icon} size={16} className={on ? 'text-brand' : 'text-faint group-hover:text-ink'} />
                    <span className="flex-1 text-left">{it.label}</span>
                    {it.badge && <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 font-mono text-[9.5px] font-bold text-white">{it.badge}</span>}
                    {on && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  )
}

export default function Admin() {
  const navigate = useNavigate()
  const { user, logout } = useStore()
  const [page, setPage] = React.useState('dashboard')
  const [mobileNav, setMobileNav] = React.useState(false)
  const scrollRef = React.useRef(null)

  React.useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0 }, [page])
  React.useEffect(() => { document.body.style.overflow = mobileNav ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [mobileNav])

  const Current = ADMIN_PAGES[page] || ADMIN_PAGES.dashboard
  const activeLabel = ADMIN_NAV.flatMap((g) => g.items).find((i) => i.id === page)?.label
  const email = user?.email || 'super-admin'
  const initials = `${user?.prenom?.[0] ?? ''}${user?.nom?.[0] ?? ''}` || 'SA'
  const onLogout = () => { logout(); navigate('/login') }

  return (
    <div className="planner-site">
      <div className="flex h-screen flex-col bg-mist/40">
        <header className="z-20 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-hair bg-white px-3 sm:px-4">
          <div className="flex items-center gap-2.5">
            <button onClick={() => setMobileNav(true)} className="flex h-9 w-9 items-center justify-center rounded-lg text-ink transition-colors hover:bg-mist lg:hidden" aria-label="Menu"><Icon name="Menu" size={20} /></button>
            <span className="hidden items-center gap-2 sm:flex">
              <Logomark size={24} />
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-white"><span className="rounded-md bg-brand px-2 py-1">Super Admin</span></span>
            </span>
            <span className="text-[14px] font-bold text-ink sm:hidden">{activeLabel}</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1.5 font-mono text-[11px] font-semibold text-amber-700 ring-1 ring-amber-500/20 md:inline-flex">
              <Icon name="Clock" size={13} /> 1 expiration {'<'} 30j
            </span>
            <span className="hidden font-mono text-[12px] text-muted lg:inline">{email}</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand font-mono text-[11px] font-bold text-white">{initials}</span>
            <button onClick={onLogout} className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] font-semibold text-muted transition-colors hover:bg-mist hover:text-ink" title="Déconnexion">
              <Icon name="LogOut" size={15} /><span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <div className="hidden lg:block"><AdminSidebar active={page} onPick={setPage} /></div>

          <div className={cx('fixed inset-0 z-[110] lg:hidden', mobileNav ? 'pointer-events-auto' : 'pointer-events-none')}>
            <div onClick={() => setMobileNav(false)} className={cx('absolute inset-0 bg-ink/30 backdrop-blur-sm transition-opacity duration-300', mobileNav ? 'opacity-100' : 'opacity-0')} />
            <div className={cx('absolute left-0 top-0 h-full shadow-2xl transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)]', mobileNav ? 'translate-x-0' : '-translate-x-full')}>
              <AdminSidebar active={page} onPick={setPage} onClose={() => setMobileNav(false)} />
            </div>
          </div>

          <main ref={scrollRef} className="min-w-0 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-[1240px] p-4 pb-24 sm:p-6">
              <div key={page} className="animate-[fadein_.3s_ease]"><Current /></div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
