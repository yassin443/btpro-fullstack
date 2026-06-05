import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart2, ChevronLeft, ChevronRight } from 'lucide-react'
import Layout from '../../components/Layout'
import api from '../../api/axios'

const MOIS_NOMS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const CURRENT_YEAR = new Date().getFullYear()
const CURRENT_MONTH = new Date().getMonth() + 1

export default function Rentabilite() {
    const [mode, setMode] = useState('projet')
    const [mois, setMois] = useState(CURRENT_MONTH)
    const [annee, setAnnee] = useState(CURRENT_YEAR)

    const queryParams = mode === 'projet'
        ? {}
        : mode === 'mensuel'
            ? { mode, mois, annee }
            : { mode: 'annuel', annee }

    const { data, isLoading } = useQuery({
        queryKey: ['rentabilite', mode, mois, annee],
        queryFn: () => api.get('/projets/rentabilite/', { params: queryParams }).then(r => r.data)
    })

    const projets = data?.projets ?? []
    const totalHonoraires = Number(data?.total_honoraires ?? 0)
    const totalCout = Number(data?.total_cout ?? 0)
    const totalProfit = Number(data?.total_profit ?? 0)
    const masseSalariale = Number(data?.masse_salariale ?? 0)

    // Marge pondérée par honoraires (évite qu'un petit projet à forte perte écrase la moyenne)
    const totalHonorairesProj = projets.reduce((s, p) => s + Number(p.honoraires || 0), 0)
    const margeMoyenne = totalHonorairesProj > 0
        ? Math.round(projets.reduce((s, p) => s + Number(p.marge || 0) * Number(p.honoraires || 0), 0) / totalHonorairesProj)
        : 0
    const projetsProf = projets.filter(p => Number(p.marge || 0) > 0).length

    function prevPeriod() {
        if (mode === 'mensuel') {
            if (mois === 1) { setMois(12); setAnnee(a => a - 1) }
            else setMois(m => m - 1)
        } else {
            setAnnee(a => a - 1)
        }
    }
    function nextPeriod() {
        if (mode === 'mensuel') {
            if (mois === 12) { setMois(1); setAnnee(a => a + 1) }
            else setMois(m => m + 1)
        } else {
            setAnnee(a => a + 1)
        }
    }

    const periodeLabel = mode === 'mensuel'
        ? `${MOIS_NOMS[mois - 1]} ${annee}`
        : mode === 'annuel'
            ? String(annee)
            : null

    const fmt = (n) => Number(n).toLocaleString('fr-DZ')

    return (
        <Layout>
            <div className="page">
                <div className="page-head">
                    <div>
                        <h1 className="page-title">Rentabilité</h1>
                        <div className="page-sub">
                            {mode === 'projet' && `Marge moyenne ${margeMoyenne}% · ${projets.length} projet${projets.length !== 1 ? 's' : ''} analysés`}
                            {mode === 'mensuel' && `Analyse mensuelle — ${periodeLabel}`}
                            {mode === 'annuel' && `Analyse annuelle — ${periodeLabel}`}
                        </div>
                    </div>

                    <div className="page-head-actions">
                        <div className="seg">
                            <button className={mode === 'projet' ? 'active' : ''} onClick={() => setMode('projet')}>Par projet</button>
                            <button className={mode === 'mensuel' ? 'active' : ''} onClick={() => setMode('mensuel')}>Par mois</button>
                            <button className={mode === 'annuel' ? 'active' : ''} onClick={() => setMode('annuel')}>Par année</button>
                        </div>
                        {mode !== 'projet' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <button onClick={prevPeriod} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ChevronLeft size={16} color="var(--muted)" />
                                </button>
                                {mode === 'mensuel' && (
                                    <select value={mois} onChange={e => setMois(Number(e.target.value))}
                                        style={{ fontSize: 13, fontWeight: 600, border: '1px solid var(--line)', borderRadius: 8, padding: '4px 8px', color: 'var(--ink)', background: 'var(--surface)', fontFamily: 'inherit' }}>
                                        {MOIS_NOMS.map((n, i) => <option key={i + 1} value={i + 1}>{n}</option>)}
                                    </select>
                                )}
                                <select value={annee} onChange={e => setAnnee(Number(e.target.value))}
                                    style={{ fontSize: 13, fontWeight: 600, border: '1px solid var(--line)', borderRadius: 8, padding: '4px 8px', color: 'var(--ink)', background: 'var(--surface)', fontFamily: 'inherit' }}>
                                    {Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - 2 + i).map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                                <button onClick={nextPeriod} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ChevronRight size={16} color="var(--muted)" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {isLoading ? (
                    <div className="text-center color-slate" style={{ padding: 80 }}>Chargement...</div>
                ) : (
                    <>
                        <div className="kpis">
                            <div className="kpi-tile dark">
                                <div className="kpi-label">Marge brute moyenne</div>
                                <div className="kpi-val">{margeMoyenne}<span className="unit">%</span></div>
                                <div className="kpi-delta up">{projets.length} projet{projets.length !== 1 ? 's' : ''} analysés</div>
                            </div>
                            <div className="kpi-tile">
                                <div className="kpi-label">Honoraires {mode === 'projet' ? 'cumulés' : 'signés'}</div>
                                <div className="kpi-val">{fmt(totalHonoraires)}<span className="unit"> DA</span></div>
                                <div className="kpi-delta">{mode !== 'projet' ? periodeLabel : 'Tous projets'}</div>
                            </div>
                            <div className="kpi-tile">
                                <div className="kpi-label">Total coûts</div>
                                <div className="kpi-val">{fmt(totalCout)}<span className="unit"> DA</span></div>
                                <div className="kpi-delta">dont {fmt(masseSalariale)} DA salaires</div>
                            </div>
                            <div className="kpi-tile">
                                <div className="kpi-label">Bénéfice net</div>
                                <div className="kpi-val" style={{ color: totalProfit < 0 ? 'var(--red)' : undefined }}>
                                    {totalProfit >= 0 ? '+' : ''}{fmt(totalProfit)}<span className="unit"> DA</span>
                                </div>
                                <div className="kpi-delta">{projetsProf}/{projets.length} proj. profitables</div>
                            </div>
                        </div>

                        {projets.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon" style={{ background: 'var(--indigo-soft)' }}><BarChart2 size={24} color="var(--indigo)" /></div>
                                <div className="empty-title">Aucune activité</div>
                                <div className="empty-sub">
                                    {mode === 'projet' ? 'Ajoutez des heures, charges ou sous-traitants' : `Aucune activité sur cette période`}
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="card">
                                    <div className="card-head">
                                        <div>
                                            <div className="card-title">Performance par projet</div>
                                            <div className="card-sub">Triés par marge décroissante</div>
                                        </div>
                                    </div>
                                    <table className="tbl" style={{ tableLayout: 'auto' }}>
                                        <thead>
                                            <tr>
                                                <th>Projet</th>
                                                <th style={{ textAlign: 'right', whiteSpace: 'nowrap', width: 1 }}>Honoraires</th>
                                                <th style={{ textAlign: 'right', whiteSpace: 'nowrap', width: 1 }}>Coût équipe</th>
                                                <th style={{ textAlign: 'right', whiteSpace: 'nowrap', width: 1 }}>Charges</th>
                                                {mode === 'projet' && <th style={{ textAlign: 'right', whiteSpace: 'nowrap', width: 1 }}>Sous-traitants</th>}
                                                <th style={{ textAlign: 'right', whiteSpace: 'nowrap', width: 1 }}>Coût total</th>
                                                <th style={{ textAlign: 'right', whiteSpace: 'nowrap', width: 1 }}>Marge</th>
                                                <th style={{ whiteSpace: 'nowrap', width: 120 }}>Rentabilité</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {projets.map(p => {
                                                const marge = p.marge
                                                const margeColor = marge >= 60 ? 'var(--green)' : marge >= 35 ? 'var(--amber)' : 'var(--red)'
                                                const meterClass = marge >= 60 ? 'green' : marge >= 35 ? 'amber' : 'red'
                                                return (
                                                    <tr key={p.id}>
                                                        <td>
                                                            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{p.nom}</div>
                                                            <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--muted)', marginTop: 1 }}>{{ EN_COURS: 'En cours', TERMINE: 'Terminé', SUSPENDU: 'Suspendu', ANNULE: 'Annulé' }[p.statut] ?? p.statut}</div>
                                                        </td>
                                                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap', fontFamily: 'var(--mono)', fontSize: 13 }}>{Number(p.honoraires).toLocaleString()} DA</td>
                                                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap', fontFamily: 'var(--mono)', fontSize: 13 }}>{Number(p.cout_heures || 0).toLocaleString()} DA</td>
                                                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap', fontFamily: 'var(--mono)', fontSize: 13, color: Number(p.charges || 0) > 0 ? 'var(--red)' : 'var(--muted)' }}>
                                                            {Number(p.charges || 0).toLocaleString()} DA
                                                        </td>
                                                        {mode === 'projet' && (
                                                            <td style={{ textAlign: 'right', whiteSpace: 'nowrap', fontFamily: 'var(--mono)', fontSize: 13 }}>{Number(p.sous_traitants || 0).toLocaleString()} DA</td>
                                                        )}
                                                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600 }}>{Number(p.cout_total || 0).toLocaleString()} DA</td>
                                                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap', fontWeight: 700, fontFamily: 'var(--mono)', fontSize: 13, color: margeColor }}>{marge}%</td>
                                                        <td>
                                                            <div className={`meter ${meterClass}`}>
                                                                <span style={{ width: `${Math.min(Math.abs(marge), 100)}%` }}></span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                            </>
                        )}
                    </>
                )}
            </div>
        </Layout>
    )
}
