from django.urls import path
from . import views, superadmin_views

urlpatterns = [
    path('mon-cabinet/', views.mon_cabinet, name='mon_cabinet'),
    path('modifier/', views.modifier_cabinet, name='modifier_cabinet'),
    path('abonnement/', views.mon_abonnement, name='mon_abonnement'),
    path('plan/', views.changer_plan, name='changer_plan'),
    path('stats-publiques/', views.stats_publiques, name='stats_publiques'),
    path('contact/', views.contact_message, name='contact_message'),
    path('superadmin/contact-messages/', superadmin_views.contact_messages, name='contact_messages_list'),
    path('superadmin/contact-messages/<int:pk>/lu/', superadmin_views.contact_message_lu, name='contact_message_lu'),
]