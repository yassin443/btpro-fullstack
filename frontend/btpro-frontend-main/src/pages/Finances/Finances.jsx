import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Receipt, TrendingUp, AlertCircle, Plus, X, FileText, ClipboardList, Download, CreditCard, Wallet, Pencil, Trash2, ArrowRight } from 'lucide-react'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import { printDoc } from '../../components/documents/printDoc'
import useToast from '../../store/useToast'
import ConfirmModal from '../../components/ConfirmModal'

const STATUTS = {
    EMISE: { label: 'Émise', badge: 'tag indigo' },
    ENVOYEE: { label: 'Envoyée', badge: 'tag blue' },
    ENVOYE: { label: 'Envoyé', badge: 'tag blue' },
    PARTIELLEMENT_PAYEE: { label: 'Partiel', badge: 'tag amber' },
    SOLDEE: { label: 'Soldée', badge: 'tag green' },
    ANNULEE: { label: 'Annulée', badge: 'tag red' },
    BROUILLON: { label: 'Brouillon', badge: 'tag neutral' },
    ACCEPTE: { label: 'Accepté', badge: 'tag green' },
    REFUSE: { label: 'Refusé', badge: 'tag red' },
}

const CATEGORIES_CHARGE = [
    { key: 'DEPLACEMENT', label: 'Déplacement' }, { key: 'CARBURANT', label: 'Carburant' },
    { key: 'ACCIDENT', label: 'Accident / Assurance' }, { key: 'LOYER', label: 'Loyer local' },
    { key: 'MOBILIER', label: 'Mobilier / Équipement' }, { key: 'LOGICIEL', label: 'Logiciels' },
    { key: 'SALAIRE', label: 'Salaires' }, { key: 'IMPOTS', label: 'Impôts / Taxes' },
    { key: 'AUTRE', label: 'Autre' },
]
const CAT_LABEL = Object.fromEntries(CATEGORIES_CHARGE.map(c => [c.key, c.label]))

const MODES_PAIEMENT = [
    { key: 'VIREMENT', label: 'Virement' }, { key: 'CHEQUE', label: 'Chèque' },
    { key: 'ESPECES', label: 'Espèces' }, { key: 'CCP', label: 'CCP' },
]

const CONDITIONS_PAIEMENT = [
    { key: 'RECEPTION', label: 'À réception' },
    { key: '30J', label: '30 jours nets' },
    { key: '45J', label: '45 jours nets' },
    { key: '60J', label: '60 jours nets' },
    { key: 'PERSONNALISE', label: 'Personnalisé' },
]

const TVA_OPTIONS = ['0', '9', '19']
const EMPTY_LIGNE = { designation: '', quantite: '1', prix_unitaire: '', tva: '19' }

const initFF = () => ({
    client: '', projet: '', phase: '', date_echeance: '',
    conditions_paiement: 'RECEPTION', remise: '0',
    rib: '', mentions_legales: '', notes: '',
    lignes: [{ ...EMPTY_LIGNE }],
})

const initDF = () => {
    const d = new Date(); d.setDate(d.getDate() + 30)
    return {
        client: '', projet: '',
        date_validite: d.toISOString().split('T')[0],
        conditions_paiement: 'RECEPTION', remise: '0',
        rib: '', mentions_legales: '', notes: '',
        lignes: [{ ...EMPTY_LIGNE }],
    }
}

function computeTotals(lignes, remise, assujetti = true) {
    const remD = parseFloat(remise) || 0
    const sous = lignes.reduce((s, l) => s + (parseFloat(l.quantite) || 0) * (parseFloat(l.prix_unitaire) || 0), 0)
    const ht = sous * (1 - remD / 100)
    const ttcBrut = lignes.reduce((s, l) => {
        const h = (parseFloat(l.quantite) || 0) * (parseFloat(l.prix_unitaire) || 0)
        const tvaRate = assujetti ? (parseFloat(l.tva) || 0) : 0
        return s + h * (1 + tvaRate / 100)
    }, 0)
    const ttc = ttcBrut * (1 - remD / 100)
    return { sous, ht, ttc, tva: ttc - ht }
}

function cleanLignes(lignes, assujetti = true) {
    return lignes
        .filter(l => parseFloat(l.prix_unitaire) > 0)
        .map((l, i) => ({
            designation: l.designation?.trim() || 'Prestation',
            quantite: parseFloat(l.quantite) || 1,
            prix_unitaire: parseFloat(l.prix_unitaire) || 0,
            tva: assujetti ? (parseFloat(l.tva) || 0) : 0,
            ordre: i + 1,
        }))
}

function validateLignes(lignes) {
    const hasPrix = lignes.some(l => parseFloat(l.prix_unitaire) > 0)
    if (!hasPrix) return 'Ajoutez au moins une ligne avec un prix unitaire'
    return null
}

