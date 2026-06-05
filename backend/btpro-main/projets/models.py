from django.db import models
from cabinets.models import Cabinet


class Client(models.Model):
    cabinet = models.ForeignKey(Cabinet, on_delete=models.CASCADE, related_name='clients')
    nom = models.CharField(max_length=200)
    contact_nom = models.CharField(max_length=200, blank=True, default='')
    telephone = models.CharField(max_length=20, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    adresse = models.TextField(blank=True, default='')
    numero_rc = models.CharField(max_length=50, blank=True, default='')
    nif = models.CharField(max_length=50, blank=True, default='')
    ai = models.CharField(max_length=50, blank=True, default='')
    nis = models.CharField(max_length=50, blank=True, default='')
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nom


class Projet(models.Model):
    STATUTS = [
        ('EN_COURS', 'En cours'),
        ('TERMINE', 'Terminé'),
        ('SUSPENDU', 'Suspendu'),
        ('ANNULE', 'Annulé'),
    ]
    TYPES = [
        ('RESIDENTIEL', 'Résidentiel'),
        ('LOGEMENT', 'Logement'),
        ('COMMERCE', 'Commerce'),
        ('INDUSTRIEL', 'Industriel'),
        ('EQUIPEMENT', 'Équipement public'),
        ('PAYSAGISME', 'Paysagisme'),
        ('RENOVATION', 'Rénovation'),
        ('AUTRE', 'Autre'),
    ]
    cabinet = models.ForeignKey(Cabinet, on_delete=models.CASCADE, related_name='projets')
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='projets')
    nom = models.CharField(max_length=200)
    type_projet = models.CharField(max_length=20, choices=TYPES, default='RESIDENTIEL')
    surface = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    adresse_chantier = models.TextField(blank=True, default='')
    wilaya = models.CharField(max_length=50, blank=True, default='')
    statut = models.CharField(max_length=20, choices=STATUTS, default='EN_COURS')
    date_debut = models.DateField(null=True, blank=True)
    date_fin_prevue = models.DateField(null=True, blank=True)
    honoraires_total = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    description = models.TextField(blank=True, default='')
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nom


class Phase(models.Model):
    NOMS = [
        ('ESQUISSE', 'Esquisse'),
        ('APS', 'Avant-projet sommaire'),
        ('APD', 'Avant-projet détaillé'),
        ('PRO', 'Projet'),
        ('DCE', 'Dossier consultation entreprises'),
        ('EXECUTION', 'Exécution'),
        ('RECEPTION', 'Réception'),
    ]
    projet = models.ForeignKey(Projet, on_delete=models.CASCADE, related_name='phases')
    nom = models.CharField(max_length=20, choices=NOMS)
    pourcentage_honoraires = models.DecimalField(max_digits=5, decimal_places=2, default=0, blank=True)
    date_debut = models.DateField(null=True, blank=True)
    date_fin = models.DateField(null=True, blank=True)
    complete = models.BooleanField(default=False)

    def __str__(self):
        return self.projet.nom + ' - ' + self.nom


class Tache(models.Model):
    PRIORITES = [('BASSE','Basse'),('NORMALE','Normale'),('HAUTE','Haute'),('URGENTE','Urgente')]
    STATUTS = [('A_FAIRE','À faire'),('EN_COURS','En cours'),('TERMINE','Terminé'),('ANNULE','Annulé'),('SUSPENDU','Suspendu')]
    phase = models.ForeignKey(Phase, on_delete=models.CASCADE, related_name='taches')
    assignee = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True)
    titre = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    priorite = models.CharField(max_length=10, choices=PRIORITES, default='NORMALE')
    statut = models.CharField(max_length=10, choices=STATUTS, default='A_FAIRE')
    deadline = models.DateField(null=True, blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.titre


class FeuilleDeTemps(models.Model):
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='feuilles')
    projet = models.ForeignKey(Projet, on_delete=models.CASCADE, related_name='feuilles')
    phase = models.ForeignKey(Phase, on_delete=models.CASCADE, null=True, blank=True, related_name='feuilles')
    taches = models.ManyToManyField(Tache, blank=True, related_name='feuilles')
    date = models.DateField()
    heures = models.DecimalField(max_digits=5, decimal_places=2)
    taux_horaire = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    description = models.TextField(blank=True)
    facturable = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return self.user.prenom + ' - ' + self.projet.nom + ' - ' + str(self.heures) + 'h'

    @property
    def montant(self):
        return self.heures * self.taux_horaire


