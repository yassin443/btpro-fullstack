import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Handshake, Plus, X, Phone, Mail,
    DollarSign, CheckCircle, Clock, Pencil, Trash2, Info,
} from 'lucide-react'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import useToast from '../../store/useToast'

const TYPES = {
    BET_STRUCTURE: 'BET Structure',
    BET_FLUIDES:   'BET Fluides',
    ECONOMISTE:    'Économiste',
    GEOMETRE:      'Géomètre',
    GEOTECHNIQUE:  'Géotechnique',
    ELECTRICIEN:   'Électricien',
    PLOMBIER:      'Plombier',
    MENUISIER:     'Menuisier',
    PEINTRE:       'Peintre',
    AUTRE:         'Autre',
}

const FORM_VIDE = {
    nom: '', type_prestation: 'BET_STRUCTURE',
    telephone: '', email: '', projet: '',
    montant: '', date_debut: '', date_fin: '', notes: '',
}

function payload(f) {
    const d = {
        nom:             f.nom,
        type_prestation: f.type_prestation,
        montant:         f.montant || '0',
    }
    if (f.telephone)  d.telephone  = f.telephone
    if (f.email)      d.email      = f.email
    if (f.projet)     d.projet     = Number(f.projet)
    if (f.date_debut) d.date_debut = f.date_debut
    if (f.date_fin)   d.date_fin   = f.date_fin
    if (f.notes)      d.notes      = f.notes
    return d
}

// ─── composants module-level ──────────────────────────────────────────────────

function Overlay({ onClose, children }) {
    return (
        <div
            style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            onClick={onClose}
        >
            <div onClick={e => e.stopPropagation()}>{children}</div>
        </div>
    )
}

function Modal({ onClose, title, subtitle, children, footer }) {
    return (
        <Overlay onClose={onClose}>
            <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 500, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
                <div style={{ padding: '22px 28px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--indigo-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Handshake size={19} color="var(--indigo)" />
                        </div>
                        <div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>{title}</div>
                            {subtitle && <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 1 }}>{subtitle}</div>}
                        </div>
                    </div>
                    <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                        <X size={14} />
                    </button>
                </div>
                <div style={{ padding: '22px 28px', flex: 1, overflowY: 'auto' }}>{children}</div>
                {footer && (
                    <div style={{ padding: '14px 28px 22px', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 10, flexShrink: 0 }}>
                        {footer}
                    </div>
                )}
            </div>
        </Overlay>
    )
}

