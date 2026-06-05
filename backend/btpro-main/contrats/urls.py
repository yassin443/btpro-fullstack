from django.urls import path
from . import views

urlpatterns = [
    path('', views.contrats, name='contrats'),
    path('<int:pk>/', views.contrat_detail, name='contrat_detail'),
    path('<int:pk>/pdf/', views.contrat_pdf, name='contrat_pdf'),
]
