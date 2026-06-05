from django.contrib import admin
from .models import Devis, Facture, Paiement, Charge

admin.site.register(Devis)
admin.site.register(Facture)
admin.site.register(Paiement)
admin.site.register(Charge)