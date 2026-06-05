from django.db import models


class Cabinet(models.Model):
    nom = models.CharField(max_length=255)
    activite = models.CharField(max_length=200, blank=True, default="Cabinet d'Architecture")
    adresse = models.CharField(max_length=255, blank=True, default='')
    telephone = models.CharField(max_length=20, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    logo = models.ImageField(upload_to='logos/', null=True, blank=True)
    numero_rc = models.CharField(max_length=50, blank=True, default='')
    nif = models.CharField(max_length=50, blank=True, default='')
    ai = models.CharField(max_length=50, blank=True, default='')
    nis = models.CharField(max_length=50, blank=True, default='')
    wilaya = models.CharField(max_length=100, blank=True, default='')
    assujetti_tva = models.BooleanField(default=True)
    date_creation = models.DateField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nom


class Abonnement(models.Model):
    PLANS = [
        ('SOLO', 'Solo - 3 900 DA/mois'),
        ('CABINET', 'Cabinet - 7 900 DA/mois'),
        ('AGENCE', 'Agence - 14 900 DA/mois'),
    ]
    cabinet = models.OneToOneField(Cabinet, on_delete=models.CASCADE, related_name='abonnement')
    plan = models.CharField(max_length=20, choices=PLANS, default='SOLO')
    date_debut = models.DateField(auto_now_add=True)
    date_fin = models.DateField(null=True, blank=True)
    actif = models.BooleanField(default=True)

    def __str__(self):
        return self.cabinet.nom + ' - ' + self.plan


class ContactMessage(models.Model):
    SUBJECTS = [
        ('DEMO', 'Demande de démo'),
        ('TARIF', 'Question tarifaire'),
        ('SUPPORT', 'Support technique'),
        ('PARTENARIAT', 'Partenariat'),
        ('AUTRE', 'Autre'),
    ]
    nom = models.CharField(max_length=200)
    cabinet = models.CharField(max_length=200, blank=True, default='')
    email = models.EmailField()
    telephone = models.CharField(max_length=20, blank=True, default='')
    sujet = models.CharField(max_length=20, choices=SUBJECTS, default='AUTRE')
    message = models.TextField()
    lu = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.nom} — {self.get_sujet_display()} ({self.email})"