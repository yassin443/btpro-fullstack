from django.contrib import admin
from .models import Client, Projet, Phase, Tache

admin.site.register(Client)
admin.site.register(Projet)
admin.site.register(Phase)
admin.site.register(Tache)
