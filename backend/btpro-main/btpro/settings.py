from pathlib import Path
from datetime import timedelta
import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('SECRET_KEY')
if not SECRET_KEY:
    raise ValueError("SECRET_KEY manquant. Créez un fichier .env avec SECRET_KEY=...")

DEBUG = os.environ.get('DEBUG', 'False') == 'True'

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'cloudinary_storage',
    'cloudinary',
    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'users',
    'cabinets',
    'projets',
    'chantier',
    'finances',
    'documents',
    'contrats',
    'ia',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'btpro.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'btpro.wsgi.application'

# Postgres si DB_NAME est défini dans .env, sinon SQLite (pratique pour le dev local)
if os.environ.get('DB_NAME'):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('DB_NAME', 'btpro'),
            'USER': os.environ.get('DB_USER', 'postgres'),
            'PASSWORD': os.environ.get('DB_PASSWORD', ''),
            'HOST': os.environ.get('DB_HOST', 'localhost'),
            'PORT': os.environ.get('DB_PORT', '5432'),
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

AUTH_USER_MODEL = 'users.User'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '20/min',
        'user': '200/min',
        'login': '5/min',
    },
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=8),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}

DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10 MB max upload

_cors_origins = os.environ.get('CORS_ALLOWED_ORIGINS', 'http://localhost:5173').split(',')
CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors_origins if o.strip()]
CORS_ALLOWED_ORIGIN_REGEXES = [r'^https://.*\.vercel\.app$']

LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'Africa/Algiers'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Email — console en dev, SMTP en prod
if os.environ.get('EMAIL_HOST'):
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST = os.environ.get('EMAIL_HOST', '')
    EMAIL_PORT = int(os.environ.get('EMAIL_PORT', 587))
    EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'True') == 'True'
    EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
    EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
    DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'noreply@planner.dz')
    EMAIL_TIMEOUT = 5
else:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

CONTACT_EMAIL = os.environ.get('CONTACT_EMAIL', 'djbarcausma@gmail.com')

# Chargily Pay
CHARGILY_API_KEY = os.environ.get('CHARGILY_API_KEY', '')
CHARGILY_API_SECRET = os.environ.get('CHARGILY_API_SECRET', '')
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
BACKEND_URL = os.environ.get('BACKEND_URL', 'http://localhost:8000')

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Cloudinary — stockage cloud des fichiers media (photos chantier, logos, documents)
CLOUDINARY_CLOUD_NAME = os.environ.get('CLOUDINARY_CLOUD_NAME', '')
CLOUDINARY_API_KEY    = os.environ.get('CLOUDINARY_API_KEY', '')
CLOUDINARY_API_SECRET = os.environ.get('CLOUDINARY_API_SECRET', '')

if CLOUDINARY_CLOUD_NAME:
    DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
    CLOUDINARY_STORAGE = {
        'CLOUD_NAME': CLOUDINARY_CLOUD_NAME,
        'API_KEY':    CLOUDINARY_API_KEY,
        'API_SECRET': CLOUDINARY_API_SECRET,
    }