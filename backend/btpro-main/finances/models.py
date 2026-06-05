from django.db import models, transaction
from django.utils import timezone
from projets.models import Projet, Client
from cabinets.models import Cabinet


def _gen_numero(model_class, cabinet, prefix):
    year = timezone.now().year
    pat = f'{prefix}-{year}-'
    with transaction.atomic():
        last = model_class.objects.select_for_update().filter(
            numero__startswith=pat
        ).order_by('numero').last()
        if last:
            try:
                seq = int(last.numero[len(pat):]) + 1
            except (ValueError, IndexError):
                seq = model_class.objects.filter(numero__startswith=pat).count() + 1
        else:
            seq = 1
        return f'{pat}{seq:04d}'


CONDITIONS_PAIEMENT = [
    ('RECEPTION',    'À réception'),
    ('30J',          '30 jours'),
    ('45J',          '45 jours'),
    ('60J',          '60 jours'),
    ('PERSONNALISE', 'Personnalisé'),
]


class Devis(models.Model):
    STATUTS = [
        ('BROUILLON', 'Brouillon'),
        ('ENVOYE', 'Envoyé'),
        ('ACCEPTE', 'Accepté'),
        ('REFUSE', 'Refusé'),
    ]
    cabinet      = models.ForeignKey(Cabinet, on_delete=models.CASCADE)
    client       = models.ForeignKey(Client, on_delete=models.CASCADE)
    projet       = models.ForeignKey(Projet, on_delete=models.CASCADE, null=True, blank=True)
    numero       = models.CharField(max_length=50, unique=True, blank=True)
    statut       = models.CharField(max_length=20, choices=STATUTS, default='BROUILLON')
    montant_ht   = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    montant_ttc  = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    remise       = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    date_emission  = models.DateField(auto_now_add=True)
    date_validite  = models.DateField()
    conditions_paiement = models.CharField(max_length=20, choices=CONDITIONS_PAIEMENT, default='30J')
    rib          = models.CharField(max_length=200, blank=True, default='')
    mentions_legales = models.TextField(blank=True, default='')
    notes        = models.TextField(blank=True)

    def save(self, *args, **kwargs):
        if not self.pk and not self.numero:
            self.numero = _gen_numero(Devis, self.cabinet, 'DEV')
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Devis {self.numero}"


class LigneDevis(models.Model):
    devis        = models.ForeignKey(Devis, on_delete=models.CASCADE, related_name='lignes')
    designation  = models.CharField(max_length=500)
    quantite     = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    prix_unitaire = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    tva          = models.DecimalField(max_digits=5, decimal_places=2, default=19)
    ordre        = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['ordre']

    @property
    def total_ht(self):
        return self.quantite * self.prix_unitaire

    @property
    def total_ttc(self):
        return self.total_ht * (1 + self.tva / 100)


class Facture(models.Model):
    STATUTS = [
        ('BROUILLON',          'Brouillon'),
        ('EMISE',              'Émise'),
        ('ENVOYEE',            'Envoyée'),
        ('PARTIELLEMENT_PAYEE','Partiellement payée'),
        ('SOLDEE',             'Soldée'),
        ('ANNULEE',            'Annulée'),
    ]
    cabinet      = models.ForeignKey(Cabinet, on_delete=models.CASCADE)
    client       = models.ForeignKey(Client, on_delete=models.CASCADE)
    projet       = models.ForeignKey(Projet, on_delete=models.CASCADE)
    numero       = models.CharField(max_length=50, unique=True, blank=True)
    statut       = models.CharField(max_length=25, choices=STATUTS, default='EMISE')
    montant_ht   = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    montant_ttc  = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    remise       = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    date_emission  = models.DateField(auto_now_add=True)
    date_echeance  = models.DateField()
    phase        = models.ForeignKey('projets.Phase', on_delete=models.SET_NULL, null=True, blank=True)
    conditions_paiement = models.CharField(max_length=20, choices=CONDITIONS_PAIEMENT, default='30J')
    rib          = models.CharField(max_length=200, blank=True, default='')
    mentions_legales = models.TextField(blank=True, default='')
    notes        = models.TextField(blank=True)

    def save(self, *args, **kwargs):
        if not self.pk and not self.numero:
            self.numero = _gen_numero(Facture, self.cabinet, 'FAC')
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Facture {self.numero}"


