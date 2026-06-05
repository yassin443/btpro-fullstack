from django.urls import path
from . import views

urlpatterns = [
    path('<int:projet_pk>/journaux/', views.journaux, name='journaux'),
    path('<int:projet_pk>/reserves/', views.reserves, name='reserves'),
    path('reserves/<int:pk>/lever/', views.lever_reserve, name='lever_reserve'),
    path('<int:projet_pk>/ordres/', views.ordres_service, name='ordres_service'),
    path('journaux/<int:journal_pk>/photos/', views.ajouter_photo, name='ajouter_photo'),
    path('photos/<int:pk>/', views.supprimer_photo, name='supprimer_photo'),
    path('rapports/', views.rapports_terrain, name='rapports_terrain'),
    path('rapports/<int:pk>/', views.rapport_detail, name='rapport_detail'),
]