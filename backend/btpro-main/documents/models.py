from django.db import models
from projets.models import Projet


class Document(models.Model):
    TYPES = [
        ('PLAN', 'Plan'),
        ('PERMIS', 'Permis de construire'),
        ('DCE', 'DCE'),
        ('CCTP', 'CCTP'),
        ('RAPPORT', 'Rapport'),
        ('CONTRAT', 'Contrat'),
        ('AVENANT', 'Avenant'),
        ('AUTRE', 'Autre'),
    ]
    projet = models.ForeignKey(Projet, on_delete=models.CASCADE, related_name='documents')
    nom = models.CharField(max_length=200)
    type_document = models.CharField(max_length=20, choices=TYPES)
    description = models.TextField(blank=True)
    uploade_par = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True)
    date_upload = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nom

class Version(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='versions')
    numero_version = models.IntegerField()
    fichier = models.FileField(upload_to='documents/')
    taille = models.IntegerField(default=0)
    commentaire = models.CharField(max_length=200, blank=True)
    uploade_par = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True)
    date_upload = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-numero_version']

    def __str__(self):
        return f"{self.document.nom} v{self.numero_version}"