class LigneFacture(models.Model):
    facture      = models.ForeignKey(Facture, on_delete=models.CASCADE, related_name='lignes')
    designation  = models.CharField(max_length=500)
    quantite     = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    prix_unitaire = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    tva          = models.DecimalField(max_digits=5, decimal_places=2, default=19)
    ordre        = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['ordre']

    @property
    def total_ht(self):
        return self.quantite * self.prix_unitaire

    @property
    def total_ttc(self):
        return self.total_ht * (1 + self.tva / 100)


class Paiement(models.Model):
    MODES = [
        ('VIREMENT', 'Virement bancaire'),
        ('CHEQUE', 'Chèque'),
        ('ESPECES', 'Espèces'),
        ('CCP', 'CCP'),
    ]
    facture = models.ForeignKey(Facture, on_delete=models.CASCADE, related_name='paiements')
    montant = models.DecimalField(max_digits=15, decimal_places=2)
    mode = models.CharField(max_length=20, choices=MODES)
    date_paiement = models.DateField()
    reference = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"Paiement {self.facture.numero} - {self.montant} DA"


class Charge(models.Model):
    CATEGORIES = [
        ('DEPLACEMENT', 'Déplacement'),
        ('CARBURANT', 'Carburant / Essence'),
        ('ACCIDENT', 'Accident / Assurance'),
        ('LOYER', 'Loyer local'),
        ('MOBILIER', 'Mobilier / Équipement'),
        ('LOGICIEL', 'Logiciels / Abonnements'),
        ('SALAIRE', 'Salaires'),
        ('IMPOTS', 'Impôts / Taxes'),
        ('AUTRE', 'Autre'),
    ]
    cabinet = models.ForeignKey(Cabinet, on_delete=models.CASCADE, related_name='charges')
    projet = models.ForeignKey(Projet, on_delete=models.CASCADE, null=True, blank=True, related_name='charges')
    categorie = models.CharField(max_length=20, choices=CATEGORIES)
    description = models.TextField()
    montant = models.DecimalField(max_digits=15, decimal_places=2)
    date = models.DateField()
    justificatif = models.FileField(upload_to='charges/', null=True, blank=True)
    paye_par = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return f"{self.categorie} - {self.montant} DA"


class ConfigPaie(models.Model):
    TYPES = [
        ('MENSUEL',    'Mensuel fixe'),
        ('JOURNALIER', 'Journalier'),
    ]
    membre = models.OneToOneField('users.User', on_delete=models.CASCADE, related_name='config_paie')
    type_paie = models.CharField(max_length=20, choices=TYPES, default='MENSUEL')
    taux = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.membre} — {self.type_paie} {self.taux} DA"


class FichePaie(models.Model):
    cabinet = models.ForeignKey(Cabinet, on_delete=models.CASCADE, related_name='fiches_paie')
    membre = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='fiches_paie')
    periode_mois = models.IntegerField()
    periode_annee = models.IntegerField()
    type_paie = models.CharField(max_length=20)
    taux = models.DecimalField(max_digits=12, decimal_places=2)
    nb_jours = models.DecimalField(max_digits=6, decimal_places=1, default=0)
    montant = models.DecimalField(max_digits=12, decimal_places=2)
    charge = models.OneToOneField(Charge, on_delete=models.SET_NULL, null=True, blank=True, related_name='fiche_paie')
    notes = models.TextField(blank=True, default='')
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('cabinet', 'membre', 'periode_mois', 'periode_annee')
        ordering = ['-periode_annee', '-periode_mois']

    def __str__(self):
        return f"Paie {self.membre} {self.periode_mois}/{self.periode_annee}"