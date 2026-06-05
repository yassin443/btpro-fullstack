from django.urls import path
from . import views

urlpatterns = [
    path('<int:projet_pk>/', views.documents, name='documents'),
    path('<int:pk>/detail/', views.document_detail, name='document_detail'),
    path('<int:document_pk>/versions/', views.ajouter_version, name='ajouter_version'),
    path('versions/<int:pk>/download/', views.telecharger_version, name='telecharger_version'),
]