function Formulaire({ f, maj, projets }) {
    const set = (k, v) => maj(p => ({ ...p, [k]: v }))
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="field">
                <label>Nom *</label>
                <input value={f.nom} onChange={e => set('nom', e.target.value)} placeholder="BET Structure Alger" />
            </div>
            <div className="field">
                <label>Type</label>
                <select value={f.type_prestation} onChange={e => set('type_prestation', e.target.value)}>
                    {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
                <div className="field" style={{ flex: 1 }}>
                    <label>Téléphone</label>
                    <input value={f.telephone} onChange={e => set('telephone', e.target.value)} placeholder="0555 00 00 00" />
                </div>
                <div className="field" style={{ flex: 1 }}>
                    <label>Email</label>
                    <input type="email" value={f.email} onChange={e => set('email', e.target.value)} placeholder="contact@bet.dz" />
                </div>
            </div>
            <div className="field">
                <label>Projet lié</label>
                <select value={f.projet} onChange={e => set('projet', e.target.value)}>
                    <option value="">— Aucun —</option>
                    {projets.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                </select>
            </div>
            <div className="field">
                <label>Montant du contrat (DA)</label>
                <input type="number" min="0" value={f.montant} onChange={e => set('montant', e.target.value)} placeholder="0" />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
                <div className="field" style={{ flex: 1 }}>
                    <label>Date début</label>
                    <input type="date" value={f.date_debut} onChange={e => set('date_debut', e.target.value)} />
                </div>
                <div className="field" style={{ flex: 1 }}>
                    <label>Date fin</label>
                    <input type="date" value={f.date_fin} onChange={e => set('date_fin', e.target.value)} />
                </div>
            </div>
            <div className="field">
                <label>Notes</label>
                <textarea value={f.notes} onChange={e => set('notes', e.target.value)} placeholder="Observations..." rows={2} style={{ resize: 'vertical' }} />
            </div>
        </div>
    )
}

function Carte({ st, onTogglePaye, onEdit, onDelete }) {
    const montant = Number(st.montant) || 0

    return (
        <div className="card" style={{ padding: 22, transition: 'transform 0.15s, box-shadow 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.07)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>

            {/* nom + type + badge payé */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg,#8B5CF6,var(--indigo))', color: '#fff', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {st.nom[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{st.nom}</div>
                    <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 1 }}>{TYPES[st.type_prestation] || st.type_prestation}</div>
                </div>
                {st.paye
                    ? <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#ECFDF5', color: '#10B981', flexShrink: 0 }}>Payé ✓</span>
                    : <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#FEF9EC', color: '#F59E0B', flexShrink: 0 }}>Non payé</span>
                }
            </div>

            {/* projet */}
            <div style={{ marginBottom: 14 }}>
                {st.projet_nom
                    ? <span className="tag indigo">Projet : {st.projet_nom}</span>
                    : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#F59E0B', background: '#FFFBEB', padding: '3px 8px', borderRadius: 6 }}>
                          <Info size={11} /> Sans projet — absent de la rentabilité
                      </span>
                }
            </div>

            {/* montant */}
            <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '14px 18px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#64748B' }}>Montant du contrat</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>{montant.toLocaleString()} DA</span>
            </div>

            {/* actions */}
            <div style={{ display: 'flex', gap: 8 }}>
                <button
                    onClick={() => onTogglePaye(st)}
                    style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        padding: '8px 12px', borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                        border: st.paye ? '1.5px solid #E2E8F0' : '1.5px solid #10B981',
                        background: st.paye ? '#F8FAFC' : '#ECFDF5',
                        color: st.paye ? '#64748B' : '#10B981',
                    }}
                >
                    <CheckCircle size={13} />
                    {st.paye ? 'Marquer non payé' : 'Marquer payé'}
                </button>
                <button onClick={() => onEdit(st)} style={{ padding: '8px 10px', borderRadius: 9, border: '1.5px solid #E2E8F0', background: '#fff', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <Pencil size={13} />
                </button>
                <button onClick={() => onDelete(st.id)} style={{ padding: '8px 10px', borderRadius: 9, border: '1.5px solid #FEE2E2', background: '#FEF2F2', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <Trash2 size={13} />
                </button>
            </div>

            {(st.telephone || st.email) && (
                <div style={{ display: 'flex', gap: 16, borderTop: '1px solid #F1F5F9', paddingTop: 10, marginTop: 12 }}>
                    {st.telephone && <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748B' }}><Phone size={11} /> {st.telephone}</span>}
                    {st.email    && <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748B' }}><Mail size={11} /> {st.email}</span>}
                </div>
            )}
        </div>
    )
}

function ConfirmSupprimer({ onAnnuler, onConfirmer, loading }) {
    return (
        <Overlay onClose={onAnnuler}>
            <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 380, padding: 28, boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <Trash2 size={20} color="#EF4444" />
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>Supprimer ce sous-traitant ?</div>
                <div style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>Cette action est irréversible.</div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={onAnnuler} style={{ flex: 1, padding: 10, borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', fontSize: 13, fontWeight: 600, color: '#64748B', cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
                    <button onClick={onConfirmer} disabled={loading} style={{ flex: 1, padding: 10, borderRadius: 10, border: 'none', background: '#EF4444', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                        {loading ? 'Suppression...' : 'Supprimer'}
                    </button>
                </div>
            </div>
        </Overlay>
    )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function SousTraitants() {
    const qc = useQueryClient()
    const { toast } = useToast()

    const [ouvertCreation, setOuvertCreation] = useState(false)
    const [formCreation,   setFormCreation]   = useState(FORM_VIDE)
    const [cibleEdition,   setCibleEdition]   = useState(null)
    const [formEdition,    setFormEdition]    = useState(FORM_VIDE)
    const [idSupprimer,    setIdSupprimer]    = useState(null)

    const { data: liste = [], isLoading } = useQuery({
        queryKey: ['sous-traitants'],
        queryFn:  () => api.get('/projets/sous-traitants/').then(r => r.data),
    })
    const { data: stats } = useQuery({
        queryKey: ['stats-sous-traitants'],
        queryFn:  () => api.get('/projets/sous-traitants/stats/').then(r => r.data),
    })
    const { data: projets = [] } = useQuery({
        queryKey: ['projets'],
        queryFn:  () => api.get('/projets/').then(r => r.data),
    })

    const refresh = () => {
        qc.invalidateQueries({ queryKey: ['sous-traitants'] })
        qc.invalidateQueries({ queryKey: ['stats-sous-traitants'] })
    }

    const mutCreer = useMutation({
        mutationFn: f => api.post('/projets/sous-traitants/', payload(f)),
        onSuccess: () => { refresh(); setOuvertCreation(false); setFormCreation(FORM_VIDE); toast('Sous-traitant ajouté') },
        onError:   () => toast('Erreur lors de l\'ajout', 'error'),
    })

    const mutModifier = useMutation({
        mutationFn: f => api.put(`/projets/sous-traitants/${cibleEdition.id}/`, payload(f)),
        onSuccess: () => { refresh(); setCibleEdition(null); toast('Mis à jour') },
        onError:   () => toast('Erreur lors de la mise à jour', 'error'),
    })

    const mutSupprimer = useMutation({
        mutationFn: id => api.delete(`/projets/sous-traitants/${id}/`),
        onSuccess: () => { refresh(); setIdSupprimer(null); toast('Supprimé', 'info') },
    })

    const mutTogglePaye = useMutation({
        mutationFn: st => api.put(`/projets/sous-traitants/${st.id}/`, { paye: !st.paye }),
        onSuccess: (_, st) => { refresh(); toast(st.paye ? 'Marqué non payé' : 'Marqué comme payé') },
        onError:   () => toast('Erreur', 'error'),
    })

    function ouvrirEdition(st) {
        setCibleEdition(st)
        setFormEdition({
            nom:             st.nom             || '',
            type_prestation: st.type_prestation || 'BET_STRUCTURE',
            telephone:       st.telephone       || '',
            email:           st.email           || '',
            projet:          st.projet          ? String(st.projet) : '',
            montant:         st.montant         || '',
            date_debut:      st.date_debut      || '',
            date_fin:        st.date_fin        || '',
            notes:           st.notes           || '',
        })
    }

    return (
        <Layout>
            <div className="page">
                <div className="page-head">
                    <div>
                        <h1 className="page-title">Sous-traitants</h1>
                        <div className="page-sub">BET, ingénieurs et prestataires externes</div>
                    </div>
                    <div className="page-head-actions">
                        <button className="btn accent" onClick={() => setOuvertCreation(true)}>
                            <Plus size={15} /> Ajouter
                        </button>
                    </div>
                </div>

                <div className="stats stats-4">
                    <div className="stat">
                        <div className="stat-icon" style={{ background: 'var(--indigo-soft)' }}><DollarSign size={18} color="var(--indigo)" /></div>
                        <div className="stat-label">Total contrats</div>
                        <div className="stat-val" style={{ fontSize: 18 }}>{Number(stats?.total_contrats ?? 0).toLocaleString()} DA</div>
                    </div>
                    <div className="stat">
                        <div className="stat-icon" style={{ background: '#ECFDF5' }}><CheckCircle size={18} color="#10B981" /></div>
                        <div className="stat-label">Total payé</div>
                        <div className="stat-val" style={{ fontSize: 18 }}>{Number(stats?.total_paye ?? 0).toLocaleString()} DA</div>
                    </div>
                    <div className="stat">
                        <div className="stat-icon" style={{ background: '#FFFBEB' }}><Clock size={18} color="#F59E0B" /></div>
                        <div className="stat-label">Reste à payer</div>
                        <div className="stat-val" style={{ fontSize: 18 }}>{Number(stats?.total_reste ?? 0).toLocaleString()} DA</div>
                    </div>
                    <div className="stat">
                        <div className="stat-icon" style={{ background: '#F0F9FF' }}><Handshake size={18} color="#0EA5E9" /></div>
                        <div className="stat-label">Non payés</div>
                        <div className="stat-val">{stats?.actifs ?? 0}</div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="text-center color-slate" style={{ padding: 80 }}>Chargement...</div>
                ) : liste.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon" style={{ background: 'var(--indigo-soft)' }}><Handshake size={24} color="var(--indigo)" /></div>
                        <div className="empty-title">Aucun sous-traitant</div>
                        <div className="empty-sub">Ajoutez vos BET et prestataires externes</div>
                        <button className="btn accent" onClick={() => setOuvertCreation(true)}><Plus size={14} /> Ajouter</button>
                    </div>
                ) : (
                    <div className="grid-cards">
                        {liste.map(st => (
                            <Carte
                                key={st.id}
                                st={st}
                                onTogglePaye={s => mutTogglePaye.mutate(s)}
                                onEdit={ouvrirEdition}
                                onDelete={id => setIdSupprimer(id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {ouvertCreation && (
                <Modal
                    onClose={() => { setOuvertCreation(false); setFormCreation(FORM_VIDE) }}
                    title="Nouveau sous-traitant"
                    footer={<>
                        <button onClick={() => { setOuvertCreation(false); setFormCreation(FORM_VIDE) }} style={{ padding: '10px 18px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', fontSize: 13, fontWeight: 600, color: '#64748B', cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
                        <button onClick={() => mutCreer.mutate(formCreation)} disabled={mutCreer.isPending} style={{ flex: 1, padding: 11, borderRadius: 10, border: 'none', background: 'var(--grad)', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: mutCreer.isPending ? 'not-allowed' : 'pointer', opacity: mutCreer.isPending ? 0.7 : 1 }}>
                            {mutCreer.isPending ? 'Ajout...' : 'Ajouter'}
                        </button>
                    </>}
                >
                    <Formulaire f={formCreation} maj={setFormCreation} projets={projets} />
                </Modal>
            )}

            {cibleEdition && (
                <Modal
                    onClose={() => setCibleEdition(null)}
                    title="Modifier"
                    subtitle={cibleEdition.nom}
                    footer={<>
                        <button onClick={() => setCibleEdition(null)} style={{ padding: '10px 18px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', fontSize: 13, fontWeight: 600, color: '#64748B', cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
                        <button onClick={() => mutModifier.mutate(formEdition)} disabled={mutModifier.isPending} style={{ flex: 1, padding: 11, borderRadius: 10, border: 'none', background: 'var(--grad)', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: mutModifier.isPending ? 'not-allowed' : 'pointer', opacity: mutModifier.isPending ? 0.7 : 1 }}>
                            {mutModifier.isPending ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                    </>}
                >
                    <Formulaire f={formEdition} maj={setFormEdition} projets={projets} />
                </Modal>
            )}

            {idSupprimer && (
                <ConfirmSupprimer
                    onAnnuler={() => setIdSupprimer(null)}
                    onConfirmer={() => mutSupprimer.mutate(idSupprimer)}
                    loading={mutSupprimer.isPending}
                />
            )}
        </Layout>
    )
}
