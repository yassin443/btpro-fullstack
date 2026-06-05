from django.db import models, transaction
from django.utils import timezone
from projets.models import Projet, Client
from cabinets.models import Cabinet


def _gen_numero(cabinet, prefix):
    year = timezone.now().year
    pat = f'{prefix}-{year}-'
    with transaction.atomic():
        last = Contrat.objects.select_for_update().filter(
            cabinet=cabinet, numero__startswith=pat
        ).order_by('numero').last()
        if last:
            try:
                seq = int(last.numero[len(pat):]) + 1
            except (ValueError, IndexError):
                seq = Contrat.objects.filter(cabinet=cabinet, numero__startswith=pat).count() + 1
        else:
            seq = 1
        return f'{pat}{seq:04d}'


MISSIONS = [
    ('ESQ', 'Esquisse'),
    ('APS', 'Avant-Projet Sommaire'),
    ('APD', 'Avant-Projet Détaillé'),
    ('PC',  'Permis de Construire'),
    ('DCE', 'Dossier Consultation Entreprises'),
    ('APM', 'Assistance Passation Marchés'),
    ('DET', 'Direction Exécution des Travaux'),
    ('AOR', 'Assistance Opérations de Réception'),
]
MISSIONS_DICT = dict(MISSIONS)


class Contrat(models.Model):
    TYPES = [
        ('CONTRAT', "Contrat de maîtrise d'œuvre"),
        ('AVENANT', 'Avenant'),
    ]
    STATUTS = [
        ('BROUILLON', 'Brouillon'),
        ('ENVOYE', 'Envoyé'),
        ('SIGNE', 'Signé'),
        ('RESILIE', 'Résilié'),
    ]

    cabinet         = models.ForeignKey(Cabinet, on_delete=models.CASCADE, related_name='contrats')
    projet          = models.ForeignKey(Projet,  on_delete=models.CASCADE, related_name='contrats')
    client          = models.ForeignKey(Client,  on_delete=models.CASCADE, related_name='contrats')
    contrat_parent  = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='avenants')

    numero          = models.CharField(max_length=50, blank=True)
    type            = models.CharField(max_length=20, choices=TYPES, default='CONTRAT')
    statut          = models.CharField(max_length=20, choices=STATUTS, default='BROUILLON')

    objet           = models.TextField()
    missions        = models.JSONField(default=list)

    montant_ht      = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    tva             = models.DecimalField(max_digits=5,  decimal_places=2, default=19)
    montant_ttc     = models.DecimalField(max_digits=15, decimal_places=2, default=0)

    date_debut      = models.DateField(null=True, blank=True)
    date_fin        = models.DateField(null=True, blank=True)
    date_signature  = models.DateField(null=True, blank=True)
    date_creation   = models.DateField(auto_now_add=True)

    notes           = models.TextField(blank=True, default='')

    def save(self, *args, **kwargs):
        if not self.pk and not self.numero:
            prefix = 'AVN' if self.type == 'AVENANT' else 'CTR'
            self.numero = _gen_numero(self.cabinet, prefix)
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.numero} — {self.projet.nom}'

    class Meta:
        ordering = ['-date_creation']
        unique_together = [('cabinet', 'numero')]


class ArticleContrat(models.Model):
    contrat  = models.ForeignKey(Contrat, on_delete=models.CASCADE, related_name='articles')
    titre    = models.CharField(max_length=200)
    contenu  = models.TextField(blank=True, default='')
    ordre    = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['ordre']

    def __str__(self):
        return f'{self.contrat.numero} — Art.{self.ordre} {self.titre}'


ARTICLES_DEFAUT_CONTRAT = [
    ('Objet du contrat',
     "Le présent contrat a pour objet de définir les conditions dans lesquelles le Maître d'œuvre est chargé par le Maître d'ouvrage de la réalisation des études d'architecture et du suivi d'exécution du projet."),
    ('Étendue de la mission',
     "La mission comprend les phases suivantes : Esquisse (ESQ), Avant-Projet Sommaire (APS), Avant-Projet Détaillé (APD), Permis de Construire (PC), Dossier Consultation Entreprises (DCE), Direction Exécution Travaux (DET), Assistance Opérations de Réception (AOR)."),
    ('Honoraires',
     "En contrepartie de sa mission, le Maître d'œuvre percevra des honoraires conformément aux montants définis dans le présent contrat, TVA 19% incluse."),
    ('Modalités de paiement',
     "30% à la signature du contrat.\n20% à la validation de l'APS.\n25% à la remise de l'APD et du permis de construire.\n15% à la remise du DCE.\n10% à la réception définitive des travaux."),
    ('Durée & délais',
     "Le contrat prend effet à compter de sa date de signature. La durée d'exécution de la mission sera précisée par phase dans le planning général. Toute prolongation fera l'objet d'un avenant."),
    ('Obligations des parties',
     "Le Maître d'ouvrage s'engage à fournir les documents nécessaires et à régler les honoraires conformément à l'article sur les modalités de paiement. Le Maître d'œuvre s'engage à exécuter sa mission avec diligence, dans le respect des règles de l'art et des dispositions légales en vigueur en Algérie."),
    ('Assurance & responsabilité',
     "Le Maître d'œuvre déclare avoir souscrit une assurance professionnelle (Garantie Décennale et Responsabilité Civile) couvrant les risques liés à l'exercice de sa mission."),
    ('Résiliation',
     "En cas de manquement grave, le contrat pourra être résilié de plein droit, après mise en demeure restée sans effet pendant 30 jours. Les honoraires des phases déjà réalisées restent acquis au Maître d'œuvre."),
    ('Litiges & juridiction compétente',
     "Tout différend sera, à défaut de règlement amiable, porté devant le Tribunal d'Alger, seul compétent. Le contrat est soumis au droit algérien."),
]

ARTICLES_DEFAUT_AVENANT = [
    ('Préambule',
     "Les parties ont conclu un contrat de maîtrise d'œuvre portant sur le projet mentionné ci-dessus. Dans le cadre de l'évolution du programme, les parties conviennent des modifications suivantes."),
    ('Objet de l\'avenant',
     "Le présent avenant modifie les conditions du contrat initial sur les points décrits ci-après."),
    ('Honoraires complémentaires',
     "En contrepartie des modifications apportées, le Maître d'œuvre percevra des honoraires complémentaires conformément aux montants définis dans le présent avenant, TVA 19% incluse."),
    ('Dispositions inchangées',
     "Toutes les autres clauses du contrat initial non expressément modifiées par le présent avenant demeurent en vigueur."),
]
