from django.urls import path
from . import views

urlpatterns = [
    path('generer/', views.generer, name='generer'),
]