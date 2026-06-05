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
]
