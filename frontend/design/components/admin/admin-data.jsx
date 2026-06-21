/* ===================== Admin — mock data ===================== */
const A = {};

A.kpis = {
  cabinets: 128, cabinetsDelta: '+12 ce mois',
  actifs: 113, actifsDelta: '88% du parc',
  mrr: 982600, mrrDelta: '+8,4%',
  arr: 11791200, arrDelta: 'projeté',
  users: 486, usersDelta: '+37 ce mois',
};

A.planBreakdown = [
  { id: 'solo', name: 'SOLO', count: 71, price: 4900, accent: '#1100FF', bar: 'bg-brand' },
  { id: 'cabinet', name: 'CABINET', count: 42, price: 8900, accent: '#1F8A5B', bar: 'bg-emerald-500' },
  { id: 'agence', name: 'AGENCE', count: 15, price: 14900, accent: '#7A5BFF', bar: 'bg-violet-500' },
];

A.revenueTrend = [
  { m: 'Jan', v: 612000 }, { m: 'Fév', v: 668000 }, { m: 'Mar', v: 724000 },
  { m: 'Avr', v: 781000 }, { m: 'Mai', v: 845000 }, { m: 'Jun', v: 906000 },
  { m: 'Jul', v: 951000 }, { m: 'Aoû', v: 982600 },
];

A.cabinets = [
  { id: 'CAB-1042', nom: 'Cabinet Méridien', email: 'patron@meridien.dz', plan: 'cabinet', inscription: '2025-09-12', expiration: '2026-09-12', membres: 5, actif: true, wilaya: 'Alger' },
  { id: 'CAB-1038', nom: 'Atelier Sud Architecture', email: 'contact@ateliersud.dz', plan: 'agence', inscription: '2025-06-03', expiration: '2026-06-03', membres: 9, actif: true, wilaya: 'Oran' },
  { id: 'CAB-1051', nom: 'Studio Médina', email: 'h.benali@studiomedina.dz', plan: 'solo', inscription: '2026-01-21', expiration: '2026-07-10', membres: 1, actif: true, wilaya: 'Constantine' },
  { id: 'CAB-1009', nom: 'Forme & Espace', email: 'gerance@formeespace.dz', plan: 'cabinet', inscription: '2025-02-18', expiration: '2026-07-04', membres: 4, actif: true, wilaya: 'Annaba' },
  { id: 'CAB-1063', nom: 'Trait & Volume', email: 'admin@traitvolume.dz', plan: 'solo', inscription: '2026-03-02', expiration: '2027-03-02', membres: 2, actif: true, wilaya: 'Blida' },
  { id: 'CAB-1024', nom: 'Arc Nord', email: 'k.saidi@arcnord.dz', plan: 'agence', inscription: '2024-11-09', expiration: '2026-06-28', membres: 11, actif: true, wilaya: 'Alger' },
  { id: 'CAB-1070', nom: 'Cabinet Rive', email: 'rive@cabinetrive.dz', plan: 'cabinet', inscription: '2026-04-14', expiration: '2027-04-14', membres: 3, actif: true, wilaya: 'Tizi Ouzou' },
  { id: 'CAB-1015', nom: 'Volume D', email: 'contact@volumed.dz', plan: 'solo', inscription: '2025-08-30', expiration: '2026-08-30', membres: 1, actif: false, wilaya: 'Sétif' },
  { id: 'CAB-1058', nom: 'Plan Libre', email: 'n.cherif@planlibre.dz', plan: 'cabinet', inscription: '2025-12-01', expiration: '2026-12-01', membres: 6, actif: true, wilaya: 'Béjaïa' },
  { id: 'CAB-1031', nom: 'Coupe & Façade', email: 'gerant@coupefacade.dz', plan: 'solo', inscription: '2025-05-22', expiration: '2026-07-02', membres: 2, actif: true, wilaya: 'Oran' },
  { id: 'CAB-1077', nom: 'Maquette Atelier', email: 'hello@maquette.dz', plan: 'cabinet', inscription: '2026-02-11', expiration: '2027-02-11', membres: 4, actif: true, wilaya: 'Tlemcen' },
  { id: 'CAB-1003', nom: 'Esquisse Studio', email: 'patron@esquisse.dz', plan: 'agence', inscription: '2024-07-15', expiration: '2026-06-25', membres: 12, actif: false, wilaya: 'Alger' },
];

