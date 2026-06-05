import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    FolderKanban, Plus, X, MapPin, Calendar,
    Home, ShoppingBag, Factory, Building2, Trees, LayoutGrid,
    ArrowRight, List, LayoutGrid as GridIcon, Search
} from 'lucide-react'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import useToast from '../../store/useToast'

const WILAYAS = [
    '01 - Adrar', '02 - Chlef', '03 - Laghouat', '04 - Oum El Bouaghi', '05 - Batna',
    '06 - Béjaïa', '07 - Biskra', '08 - Béchar', '09 - Blida', '10 - Bouira',
    '11 - Tamanrasset', '12 - Tébessa', '13 - Tlemcen', '14 - Tiaret', '15 - Tizi Ouzou',
    '16 - Alger', '17 - Djelfa', '18 - Jijel', '19 - Sétif', '20 - Saïda',
    '21 - Skikda', '22 - Sidi Bel Abbès', '23 - Annaba', '24 - Guelma', '25 - Constantine',
    '26 - Médéa', '27 - Mostaganem', "28 - M'Sila", '29 - Mascara', '30 - Ouargla',
    '31 - Oran', '32 - El Bayadh', '33 - Illizi', '34 - Bordj Bou Arréridj', '35 - Boumerdès',
    '36 - El Tarf', '37 - Tindouf', '38 - Tissemsilt', '39 - El Oued', '40 - Khenchela',
    '41 - Souk Ahras', '42 - Tipaza', '43 - Mila', '44 - Aïn Defla', '45 - Naâma',
    '46 - Aïn Témouchent', '47 - Ghardaïa', '48 - Relizane', '49 - Timimoun',
    '50 - Bordj Badji Mokhtar', '51 - Ouled Djellal', '52 - Béni Abbès', '53 - In Salah',
    "54 - In Guezzam", '55 - Touggourt', '56 - Djanet', "57 - El M'Ghair", '58 - El Meniaa',
]

const STATUTS = {
    EN_COURS: { label: 'En cours', cls: 'tag indigo', color: 'var(--indigo)' },
    TERMINE:  { label: 'Terminé',  cls: 'tag green',  color: 'var(--green)' },
    SUSPENDU: { label: 'Suspendu', cls: 'tag amber',  color: 'var(--amber)' },
    ANNULE:   { label: 'Annulé',   cls: 'tag red',    color: 'var(--red)' },
}

const TYPE_ICONS = {
    LOGEMENT:   Home,
    COMMERCE:   ShoppingBag,
    INDUSTRIEL: Factory,
    EQUIPEMENT: Building2,
    PAYSAGISME: Trees,
    AUTRE:      LayoutGrid,
}

const TYPES = ['LOGEMENT', 'COMMERCE', 'INDUSTRIEL', 'EQUIPEMENT', 'PAYSAGISME', 'AUTRE']

const FILTERS = [
    { key: 'Tous',     label: 'Tous' },
    { key: 'EN_COURS', label: 'En cours' },
    { key: 'SUSPENDU', label: 'Suspendus' },
    { key: 'TERMINE',  label: 'Terminés' },
    { key: 'ANNULE',   label: 'Annulés' },
]

