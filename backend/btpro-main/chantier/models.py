from django.db import models
from projets.models import Projet


class JournalChantier(models.Model):
    METEOS = [
        ('SOLEIL', 'Ensoleillé'),
        ('NUAGEUX', 'Nuageux'),
        ('PLUIE', 'Pluie'),
        ('VENT', 'Vent'),
    ]
    projet = models.ForeignKey(Projet, on_delete=models.CASCADE, related_name='journaux')
    date = models.DateField()
    meteo = models.CharField(max_length=20, choices=METEOS)
    effectif = models.IntegerField(default=0)
    avancement = models.IntegerField(default=0)
    travaux_realises = models.TextField()
    observations = models.TextField(blank=True)
    redacteur = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Journal {self.projet.nom} - {self.date}"


class PhotoChantier(models.Model):
    journal = models.ForeignKey(JournalChantier, on_delete=models.CASCADE, related_name='photos')
    image = models.ImageField(upload_to='chantier/photos/')
    legende = models.CharField(max_length=200, blank=True)
    date_prise = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Photo {self.journal.projet.nom} - {self.date_prise}"


class Reserve(models.Model):
    STATUTS = [
        ('OUVERTE', 'Ouverte'),
        ('EN_COURS', 'En cours de levée'),
        ('LEVEE', 'Levée'),
    ]
    projet = models.ForeignKey(Projet, on_delete=models.CASCADE, related_name='reserves')
    description = models.TextField()
    responsable = models.CharField(max_length=200)
    statut = models.CharField(max_length=10, choices=STATUTS, default='OUVERTE')
    date_constat = models.DateField(auto_now_add=True)
    date_levee = models.DateField(null=True, blank=True)
    photo = models.ImageField(upload_to='reserves/', null=True, blank=True)

    def __str__(self):
        return f"Réserve {self.projet.nom} - {self.statut}"


class OrdreService(models.Model):
    TYPES = [
        ('DEMARRAGE', 'Ordre de démarrage'),
        ('ARRET', 'Ordre d arrêt'),
        ('REPRISE', 'Ordre de reprise'),
        ('MODIFICATION', 'Ordre de modification'),
    ]
    projet = models.ForeignKey(Projet, on_delete=models.CASCADE, related_name='ordres_service')
    type_ordre = models.CharField(max_length=20, choices=TYPES)
    numero = models.CharField(max_length=50, unique=True)
    description = models.TextField()
    date_emission = models.DateField(auto_now_add=True)
    emis_par = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return f"{self.type_ordre} - {self.projet.nom}"


class RapportTerrain(models.Model):
    projet = models.ForeignKey('projets.Projet', on_delete=models.CASCADE, related_name='rapports_terrain')
    redacteur = models.ForeignKey('users.User', on_delete=models.CASCADE)
    date = models.DateField()
    titre = models.CharField(max_length=200)
    lieu = models.CharField(max_length=200, blank=True)
    meteo = models.CharField(max_length=20, default='SOLEIL')
    etat_general = models.CharField(max_length=20, choices=[
        ('BON', 'Bon'),
        ('ACCEPTABLE', 'Acceptable'),
        ('MAUVAIS', 'Mauvais'),
        ('CRITIQUE', 'Critique'),
    ], default='BON')
    observations = models.TextField(blank=True)
    securite_ok = models.BooleanField(default=True)
    structure_ok = models.BooleanField(default=True)
    electricite_ok = models.BooleanField(default=True)
    plomberie_ok = models.BooleanField(default=True)
    etancheite_ok = models.BooleanField(default=True)
    finitions_ok = models.BooleanField(default=True)
    actions_requises = models.TextField(blank=True)
    points_controle = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return self.titre + ' - ' + str(self.date)