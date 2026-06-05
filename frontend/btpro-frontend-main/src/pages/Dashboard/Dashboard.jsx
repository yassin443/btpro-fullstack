import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FolderKanban, Users, TrendingUp, AlertCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Layout from '../../components/Layout'
import useStore from '../../store/useStore'
import api from '../../api/axios'

const STATUT_BADGE = {
    EN_COURS: 'tag indigo',
    TERMINE: 'tag green',
    SUSPENDU: 'tag amber',
    ANNULE: 'tag red',
}
const STATUT_LABEL = {
    EN_COURS: 'En cours', TERMINE: 'Terminé', SUSPENDU: 'Suspendu', ANNULE: 'Annulé'
}

export default function Dashboard() {
    const { user } = useStore()
    const navigate = useNavigate()
    const isPatron = user?.is_patron === true

    const { data: projets = [] } = useQuery({
        queryKey: ['projets'],
        queryFn: () => api.get('/projets/').then(r => r.data)
    })

    const { data: clients = [] } = useQuery({
        queryKey: ['clients'],
        queryFn: () => api.get('/projets/clients/').then(r => r.data)
    })

    const { data: factures = [] } = useQuery({
        queryKey: ['factures'],
        queryFn: () => api.get('/finances/factures/').then(r => r.data),
        enabled: isPatron,
    })

    const chartData = useMemo(() => {
        const now = new Date()
        return Array.from({ length: 6 }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
            const year = d.getFullYear()
            const month = d.getMonth()
            const honoraires = factures
                .filter(f => {
                    if (f.statut !== 'SOLDEE') return false
                    const fd = new Date(f.date_emission)
                    return fd.getFullYear() === year && fd.getMonth() === month
                })
                .reduce((sum, f) => sum + Number(f.montant_ttc), 0)
            return {
                mois: d.toLocaleDateString('fr-FR', { month: 'short' }),
                honoraires,
            }
        })
    }, [factures])

    const projetsActifs = projets.filter(p => p.statut === 'EN_COURS').length
    const totalImpaye = factures
        .filter(f => ['EMISE', 'ENVOYEE', 'PARTIELLEMENT_PAYEE'].includes(f.statut))
        .reduce((sum, f) => sum + Number(f.montant_ttc), 0)
    const totalEncaisse = factures
        .filter(f => f.statut === 'SOLDEE')
        .reduce((sum, f) => sum + Number(f.montant_ttc), 0)

    const FACTURE_BADGE = {
        SOLDEE: 'tag green',
        EMISE: 'tag amber',
        ENVOYEE: 'tag blue',
        PARTIELLEMENT_PAYEE: 'tag indigo',
        ANNULEE: 'tag red',
    }
    const FACTURE_LABEL = {
        SOLDEE: 'Soldée', EMISE: 'Émise', ENVOYEE: 'Envoyée',
        PARTIELLEMENT_PAYEE: 'Part. payée', ANNULEE: 'Annulée',
    }

    return (
        <Layout>
            <div className="page">
                <div className="page-head">
                    <div>
                        <h1 className="page-title">Bonjour, <span className="it">{user?.prenom}</span>.</h1>
                        <div className="page-sub">Voici l'état de votre cabinet aujourd'hui.</div>
                    </div>
                </div>

                <div className="kpis">
                    {isPatron && (
                        <div className="kpi-tile dark">
                            <div className="kpi-label">Encaissé ce mois</div>
                            <div className="kpi-val" style={{ fontSize: totalEncaisse >= 1_000_000 ? 22 : 28 }}>
                                {totalEncaisse.toLocaleString('fr-DZ')} <span className="unit">DA</span>
                            </div>
                            <div className="kpi-delta up">Factures soldées</div>
                        </div>
                    )}
                    <div className="kpi-tile">
                        <div className="kpi-label">Projets actifs</div>
                        <div className="kpi-val">{projetsActifs}</div>
                        <div className="kpi-delta">{projets.length} total</div>
                    </div>
                    <div className="kpi-tile">
                        <div className="kpi-label">Clients</div>
                        <div className="kpi-val">{clients.length}</div>
                        <div className="kpi-delta">inscrits</div>
                    </div>
                    {isPatron && (
                        <div className="kpi-tile">
                            <div className="kpi-label">Impayé</div>
                            <div className="kpi-val" style={{ fontSize: totalImpaye >= 1_000_000 ? 22 : 28 }}>
                                {totalImpaye.toLocaleString('fr-DZ')} <span className="unit">DA</span>
                            </div>
                            <div className="kpi-delta down">À relancer</div>
                        </div>
                    )}
                </div>

                <div className={`${isPatron ? 'grid-66-33' : ''} mb-24`}>
                    {isPatron && (
                        <div className="card">
                            <div className="card-head">
                                <div>
                                    <div className="card-title">Honoraires encaissés</div>
                                    <div className="card-sub">6 derniers mois</div>
                                </div>
                            </div>
                            <div className="card-body">
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={chartData} barSize={28}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                                        <XAxis dataKey="mois" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted)' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted)' }} />
                                        <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surface)' }} cursor={{ fill: 'var(--bg-2)' }} />
                                        <Bar dataKey="honoraires" fill="url(#grad-db)" radius={[6, 6, 0, 0]} />
                                        <defs>
                                            <linearGradient id="grad-db" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#1100FF" />
                                                <stop offset="100%" stopColor="#4D1AFF" />
                                            </linearGradient>
                                        </defs>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    <div className="card">
                        <div className="card-head">
                            <div className="card-title">Projets récents</div>
                            <button className="btn sm" onClick={() => navigate('/projets')}>Voir tout</button>
                        </div>
                        <div style={{ padding: '4px 0' }}>
                            {projets.length === 0 ? (
                                <div className="empty-state" style={{ padding: '32px 20px' }}>Aucun projet</div>
                            ) : projets.slice(0, 5).map(projet => (
                                <div key={projet.id}
                                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderBottom: '1px solid var(--line)', cursor: 'pointer' }}
                                    onClick={() => navigate(`/projets/${projet.id}`)}>
                                    <div className="avatar indigo" style={{ width: 34, height: 34, fontSize: 11, flexShrink: 0 }}>
                                        <FolderKanban size={15} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {projet.nom}
                                        </div>
                                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{projet.wilaya}</div>
                                    </div>
                                    <span className={STATUT_BADGE[projet.statut] ?? 'tag neutral'}>
                                        <span className="dot" />
                                        {STATUT_LABEL[projet.statut] ?? projet.statut}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {isPatron && (
                    <div className="card">
                        <div className="card-head">
                            <div>
                                <div className="card-title">Factures récentes</div>
                                <div className="card-sub">5 derniers documents émis</div>
                            </div>
                            <button className="btn sm" onClick={() => navigate('/finances')}>Voir tout</button>
                        </div>
                        {factures.length === 0 ? (
                            <div className="empty-state" style={{ padding: '40px 20px' }}>Aucune facture</div>
                        ) : (
                            <table className="tbl">
                                <thead>
                                    <tr>
                                        <th>Numéro</th>
                                        <th>Client</th>
                                        <th>Montant TTC</th>
                                        <th>Statut</th>
                                        <th>Échéance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {factures.slice(0, 5).map(f => (
                                        <tr key={f.id}>
                                            <td className="ref">{f.numero}</td>
                                            <td style={{ fontWeight: 500 }}>{f.client_nom}</td>
                                            <td className="num">{Number(f.montant_ttc).toLocaleString()} DA</td>
                                            <td>
                                                <span className={FACTURE_BADGE[f.statut] ?? 'tag neutral'}>
                                                    <span className="dot" />
                                                    {FACTURE_LABEL[f.statut] ?? f.statut}
                                                </span>
                                            </td>
                                            <td className="mono" style={{ fontSize: 11.5, color: 'var(--muted)' }}>{f.date_echeance}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    )
}
