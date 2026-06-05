import { openDocInTab } from '../../components/documents/printDoc'

const CABINET = {
    nom: 'Cabinet Architecture Benali',
    activite: "Architecte DPLG · Conseil & Maîtrise d'œuvre",
    adresse: '12 Rue des Oliviers, Alger 16000',
    telephone: '021 23 45 67',
    email: 'contact@archi-benali.dz',
    nif: '123456789012345',
    nis: '987654321098765',
    numero_rc: 'RC/16A/B/0012345',
    ai: 'AI/2020/12345',
    logo: null,
}

const CLIENT = {
    nom: 'EURL Constructions Modernes',
    contact_nom: 'M. Karim Hadj',
    adresse: '45 Avenue de l\'Indépendance, Blida 09000',
    email: 'k.hadj@constructions-modernes.dz',
    nif: '987612345678901',
}

const DEMO_DEVIS = {
    numero: 'DEV-2025-042',
    date_emission: '2025-05-15',
    date_validite: '2025-06-15',
    statut: 'EMISE',
    projet_nom: 'Résidence Les Palmiers — Blida',
    client_nom: 'EURL Constructions Modernes',
    conditions_paiement: '30J',
    remise: 5,
    montant_ht: 2100000,
    montant_ttc: 2499000,
    notes: "Devis établi conformément à votre demande du 10 mai 2025 pour la mission complète d'architecture et de maîtrise d'œuvre du projet de résidence collective.",
    rib: "BNA · Agence Alger Centre\nRIB : 00200 12345 00000123456 78\nIBAN : DZ58 0020 0123 4500 0012 3456 78",
    mentions_legales: "Devis valable 30 jours à compter de la date d'émission. Tout commencement de prestation vaut acceptation des présentes conditions. TVA 19% incluse.",
    lignes: [
        { designation: "Phase Esquisse (ESQ) — Études de faisabilité et volumétrie", quantite: 1, prix_unitaire: 420000, tva: 19 },
        { designation: "Avant-Projet Sommaire (APS) — Plans et coupes préliminaires", quantite: 1, prix_unitaire: 525000, tva: 19 },
        { designation: "Avant-Projet Détaillé (APD) + Permis de Construire", quantite: 1, prix_unitaire: 630000, tva: 19 },
        { designation: "Dossier Consultation Entreprises (DCE)", quantite: 1, prix_unitaire: 315000, tva: 19 },
        { designation: "Direction Exécution Travaux (DET) — Suivi mensuel", quantite: 12, prix_unitaire: 17500, tva: 19 },
    ],
}

const DEMO_FACTURE = {
    numero: 'FAC-2025-018',
    date_emission: '2025-05-20',
    date_echeance: '2025-06-20',
    statut: 'EMISE',
    projet_nom: 'Résidence Les Palmiers — Blida',
    client_nom: 'EURL Constructions Modernes',
    phase: 'Phase APS — Avant-projet sommaire',
    conditions_paiement: '30J',
    montant_ht: 525000,
    montant_ttc: 624750,
    rib: "BNA · Agence Alger Centre\nRIB : 00200 12345 00000123456 78",
    lignes: [
        { designation: "Avant-Projet Sommaire (APS) — Plans, coupes et façades préliminaires", quantite: 1, prix_unitaire: 525000, tva: 19 },
    ],
}

const DEMO_FACTURE_SOLDEE = {
    ...DEMO_FACTURE,
    numero: 'FAC-2025-005',
    statut: 'SOLDEE',
    date_emission: '2025-02-10',
    date_echeance: '2025-03-12',
    phase: 'Phase ESQ — Esquisse',
    montant_ht: 420000,
    montant_ttc: 499800,
    lignes: [
        { designation: "Phase Esquisse (ESQ) — Études de faisabilité et premières propositions", quantite: 1, prix_unitaire: 420000, tva: 19 },
    ],
}