A.membersByCabinet = {
  'CAB-1042': [
    { email: 'patron@meridien.dz', nom: 'Sofiane Mansouri', role: 'Patron', patron: true },
    { email: 'l.haddad@meridien.dz', nom: 'Lina Haddad', role: 'Architecte', patron: false },
    { email: 'y.brahimi@meridien.dz', nom: 'Yanis Brahimi', role: 'Architecte', patron: false },
    { email: 'r.toumi@meridien.dz', nom: 'Rania Toumi', role: 'Comptable', patron: false },
    { email: 'stagiaire@meridien.dz', nom: 'Adel Khelifi', role: 'Stagiaire', patron: false },
  ],
};
A.defaultMembers = [
  { email: 'patron@cabinet.dz', nom: 'Gérant du cabinet', role: 'Patron', patron: true },
  { email: 'archi@cabinet.dz', nom: 'Architecte associé', role: 'Architecte', patron: false },
];

A.messages = [
  { id: 'M-301', nom: 'Karim Belkacem', cabinet: 'Atelier Sud Architecture', sujet: 'Question facturation TVA', date: '2026-06-19 14:22', email: 'k.belkacem@ateliersud.dz', tel: '+213 555 21 09 88', lu: false, corps: "Bonjour, sur certaines factures la TVA à 19% ne s'applique pas automatiquement aux honoraires APD. Est-ce un réglage du cabinet ou un bug ? Merci d'avance." },
  { id: 'M-300', nom: 'Hana Benali', cabinet: 'Studio Médina', sujet: 'Augmenter le nombre de sièges', date: '2026-06-19 09:41', email: 'h.benali@studiomedina.dz', tel: '+213 661 44 12 30', lu: false, corps: "Nous passons de 1 à 3 architectes le mois prochain. Comment migrer du plan SOLO vers CABINET sans perdre nos projets ?" },
  { id: 'M-298', nom: 'Sofiane Mansouri', cabinet: 'Cabinet Méridien', sujet: 'Export comptable', date: '2026-06-18 17:05', email: 'patron@meridien.dz', tel: '+213 770 88 03 21', lu: true, corps: "Serait-il possible d'exporter les écritures au format compatible avec notre logiciel comptable ? Un export CSV ferait l'affaire." },
  { id: 'M-295', nom: 'Nadia Cherif', cabinet: 'Plan Libre', sujet: 'Application mobile', date: '2026-06-17 11:33', email: 'n.cherif@planlibre.dz', tel: '+213 540 12 77 65', lu: true, corps: "L'app mobile fonctionne très bien sur le chantier. Une version tablette serait un vrai plus pour les plans." },
  { id: 'M-293', nom: 'Rachid Saidi', cabinet: 'Arc Nord', sujet: 'Problème de connexion', date: '2026-06-16 08:12', email: 'k.saidi@arcnord.dz', tel: '+213 559 30 41 02', lu: true, corps: "Un de nos architectes ne parvient plus à se connecter depuis hier — le lien de réinitialisation n'arrive pas. Pouvez-vous vérifier ?" },
  { id: 'M-290', nom: 'Amel Khaldi', cabinet: 'Forme & Espace', sujet: 'Demande de démonstration', date: '2026-06-14 15:48', email: 'gerance@formeespace.dz', tel: '+213 661 70 22 19', lu: true, corps: "Nous souhaitons former deux nouvelles recrues. Proposez-vous une session de démonstration en ligne ?" },
];

