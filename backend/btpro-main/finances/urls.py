from django.urls import path
from . import views, payment_views

urlpatterns = [
    path('devis/', views.devis, name='devis'),
    path('devis/<int:pk>/', views.devis_detail, name='devis_detail'),
    path('factures/', views.factures, name='factures'),
    path('factures/<int:pk>/', views.facture_detail, name='facture_detail'),
    path('factures/<int:pk>/pdf/', views.facture_pdf, name='facture_pdf'),
    path('factures/<int:pk>/relance/', views.envoyer_relance, name='envoyer_relance'),
    path('factures/<int:facture_pk>/paiements/', views.ajouter_paiement, name='ajouter_paiement'),
    path('alertes/', views.alertes_impayes, name='alertes_impayes'),
    path('charges/', views.charges, name='charges'),
    path('charges/<int:pk>/', views.charge_detail, name='charge_detail'),
    path('devis/<int:pk>/pdf/', views.devis_pdf, name='devis_pdf'),
    path('devis/<int:pk>/convertir/', views.convertir_devis, name='convertir_devis'),
    path('checkout/', payment_views.create_checkout, name='create_checkout'),
    path('webhook/', payment_views.webhook, name='payment_webhook'),
    path('paie/membres/', views.paie_membres, name='paie_membres'),
    path('paie/config/<int:user_id>/', views.paie_config, name='paie_config'),
    path('paie/fiches/', views.paie_fiches, name='paie_fiches'),
    path('paie/fiches/<int:pk>/', views.paie_fiche_detail, name='paie_fiche_detail'),
    path('paie/resume/', views.paie_resume, name='paie_resume'),
    path('paie/mon-salaire/', views.mon_salaire, name='mon_salaire'),
]