class SousTraitant(models.Model):
    TYPES = [
        ('BET_STRUCTURE', 'BET Structure'),
        ('BET_FLUIDES', 'BET Fluides'),
        ('ECONOMISTE', 'Économiste'),
        ('GEOMETRE', 'Géomètre'),
        ('GEOTECHNIQUE', 'Géotechnique'),
        ('ELECTRICIEN', 'Électricien'),
        ('PLOMBIER', 'Plombier'),
        ('MENUISIER', 'Menuisier'),
        ('PEINTRE', 'Peintre'),
        ('AUTRE', 'Autre'),
    ]
    STATUTS = [
        ('ACTIF', 'Actif'),
        ('TERMINE', 'Terminé'),
        ('SUSPENDU', 'Suspendu'),
    ]
    cabinet         = models.ForeignKey(Cabinet, on_delete=models.CASCADE, related_name='sous_traitants')
    projet          = models.ForeignKey(Projet, on_delete=models.CASCADE, related_name='sous_traitants', null=True, blank=True)
    nom             = models.CharField(max_length=200)
    type_prestation = models.CharField(max_length=20, choices=TYPES)
    telephone       = models.CharField(max_length=20, blank=True)
    email           = models.EmailField(blank=True)
    montant         = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    paye            = models.BooleanField(default=False)
    statut          = models.CharField(max_length=20, choices=STATUTS, default='ACTIF')
    date_debut      = models.DateField(null=True, blank=True)
    date_fin        = models.DateField(null=True, blank=True)
    notes           = models.TextField(blank=True)
    created_at      = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.nom


class PermisConstruction(models.Model):
    TYPES = [
        ('PC', 'Permis de construire'),
        ('CU', "Certificat d'urbanisme"),
        ('DAEU', "Décl. achèvement"),
        ('AUTRE', 'Autre'),
    ]
    STATUTS = [
        ('PREPARATION', 'En préparation'),
        ('DEPOSE', 'Déposé'),
        ('INSTRUCTION', 'En instruction'),
        ('OBTENU', 'Obtenu'),
        ('REFUSE', 'Refusé'),
        ('ARCHIVE', 'Archivé'),
    ]
    cabinet = models.ForeignKey(Cabinet, on_delete=models.CASCADE, related_name='permis')
    projet = models.ForeignKey(Projet, on_delete=models.CASCADE, related_name='permis')
    type_pc = models.CharField(max_length=10, choices=TYPES, default='PC')
    statut = models.CharField(max_length=20, choices=STATUTS, default='PREPARATION')
    reference = models.CharField(max_length=100, blank=True)
    wilaya = models.CharField(max_length=50, blank=True)
    date_depot = models.DateField(null=True, blank=True)
    date_decision_prevue = models.DateField(null=True, blank=True)
    date_obtention = models.DateField(null=True, blank=True)
    numero_arrete = models.CharField(max_length=100, blank=True)
    observations = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_type_pc_display()} — {self.projet.nom}"


class BudgetPoste(models.Model):
    CATEGORIES = [
        ('HONORAIRES', 'Honoraires'),
        ('ETUDES', 'Études techniques'),
        ('TRAVAUX', 'Travaux'),
        ('ADMINISTRATION', 'Frais administratifs'),
        ('DIVERS', 'Divers'),
    ]
    cabinet = models.ForeignKey(Cabinet, on_delete=models.CASCADE, related_name='budget_postes')
    projet = models.ForeignKey(Projet, on_delete=models.CASCADE, related_name='budget_postes')
    categorie = models.CharField(max_length=20, choices=CATEGORIES, default='DIVERS')
    libelle = models.CharField(max_length=200)
    montant_prevu = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    montant_reel = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['categorie', 'libelle']

    def __str__(self):
        return f"{self.libelle} — {self.projet.nom}"


class CompteRendu(models.Model):
    cabinet = models.ForeignKey(Cabinet, on_delete=models.CASCADE, related_name='comptes_rendus')
    projet = models.ForeignKey(Projet, on_delete=models.CASCADE, related_name='comptes_rendus')
    titre = models.CharField(max_length=200)
    date = models.DateField()
    lieu = models.CharField(max_length=200, blank=True)
    animateur = models.CharField(max_length=100, blank=True)
    participants = models.TextField(blank=True)
    ordre_du_jour = models.TextField(blank=True)
    decisions = models.TextField(blank=True)
    observations = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"{self.titre} — {self.date}"


class Notification(models.Model):
    cabinet = models.ForeignKey(Cabinet, on_delete=models.CASCADE, related_name='notifications')
    destinataire = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='notifications')
    message = models.CharField(max_length=300)
    lu = models.BooleanField(default=False)
    lien = models.CharField(max_length=200, blank=True)
    date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return self.message