const DEMO_CONTRAT = {
    numero: 'CTR-2025-007',
    date_signature: '2025-01-15',
    date_debut: '2025-01-20',
    date_fin: '2026-12-31',
    statut: 'SIGNE',
    projet_nom: 'Résidence Les Palmiers — Blida',
    type: 'CONTRAT',
    missions: ['ESQ', 'APS', 'APD', 'PC', 'DCE', 'DET', 'AOR'],
    montant_ht: 2100000,
    montant_ttc: 2499000,
    objet: "Le présent contrat a pour objet de confier au Maître d'œuvre la mission complète d'architecture et de maîtrise d'œuvre pour la conception et le suivi de la réalisation de la Résidence Les Palmiers, un ensemble résidentiel de 48 logements collectifs situé à Blida.",
}

const DEMO_AVENANT = {
    numero: 'AVN-2025-002',
    date_signature: '2025-04-01',
    date_debut: '2025-04-01',
    date_fin: '2027-03-31',
    statut: 'SIGNE',
    projet_nom: 'Résidence Les Palmiers — Blida',
    type: 'AVENANT',
    montant_ht: 350000,
    montant_ttc: 416500,
    objet: "Modification du programme : ajout de 8 logements supplémentaires (lot C) suite à la décision du Maître d'ouvrage en date du 25 mars 2025. Les plans de masse et les calculs de structure sont à reprendre en totalité.",
    notes: "Les délais de la mission DET sont prolongés de 6 mois en conséquence de l'extension du programme.",
}

const DEMO_RAPPORT = {
    titre: 'Inspection fondations — Lot A',
    date: '2025-05-22',
    redacteur_nom: 'Architecte M. Benali',
    projet_nom: 'Résidence Les Palmiers — Blida',
    lieu: '09 - Blida',
    meteo: 'SOLEIL',
    etat_general: 'ACCEPTABLE',
    observations: "Les travaux de fondation du lot A avancent conformément au planning. Quelques irrégularités ont été constatées sur le ferraillage des semelles filantes en zone nord. Les équipes ont été informées et des corrections sont en cours. La coulée béton prévue demain matin est maintenue sous réserve de validation de la non-conformité signalée.",
    actions_requises: "1. Vérifier la conformité du ferraillage zone nord avant coulée (avant 07h00 demain).\n2. Demander à l'entreprise SARL Bâtisseurs le PV de correction signé.\n3. Contacter le BET Structure pour avis sur les semelles irrégulières.",
    points_controle: [
        { label: 'Sécurité chantier', statut: 'OK' },
        { label: 'EPI ouvriers', statut: 'OK' },
        { label: 'Ferraillage semelles', statut: 'NOK' },
        { label: 'Coffrage en place', statut: 'OK' },
        { label: 'Béton conforme', statut: 'NA' },
        { label: 'Implantation conforme', statut: 'OK' },
        { label: 'Nettoyage fond de fouille', statut: 'OK' },
        { label: 'Réservations techniques', statut: 'NOK' },
    ],
}

const DOCS = [
    {
        key: 'devis',
        label: 'Devis',
        sub: 'DEV-2025-042 · 2 499 000 DA TTC',
        color: 'var(--indigo)',
        bg: 'var(--indigo-soft)',
        border: '#C7D2FE',
        emoji: '📋',
        open: () => openDocInTab('devis', DEMO_DEVIS, CABINET, CLIENT),
    },
    {
        key: 'facture-emise',
        label: 'Facture émise',
        sub: 'FAC-2025-018 · Phase APS · 624 750 DA',
        color: '#D97706',
        bg: '#FFFBEB',
        border: '#FDE68A',
        emoji: '🧾',
        open: () => openDocInTab('facture', DEMO_FACTURE, CABINET, CLIENT),
    },
    {
        key: 'facture-soldee',
        label: 'Facture soldée',
        sub: 'FAC-2025-005 · Phase ESQ · watermark PAYÉE',
        color: '#16A34A',
        bg: '#F0FDF4',
        border: '#BBF7D0',
        emoji: '✅',
        open: () => openDocInTab('facture', DEMO_FACTURE_SOLDEE, CABINET, CLIENT),
    },
    {
        key: 'contrat',
        label: 'Contrat',
        sub: 'CTR-2025-007 · Mission complète · 9 articles',
        color: '#0F172A',
        bg: '#F8FAFC',
        border: '#E2E8F0',
        emoji: '📄',
        open: () => openDocInTab('contrat', DEMO_CONTRAT, CABINET, CLIENT),
    },
    {
        key: 'avenant',
        label: 'Avenant',
        sub: 'AVN-2025-002 · 416 500 DA TTC · document autonome',
        color: '#7C3AED',
        bg: '#F5F3FF',
        border: '#DDD6FE',
        emoji: '📝',
        open: () => openDocInTab('contrat', DEMO_AVENANT, CABINET, CLIENT),
    },
    {
        key: 'rapport',
        label: 'Rapport de terrain',
        sub: 'Inspection fondations · État ACCEPTABLE',
        color: '#DC2626',
        bg: '#FEF2F2',
        border: '#FECACA',
        emoji: '🏗️',
        open: () => openDocInTab('rapport', DEMO_RAPPORT, CABINET),
    },
]

