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
        ('SOLO', 'Solo - 4 900 DA/mois'),
        ('CABINET', 'Cabinet - 8 900 DA/mois'),
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
    reponse = models.TextField(blank=True, default='')
    repondu = models.BooleanField(default=False)
    repondu_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.nom} — {self.get_sujet_display()} ({self.email})"


class PlatformCharge(models.Model):
    """Charges/frais de la plateforme elle-même (côté éditeur du SaaS) — pour le P&L superadmin."""
    CATEGORIES = [
        ('HEBERGEMENT', 'Hébergement'),
        ('EMAIL', 'Email/Resend'),
        ('STOCKAGE', 'Cloudflare R2'),
        ('DOMAINE', 'Domaine'),
        ('SALAIRES', 'Salaires'),
        ('MARKETING', 'Marketing'),
        ('AUTRE', 'Autre'),
    ]
    categorie = models.CharField(max_length=20, choices=CATEGORIES, default='AUTRE')
    libelle = models.CharField(max_length=200)
    montant = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    date = models.DateField()
    recurrent = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-id']

    def __str__(self):
        return f"{self.get_categorie_display()} — {self.montant} DA"


class Annonce(models.Model):
    """Annonce diffusée par le superadmin aux cabinets (in-app et/ou email)."""
    CANALS = [
        ('INAPP', 'In-app'),
        ('EMAIL', 'Email'),
        ('LES_DEUX', 'Les deux'),
    ]
    CIBLES = [
        ('TOUS', 'Tous'),
        ('SOLO', 'SOLO'),
        ('CABINET', 'CABINET'),
        ('AGENCE', 'AGENCE'),
    ]
    titre = models.CharField(max_length=200)
    message = models.TextField()
    canal = models.CharField(max_length=10, choices=CANALS, default='LES_DEUX')
    cible = models.CharField(max_length=10, choices=CIBLES, default='TOUS')
    destinataires = models.IntegerField(default=0)
    sent_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.titre} → {self.get_cible_display()} ({self.destinataires})"


class PlanConfig(models.Model):
    """Configuration éditable d'un plan (tarifs + limites + fonctionnalités). Remplace les valeurs codées en dur."""
    code = models.CharField(max_length=20, unique=True)   # SOLO / CABINET / AGENCE
    name = models.CharField(max_length=50)
    prix = models.DecimalField(max_digits=10, decimal_places=2, default=0)      # mensuel (DA)
    annuel = models.DecimalField(max_digits=10, decimal_places=2, default=0)    # annuel (DA)
    populaire = models.BooleanField(default=False)
    features = models.JSONField(default=list)
    max_users = models.IntegerField(default=1)
    max_projets = models.IntegerField(default=30)   # <= 0 => illimité
    stockage_gb = models.IntegerField(default=5)
    f_planning = models.BooleanField(default=False)
    f_soustraitants = models.BooleanField(default=False)
    f_export_compta = models.BooleanField(default=False)
    f_ia = models.BooleanField(default=True)
    ordre = models.IntegerField(default=0)

    class Meta:
        ordering = ['ordre']

    def __str__(self):
        return f"{self.code} — {self.prix} DA"


class SiteSetting(models.Model):
    """Paramètres généraux du SaaS (ligne unique)."""
    nom = models.CharField(max_length=100, default='Planner')
    email_contact = models.EmailField(default='contact@planner.dz')
    devise = models.CharField(max_length=10, default='DA')
    tva_defaut = models.DecimalField(max_digits=5, decimal_places=2, default=19)
    maintenance = models.BooleanField(default=False)
    inscriptions_ouvertes = models.BooleanField(default=True)

    def __str__(self):
        return self.nom

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class ActivityLog(models.Model):
    """Piste d'audit des actions sur la plateforme."""
    user_email = models.CharField(max_length=254, blank=True, default='')
    action = models.CharField(max_length=200)
    cible = models.CharField(max_length=200, blank=True, default='')
    ip = models.CharField(max_length=64, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user_email} — {self.action}"


class SystemError(models.Model):
    """Journal des incidents techniques de la plateforme."""
    NIVEAUX = [('Error', 'Error'), ('Warning', 'Warning'), ('Info', 'Info')]
    niveau = models.CharField(max_length=10, choices=NIVEAUX, default='Error')
    message = models.CharField(max_length=300)
    source = models.CharField(max_length=120, blank=True, default='')
    contexte = models.TextField(blank=True, default='')
    occurrences = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"[{self.niveau}] {self.message}"