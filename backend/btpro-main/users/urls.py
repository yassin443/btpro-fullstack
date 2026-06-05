from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('google-auth/', views.google_auth, name='google_auth'),
    path('me/', views.me, name='me'),
    path('logout/', views.logout, name='logout'),
    path('membres/', views.membres, name='membres'),
    path('membres/<int:pk>/', views.supprimer_membre, name='supprimer_membre'),
    path('membres/<int:pk>/reset-password/', views.reset_password_membre, name='reset_password_membre'),
    path('membres/<int:pk>/associe/', views.toggle_associe, name='toggle_associe'),
]