A.projets = [
  { cabinet: 'Cabinet Méridien', projet: 'Villa R+1 — Hydra', type: 'Résidentiel', statut: 'Chantier', date: '2025-10-02', honoraires: 4200000 },
  { cabinet: 'Atelier Sud Architecture', projet: 'Siège social Oran', type: 'Tertiaire', statut: 'DCE', date: '2025-11-18', honoraires: 9800000 },
  { cabinet: 'Studio Médina', projet: 'Réhabilitation médina', type: 'Patrimoine', statut: 'APD', date: '2026-02-03', honoraires: 3100000 },
  { cabinet: 'Forme & Espace', projet: 'Groupe scolaire', type: 'Équipement', statut: 'DET', date: '2025-09-21', honoraires: 7600000 },
  { cabinet: 'Arc Nord', projet: 'Tour de bureaux', type: 'Tertiaire', statut: 'Esquisse', date: '2026-04-29', honoraires: 14500000 },
  { cabinet: 'Cabinet Rive', projet: 'Logements collectifs', type: 'Résidentiel', statut: 'APS', date: '2026-05-12', honoraires: 6200000 },
  { cabinet: 'Plan Libre', projet: 'Centre culturel', type: 'Équipement', statut: 'Chantier', date: '2025-08-04', honoraires: 8900000 },
  { cabinet: 'Trait & Volume', projet: 'Maison individuelle', type: 'Résidentiel', statut: 'APD', date: '2026-03-22', honoraires: 2400000 },
  { cabinet: 'Coupe & Façade', projet: 'Rénovation commerce', type: 'Commercial', statut: 'DCE', date: '2026-01-08', honoraires: 1800000 },
  { cabinet: 'Maquette Atelier', projet: 'Clinique privée', type: 'Santé', statut: 'APS', date: '2026-04-02', honoraires: 11200000 },
  { cabinet: 'Esquisse Studio', projet: 'Hôtel balnéaire', type: 'Hôtellerie', statut: 'Esquisse', date: '2026-05-30', honoraires: 23000000 },
  { cabinet: 'Cabinet Méridien', projet: 'Extension bureaux', type: 'Tertiaire', statut: 'DET', date: '2025-12-15', honoraires: 3300000 },
];

A.factures = [
  { num: 'FA-2026-0142', cabinet: 'Cabinet Méridien', client: 'SARL Promodev', montant: 738800, statut: 'Payée', echeance: '2026-05-30' },
  { num: 'FA-2026-0139', cabinet: 'Atelier Sud Architecture', client: 'Wilaya d\'Oran', montant: 2380000, statut: 'En attente', echeance: '2026-07-15' },
  { num: 'FA-2026-0137', cabinet: 'Forme & Espace', client: 'APC Annaba', montant: 1520000, statut: 'Payée', echeance: '2026-04-20' },
  { num: 'FA-2026-0134', cabinet: 'Studio Médina', client: 'Privé — M. Larbi', montant: 619500, statut: 'Impayée', echeance: '2026-05-02' },
  { num: 'FA-2026-0131', cabinet: 'Arc Nord', client: 'Groupe Cevital', montant: 4760000, statut: 'En attente', echeance: '2026-07-28' },
  { num: 'FA-2026-0128', cabinet: 'Plan Libre', client: 'Direction Culture', montant: 1190000, statut: 'Payée', echeance: '2026-03-30' },
  { num: 'FA-2026-0125', cabinet: 'Cabinet Rive', client: 'SCI Les Oliviers', montant: 892000, statut: 'Impayée', echeance: '2026-04-12' },
  { num: 'FA-2026-0122', cabinet: 'Maquette Atelier', client: 'Clinique El Wafa', montant: 3340000, statut: 'En attente', echeance: '2026-08-01' },
  { num: 'FA-2026-0119', cabinet: 'Coupe & Façade', client: 'Boutique Zilia', montant: 357000, statut: 'Payée', echeance: '2026-02-28' },
  { num: 'FA-2026-0116', cabinet: 'Esquisse Studio', client: 'Hôtel Azur', montant: 6890000, statut: 'En attente', echeance: '2026-09-10' },
];