function LignesEditor({ lignes, onChange, assujetti = true }) {
    const add = () => onChange([...lignes, { ...EMPTY_LIGNE, tva: assujetti ? '19' : '0' }])
    const remove = (i) => onChange(lignes.filter((_, idx) => idx !== i))
    const update = (i, key, val) => onChange(lignes.map((l, idx) => idx === i ? { ...l, [key]: val } : l))

    return (
        <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lignes de facturation</span>
                <button type="button" onClick={add}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: 'var(--indigo)', background: 'var(--indigo-soft)', border: 'none', borderRadius: 7, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
                    <Plus size={12} /> Ajouter
                </button>
            </div>
            <div style={{ border: '1.5px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                        <tr style={{ background: '#F8FAFC' }}>
                            <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 600, color: '#64748B', borderBottom: '1px solid #E2E8F0', fontSize: 11 }}>Désignation</th>
                            <th style={{ padding: '7px 8px', textAlign: 'center', fontWeight: 600, color: '#64748B', borderBottom: '1px solid #E2E8F0', width: 55, fontSize: 11 }}>Qté</th>
                            <th style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 600, color: '#64748B', borderBottom: '1px solid #E2E8F0', width: 110, fontSize: 11 }}>P.U. (DA)</th>
                            {assujetti && <th style={{ padding: '7px 8px', textAlign: 'center', fontWeight: 600, color: '#64748B', borderBottom: '1px solid #E2E8F0', width: 60, fontSize: 11 }}>TVA</th>}
                            <th style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600, color: '#64748B', borderBottom: '1px solid #E2E8F0', width: 95, fontSize: 11 }}>Total HT</th>
                            <th style={{ width: 30, borderBottom: '1px solid #E2E8F0' }} />
                        </tr>
                    </thead>
                    <tbody>
                        {lignes.length === 0 && (
                            <tr><td colSpan={assujetti ? 6 : 5} style={{ padding: '18px', textAlign: 'center', color: '#94A3B8', fontSize: 12, fontStyle: 'italic' }}>Aucune ligne — cliquez sur « Ajouter »</td></tr>
                        )}
                        {lignes.map((l, i) => {
                            const tot = (parseFloat(l.quantite) || 0) * (parseFloat(l.prix_unitaire) || 0)
                            return (
                                <tr key={i} style={{ borderBottom: i < lignes.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                                    <td style={{ padding: '5px 10px' }}>
                                        <input value={l.designation} onChange={e => update(i, 'designation', e.target.value)}
                                            placeholder="Description de la prestation..."
                                            style={{ width: '100%', border: 'none', outline: 'none', fontSize: 12, color: '#0F172A', fontFamily: 'inherit', background: 'transparent', padding: 0 }} />
                                    </td>
                                    <td style={{ padding: '5px 6px' }}>
                                        <input type="number" min="0.01" step="any" value={l.quantite} onChange={e => update(i, 'quantite', e.target.value)}
                                            style={{ width: '100%', border: 'none', outline: 'none', fontSize: 12, textAlign: 'center', color: '#0F172A', fontFamily: 'inherit', background: 'transparent', padding: 0 }} />
                                    </td>
                                    <td style={{ padding: '5px 6px' }}>
                                        <input type="number" min="0" step="any" value={l.prix_unitaire} onChange={e => update(i, 'prix_unitaire', e.target.value)}
                                            placeholder="0"
                                            style={{ width: '100%', border: 'none', outline: 'none', fontSize: 12, textAlign: 'right', color: '#0F172A', fontFamily: 'inherit', background: 'transparent', padding: 0 }} />
                                    </td>
                                    {assujetti && (
                                        <td style={{ padding: '5px 6px' }}>
                                            <select value={l.tva} onChange={e => update(i, 'tva', e.target.value)}
                                                style={{ width: '100%', border: 'none', outline: 'none', fontSize: 12, textAlign: 'center', color: '#0F172A', fontFamily: 'inherit', background: 'transparent', cursor: 'pointer', padding: 0 }}>
                                                {TVA_OPTIONS.map(t => <option key={t} value={t}>{t}%</option>)}
                                            </select>
                                        </td>
                                    )}
                                    <td style={{ padding: '5px 10px', textAlign: 'right', fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', fontSize: 12 }}>
                                        {tot > 0 ? tot.toLocaleString('fr-DZ') : '—'}
                                    </td>
                                    <td style={{ padding: '5px 6px', textAlign: 'center' }}>
                                        <button type="button" onClick={() => remove(i)}
                                            style={{ width: 20, height: 20, borderRadius: 5, background: '#FEF2F2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
                                            <X size={10} />
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function TotauxBlock({ lignes, remise, assujetti = true }) {
    const { sous, ht, ttc, tva } = computeTotals(lignes, remise, assujetti)
    const remD = parseFloat(remise) || 0
    if (ttc === 0) return null
    const fmt = (n) => n.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })
    return (
        <div style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
            {remD > 0 && <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748B', marginBottom: 3 }}>
                    <span>Sous-total HT</span><span>{fmt(sous)} DA</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#EF4444', marginBottom: 3 }}>
                    <span>Remise ({remD}%)</span><span>-{fmt(sous * remD / 100)} DA</span>
                </div>
            </>}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748B', marginBottom: assujetti ? 3 : 6 }}>
                <span>Total HT</span><span style={{ fontWeight: 600 }}>{fmt(ht)} DA</span>
            </div>
            {assujetti && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748B', marginBottom: 6 }}>
                    <span>TVA</span><span>{fmt(tva)} DA</span>
                </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800, color: '#0F172A', paddingTop: 6, borderTop: '1.5px solid #E2E8F0' }}>
                <span>Total TTC</span><span style={{ color: 'var(--indigo)' }}>{fmt(ttc)} DA</span>
            </div>
            {!assujetti && (
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4, fontStyle: 'italic' }}>
                    «&nbsp;Non assujetti à la TVA&nbsp;»
                </div>
            )}
        </div>
    )
}

export default function Finances() {
    const queryClient = useQueryClient()
    const { toast } = useToast()
    const [tab, setTab] = useState('factures')
    const [projetFilter, setProjetFilter] = useState('')
    const [openFacture, setOpenFacture] = useState(false)
    const [openDevis, setOpenDevis] = useState(false)
    const [openCharge, setOpenCharge] = useState(false)
    const [openPaiement, setOpenPaiement] = useState(null)
    const [editItem, setEditItem] = useState(null)
    const [factureForm, setFactureForm] = useState(initFF)
    const [devisForm, setDevisForm] = useState(initDF)
    const [chargeForm, setChargeForm] = useState({ categorie: 'DEPLACEMENT', description: '', montant: '', date: new Date().toISOString().split('T')[0], projet: '' })
    const [paiementForm, setPaiementForm] = useState({ montant: '', mode: 'VIREMENT', reference: '', notes: '' })
    const [confirmDel, setConfirmDel] = useState(null)

    const { data: factures, isLoading } = useQuery({ queryKey: ['factures'], queryFn: () => api.get('/finances/factures/').then(r => r.data) })
    const { data: devis } = useQuery({ queryKey: ['devis'], queryFn: () => api.get('/finances/devis/').then(r => r.data) })
    const { data: charges } = useQuery({ queryKey: ['charges'], queryFn: () => api.get('/finances/charges/').then(r => r.data) })
    const { data: clients } = useQuery({ queryKey: ['clients'], queryFn: () => api.get('/projets/clients/').then(r => r.data) })
    const { data: cabinetData } = useQuery({ queryKey: ['cabinet'], queryFn: () => api.get('/cabinets/mon-cabinet/').then(r => r.data) })
    const { data: projets } = useQuery({ queryKey: ['projets'], queryFn: () => api.get('/projets/').then(r => r.data) })
    const assujetti = cabinetData?.assujetti_tva !== false

    const { data: phasesFacture = [] } = useQuery({
        queryKey: ['phases-facture', factureForm.projet],
        queryFn: () => api.get(`/projets/${factureForm.projet}/phases/`).then(r => r.data),
        enabled: !!factureForm.projet,
    })

    const PHASE_LABELS = { ESQUISSE: 'Esquisse', APS: 'Avant-projet sommaire', APD: 'Avant-projet détaillé', PRO: 'Projet', DCE: 'Dossier DCE', EXECUTION: 'Exécution', RECEPTION: 'Réception' }

    const factureMutation = useMutation({
        mutationFn: (data) => {
            const payload = { client: data.client, projet: data.projet, remise: parseFloat(data.remise) || 0, conditions_paiement: data.conditions_paiement, lignes: cleanLignes(data.lignes, assujetti) }
            if (data.phase) payload.phase = data.phase
            if (data.date_echeance) payload.date_echeance = data.date_echeance
            if (data.rib) payload.rib = data.rib
            if (data.mentions_legales) payload.mentions_legales = data.mentions_legales
            if (data.notes) payload.notes = data.notes
            return api.post('/finances/factures/', payload)
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['factures'] }); setOpenFacture(false); setFactureForm(initFF()); toast('Facture créée') },
        onError: (e) => toast(e?.response?.data?.error || 'Erreur lors de la création', 'error'),
    })

    const editFactureMutation = useMutation({
        mutationFn: ({ id, data }) => {
            const payload = { client: data.client, projet: data.projet, remise: parseFloat(data.remise) || 0, conditions_paiement: data.conditions_paiement, lignes: cleanLignes(data.lignes, assujetti), rib: data.rib || '', mentions_legales: data.mentions_legales || '', notes: data.notes || '' }
            if (data.phase) payload.phase = data.phase
            if (data.date_echeance) payload.date_echeance = data.date_echeance
            return api.put(`/finances/factures/${id}/`, payload)
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['factures'] }); setEditItem(null); toast('Facture mise à jour') },
        onError: () => toast('Erreur lors de la mise à jour', 'error'),
    })

    const deleteFactureMutation = useMutation({
        mutationFn: (id) => api.delete(`/finances/factures/${id}/`),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['factures'] }); toast('Facture supprimée', 'info') },
    })

    const devisMutation = useMutation({
        mutationFn: (data) => {
            const payload = { client: data.client, projet: data.projet, remise: parseFloat(data.remise) || 0, conditions_paiement: data.conditions_paiement, lignes: cleanLignes(data.lignes, assujetti) }
            if (data.date_validite) payload.date_validite = data.date_validite
            if (data.rib) payload.rib = data.rib
            if (data.mentions_legales) payload.mentions_legales = data.mentions_legales
            if (data.notes) payload.notes = data.notes
            return api.post('/finances/devis/', payload)
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['devis'] }); setOpenDevis(false); setDevisForm(initDF()); toast('Devis créé') },
        onError: (e) => toast(e?.response?.data?.error || 'Erreur lors de la création', 'error'),
    })

    const editDevisMutation = useMutation({
        mutationFn: ({ id, data }) => {
            const payload = { client: data.client, projet: data.projet, remise: parseFloat(data.remise) || 0, conditions_paiement: data.conditions_paiement, lignes: cleanLignes(data.lignes, assujetti), rib: data.rib || '', mentions_legales: data.mentions_legales || '', notes: data.notes || '' }
            if (data.date_validite) payload.date_validite = data.date_validite
            return api.put(`/finances/devis/${id}/`, payload)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['devis'] })
            queryClient.invalidateQueries({ queryKey: ['rentabilite'] })
            setEditItem(null)
            toast('Devis mis à jour')
        },
        onError: () => toast('Erreur lors de la mise à jour', 'error'),
    })

    const deleteDevisMutation = useMutation({
        mutationFn: (id) => api.delete(`/finances/devis/${id}/`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['devis'] })
            queryClient.invalidateQueries({ queryKey: ['rentabilite'] })
            toast('Devis supprimé', 'info')
        },
    })

    const devisStatutMutation = useMutation({
        mutationFn: ({ id, statut }) => api.put(`/finances/devis/${id}/`, { statut }),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['devis'] })
            queryClient.invalidateQueries({ queryKey: ['projets'] })
            queryClient.invalidateQueries({ queryKey: ['rentabilite'] })
            if (variables.statut === 'ACCEPTE') {
                queryClient.invalidateQueries({ queryKey: ['contrats'] })
                toast('Devis accepté — contrat créé automatiquement')
            }
        },
    })

    const convertirMutation = useMutation({
        mutationFn: (id) => api.post(`/finances/devis/${id}/convertir/`).then(r => r.data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['factures'] })
            queryClient.invalidateQueries({ queryKey: ['devis'] })
            setTab('factures')
            toast(`Facture ${data.numero} créée`)
        },
        onError: () => toast('Erreur lors de la conversion', 'error'),
    })

    const chargeMutation = useMutation({
        mutationFn: (data) => {
            const clean = { categorie: data.categorie, description: data.description, montant: data.montant }
            if (data.date) clean.date = data.date
            if (data.projet) clean.projet = data.projet
            return api.post('/finances/charges/', clean)
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['charges'] }); setOpenCharge(false); setChargeForm({ categorie: 'DEPLACEMENT', description: '', montant: '', date: new Date().toISOString().split('T')[0], projet: '' }); toast('Charge enregistrée') },
        onError: () => toast('Erreur lors de l\'enregistrement', 'error'),
    })

    const editChargeMutation = useMutation({
        mutationFn: ({ id, data }) => api.put(`/finances/charges/${id}/`, { categorie: data.categorie, description: data.description, montant: data.montant, date: data.date, ...(data.projet && { projet: data.projet }) }),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['charges'] }); setEditItem(null); toast('Charge mise à jour') },
        onError: () => toast('Erreur lors de la mise à jour', 'error'),
    })

    const deleteChargeMutation = useMutation({
        mutationFn: (id) => api.delete(`/finances/charges/${id}/`),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['charges'] }); toast('Charge supprimée', 'info') },
    })

    const paiementMutation = useMutation({
        mutationFn: (data) => api.post(`/finances/factures/${data.factureId}/paiements/`, { montant: parseFloat(data.montant), mode: data.mode, reference: data.reference, notes: data.notes, date_paiement: data.date_paiement }),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['factures'] }); setOpenPaiement(null); setPaiementForm({ montant: '', mode: 'VIREMENT', reference: '', notes: '' }); toast('Paiement enregistré') },
        onError: () => toast('Erreur lors de l\'enregistrement du paiement', 'error'),
    })

    const facturesList = factures || []
    const devisList = devis || []
    const chargesList = charges || []
    const clientsList = clients || []
    const projetsList = projets || []

    const pid = projetFilter ? Number(projetFilter) : null
    const filteredFactures = pid ? facturesList.filter(f => f.projet === pid) : facturesList
    const filteredDevis = pid ? devisList.filter(d => d.projet === pid) : devisList
    const filteredCharges = pid ? chargesList.filter(c => c.projet === pid) : chargesList

    const totalEncaisse = filteredFactures.filter(f => f.statut === 'SOLDEE').reduce((sum, f) => sum + Number(f.montant_ttc), 0)
    const totalImpaye = filteredFactures.filter(f => ['EMISE', 'ENVOYEE', 'PARTIELLEMENT_PAYEE'].includes(f.statut)).reduce((sum, f) => sum + Number(f.montant_ttc), 0)
    const totalCharges = filteredCharges.reduce((sum, c) => sum + Number(c.montant), 0)

    const devisAccepte = pid ? filteredDevis.find(d => d.statut === 'ACCEPTE') : null
    const encaisseProjet = filteredFactures.reduce((sum, f) => sum + (f.paiements || []).reduce((s, p) => s + Number(p.montant), 0), 0)
    const factureProjet = filteredFactures.reduce((sum, f) => sum + Number(f.montant_ttc), 0)

    const openPreview = (item) => {
        const client = (clients || []).find(c => c.id === item.client) || null
        const type = tab === 'factures' ? 'facture' : 'devis'
        printDoc(type, item, cabinetData || {}, client)
    }

    const TABS_LIST = [
        { key: 'factures', label: `Factures (${filteredFactures.length})`, icon: FileText },
        { key: 'devis', label: `Devis (${filteredDevis.length})`, icon: ClipboardList },
        { key: 'charges', label: `Charges (${filteredCharges.length})`, icon: Wallet },
    ]

    const currentList = tab === 'factures' ? filteredFactures : filteredDevis

    const OVERLAY = { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 200, backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }
    const CLOSE_BTN = { width: 34, height: 34, borderRadius: 9, background: '#F8FAFC', border: '1px solid #E2E8F0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }

    const renderFactureFields = (form, setForm) => (
        <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field"><label>Client</label>
                    <select value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))}>
                        <option value="">Sélectionner</option>
                        {clientsList.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                    </select>
                </div>
                <div className="field"><label>Projet</label>
                    <select value={form.projet} onChange={e => setForm(f => ({ ...f, projet: e.target.value, phase: '' }))}>
                        <option value="">Sélectionner</option>
                        {projetsList.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                    </select>
                </div>
            </div>
            {form.projet && (
                <div className="field">
                    <label>Phase <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>(optionnel)</span></label>
                    <select value={form.phase || ''} onChange={e => setForm(f => ({ ...f, phase: e.target.value }))}>
                        <option value="">— Sans phase —</option>
                        {phasesFacture.map(ph => <option key={ph.id} value={ph.id}>{PHASE_LABELS[ph.nom] ?? ph.nom}</option>)}
                    </select>
                </div>
            )}
            <LignesEditor lignes={form.lignes} onChange={v => setForm(f => ({ ...f, lignes: v }))} assujetti={assujetti} />
            <TotauxBlock lignes={form.lignes} remise={form.remise} assujetti={assujetti} />
            <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 12 }}>
                <div className="field"><label>Remise (%)</label>
                    <input type="number" min="0" max="100" step="0.01" value={form.remise} onChange={e => setForm(f => ({ ...f, remise: e.target.value }))} placeholder="0" />
                </div>
                <div className="field"><label>Conditions de paiement</label>
                    <select value={form.conditions_paiement} onChange={e => setForm(f => ({ ...f, conditions_paiement: e.target.value }))}>
                        {CONDITIONS_PAIEMENT.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                    </select>
                </div>
            </div>
            <div className="field"><label>Date d'échéance <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>(optionnel)</span></label>
                <input type="date" value={form.date_echeance || ''} onChange={e => setForm(f => ({ ...f, date_echeance: e.target.value }))} />
            </div>
            <div className="field"><label>RIB / Coordonnées bancaires <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>(optionnel)</span></label>
                <textarea value={form.rib || ''} onChange={e => setForm(f => ({ ...f, rib: e.target.value }))} rows={2} style={{ resize: 'vertical' }} placeholder="CCP : 1234567890 / Banque CPA…" />
            </div>
            <div className="field"><label>Mentions légales <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>(optionnel)</span></label>
                <textarea value={form.mentions_legales || ''} onChange={e => setForm(f => ({ ...f, mentions_legales: e.target.value }))} rows={2} style={{ resize: 'vertical' }} placeholder="En cas de retard de paiement…" />
            </div>
            <div className="field" style={{ marginBottom: 0 }}><label>Notes internes <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>(optionnel)</span></label>
                <textarea value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} style={{ resize: 'vertical' }} />
            </div>
        </>
    )

    const renderDevisFields = (form, setForm) => (
        <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field"><label>Client</label>
                    <select value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))}>
                        <option value="">Sélectionner</option>
                        {clientsList.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                    </select>
                </div>
                <div className="field"><label>Projet</label>
                    <select value={form.projet} onChange={e => setForm(f => ({ ...f, projet: e.target.value }))}>
                        <option value="">Sélectionner</option>
                        {projetsList.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                    </select>
                </div>
            </div>
            <LignesEditor lignes={form.lignes} onChange={v => setForm(f => ({ ...f, lignes: v }))} assujetti={assujetti} />
            <TotauxBlock lignes={form.lignes} remise={form.remise} assujetti={assujetti} />
            <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 12 }}>
                <div className="field"><label>Remise (%)</label>
                    <input type="number" min="0" max="100" step="0.01" value={form.remise} onChange={e => setForm(f => ({ ...f, remise: e.target.value }))} placeholder="0" />
                </div>
                <div className="field"><label>Conditions de paiement</label>
                    <select value={form.conditions_paiement} onChange={e => setForm(f => ({ ...f, conditions_paiement: e.target.value }))}>
                        {CONDITIONS_PAIEMENT.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                    </select>
                </div>
            </div>
            <div className="field"><label>Date de validité</label>
                <input type="date" value={form.date_validite || ''} onChange={e => setForm(f => ({ ...f, date_validite: e.target.value }))} />
            </div>
            <div className="field"><label>RIB / Coordonnées bancaires <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>(optionnel)</span></label>
                <textarea value={form.rib || ''} onChange={e => setForm(f => ({ ...f, rib: e.target.value }))} rows={2} style={{ resize: 'vertical' }} placeholder="CCP : 1234567890…" />
            </div>
            <div className="field"><label>Mentions légales <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>(optionnel)</span></label>
                <textarea value={form.mentions_legales || ''} onChange={e => setForm(f => ({ ...f, mentions_legales: e.target.value }))} rows={2} style={{ resize: 'vertical' }} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}><label>Notes internes <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>(optionnel)</span></label>
                <textarea value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} style={{ resize: 'vertical' }} />
            </div>
        </>
    )

    return (
        <Layout>
            <div className="page">
                <div className="page-head">
                    <div>
                        <h1 className="page-title">Finances</h1>
                        <div className="page-sub">Devis, factures, paiements et charges</div>
                    </div>
                    <div className="page-head-actions">
                        <button className="btn" style={{ color: 'var(--amber)', borderColor: 'var(--amber-soft)' }} onClick={() => setOpenCharge(true)}>
                            <Wallet size={14} /> Nouvelle charge
                        </button>
                        <button className="btn" onClick={() => { setDevisForm(initDF()); setOpenDevis(true) }}>
                            <ClipboardList size={14} /> Nouveau devis
                        </button>
                        <button className="btn accent" onClick={() => { setFactureForm(initFF()); setOpenFacture(true) }}>
                            <Plus size={14} /> Nouvelle facture
                        </button>
                    </div>
                </div>

                <div className="kpis">
                    <div className="kpi-tile dark">
                        <div className="kpi-label">Encaissé</div>
                        <div className="kpi-val" style={{ fontSize: totalEncaisse >= 1_000_000 ? 22 : 28 }}>{totalEncaisse.toLocaleString('fr-DZ')} <span className="unit">DA</span></div>
                        <div className="kpi-delta up">Factures soldées</div>
                    </div>
                    <div className="kpi-tile">
                        <div className="kpi-label">Total factures</div>
                        <div className="kpi-val">{facturesList.length}</div>
                        <div className="kpi-delta">émises</div>
                    </div>
                    <div className="kpi-tile">
                        <div className="kpi-label">Impayé</div>
                        <div className="kpi-val" style={{ fontSize: totalImpaye >= 1_000_000 ? 22 : 28 }}>{totalImpaye.toLocaleString('fr-DZ')} <span className="unit">DA</span></div>
                        <div className="kpi-delta down">À relancer</div>
                    </div>
                    <div className="kpi-tile">
                        <div className="kpi-label">Charges</div>
                        <div className="kpi-val" style={{ fontSize: totalCharges >= 1_000_000 ? 22 : 28 }}>{totalCharges.toLocaleString('fr-DZ')} <span className="unit">DA</span></div>
                        <div className="kpi-delta">ce mois</div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <select value={projetFilter} onChange={e => setProjetFilter(e.target.value)}
                        style={{ padding: '8px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 13, fontWeight: 600, color: projetFilter ? '#0F172A' : '#94A3B8', background: 'white', cursor: 'pointer', fontFamily: 'inherit', minWidth: 220 }}>
                        <option value="">Tous les projets</option>
                        {projetsList.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                    </select>
                    {projetFilter && (
                        <button onClick={() => setProjetFilter('')} style={{ padding: '8px 12px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: 'white', fontSize: 12, fontWeight: 600, color: '#64748B', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <X size={12} /> Effacer
                        </button>
                    )}
                </div>

                {pid && (
                    <div style={{ background: devisAccepte ? 'linear-gradient(135deg,var(--indigo-soft),#F5F3FF)' : '#F8FAFC', border: `1.5px solid ${devisAccepte ? '#C7D2FE' : '#E2E8F0'}`, borderRadius: 14, padding: '14px 20px', marginBottom: 16, display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Devis validé</div>
                            {devisAccepte
                                ? <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--indigo)' }}>{Number(devisAccepte.montant_ttc).toLocaleString()} DA</div>
                                : <div style={{ fontSize: 13, fontWeight: 600, color: '#94A3B8' }}>Aucun devis accepté</div>
                            }
                        </div>
                        {devisAccepte && <>
                            <div style={{ width: 1, height: 36, background: '#C7D2FE' }} />
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total facturé</div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>{factureProjet.toLocaleString()} DA</div>
                            </div>
                            <div style={{ width: 1, height: 36, background: '#C7D2FE' }} />
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Encaissé</div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: '#10B981' }}>{encaisseProjet.toLocaleString()} DA</div>
                            </div>
                            <div style={{ width: 1, height: 36, background: '#C7D2FE' }} />
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reste à encaisser</div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: Number(devisAccepte.montant_ttc) - encaisseProjet > 0 ? '#F59E0B' : '#10B981' }}>
                                    {(Number(devisAccepte.montant_ttc) - encaisseProjet).toLocaleString()} DA
                                </div>
                            </div>
                        </>}
                    </div>
                )}

                <div className="filter-tabs">
                    {TABS_LIST.map(t => {
                        const Icon = t.icon
                        return (
                            <button key={t.key} className={'filter-tab' + (tab === t.key ? ' active' : '')} onClick={() => setTab(t.key)}>
                                <Icon size={13} style={{ marginRight: 5 }} /> {t.label}
                            </button>
                        )
                    })}
                </div>

                {isLoading ? (
                    <div className="text-center color-slate" style={{ padding: 80 }}>Chargement...</div>
                ) : (
                    <div className="card">
                        {(tab === 'factures' || tab === 'devis') && (
                            currentList.length === 0 ? (
                                <div className="text-center" style={{ padding: '60px 40px' }}>
                                    <div className="empty-icon" style={{ background: 'var(--indigo-soft)' }}>
                                        {tab === 'factures' ? <Receipt size={24} color="var(--indigo)" /> : <ClipboardList size={24} color="var(--indigo)" />}
                                    </div>
                                    <div className="empty-title">{tab === 'factures' ? 'Aucune facture' : 'Aucun devis'}</div>
                                    <div className="empty-sub">Créez votre premier document</div>
                                </div>
                            ) : (
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Numéro</th>
                                            <th>Client</th>
                                            <th>Montant TTC</th>
                                            <th>Statut</th>
                                            <th>{tab === 'factures' ? 'Échéance' : 'Validité'}</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentList.map(item => {
                                            const s = STATUTS[item.statut]
                                            return (
                                                <tr key={item.id}>
                                                    <td>
                                                        <div className="flex-center gap-8">
                                                            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--indigo-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                {tab === 'factures' ? <FileText size={13} color="var(--indigo)" /> : <ClipboardList size={13} color="var(--indigo)" />}
                                                            </div>
                                                            <span className="fw-700" style={{ color: '#0F172A' }}>{item.numero}</span>
                                                        </div>
                                                    </td>
                                                    <td className="color-slate">{item.client_nom || `Client #${item.client}`}</td>
                                                    <td className="fw-700" style={{ color: '#0F172A' }}>{Number(item.montant_ttc).toLocaleString()} DA</td>
                                                    <td><span className={s?.badge ?? 'tag neutral'}>{s?.label ?? item.statut}</span></td>
                                                    <td className="color-slate">{item.date_echeance || item.date_validite || '—'}</td>
                                                    <td>
                                                        <div className="flex gap-6">
                                                            <button className="btn sm" onClick={() => openPreview(item)}>
                                                                <Download size={12} /> PDF
                                                            </button>
                                                            {tab === 'factures' && item.statut !== 'SOLDEE' && (
                                                                <button className="btn btn-green btn-sm" onClick={() => setOpenPaiement(item)}>
                                                                    <CreditCard size={12} /> Payer
                                                                </button>
                                                            )}
                                                            {tab === 'devis' && item.statut === 'BROUILLON' && (
                                                                <button className="btn sm" onClick={() => devisStatutMutation.mutate({ id: item.id, statut: 'ENVOYE' })}>
                                                                    Envoyer
                                                                </button>
                                                            )}
                                                            {tab === 'devis' && !['ACCEPTE', 'REFUSE'].includes(item.statut) && (
                                                                <button className="btn btn-green btn-sm" onClick={() => devisStatutMutation.mutate({ id: item.id, statut: 'ACCEPTE' })}>
                                                                    Accepter
                                                                </button>
                                                            )}
                                                            {tab === 'devis' && !['ACCEPTE', 'REFUSE'].includes(item.statut) && (
                                                                <button className="btn sm" style={{ color: 'var(--red)' }} onClick={() => devisStatutMutation.mutate({ id: item.id, statut: 'REFUSE' })}>
                                                                    Refuser
                                                                </button>
                                                            )}
                                                            {tab === 'devis' && item.statut === 'ACCEPTE' && (
                                                                <button className="btn accent sm" title="Convertir en facture"
                                                                    onClick={() => convertirMutation.mutate(item.id)}
                                                                    disabled={convertirMutation.isPending}>
                                                                    <ArrowRight size={12} /> Facture
                                                                </button>
                                                            )}
                                                            <button className="btn sm" title="Modifier" onClick={() => {
                                                                if (tab === 'factures') {
                                                                    setFactureForm({
                                                                        client: item.client, projet: item.projet,
                                                                        phase: item.phase || '',
                                                                        date_echeance: item.date_echeance || '',
                                                                        conditions_paiement: item.conditions_paiement || 'RECEPTION',
                                                                        remise: item.remise ?? '0',
                                                                        rib: item.rib || '', mentions_legales: item.mentions_legales || '', notes: item.notes || '',
                                                                        lignes: item.lignes?.length ? item.lignes.map(l => ({ designation: l.designation, quantite: String(l.quantite), prix_unitaire: String(l.prix_unitaire), tva: String(l.tva) })) : [{ ...EMPTY_LIGNE }],
                                                                    })
                                                                } else {
                                                                    setDevisForm({
                                                                        client: item.client, projet: item.projet,
                                                                        date_validite: item.date_validite || '',
                                                                        conditions_paiement: item.conditions_paiement || 'RECEPTION',
                                                                        remise: item.remise ?? '0',
                                                                        rib: item.rib || '', mentions_legales: item.mentions_legales || '', notes: item.notes || '',
                                                                        lignes: item.lignes?.length ? item.lignes.map(l => ({ designation: l.designation, quantite: String(l.quantite), prix_unitaire: String(l.prix_unitaire), tva: String(l.tva) })) : [{ ...EMPTY_LIGNE }],
                                                                    })
                                                                }
                                                                setEditItem(item)
                                                            }}>
                                                                <Pencil size={12} />
                                                            </button>
                                                            <button className="btn sm" style={{ color: 'var(--red)' }} title="Supprimer" onClick={() =>
                                                                setConfirmDel({ action: () => tab === 'factures' ? deleteFactureMutation.mutate(item.id) : deleteDevisMutation.mutate(item.id) })
                                                            }>
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            )
                        )}

                        {tab === 'charges' && (
                            filteredCharges.length === 0 ? (
                                <div className="text-center" style={{ padding: '60px 40px' }}>
                                    <div className="empty-icon" style={{ background: '#FEF2F2' }}><Wallet size={24} color="#EF4444" /></div>
                                    <div className="empty-title">Aucune charge</div>
                                    <div className="empty-sub">Enregistrez vos dépenses</div>
                                </div>
                            ) : (
                                <table>
                                    <thead><tr><th>Catégorie</th><th>Description</th><th>Montant</th><th>Date</th><th></th></tr></thead>
                                    <tbody>
                                        {filteredCharges.map(charge => (
                                            <tr key={charge.id}>
                                                <td><span className="tag red">{CAT_LABEL[charge.categorie] ?? charge.categorie}</span></td>
                                                <td style={{ color: '#0F172A' }}>{charge.description}</td>
                                                <td className="fw-700 color-red">-{Number(charge.montant).toLocaleString()} DA</td>
                                                <td className="color-slate">{charge.date}</td>
                                                <td>
                                                    <div className="flex gap-6">
                                                        <button className="btn sm" title="Modifier" onClick={() => {
                                                            setChargeForm({ categorie: charge.categorie, description: charge.description, montant: charge.montant, date: charge.date, projet: charge.projet || '' })
                                                            setEditItem({ ...charge, _type: 'charge' })
                                                        }}><Pencil size={12} /></button>
                                                        <button className="btn sm" style={{ color: 'var(--red)' }} title="Supprimer" onClick={() =>
                                                            setConfirmDel({ action: () => deleteChargeMutation.mutate(charge.id) })
                                                        }><Trash2 size={12} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )
                        )}
                    </div>
                )}
            </div>

            {/* Modal nouvelle facture */}
            {openFacture && (
                <div style={OVERLAY} onClick={() => setOpenFacture(false)}>
                    <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 860, boxShadow: '0 24px 80px rgba(0,0,0,0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '92vh' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--indigo-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Receipt size={19} color="var(--indigo)" /></div>
                                <div>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' }}>Nouvelle facture</div>
                                    <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 1 }}>Créer et envoyer une facture</div>
                                </div>
                            </div>
                            <button onClick={() => setOpenFacture(false)} style={CLOSE_BTN}><X size={15} /></button>
                        </div>
                        <div style={{ padding: '20px 24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                            {renderFactureFields(factureForm, setFactureForm)}
                            {factureMutation.isError && (
                                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginTop: 8, fontSize: 13, color: '#DC2626', fontWeight: 500 }}>
                                    {factureMutation.error?.response?.data?.error || 'Erreur lors de la création'}
                                </div>
                            )}
                        </div>
                        <div style={{ padding: '14px 24px 20px', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 10, flexShrink: 0 }}>
                            <button onClick={() => setOpenFacture(false)} style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: 'white', fontSize: 13, fontWeight: 600, color: '#64748B', cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
                            <button onClick={() => {
                                const err = validateLignes(factureForm.lignes)
                                if (err) { toast(err, 'error'); return }
                                factureMutation.mutate(factureForm)
                            }} disabled={factureMutation.isPending}
                                style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: 'var(--grad)', color: 'white', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: factureMutation.isPending ? 'not-allowed' : 'pointer', opacity: factureMutation.isPending ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                                {factureMutation.isPending ? 'Création...' : 'Créer la facture'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal nouveau devis */}
            {openDevis && (
                <div style={OVERLAY} onClick={() => setOpenDevis(false)}>
                    <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 860, boxShadow: '0 24px 80px rgba(0,0,0,0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '92vh' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 11, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ClipboardList size={19} color="#10B981" /></div>
                                <div>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' }}>Nouveau devis</div>
                                    <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 1 }}>Proposition commerciale au client</div>
                                </div>
                            </div>
                            <button onClick={() => setOpenDevis(false)} style={CLOSE_BTN}><X size={15} /></button>
                        </div>
                        <div style={{ padding: '20px 24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                            {renderDevisFields(devisForm, setDevisForm)}
                            {devisMutation.isError && (
                                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginTop: 8, fontSize: 13, color: '#DC2626', fontWeight: 500 }}>
                                    {devisMutation.error?.response?.data?.error || 'Erreur lors de la création'}
                                </div>
                            )}
                        </div>
                        <div style={{ padding: '14px 24px 20px', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 10, flexShrink: 0 }}>
                            <button onClick={() => setOpenDevis(false)} style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: 'white', fontSize: 13, fontWeight: 600, color: '#64748B', cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
                            <button onClick={() => {
                                const err = validateLignes(devisForm.lignes)
                                if (err) { toast(err, 'error'); return }
                                devisMutation.mutate(devisForm)
                            }} disabled={devisMutation.isPending}
                                style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#10B981,#059669)', color: 'white', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: devisMutation.isPending ? 'not-allowed' : 'pointer', opacity: devisMutation.isPending ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                                {devisMutation.isPending ? 'Création...' : 'Créer le devis'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal nouvelle charge */}
            {openCharge && (
                <div style={OVERLAY} onClick={() => setOpenCharge(false)}>
                    <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 480, boxShadow: '0 24px 80px rgba(0,0,0,0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '24px 28px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 42, height: 42, borderRadius: 12, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #FECACA' }}><TrendingUp size={20} color="#EF4444" /></div>
                                <div>
                                    <div style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' }}>Nouvelle charge</div>
                                    <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 1 }}>Dépense ou frais du cabinet</div>
                                </div>
                            </div>
                            <button onClick={() => setOpenCharge(false)} style={CLOSE_BTN}><X size={15} /></button>
                        </div>
                        <div style={{ padding: '24px 28px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                            <div className="field">
                                <label>Catégorie</label>
                                <div className="flex" style={{ flexWrap: 'wrap', gap: 6 }}>
                                    {CATEGORIES_CHARGE.map(cat => (
                                        <button key={cat.key} onClick={() => setChargeForm(f => ({ ...f, categorie: cat.key }))}
                                            style={{ padding: '6px 12px', borderRadius: 9, cursor: 'pointer', border: chargeForm.categorie === cat.key ? '2px solid #EF4444' : '1.5px solid #E2E8F0', background: chargeForm.categorie === cat.key ? '#FEF2F2' : 'white', color: chargeForm.categorie === cat.key ? '#EF4444' : '#64748B', fontWeight: 600, fontSize: 12, fontFamily: 'inherit' }}>
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="field"><label>Description</label><input value={chargeForm.description} onChange={e => setChargeForm(f => ({ ...f, description: e.target.value }))} /></div>
                            <div className="grid-2">
                                <div className="field"><label>Montant (DA)</label><input type="number" value={chargeForm.montant} onChange={e => setChargeForm(f => ({ ...f, montant: e.target.value }))} /></div>
                                <div className="field"><label>Date</label><input type="date" value={chargeForm.date} onChange={e => setChargeForm(f => ({ ...f, date: e.target.value }))} /></div>
                            </div>
                            <div className="field" style={{ marginBottom: 0 }}><label>Projet (optionnel)</label>
                                <select value={chargeForm.projet} onChange={e => setChargeForm(f => ({ ...f, projet: e.target.value }))}>
                                    <option value="">Aucun projet</option>
                                    {projetsList.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                                </select>
                            </div>
                        </div>
                        <div style={{ padding: '16px 28px 24px', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 10, flexShrink: 0 }}>
                            <button onClick={() => setOpenCharge(false)} style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: 'white', fontSize: 13, fontWeight: 600, color: '#64748B', cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
                            <button onClick={() => chargeMutation.mutate(chargeForm)} disabled={chargeMutation.isPending}
                                style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#EF4444,#DC2626)', color: 'white', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: chargeMutation.isPending ? 'not-allowed' : 'pointer', opacity: chargeMutation.isPending ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                                {chargeMutation.isPending ? 'Ajout...' : 'Ajouter la charge'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal paiement */}
            {openPaiement && (
                <div style={OVERLAY} onClick={() => setOpenPaiement(null)}>
                    <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 460, boxShadow: '0 24px 80px rgba(0,0,0,0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '24px 28px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 42, height: 42, borderRadius: 12, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Wallet size={20} color="#10B981" /></div>
                                <div>
                                    <div style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' }}>Enregistrer un paiement</div>
                                    <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 1 }}>Encaissement reçu du client</div>
                                </div>
                            </div>
                            <button onClick={() => setOpenPaiement(null)} style={CLOSE_BTN}><X size={15} /></button>
                        </div>
                        <div style={{ padding: '24px 28px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                                <div className="fw-600 fs-13" style={{ color: '#0F172A' }}>Facture {openPaiement.numero}</div>
                                <div className="fs-13 color-slate">{openPaiement.client_nom} — {Number(openPaiement.montant_ttc).toLocaleString()} DA TTC</div>
                                {(() => {
                                    const dejaPaye = (openPaiement.paiements || []).reduce((s, p) => s + Number(p.montant), 0)
                                    return (
                                        <div className="flex gap-12" style={{ marginTop: 4 }}>
                                            <span className="fw-700 fs-12 color-green">Payé: {dejaPaye.toLocaleString()} DA</span>
                                            <span className="fw-700 fs-12 color-amber">Reste: {(Number(openPaiement.montant_ttc) - dejaPaye).toLocaleString()} DA</span>
                                        </div>
                                    )
                                })()}
                            </div>
                            <div className="field"><label>Montant reçu (DA)</label><input type="text" inputMode="decimal" autoFocus placeholder="Ex: 150000" value={paiementForm.montant} onChange={e => { const v = e.target.value.replace(/[^0-9.]/g, ''); setPaiementForm(f => ({ ...f, montant: v })) }} /></div>
                            {paiementMutation.isError && (
                                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#DC2626', fontWeight: 500 }}>
                                    {paiementMutation.error?.response?.data?.error || 'Erreur lors de l\'enregistrement'}
                                </div>
                            )}
                            <div className="field">
                                <label>Mode de paiement</label>
                                <div className="flex" style={{ flexWrap: 'wrap', gap: 6 }}>
                                    {MODES_PAIEMENT.map(m => (
                                        <button key={m.key} onClick={() => setPaiementForm(f => ({ ...f, mode: m.key }))}
                                            style={{ padding: '6px 14px', borderRadius: 9, cursor: 'pointer', border: paiementForm.mode === m.key ? '2px solid #10B981' : '1.5px solid #E2E8F0', background: paiementForm.mode === m.key ? '#ECFDF5' : 'white', color: paiementForm.mode === m.key ? '#10B981' : '#64748B', fontWeight: 600, fontSize: 12, fontFamily: 'inherit' }}>
                                            {m.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="field"><label>Référence</label><input value={paiementForm.reference} onChange={e => setPaiementForm(f => ({ ...f, reference: e.target.value }))} placeholder="N° chèque, virement..." /></div>
                        </div>
                        <div style={{ padding: '16px 28px 24px', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 10, flexShrink: 0 }}>
                            <button onClick={() => setOpenPaiement(null)} style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: 'white', fontSize: 13, fontWeight: 600, color: '#64748B', cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
                            <button onClick={() => {
                                if (!paiementForm.montant || parseFloat(paiementForm.montant) <= 0) return
                                paiementMutation.mutate({ factureId: openPaiement.id, montant: paiementForm.montant, mode: paiementForm.mode, reference: paiementForm.reference, notes: paiementForm.notes, date_paiement: new Date().toISOString().split('T')[0] })
                            }} disabled={paiementMutation.isPending || !paiementForm.montant}
                                style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#10B981,#059669)', color: 'white', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: paiementMutation.isPending ? 'not-allowed' : 'pointer', opacity: paiementMutation.isPending ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                                {paiementMutation.isPending ? 'Enregistrement...' : 'Enregistrer le paiement'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal édition facture */}
            {editItem && !editItem._type && tab === 'factures' && (
                <div style={OVERLAY} onClick={() => setEditItem(null)}>
                    <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 860, boxShadow: '0 24px 80px rgba(0,0,0,0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '92vh' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--indigo-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Receipt size={18} color="var(--indigo)" /></div>
                                <div>
                                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>Modifier la facture</div>
                                    <div style={{ fontSize: 12, color: '#94A3B8' }}>{editItem.numero}</div>
                                </div>
                            </div>
                            <button onClick={() => setEditItem(null)} style={CLOSE_BTN}><X size={15} /></button>
                        </div>
                        <div style={{ padding: '20px 24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                            {renderFactureFields(factureForm, setFactureForm)}
                        </div>
                        <div style={{ padding: '14px 24px 20px', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 10, flexShrink: 0 }}>
                            <button onClick={() => setEditItem(null)} style={{ padding: '10px 18px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: 'white', fontSize: 13, fontWeight: 600, color: '#64748B', cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
                            <button onClick={() => {
                                const err = validateLignes(factureForm.lignes)
                                if (err) { toast(err, 'error'); return }
                                editFactureMutation.mutate({ id: editItem.id, data: factureForm })
                            }} disabled={editFactureMutation.isPending}
                                style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: 'var(--grad)', color: 'white', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {editFactureMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal édition devis */}
            {editItem && !editItem._type && tab === 'devis' && (
                <div style={OVERLAY} onClick={() => setEditItem(null)}>
                    <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 860, boxShadow: '0 24px 80px rgba(0,0,0,0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '92vh' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 11, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ClipboardList size={18} color="#10B981" /></div>
                                <div>
                                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>Modifier le devis</div>
                                    <div style={{ fontSize: 12, color: '#94A3B8' }}>{editItem.numero}</div>
                                </div>
                            </div>
                            <button onClick={() => setEditItem(null)} style={CLOSE_BTN}><X size={15} /></button>
                        </div>
                        <div style={{ padding: '20px 24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                            {renderDevisFields(devisForm, setDevisForm)}
                        </div>
                        <div style={{ padding: '14px 24px 20px', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 10, flexShrink: 0 }}>
                            <button onClick={() => setEditItem(null)} style={{ padding: '10px 18px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: 'white', fontSize: 13, fontWeight: 600, color: '#64748B', cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
                            <button onClick={() => {
                                const err = validateLignes(devisForm.lignes)
                                if (err) { toast(err, 'error'); return }
                                editDevisMutation.mutate({ id: editItem.id, data: devisForm })
                            }} disabled={editDevisMutation.isPending}
                                style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#10B981,#059669)', color: 'white', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {editDevisMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal édition charge */}
            {editItem?._type === 'charge' && (
                <div style={OVERLAY} onClick={() => setEditItem(null)}>
                    <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 460, boxShadow: '0 24px 80px rgba(0,0,0,0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '22px 26px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 11, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Wallet size={18} color="#EF4444" /></div>
                                <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>Modifier la charge</div>
                            </div>
                            <button onClick={() => setEditItem(null)} style={CLOSE_BTN}><X size={14} /></button>
                        </div>
                        <div style={{ padding: '20px 26px', display: 'flex', flexDirection: 'column' }}>
                            <div className="field">
                                <label>Catégorie</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {CATEGORIES_CHARGE.map(cat => (
                                        <button key={cat.key} onClick={() => setChargeForm(f => ({ ...f, categorie: cat.key }))}
                                            style={{ padding: '5px 11px', borderRadius: 8, cursor: 'pointer', border: chargeForm.categorie === cat.key ? '2px solid #EF4444' : '1.5px solid #E2E8F0', background: chargeForm.categorie === cat.key ? '#FEF2F2' : 'white', color: chargeForm.categorie === cat.key ? '#EF4444' : '#64748B', fontWeight: 600, fontSize: 12, fontFamily: 'inherit' }}>
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="field"><label>Description</label><input value={chargeForm.description} onChange={e => setChargeForm(f => ({ ...f, description: e.target.value }))} /></div>
                            <div className="grid-2">
                                <div className="field"><label>Montant (DA)</label><input type="number" value={chargeForm.montant} onChange={e => setChargeForm(f => ({ ...f, montant: e.target.value }))} /></div>
                                <div className="field" style={{ marginBottom: 0 }}><label>Date</label><input type="date" value={chargeForm.date} onChange={e => setChargeForm(f => ({ ...f, date: e.target.value }))} /></div>
                            </div>
                        </div>
                        <div style={{ padding: '14px 26px 22px', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 10 }}>
                            <button onClick={() => setEditItem(null)} style={{ padding: '10px 18px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: 'white', fontSize: 13, fontWeight: 600, color: '#64748B', cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
                            <button onClick={() => editChargeMutation.mutate({ id: editItem.id, data: chargeForm })} disabled={editChargeMutation.isPending}
                                style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#EF4444,#DC2626)', color: 'white', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {editChargeMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                open={!!confirmDel}
                title="Supprimer ce document ?"
                message="Cette action est irréversible."
                onConfirm={() => confirmDel?.action()}
                onCancel={() => setConfirmDel(null)}
            />
        </Layout>
    )
}