export default function Projets() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { toast } = useToast()
    const [open, setOpen] = useState(false)
    const [filter, setFilter] = useState('Tous')
    const [search, setSearch] = useState('')
    const [view, setView] = useState('liste')
    const [form, setForm] = useState({
        nom: '', type_projet: 'LOGEMENT', wilaya: '',
        adresse_chantier: '', date_debut: '', client_id: ''
    })

    const { data: projets = [], isLoading } = useQuery({
        queryKey: ['projets'],
        queryFn: () => api.get('/projets/').then(r => r.data)
    })

    const { data: clients = [] } = useQuery({
        queryKey: ['clients'],
        queryFn: () => api.get('/projets/clients/').then(r => r.data)
    })

    const mutation = useMutation({
        mutationFn: (data) => api.post('/projets/', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projets'] })
            setOpen(false)
            setForm({ nom: '', type_projet: 'LOGEMENT', wilaya: '', adresse_chantier: '', date_debut: '', client_id: '' })
            toast('Projet créé avec succès')
        },
        onError: (err) => {
            if (err.response?.status === 403) {
                setOpen(false)
                toast(err.response.data.message ?? 'Limite de projets atteinte', 'error')
            } else {
                toast('Erreur lors de la création du projet', 'error')
            }
        }
    })

    const totalCA = projets.reduce((s, p) => s + (p.devis_accepte ? Number(p.devis_accepte.montant_ttc) : 0), 0)

    const afterFilter = filter === 'Tous' ? projets : projets.filter(p => p.statut === filter)
    const filtered = search
        ? afterFilter.filter(p =>
            p.nom.toLowerCase().includes(search.toLowerCase()) ||
            (p.client?.nom || '').toLowerCase().includes(search.toLowerCase()) ||
            (p.wilaya || '').toLowerCase().includes(search.toLowerCase())
          )
        : afterFilter

    const count = (key) => key === 'Tous' ? projets.length : projets.filter(p => p.statut === key).length

    return (
        <Layout>
            <div className="page">

                {/* Header */}
                <div className="page-head">
                    <div>
                        <h1 className="page-title">Projets</h1>
                    </div>
                    <div className="page-head-actions">
                        <button className="btn accent" onClick={() => setOpen(true)}>
                            <Plus size={15} /> Nouveau projet
                        </button>
                    </div>
                </div>

                {/* Toolbar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                    {/* Search */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 32, padding: '0 12px', border: '1px solid var(--line)', borderRadius: 'var(--radius)', background: 'var(--surface)', width: 260 }}>
                        <Search size={13} color="var(--muted)" style={{ flexShrink: 0 }} />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Rechercher par nom, client, wilaya…"
                            style={{ flex: 1, fontSize: 12.5, background: 'transparent', border: 'none', outline: 'none', color: 'var(--ink)' }}
                        />
                    </div>

                    {/* Filter chips */}
                    <div style={{ display: 'flex', gap: 4 }}>
                        {FILTERS.map(f => (
                            <button
                                key={f.key}
                                className={'chip' + (filter === f.key ? ' active' : '')}
                                onClick={() => setFilter(f.key)}
                            >
                                {f.label}
                                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, opacity: 0.7 }}>{count(f.key)}</span>
                            </button>
                        ))}
                    </div>

                    {/* View toggle */}
                    <div className="seg" style={{ marginLeft: 'auto' }}>
                        <button className={view === 'liste' ? 'active' : ''} onClick={() => setView('liste')}>
                            <List size={13} />
                        </button>
                        <button className={view === 'cartes' ? 'active' : ''} onClick={() => setView('cartes')}>
                            <GridIcon size={13} />
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 80 }}>Chargement...</div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon" style={{ background: 'var(--indigo-soft)' }}>
                            <FolderKanban size={24} color="var(--indigo)" />
                        </div>
                        <div className="empty-title">{search ? 'Aucun résultat' : 'Aucun projet'}</div>
                        <div className="empty-sub">{search ? `Aucun projet ne correspond à "${search}"` : 'Créez votre premier projet d\'architecture'}</div>
                        {!search && (
                            <button className="btn accent" onClick={() => setOpen(true)}>
                                <Plus size={15} /> Nouveau projet
                            </button>
                        )}
                    </div>
                ) : view === 'liste' ? (

                    /* ── TABLE VIEW ── */
                    <div className="card">
                        <table className="tbl">
                            <thead>
                                <tr>
                                    <th>Projet</th>
                                    <th>Client</th>
                                    <th>Wilaya</th>
                                    <th>Échéance</th>
                                    <th>Statut</th>
                                    <th className="r">Honoraires</th>
                                    <th style={{ width: 40 }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(p => {
                                    const s = STATUTS[p.statut]
                                    const Icon = TYPE_ICONS[p.type_projet] ?? LayoutGrid
                                    return (
                                        <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/projets/${p.id}`)}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--indigo-soft)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                                                        <Icon size={15} color="var(--indigo)" />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>{p.nom}</div>
                                                        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{p.type_projet}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ fontSize: 13, color: p.client?.nom ? 'var(--ink)' : 'var(--muted)' }}>
                                                {p.client?.nom ?? '—'}
                                            </td>
                                            <td>
                                                {p.wilaya
                                                    ? <span className="tag line" style={{ fontSize: 11 }}>{p.wilaya.split(' - ')[0]} · {p.wilaya.split(' - ')[1]}</span>
                                                    : <span style={{ color: 'var(--muted)' }}>—</span>
                                                }
                                            </td>
                                            <td style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--muted)' }}>
                                                {p.date_fin_prevue ?? '—'}
                                            </td>
                                            <td>
                                                <span className={s?.cls ?? 'tag neutral'}>
                                                    <span className="dot" />
                                                    {s?.label ?? p.statut}
                                                </span>
                                            </td>
                                            <td className="num">
                                                {p.devis_accepte
                                                    ? <>{Number(p.devis_accepte.montant_ttc).toLocaleString('fr-DZ')} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>DA</span></>
                                                    : <span style={{ color: 'var(--muted)', fontFamily: 'var(--sans)', fontWeight: 400, fontSize: 12 }}>—</span>
                                                }
                                            </td>
                                            <td onClick={e => { e.stopPropagation(); navigate(`/projets/${p.id}`) }}>
                                                <button className="btn sm icon-only ghost">
                                                    <ArrowRight size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                ) : (

                    /* ── CARDS VIEW ── */
                    <div className="grid-cards">
                        {filtered.map((projet) => {
                            const s = STATUTS[projet.statut]
                            const Icon = TYPE_ICONS[projet.type_projet] ?? LayoutGrid
                            return (
                                <div key={projet.id} className="proj-card" onClick={() => navigate(`/projets/${projet.id}`)}>
                                    <div className="proj-card-accent" style={{ background: s?.color ?? 'var(--indigo)' }} />
                                    <div className="flex-between" style={{ marginBottom: 14 }}>
                                        <div className="proj-type-chip">
                                            <Icon size={13} color="var(--indigo)" />
                                            {projet.type_projet}
                                        </div>
                                        <span className={s?.cls ?? 'tag neutral'}>
                                            <span className="dot" />{s?.label ?? projet.statut}
                                        </span>
                                    </div>
                                    <div className="proj-name">{projet.nom}</div>
                                    <div className="proj-meta-row">
                                        <div className="proj-meta-item">
                                            <MapPin size={11} color="var(--muted)" />{projet.wilaya ?? '—'}
                                        </div>
                                        <div className="proj-meta-item">
                                            <Calendar size={11} color="var(--muted)" />{projet.date_debut ?? '—'}
                                        </div>
                                    </div>
                                    <div className="proj-divider" />
                                    <div className="proj-footer">
                                        <span className="proj-hon">
                                            {projet.devis_accepte
                                                ? <>{Number(projet.devis_accepte.montant_ttc).toLocaleString('fr-DZ')}<span> DA</span></>
                                                : <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--muted)' }}>En attente de devis</span>
                                            }
                                        </span>
                                        {projet.client?.nom && (
                                            <div className="proj-client">
                                                <div className="proj-client-av">{projet.client.nom[0]?.toUpperCase()}</div>
                                                <span className="proj-client-name">{projet.client.nom}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Modal nouveau projet */}
            {open && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 200, backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setOpen(false)}>
                    <div style={{ background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: 540, boxShadow: '0 24px 80px rgba(0,0,0,0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--indigo-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FolderKanban size={20} color="var(--indigo)" />
                                </div>
                                <div>
                                    <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.3px' }}>Nouveau projet</div>
                                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>Renseignez les informations du projet</div>
                                </div>
                            </div>
                            <button onClick={() => setOpen(false)} style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--bg)', border: '1px solid var(--line)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
                                <X size={15} />
                            </button>
                        </div>
                        <div style={{ padding: '24px 28px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                            <div className="field">
                                <label>Nom du projet</label>
                                <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="Ex: Villa Dupont" />
                            </div>
                            <div className="field">
                                <label>Client</label>
                                <select value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })}>
                                    <option value="">Sélectionner un client</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                                </select>
                            </div>
                            <div className="field">
                                <label>Type de projet</label>
                                <select value={form.type_projet} onChange={e => setForm({ ...form, type_projet: e.target.value })}>
                                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="field">
                                <label>Wilaya</label>
                                <select value={form.wilaya} onChange={e => setForm({ ...form, wilaya: e.target.value })}>
                                    <option value="">Sélectionner une wilaya</option>
                                    {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                                </select>
                            </div>
                            <div className="field">
                                <label>Adresse chantier</label>
                                <input value={form.adresse_chantier} onChange={e => setForm({ ...form, adresse_chantier: e.target.value })} />
                            </div>
                            <div className="field">
                                <label>Date de début</label>
                                <input type="date" value={form.date_debut} onChange={e => setForm({ ...form, date_debut: e.target.value })} />
                            </div>
                        </div>
                        <div style={{ padding: '16px 28px 24px', borderTop: '1px solid var(--line)', display: 'flex', gap: 10, flexShrink: 0 }}>
                            <button onClick={() => setOpen(false)} style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid var(--line)', background: 'var(--surface)', fontSize: 13, fontWeight: 600, color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
                            <button style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: 'var(--grad)', color: 'white', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: mutation.isPending ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(17,0,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: mutation.isPending ? 0.7 : 1 }}
                                onClick={() => mutation.mutate(form)} disabled={mutation.isPending}>
                                {mutation.isPending ? 'Création...' : 'Créer le projet'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    )
}
