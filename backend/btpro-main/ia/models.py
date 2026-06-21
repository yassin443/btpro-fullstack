from django.db import models


class IAUsage(models.Model):
    """Journalise chaque génération IA pour les statistiques superadmin."""
    OUTILS = [
        ('cctp', 'CCTP'),
        ('cr', 'Compte-rendu'),
        ('reglementation', 'Réglementation'),
    ]
    cabinet = models.ForeignKey('cabinets.Cabinet', on_delete=models.CASCADE, null=True, blank=True, related_name='ia_usages')
    user = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True)
    outil = models.CharField(max_length=20, choices=OUTILS)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.outil} — {self.created_at:%Y-%m-%d}"
