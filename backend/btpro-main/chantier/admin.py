from django.contrib import admin
from .models import JournalChantier, PhotoChantier, Reserve, OrdreService

admin.site.register(JournalChantier)
admin.site.register(PhotoChantier)
admin.site.register(Reserve)
admin.site.register(OrdreService)