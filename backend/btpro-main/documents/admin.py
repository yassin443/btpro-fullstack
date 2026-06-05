from django.contrib import admin
from .models import Document, Version

admin.site.register(Document)
admin.site.register(Version)