A.aiUsage = {
  total: 18420,
  tools: [
    { name: 'CCTP', value: 7820, accent: 'bg-brand' },
    { name: 'Compte-rendu', value: 6240, accent: 'bg-emerald-500' },
    { name: 'Réglementation', value: 4360, accent: 'bg-violet-500' },
  ],
  topCabinets: [
    { nom: 'Arc Nord', value: 1840 }, { nom: 'Atelier Sud Architecture', value: 1520 },
    { nom: 'Esquisse Studio', value: 1310 }, { nom: 'Cabinet Méridien', value: 1180 },
    { nom: 'Plan Libre', value: 940 },
  ],
  overTime: [820, 910, 1040, 1180, 1290, 1370, 1510, 1640, 1720, 1810, 1930, 2360],
};

A.expenses = [
  { cat: 'Hébergement', libelle: 'Serveurs applicatifs', montant: 38000, date: '2026-06-01', recurrent: true },
  { cat: 'Email/Resend', libelle: 'Envois transactionnels', montant: 9800, date: '2026-06-01', recurrent: true },
  { cat: 'Cloudflare R2', libelle: 'Stockage fichiers & plans', montant: 14500, date: '2026-06-01', recurrent: true },
  { cat: 'Domaine', libelle: 'planner.dz + SSL', montant: 2200, date: '2026-01-15', recurrent: false },
  { cat: 'Salaires', libelle: 'Équipe technique (3)', montant: 540000, date: '2026-06-01', recurrent: true },
  { cat: 'Marketing', libelle: 'Campagne acquisition', montant: 75000, date: '2026-06-05', recurrent: false },
  { cat: 'Autre', libelle: 'Outils & licences', montant: 18600, date: '2026-06-01', recurrent: true },
];

A.expenseCats = ['Hébergement', 'Email/Resend', 'Cloudflare R2', 'Domaine', 'Salaires', 'Marketing', 'Autre'];

A.annonces = [
  { titre: 'Maintenance planifiée dimanche', canal: 'Les deux', cible: 'Tous', dest: 128, date: '2026-06-15' },
  { titre: 'Nouvelle fonctionnalité : export comptable', canal: 'In-app', cible: 'CABINET', dest: 42, date: '2026-06-08' },
  { titre: 'Mise à jour de la facturation TVA', canal: 'Email', cible: 'Tous', dest: 128, date: '2026-05-28' },
  { titre: 'Offre de parrainage AGENCE', canal: 'Email', cible: 'AGENCE', dest: 15, date: '2026-05-12' },
];

A.erreurs = [
  { niveau: 'Error', message: 'Échec génération PDF facture', source: 'invoice-service', date: '2026-06-20 03:14', occ: 12, ctx: 'TimeoutError: PDF worker exceeded 30s on FA-2026-0139 (cabinet CAB-1038). Retry queue engaged.' },
  { niveau: 'Warning', message: 'Quota stockage proche (92%)', source: 'storage-r2', date: '2026-06-19 22:48', occ: 3, ctx: 'Cabinet CAB-1024 at 184GB / 200GB. Notification sent to patron.' },
  { niveau: 'Error', message: 'Webhook Chargily non confirmé', source: 'payments', date: '2026-06-19 16:02', occ: 5, ctx: 'Signature mismatch on callback for CAB-1051. Payment marked pending, manual review needed.' },
  { niveau: 'Info', message: 'Réindexation recherche terminée', source: 'search-index', date: '2026-06-19 04:00', occ: 1, ctx: 'Full reindex of 128 cabinets / 14820 documents completed in 412s.' },
  { niveau: 'Warning', message: 'Tentatives de connexion échouées', source: 'auth', date: '2026-06-18 19:27', occ: 9, ctx: '9 failed logins for k.saidi@arcnord.dz within 10 min. Account temporarily throttled.' },
  { niveau: 'Error', message: 'Email transactionnel rejeté', source: 'resend', date: '2026-06-18 12:11', occ: 4, ctx: 'Hard bounce on reset link to archi@volumed.dz — invalid mailbox.' },
  { niveau: 'Info', message: 'Sauvegarde quotidienne OK', source: 'backup', date: '2026-06-18 02:00', occ: 1, ctx: 'Snapshot 2026-06-18 stored (R2, eu-central). Size 38.2GB.' },
];

