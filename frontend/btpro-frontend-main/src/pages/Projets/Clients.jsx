import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserPlus, MapPin, X, Building2, FileText, Pencil, Trash2, Search } from 'lucide-react'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import ConfirmModal from '../../components/ConfirmModal'

const GRADIENTS = [
    ['var(--indigo)', '#8B5CF6'],
    ['#10B981', '#059669'],
    ['#F59E0B', '#D97706'],
    ['#EF4444', '#DC2626'],
    ['#3B82F6', '#2563EB'],
    ['#EC4899', '#DB2777'],
    ['#8B5CF6', '#7C3AED'],
    ['#06B6D4', '#0891B2'],
]

function getGradient(name) {
    let hash = 0
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
    return GRADIENTS[Math.abs(hash) % GRADIENTS.length]
}

const EMPTY_FORM = { type: 'PARTICULIER', nom: '', contact_nom: '', telephone: '', email: '', adresse: '', numero_rc: '', nif: '', ai: '', nis: '' }

export default function Clients() {
    const queryClient = useQueryClient()
    const [search, setSearch] = useState('')
    const [filterType, setFilterType] = useState('TOUS')
    const [modal, setModal] = useState(null)
    const [form, setForm] = useState(EMPTY_FORM)
    const [confirmDel, setConfirmDel] = useState(null)

    const isEdit = modal && modal !== 'new'

    const { data: clients, isLoading } = useQuery({
        queryKey: ['clients'],
        queryFn: () => api.get('/projets/clients/').then(r => r.data)
    })

    const createMutation = useMutation({
        mutationFn: (data) => api.post('/projets/clients/', data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clients'] }); closeModal() }
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, ...data }) => api.put(`/projets/clients/${id}/`, data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clients'] }); closeModal() }
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/projets/clients/${id}/`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] })
    })

    const clientsList = clients || []
    const typeOf = (c) => (c.type || '').toUpperCase()
    const countParticuliers = clientsList.filter(c => typeOf(c) === 'PARTICULIER').length
    const countEntreprises = clientsList.filter(c => typeOf(c) === 'ENTREPRISE').length

    const filtered = clientsList.filter(c => {
        const matchSearch = c.nom.toLowerCase().includes(search.toLowerCase()) ||
            (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
        const matchType = filterType === 'TOUS' || typeOf(c) === filterType
        return matchSearch && matchType
    })

    const setF = (key, val) => setForm(f => ({ ...f, [key]: val }))

    const openNew = () => { setForm(EMPTY_FORM); setModal('new') }
    const openEdit = (client) => {
        setForm({
            type: client.type || 'PARTICULIER',
            nom: client.nom || '',
            contact_nom: client.contact_nom || '',
            telephone: client.telephone || '',
            email: client.email || '',
            adresse: client.adresse || '',
            numero_rc: client.numero_rc || '',
            nif: client.nif || '',
            ai: client.ai || '',
            nis: client.nis || '',
        })
        setModal(client)
    }
    const closeModal = () => { setModal(null); setForm(EMPTY_FORM) }

    const handleSubmit = () => {
        if (isEdit) updateMutation.mutate({ id: modal.id, ...form })
        else createMutation.mutate(form)
    }

    const isPending = createMutation.isPending || updateMutation.isPending
    const hasFiscal = (c) => c.numero_rc || c.nif || c.nis

    return (
        <Layout>
            <div className="page">
                <div className="page-head">
                    <div>
                        <h1 className="page-title">Clients</h1>
                        <div className="page-sub">{clientsList.length} client(s) enregistré(s)</div>
                    </div>
                    <div className="page-head-actions">
                        <button className="btn accent" onClick={openNew}>
                            <UserPlus size={16} /> Nouveau client
                        </button>
                    </div>
                </div>

                {clientsList.length > 0 && (
                    <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Rechercher par nom, NIF, contact…"
                                style={{ padding: '8px 12px 8px 32px', borderRadius: 10, border: '1.5px solid var(--line)', fontSize: 13, color: 'var(--ink)', fontFamily: 'inherit', outline: 'none', width: 280, background: 'var(--surface)' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button className={'chip' + (filterType === 'TOUS' ? ' active' : '')} onClick={() => setFilterType('TOUS')}>Tous · {clientsList.length}</button>
                            <button className={'chip' + (filterType === 'PARTICULIER' ? ' active' : '')} onClick={() => setFilterType('PARTICULIER')}>Particuliers · {countParticuliers}</button>
                            <button className={'chip' + (filterType === 'ENTREPRISE' ? ' active' : '')} onClick={() => setFilterType('ENTREPRISE')}>Entreprises · {countEntreprises}</button>
                        </div>
                    </div>
                )}

                {isLoading ? (
                    <div className="text-center color-slate" style={{ padding: 80, fontSize: 15 }}>Chargement...</div>
                ) : clientsList.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon" style={{ background: 'linear-gradient(135deg,var(--indigo-soft),#E0E7FF)' }}>
                            <UserPlus size={28} color="var(--indigo)" />
                        </div>
                        <div className="empty-title">Aucun client</div>
                        <div className="empty-sub">Ajoutez votre premier client pour commencer</div>
                        <button className="btn accent" onClick={openNew}><UserPlus size={15} /> Ajouter un client</button>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon" style={{ background: '#F1F5F9' }}>
                            <UserPlus size={28} color="#94A3B8" />
                        </div>
                        <div className="empty-title">Aucun résultat</div>
                        <div className="empty-sub">Aucun client ne correspond à "{search}"</div>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                        {filtered.map(client => {
                            const [c1, c2] = getGradient(client.nom)
                            const initials = client.nom.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
                            return (
                                <div key={client.id} className="card" style={{ cursor: 'default' }}>
                                    <div style={{ padding: '20px 20px 16px', display: 'flex', alignItems: 'start', gap: 14 }}>
                                        <div style={{
                                            width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                                            background: `linear-gradient(135deg, ${c1}, ${c2})`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 17, fontWeight: 800, color: 'white',
                                        }}>
                                            {initials}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, fontSize: 14.5, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--ink)' }}>
                                                {client.nom}
                                            </div>
                                            {client.nif ? (
                                                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 4, fontFamily: 'var(--mono)' }}>NIF · {client.nif}</div>
                                            ) : client.contact_nom ? (
                                                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <Building2 size={11} color="var(--muted)" /> {client.contact_nom}
                                                </div>
                                            ) : null}
                                        </div>
                                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                            <button
                                                onClick={() => openEdit(client)}
                                                style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--bg-2)', border: '1px solid var(--line)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}
                                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--indigo-soft)'; e.currentTarget.style.color = 'var(--indigo)' }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-2)'; e.currentTarget.style.color = 'var(--muted)' }}>
                                                <Pencil size={12} />
                                            </button>
                                            <button
                                                onClick={() => setConfirmDel(client)}
                                                style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--bg-2)', border: '1px solid var(--line)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}
                                                onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#EF4444' }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-2)'; e.currentTarget.style.color = 'var(--muted)' }}>
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ padding: '0 20px 14px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                        <span className={`tag ${typeOf(client) === 'ENTREPRISE' ? 'indigo' : ''}`}>
                                            {typeOf(client) === 'ENTREPRISE' ? 'Entreprise' : 'Particulier'}
                                        </span>
                                        {client.numero_rc && (
                                            <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: 'var(--bg-2)', border: '1px solid var(--line)', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
                                                RC {client.numero_rc}
                                            </span>
                                        )}
                                        {client.nis && (
                                            <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: 'var(--bg-2)', border: '1px solid var(--line)', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
                                                NIS {client.nis}
                                            </span>
                                        )}
                                    </div>

                                    <div style={{ margin: '0 20px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: 12, background: 'var(--bg-2)', borderRadius: 8 }}>
                                        <div>
                                            <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Téléphone</div>
                                            {client.telephone ? (
                                                <a href={`tel:${client.telephone}`} style={{ fontSize: 12.5, fontWeight: 500, marginTop: 2, display: 'block', textDecoration: 'none', color: 'var(--ink)' }}>{client.telephone}</a>
                                            ) : (
                                                <div style={{ fontSize: 13, marginTop: 2, color: '#CBD5E1' }}>—</div>
                                            )}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Email</div>
                                            {client.email ? (
                                                <a href={`mailto:${client.email}`} style={{ fontSize: 12, marginTop: 2, display: 'block', textDecoration: 'none', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.email}</a>
                                            ) : (
                                                <div style={{ fontSize: 13, marginTop: 2, color: '#CBD5E1' }}>—</div>
                                            )}
                                        </div>
                                    </div>

                                    {client.adresse && (
                                        <div style={{ padding: '0 20px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <MapPin size={12} color="var(--muted)" />
                                            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{client.adresse}</span>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {modal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 200, backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={closeModal}>
                    <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 520, boxShadow: '0 24px 80px rgba(0,0,0,0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '24px 28px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--indigo-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {isEdit ? <Pencil size={18} color="var(--indigo)" /> : <UserPlus size={20} color="var(--indigo)" />}
                                </div>
                                <div>
                                    <div style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' }}>
                                        {isEdit ? `Modifier ${modal.nom}` : 'Nouveau client'}
                                    </div>
                                    <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 1 }}>Particulier ou entreprise</div>
                                </div>
                            </div>
                            <button onClick={closeModal} style={{ width: 34, height: 34, borderRadius: 9, background: '#F8FAFC', border: '1px solid #E2E8F0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                                <X size={15} />
                            </button>
                        </div>

                        <div style={{ padding: '24px 28px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 10, padding: 3, gap: 2, marginBottom: 20 }}>
                                {[{ key: 'PARTICULIER', label: 'Particulier' }, { key: 'ENTREPRISE', label: 'Entreprise' }].map(({ key, label }) => (
                                    <button key={key} type="button" onClick={() => setF('type', key)} style={{
                                        flex: 1, padding: '7px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                        fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                                        background: form.type === key ? '#fff' : 'transparent',
                                        color: form.type === key ? 'var(--indigo)' : '#64748B',
                                        boxShadow: form.type === key ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
                                        transition: 'all .15s',
                                    }}>{label}</button>
                                ))}
                            </div>

                            <div className="field">
                                <label>{form.type === 'ENTREPRISE' ? 'Raison sociale / Nom entreprise' : 'Nom complet'}</label>
                                <input value={form.nom} onChange={e => setF('nom', e.target.value)}
                                    placeholder={form.type === 'ENTREPRISE' ? 'Ex: Dupont Construction SARL' : 'Ex: Ahmed Benali'} />
                            </div>

                            {form.type === 'ENTREPRISE' && (
                                <div className="field">
                                    <label>Responsable / Contact</label>
                                    <input value={form.contact_nom} onChange={e => setF('contact_nom', e.target.value)} placeholder="Nom du responsable" />
                                </div>
                            )}

                            <div className="grid-2" style={{ alignItems: 'start' }}>
                                <div className="field">
                                    <label>Téléphone</label>
                                    <input value={form.telephone} onChange={e => setF('telephone', e.target.value)} placeholder="0555 00 00 00" />
                                </div>
                                <div className="field">
                                    <label>Email</label>
                                    <input type="email" value={form.email} onChange={e => setF('email', e.target.value)} placeholder="contact@email.com" />
                                </div>
                            </div>
                            <div className="field">
                                <label>Adresse</label>
                                <input value={form.adresse} onChange={e => setF('adresse', e.target.value)} placeholder="Adresse complète" />
                            </div>

                            {form.type === 'ENTREPRISE' && (
                                <>
                                    <div style={{ height: 1, background: '#F1F5F9', margin: '8px 0 16px' }} />
                                    <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        <FileText size={12} color="#94A3B8" /> Identifiants fiscaux <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optionnel)</span>
                                    </div>
                                    <div className="grid-2">
                                        <div className="field"><label>RC</label><input value={form.numero_rc} onChange={e => setF('numero_rc', e.target.value)} placeholder="N° RC" /></div>
                                        <div className="field"><label>NIF</label><input value={form.nif} onChange={e => setF('nif', e.target.value)} placeholder="NIF" /></div>
                                        <div className="field"><label>AI</label><input value={form.ai} onChange={e => setF('ai', e.target.value)} placeholder="Article d'imposition" /></div>
                                        <div className="field"><label>NIS</label><input value={form.nis} onChange={e => setF('nis', e.target.value)} placeholder="NIS" /></div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div style={{ padding: '16px 28px 24px', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 10, flexShrink: 0 }}>
                            <button onClick={closeModal} style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: 'white', fontSize: 13, fontWeight: 600, color: '#64748B', cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
                            <button style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: 'var(--grad)', color: 'white', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: isPending ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(17,0,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: isPending ? 0.7 : 1 }}
                                onClick={handleSubmit} disabled={isPending}>
                                {isPending ? 'Enregistrement...' : isEdit ? 'Enregistrer les modifications' : 'Créer le client'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                open={!!confirmDel}
                title="Supprimer le client"
                message={`"${confirmDel?.nom}" sera définitivement supprimé. Les projets associés ne seront pas affectés.`}
                onConfirm={() => deleteMutation.mutate(confirmDel.id)}
                onCancel={() => setConfirmDel(null)}
            />
        </Layout>
    )
}