export default function DocDemo() {
    return (
        <div style={{ minHeight: '100vh', background: '#F8F7FC', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
            {/* Header */}
            <div style={{ background: '#0F172A', padding: '28px 40px 24px' }}>
                <div style={{ maxWidth: 860, margin: '0 auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--indigo)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📑</div>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: 'monospace', letterSpacing: '0.08em' }}>BTPRO · DEMO DOCUMENTS</span>
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px', marginBottom: 6 }}>
                        Aperçu des documents générés
                    </div>
                    <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
                        Cliquez sur un document pour l'ouvrir dans un nouvel onglet — imprimable et exportable en PDF.
                        <br />Données fictives · Cabinet <b style={{ color: 'rgba(255,255,255,0.65)' }}>Architecture Benali</b> · Projet <b style={{ color: 'rgba(255,255,255,0.65)' }}>Résidence Les Palmiers</b>
                    </div>
                </div>
            </div>

            {/* Cards */}
            <div style={{ maxWidth: 860, margin: '0 auto', padding: '36px 40px 60px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {DOCS.map(d => (
                        <button
                            key={d.key}
                            onClick={d.open}
                            style={{
                                background: '#fff',
                                borderRadius: 16,
                                border: `1px solid ${d.border}`,
                                padding: '22px 24px',
                                cursor: 'pointer',
                                textAlign: 'left',
                                fontFamily: 'inherit',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 18,
                                transition: 'box-shadow 0.15s, transform 0.1s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 20px rgba(0,0,0,0.08), 0 0 0 2px ${d.border}`; e.currentTarget.style.transform = 'translateY(-1px)' }}
                            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)' }}
                        >
                            <div style={{ width: 52, height: 52, borderRadius: 14, background: d.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                                {d.emoji}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', letterSpacing: '-0.3px', marginBottom: 4 }}>
                                    {d.label}
                                </div>
                                <div style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>
                                    {d.sub}
                                </div>
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: d.color, padding: '4px 10px', borderRadius: 8, background: d.bg, border: `1px solid ${d.border}`, flexShrink: 0 }}>
                                Ouvrir →
                            </div>
                        </button>
                    ))}
                </div>

                {/* Info block */}
                <div style={{ marginTop: 32, padding: '18px 22px', background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>💡</div>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Comment ça fonctionne</div>
                        <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.7 }}>
                            Chaque document s'ouvre dans un <b>nouvel onglet</b> et peut être <b>imprimé</b> ou <b>exporté en PDF</b> via le navigateur (Ctrl+P ou ⌘+P).<br />
                            Les vrais documents utilisent les données de votre cabinet, clients et projets réels depuis la base de données.
                            <br /><br />
                            <b>Types disponibles :</b> Devis · Facture (émise / soldée / partielle) · Contrat de maîtrise d'œuvre (9 articles) · Avenant (document autonome) · Rapport de terrain
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: 16, textAlign: 'center', fontSize: 12, color: '#9CA3AF' }}>
                    Page de démo · <a href="/dashboard" style={{ color: 'var(--indigo)', fontWeight: 600, textDecoration: 'none' }}>← Retour au tableau de bord</a>
                </div>
            </div>
        </div>
    )
}
