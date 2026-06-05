import { useQuery } from '@tanstack/react-query'
import { Wallet, Calendar, TrendingUp, Clock } from 'lucide-react'
import Layout from '../../components/Layout'
import api from '../../api/axios'

const MOIS_LABELS = [
    '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

const TYPE_LABELS = {
    MENSUEL:    'Salaire mensuel fixe',
    JOURNALIER: 'Taux journalier',
    FORFAIT:    'Forfait libre',
}

export default function MaRemuneration() {
    const { data, isLoading } = useQuery({
        queryKey: ['mon-salaire'],
        queryFn: () => api.get('/finances/paie/mon-salaire/').then(r => r.data),
    })

    const fiches = data?.fiches || []
    const totalAnnee = fiches
        .filter(f => f.periode_annee === new Date().getFullYear())
        .reduce((s, f) => s + f.montant, 0)

    return (
        <Layout>
            <div className="page">
                <div className="page-head">
                    <div>
                        <h1 className="page-title">Ma rémunération</h1>
                        <div className="page-sub">Historique de vos fiches de paie</div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="text-center color-slate" style={{ padding: 80 }}>Chargement...</div>
                ) : (
                    <>
                        {/* Info card */}
                        <div style={{
                            background: '#fff', borderRadius: 16,
                            border: '1px solid #E5E7EB',
                            padding: '22px 26px', marginBottom: 24,
                            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                            display: 'flex', overflow: 'hidden',
                        }}>
                            <div style={{ width: 4, background: 'var(--indigo)', borderRadius: 4, flexShrink: 0, marginRight: 22 }} />
                            <div style={{ flex: 1, display: 'flex', gap: 40, flexWrap: 'wrap', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Nom</div>
                                    <div style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>{data?.nom || '—'}</div>
                                    <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{data?.role || ''}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Type de paie</div>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{TYPE_LABELS[data?.type_paie] || '—'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Taux</div>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>
                                        {data?.taux > 0 ? `${Number(data.taux).toLocaleString('fr-DZ')} DA` : 'Non configuré'}
                                        {data?.type_paie === 'JOURNALIER' ? ' / jour' : data?.type_paie === 'MENSUEL' ? ' / mois' : ''}
                                    </div>
                                </div>
                                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Total {new Date().getFullYear()}</div>
                                    <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--indigo)', letterSpacing: '-1px', lineHeight: 1 }}>
                                        {totalAnnee > 0 ? Number(totalAnnee).toLocaleString('fr-DZ') : '0'} DA
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Fiches list */}
                        {fiches.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon" style={{ background: 'var(--indigo-soft)' }}><Wallet size={24} color="var(--indigo)" /></div>
                                <div className="empty-title">Aucune fiche de paie</div>
                                <div className="empty-sub">Vos fiches apparaîtront ici une fois générées par le patron</div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {fiches.map(f => (
                                    <div key={f.id} style={{
                                        background: '#fff', borderRadius: 14,
                                        border: '1px solid #E5E7EB',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                                        display: 'flex', overflow: 'hidden', alignItems: 'stretch',
                                    }}>
                                        <div style={{ width: 4, background: 'var(--indigo)', flexShrink: 0 }} />
                                        <div style={{ flex: 1, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 160 }}>
                                                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--indigo-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <Calendar size={18} color="var(--indigo)" />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', letterSpacing: '-0.3px' }}>
                                                        {MOIS_LABELS[f.periode_mois]} {f.periode_annee}
                                                    </div>
                                                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
                                                        {TYPE_LABELS[f.type_paie] || f.type_paie}
                                                    </div>
                                                </div>
                                            </div>

                                            {f.type_paie === 'JOURNALIER' && f.nb_jours > 0 && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <Clock size={14} color="#9CA3AF" />
                                                    <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>
                                                        {f.nb_jours}h travaillées
                                                    </span>
                                                </div>
                                            )}

                                            {f.projets?.length > 0 && (
                                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                                                    {f.projets.map(p => (
                                                        <span key={p.nom} style={{ fontSize: 10, background: '#EFF6FF', color: '#2563EB', borderRadius: 20, padding: '2px 9px', fontWeight: 600, border: '1px solid #BFDBFE' }}>
                                                            {p.nom} · {p.heures}h
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {f.notes && (
                                                <div style={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>
                                                    {f.notes}
                                                </div>
                                            )}

                                            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                                                <div style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-1px', lineHeight: 1 }}>
                                                    {Number(f.montant).toLocaleString('fr-DZ')} DA
                                                </div>
                                                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                                                    Taux : {Number(f.taux).toLocaleString('fr-DZ')} DA
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </Layout>
    )
}
