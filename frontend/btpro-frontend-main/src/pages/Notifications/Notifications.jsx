import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, ArrowRight } from 'lucide-react'
import api from '../../api/axios'
import Layout from '../../components/Layout'

export default function Notifications() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const { data: notifs = [], isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: () => api.get('/projets/notifications/').then(r => r.data),
        retry: false,
    })

    const nonLues = notifs.filter(n => !n.lu).length

    const marquerToutLu = useMutation({
        mutationFn: () => api.post('/projets/notifications/lire/'),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    })

    return (
        <Layout>
            <div className="page">
                <div className="page-head">
                    <div>
                        <h1 className="page-title">Notifications</h1>
                        <div className="page-sub">Vos alertes et mises à jour</div>
                    </div>
                    {nonLues > 0 && (
                        <div className="page-head-actions">
                            <button className="btn" onClick={() => marquerToutLu.mutate()} disabled={marquerToutLu.isPending}>
                                <CheckCheck size={15} /> Tout marquer comme lu
                            </button>
                        </div>
                    )}
                </div>

                {isLoading ? (
                    <div className="text-center color-slate" style={{ padding: 60 }}>Chargement...</div>
                ) : notifs.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon" style={{ background: 'var(--indigo-soft)' }}><Bell size={24} color="var(--indigo)" /></div>
                        <div className="empty-title">Aucune notification</div>
                        <div className="empty-sub">Vous serez informé ici des réunions, tâches et mises à jour</div>
                    </div>
                ) : (
                    <div className="flex-col gap-10">
                        {notifs.map(n => (
                            <div
                                key={n.id}
                                onClick={() => { if (n.lien) navigate(n.lien) }}
                                style={{
                                    background: n.lu ? 'white' : 'var(--indigo-soft)',
                                    borderRadius: 14,
                                    border: `1.5px solid ${n.lu ? '#F1F5F9' : 'rgba(17,0,255,0.18)'}`,
                                    boxShadow: '0 1px 4px rgba(15,23,42,0.04)',
                                    padding: '14px 16px',
                                    cursor: n.lien ? 'pointer' : 'default',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 12,
                                }}
                            >
                                <div style={{ width: 40, height: 40, borderRadius: 11, background: n.lu ? 'var(--bg)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Bell size={17} color="var(--indigo)" />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13.5, fontWeight: n.lu ? 500 : 700, color: '#0F172A', lineHeight: 1.45 }}>{n.message}</div>
                                    <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 4 }}>
                                        {new Date(n.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                                {!n.lu && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--indigo)', flexShrink: 0, marginTop: 6 }} />}
                                {n.lien && <ArrowRight size={14} color="var(--muted-2)" style={{ flexShrink: 0, marginTop: 4 }} />}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    )
}
