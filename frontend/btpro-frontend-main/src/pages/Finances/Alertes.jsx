import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { AlertCircle, Mail, Clock, TrendingDown, CheckCircle, RefreshCw } from 'lucide-react'
import Layout from '../../components/Layout'
import api from '../../api/axios'

const NIVEAU_CONFIG = {
    ATTENTION: { label: 'Attention', color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
    URGENT: { label: 'Urgent', color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
    CRITIQUE: { label: 'Critique', color: '#7F1D1D', bg: '#FEE2E2', border: '#FCA5A5' },
}

export default function Alertes() {
    const [relanceEnvoyee, setRelanceEnvoyee] = useState({})
    const [erreurs, setErreurs] = useState({})

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['alertes'],
        queryFn: () => api.get('/finances/alertes/').then(r => r.data)
    })

    const relanceMutation = useMutation({
        mutationFn: (id) => api.post(`/finances/factures/${id}/relance/`),
        onSuccess: (_, id) => {
            setRelanceEnvoyee(prev => ({ ...prev, [id]: true }))
            setErreurs(prev => ({ ...prev, [id]: null }))
        },
        onError: (err, id) => {
            const msg = err.response?.data?.error ?? 'Erreur envoi'
            setErreurs(prev => ({ ...prev, [id]: msg }))
        }
    })

    const alertes = data?.alertes ?? []
    const totalAlertes = data?.total_alertes ?? 0
    const totalImpaye = Number(data?.total_impaye ?? 0)
    const critiques = alertes.filter(a => a.niveau === 'CRITIQUE').length

    return (
        <Layout>
            <div className="page">
                <div className="page-head">
                    <div>
                        <h1 className="page-title">Alertes impayés</h1>
                        <div className="page-sub">Factures en retard — relances par email</div>
                    </div>
                    <div className="page-head-actions">
                        <button className="btn" onClick={() => refetch()}>
                            <RefreshCw size={15} /> Actualiser
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="text-center color-slate" style={{ padding: 80 }}>Chargement...</div>
                ) : (
                    <>
                        <div className="stats stats-3">
                            <div className="stat">
                                <div className="stat-icon" style={{ background: '#FEF2F2' }}><AlertCircle size={18} color="#EF4444" /></div>
                                <div className="stat-label">Total alertes</div>
                                <div className="stat-val">{totalAlertes}</div>
                            </div>
                            <div className="stat">
                                <div className="stat-icon" style={{ background: '#FEF2F2' }}><TrendingDown size={18} color="#EF4444" /></div>
                                <div className="stat-label">Montant impayé</div>
                                <div className="stat-val" style={{ fontSize: 18 }}>{totalImpaye.toLocaleString()} DA</div>
                            </div>
                            <div className="stat">
                                <div className="stat-icon" style={{ background: '#FEE2E2' }}><Clock size={18} color="#7F1D1D" /></div>
                                <div className="stat-label">Critiques +60j</div>
                                <div className="stat-val">{critiques}</div>
                            </div>
                        </div>

                        {alertes.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon" style={{ background: '#ECFDF5' }}><CheckCircle size={24} color="#10B981" /></div>
                                <div className="empty-title">Aucun impayé en retard</div>
                                <div className="empty-sub">Toutes vos factures sont à jour</div>
                            </div>
                        ) : (
                            <div className="flex-col gap-12">
                                {alertes.map(alerte => {
                                    const config = NIVEAU_CONFIG[alerte.niveau]
                                    const envoye = relanceEnvoyee[alerte.id]
                                    const erreur = erreurs[alerte.id]
                                    return (
                                        <div key={alerte.id} className="card" style={{ border: `1px solid ${config.border}` }}>
                                            <div className="card-body">
                                                <div className="flex-center gap-20">
                                                    <div style={{ width: 48, height: 48, borderRadius: 12, background: config.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <AlertCircle size={22} color={config.color} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex-center gap-10 mb-6">
                                                            <span className="fw-700" style={{ fontSize: 15, color: '#0F172A' }}>{alerte.client}</span>
                                                            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: config.bg, color: config.color }}>{config.label}</span>
                                                        </div>
                                                        <div className="flex gap-20 fs-13 color-slate" style={{ flexWrap: 'wrap' }}>
                                                            <span>Facture <strong style={{ color: '#0F172A' }}>{alerte.numero}</strong></span>
                                                            <span>Échéance : <strong style={{ color: '#0F172A' }}>{alerte.date_echeance}</strong></span>
                                                            <span className="fw-700" style={{ color: config.color }}>{alerte.jours_retard} jour(s) de retard</span>
                                                        </div>
                                                        {erreur && (
                                                            <div className="fs-12" style={{ marginTop: 8, color: '#EF4444', background: '#FEF2F2', padding: '6px 10px', borderRadius: 6 }}>
                                                                {erreur}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-right" style={{ flexShrink: 0 }}>
                                                        <div className="fw-700 mb-10" style={{ fontSize: 20, color: '#0F172A' }}>
                                                            {Number(alerte.montant).toLocaleString()} DA
                                                        </div>
                                                        <button
                                                            className={envoye ? 'btn btn-green btn-sm' : 'btn accent sm'}
                                                            onClick={() => relanceMutation.mutate(alerte.id)}
                                                            disabled={relanceMutation.isPending || envoye}>
                                                            {envoye ? (
                                                                <><CheckCircle size={13} /> Envoyée !</>
                                                            ) : (
                                                                <><Mail size={13} /> Envoyer relance</>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
        </Layout>
    )
}
