import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Clock, Plus, X, Timer, CheckCircle, Trash2 } from 'lucide-react'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import useStore from '../../store/useStore'
import ConfirmModal from '../../components/ConfirmModal'

export default function TimeTracking() {
    const queryClient = useQueryClient()
    const { user: currentUser } = useStore()
    const isPatron = currentUser?.is_patron === true

    const [open, setOpen] = useState(false)
    const [confirmDel, setConfirmDel] = useState(null)
    const [form, setForm] = useState({
        user: '', projet: '', date: new Date().toISOString().split('T')[0],
        heures: '', taux_horaire: '3000', description: '', facturable: true,
    })

    const { data: feuilles, isLoading } = useQuery({
        queryKey: ['feuilles'],
        queryFn: () => api.get('/projets/temps/').then(r => r.data),
    })
    const { data: stats } = useQuery({
        queryKey: ['stats-temps'],
        queryFn: () => api.get('/projets/temps/stats/').then(r => r.data),
    })
    const { data: projets } = useQuery({
        queryKey: ['projets'],
        queryFn: () => api.get('/projets/').then(r => r.data),
    })
    const { data: membres } = useQuery({
        queryKey: ['membres'],
        queryFn: () => api.get('/users/membres/').then(r => r.data),
    })
    const { data: paieMembres = [] } = useQuery({
        queryKey: ['paie-membres-config'],
        queryFn: () => api.get('/finances/paie/membres/').then(r => r.data),
        enabled: isPatron,
    })

    const selectedMembreConfig = form.user
        ? paieMembres.find(m => String(m.id) === String(form.user))
        : null
    const membreTypePaie = selectedMembreConfig?.type_paie ?? null

    const resetModal = () => {
        setOpen(false)
        setForm({
            user: '', projet: '', date: new Date().toISOString().split('T')[0],
            heures: '', taux_horaire: '3000', description: '', facturable: true,
        })
    }

    const mutation = useMutation({
        mutationFn: (data) => {
            const payload = {
                projet: data.projet, date: data.date, heures: data.heures,
                taux_horaire: data.taux_horaire, facturable: data.facturable,
            }
            if (data.description) payload.description = data.description
            if (data.user) payload.user = data.user
            return api.post('/projets/temps/', payload)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feuilles'] })
            queryClient.invalidateQueries({ queryKey: ['stats-temps'] })
            resetModal()
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/projets/temps/${id}/`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feuilles'] })
            queryClient.invalidateQueries({ queryKey: ['stats-temps'] })
        },
    })

    const allFeuilles = feuilles || []
    const feuillesList = isPatron ? allFeuilles : allFeuilles.filter(f => f.user === currentUser?.id)
    const projetsList = projets || []
    const totalHeures = isPatron && stats
        ? Number(stats.total_heures || 0)
        : feuillesList.reduce((s, f) => s + Number(f.heures || 0), 0)
    const heuresFacturables = isPatron && stats
        ? Number(stats.heures_facturables || 0)
        : feuillesList.filter(f => f.facturable).reduce((s, f) => s + Number(f.heures || 0), 0)
    const montantTotal = stats ? Number(stats.montant_total || 0) : 0

    const canSubmit = form.projet && form.date && form.heures && !mutation.isPending && membreTypePaie !== 'MENSUEL'

    return (
        <Layout>
            <div className="page">
                <div className="page-head">
                    <div>
                        <h1 className="page-title">Feuilles de temps</h1>
                        <div className="page-sub">Enregistrez le temps passé par projet</div>
                    </div>
                    <div className="page-head-actions">
                        <button className="btn accent" onClick={() => setOpen(true)}>
                            <Plus size={15} /> Ajouter du temps
                        </button>
                    </div>
                </div>

                <div className={isPatron ? 'stats stats-3' : 'stats stats-2'}>
                    <div className="stat">
                        <div className="stat-icon" style={{ background: 'var(--indigo-soft)' }}><Clock size={18} color="var(--indigo)" /></div>
                        <div className="stat-label">Total heures</div>
                        <div className="stat-val">{totalHeures.toFixed(1)}h</div>
                    </div>
                    <div className="stat">
                        <div className="stat-icon" style={{ background: '#ECFDF5' }}><Timer size={18} color="#10B981" /></div>
                        <div className="stat-label">Heures facturables</div>
                        <div className="stat-val">{heuresFacturables.toFixed(1)}h</div>
                    </div>
                    {isPatron && (
                        <div className="stat">
                            <div className="stat-icon" style={{ background: '#FFFBEB' }}><CheckCircle size={18} color="#F59E0B" /></div>
                            <div className="stat-label">Montant facturable</div>
                            <div className="stat-val" style={{ fontSize: 18 }}>{montantTotal.toLocaleString()} DA</div>
                        </div>
                    )}
                </div>

                {isLoading ? (
                    <div className="text-center color-slate" style={{ padding: 80 }}>Chargement...</div>
                ) : feuillesList.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon" style={{ background: 'var(--indigo-soft)' }}><Clock size={24} color="var(--indigo)" /></div>
                        <div className="empty-title">Aucun temps enregistré</div>
                        <div className="empty-sub">Commencez à tracker votre temps par projet</div>
                        <button className="btn accent" onClick={() => setOpen(true)}><Plus size={14} /> Ajouter du temps</button>
                    </div>
                ) : (
                    <div className="card" style={{ overflow: 'visible' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Projet</th>
                                    <th>Heures</th>
                                    {isPatron && <><th>Taux</th><th>Montant</th></>}
                                    <th>Facturable</th>
                                    <th>Description</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {feuillesList.map(f => (
                                    <tr key={f.id}>
                                        <td className="fw-600" style={{ color: '#0F172A' }}>{f.date}</td>
                                        <td>
                                            <div className="flex-center gap-8">
                                                <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--indigo-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Clock size={12} color="var(--indigo)" />
                                                </div>
                                                <span className="fw-600 fs-13" style={{ color: '#0F172A' }}>{f.projet_nom}</span>
                                            </div>
                                        </td>
                                        <td className="fw-700 color-indigo">{f.heures}h</td>
                                        {isPatron && <>
                                            <td className="color-slate">{Number(f.taux_horaire).toLocaleString()} DA/h</td>
                                            <td className="fw-700" style={{ color: '#0F172A' }}>{Number(f.montant).toLocaleString()} DA</td>
                                        </>}
                                        <td>
                                            {f.facturable
                                                ? <span className="flex-center gap-4 fs-12 fw-600 color-green"><CheckCircle size={12} /> Oui</span>
                                                : <span className="fs-12 color-slate">Non</span>}
                                        </td>
                                        <td className="color-slate" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {f.description || '—'}
                                        </td>
                                        <td>
                                            <button
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 4, borderRadius: 6 }}
                                                onClick={() => setConfirmDel({ action: () => deleteMutation.mutate(f.id) })}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {open && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 200, backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={resetModal}>
                    <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 480, boxShadow: '0 24px 80px rgba(0,0,0,0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '22px 26px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--indigo-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Clock size={20} color="var(--indigo)" />
                                </div>
                                <div>
                                    <div style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' }}>Ajouter du temps</div>
                                    <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 1 }}>Enregistrez une feuille de temps</div>
                                </div>
                            </div>
                            <button onClick={resetModal} style={{ width: 34, height: 34, borderRadius: 9, background: '#F8FAFC', border: '1px solid #E2E8F0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                                <X size={15} />
                            </button>
                        </div>

                        <div style={{ padding: '20px 26px', display: 'flex', flexDirection: 'column', gap: 0 }}>

                            {isPatron && membres?.length > 1 && (
                                <div className="field">
                                    <label>Architecte</label>
                                    <select value={form.user} onChange={e => {
                                        const userId = e.target.value
                                        const cfg = paieMembres.find(m => String(m.id) === String(userId))
                                        let newTaux = '3000'
                                        if (cfg?.type_paie === 'HORAIRE') newTaux = String(cfg.taux || 3000)
                                        else if (cfg?.type_paie === 'JOURNALIER') newTaux = '0'
                                        setForm(f => ({ ...f, user: userId, taux_horaire: newTaux }))
                                    }}>
                                        <option value="">Moi-même ({currentUser.prenom} {currentUser.nom})</option>
                                        {membres.filter(m => m.id !== currentUser.id).map(m => (
                                            <option key={m.id} value={m.id}>{m.prenom} {m.nom}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {membreTypePaie === 'MENSUEL' && (
                                <div style={{ background: '#FEF3C7', border: '1.5px solid #FCD34D', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                    <span style={{ fontSize: 15, lineHeight: 1.4 }}>⚠️</span>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>Employé en mensuel fixe</div>
                                        <div style={{ fontSize: 12, color: '#92400E', marginTop: 2 }}>Pas de feuilles de temps pour cet employé. La paie est générée depuis la page Paie.</div>
                                    </div>
                                </div>
                            )}
                            {membreTypePaie === 'JOURNALIER' && (
                                <div style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: 10, padding: '8px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 14 }}>ℹ️</span>
                                    <div style={{ fontSize: 12, color: '#1E40AF' }}>Employé journalier — taux horaire forcé à 0 DA (le coût est suivi via la fiche de paie).</div>
                                </div>
                            )}

                            <div className="field">
                                <label>Projet *</label>
                                <select value={form.projet} onChange={e => setForm(f => ({ ...f, projet: e.target.value }))}>
                                    <option value="">Sélectionner un projet</option>
                                    {projetsList.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                                </select>
                            </div>

                            <div className="grid-2">
                                <div className="field">
                                    <label>Date *</label>
                                    <input type="date" value={form.date} max={new Date().toISOString().split('T')[0]} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                                </div>
                                <div className="field">
                                    <label>{membreTypePaie === 'JOURNALIER' ? 'Jours *' : 'Heures *'}</label>
                                    <input
                                        type="number" step="0.5" min={0.5}
                                        value={form.heures}
                                        placeholder={membreTypePaie === 'JOURNALIER' ? 'ex: 1' : 'ex: 3.5'}
                                        onChange={e => {
                                            const v = parseFloat(e.target.value)
                                            setForm(f => ({ ...f, heures: v || e.target.value }))
                                        }}
                                    />
                                </div>
                            </div>

                            {isPatron && membreTypePaie !== 'MENSUEL' && (
                                <div className="field">
                                    <label>{membreTypePaie === 'JOURNALIER' ? 'Taux journalier (DA/j)' : 'Taux horaire (DA/h)'}</label>
                                    <input type="number" value={form.taux_horaire} onChange={e => setForm(f => ({ ...f, taux_horaire: e.target.value }))} />
                                </div>
                            )}

                            <div className="field">
                                <label>Description</label>
                                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Décrivez le travail effectué..." style={{ resize: 'vertical' }} />
                            </div>

                            {isPatron && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                    <input type="checkbox" checked={form.facturable} onChange={e => setForm(f => ({ ...f, facturable: e.target.checked }))} style={{ accentColor: 'var(--indigo)', width: 16, height: 16 }} />
                                    <label style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>Heures facturables au client</label>
                                </div>
                            )}
                        </div>

                        <div style={{ padding: '14px 26px 22px', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 10 }}>
                            <button onClick={resetModal} style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: 'white', fontSize: 13, fontWeight: 600, color: '#64748B', cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
                            <button
                                disabled={!canSubmit}
                                onClick={() => mutation.mutate(form)}
                                style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: 'var(--grad)', color: 'white', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: canSubmit ? 'pointer' : 'not-allowed', boxShadow: '0 4px 14px rgba(17,0,255,0.25)', opacity: canSubmit ? 1 : 0.6 }}>
                                {mutation.isPending ? 'Ajout...' : 'Enregistrer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                open={!!confirmDel}
                title="Supprimer cette entrée ?"
                message="Cette feuille de temps sera supprimée définitivement."
                onConfirm={() => { confirmDel?.action(); setConfirmDel(null) }}
                onCancel={() => setConfirmDel(null)}
            />
        </Layout>
    )
}
