from django.urls import path
from . import superadmin_views

urlpatterns = [
    path('dashboard/', superadmin_views.dashboard),
    path('cabinets/<int:pk>/toggle/', superadmin_views.toggle_cabinet),
    path('cabinets/<int:pk>/plan/', superadmin_views.update_plan),
    path('cabinets/<int:pk>/prolonger/', superadmin_views.prolonger),
    path('cabinets/<int:pk>/delete/', superadmin_views.delete_cabinet),
    path('cabinets/<int:pk>/membres/', superadmin_views.cabinet_membres),
    path('contact-messages/', superadmin_views.contact_messages),
    path('contact-messages/<int:pk>/lu/', superadmin_views.contact_message_lu),
    path('contact-messages/<int:pk>/repondre/', superadmin_views.contact_message_repondre),
    path('projets/', superadmin_views.all_projets),
    path('factures/', superadmin_views.all_factures),
    path('charges-plateforme/', superadmin_views.charges_plateforme),
    path('charges-plateforme/<int:pk>/', superadmin_views.charge_plateforme_detail),
    path('annonces/', superadmin_views.annonces),
    path('logs/', superadmin_views.logs),
    path('erreurs/', superadmin_views.erreurs),
    path('plans/', superadmin_views.plans_config),
    path('limites/', superadmin_views.limites_config),
    path('parametres/', superadmin_views.parametres),
    path('ia-stats/', superadmin_views.ia_stats),
]