A.logs = [
  { user: 'yassint902@gmail.com', action: 'A prolongé l\'abonnement', cible: 'CAB-1051 (+6 mois)', date: '2026-06-20 10:42', ip: '41.102.18.4' },
  { user: 'yassint902@gmail.com', action: 'A désactivé un cabinet', cible: 'CAB-1015', date: '2026-06-20 10:30', ip: '41.102.18.4' },
  { user: 'patron@meridien.dz', action: 'A créé une facture', cible: 'FA-2026-0142', date: '2026-06-20 09:58', ip: '105.99.42.71' },
  { user: 'k.saidi@arcnord.dz', action: 'A invité un membre', cible: 'archi5@arcnord.dz', date: '2026-06-20 09:12', ip: '197.14.8.220' },
  { user: 'yassint902@gmail.com', action: 'A envoyé une annonce', cible: 'Tous (128 dest.)', date: '2026-06-19 18:05', ip: '41.102.18.4' },
  { user: 'h.benali@studiomedina.dz', action: 'A modifié un projet', cible: 'Réhabilitation médina', date: '2026-06-19 15:40', ip: '102.48.16.9' },
  { user: 'gerance@formeespace.dz', action: 'A exporté des données', cible: 'Projets (CSV)', date: '2026-06-19 11:22', ip: '154.21.6.88' },
  { user: 'yassint902@gmail.com', action: 'A modifié les limites du plan', cible: 'CABINET', date: '2026-06-18 16:50', ip: '41.102.18.4' },
  { user: 'n.cherif@planlibre.dz', action: 'S\'est connecté', cible: 'Session web', date: '2026-06-18 08:03', ip: '41.200.55.12' },
  { user: 'yassint902@gmail.com', action: 'A supprimé un cabinet', cible: 'CAB-0991 (test)', date: '2026-06-17 14:19', ip: '41.102.18.4' },
];

A.plansConfig = [
  { id: 'solo', name: 'SOLO', prix: 4900, annuel: 49000, populaire: false, features: ['Projets illimités', 'Facturation & devis PDF', 'Suivi de chantier', 'Feuille de temps', 'Paiement Chargily Pay'] },
  { id: 'cabinet', name: 'CABINET', prix: 8900, annuel: 89000, populaire: true, features: ['Tout de SOLO', 'Planning d\'équipe', 'Rentabilité par projet', 'Gestion de la paie', 'Rôles & permissions', 'Support prioritaire'] },
  { id: 'agence', name: 'AGENCE', prix: 14900, annuel: 149000, populaire: false, features: ['Tout de CABINET', 'Tableaux de bord avancés', 'Exports comptables', 'Multi-agences', 'Accompagnement dédié'] },
];

A.limits = [
  { plan: 'SOLO', projets: '∞', users: 1, stockage: 5, planning: false, soustraitants: false, exportCompta: false, ia: true },
  { plan: 'CABINET', projets: '∞', users: 5, stockage: 50, planning: true, soustraitants: true, exportCompta: false, ia: true },
  { plan: 'AGENCE', projets: '∞', users: 10, stockage: 200, planning: true, soustraitants: true, exportCompta: true, ia: true },
];

window.A = A;
