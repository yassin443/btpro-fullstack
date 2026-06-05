from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')),
    path('api/cabinets/', include('cabinets.urls')),
    path('api/projets/', include('projets.urls')),
    path('api/chantier/', include('chantier.urls')),
    path('api/finances/', include('finances.urls')),
    path('api/documents/', include('documents.urls')),
    path('api/contrats/', include('contrats.urls')),
    path('api/superadmin/', include('cabinets.superadmin_urls')),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
