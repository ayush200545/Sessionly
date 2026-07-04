from pathlib import Path
from datetime import timedelta
from decouple import config
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = config('DJANGO_SECRET_KEY')
DEBUG = config('DJANGO_DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('DJANGO_ALLOWED_HOSTS', default='localhost,127.0.0.1,.vercel.app,.onrender.com').split(',')

# Trust Render's proxy to tell us it's HTTPS
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',
    # Third-party
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'social_django',
    'corsheaders',
    'django_filters',
    'drf_spectacular',
    # Local
    'apps.accounts',
    'apps.sessions',
    'apps.bookings',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    # 'social_django.middleware.SocialAuthExceptionMiddleware',
]

ROOT_URLCONF = 'config.urls'
AUTH_USER_MODEL = 'accounts.User'
SITE_ID = 1

USE_SQLITE = config('USE_SQLITE', default=False, cast=bool)

if USE_SQLITE:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
else:
    # Use dj_database_url to parse DATABASE_URL environment variable from Render/Neon
    DATABASES = {
        'default': dj_database_url.config(
            default=config('DATABASE_URL', default='postgres://postgres:postgres123@db:5432/sessions_marketplace'),
            conn_max_age=600,
            conn_health_checks=True,
        )
    }

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 12,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# JWT
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=config('JWT_ACCESS_TOKEN_LIFETIME_MINUTES', default=60, cast=int)),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=config('JWT_REFRESH_TOKEN_LIFETIME_DAYS', default=7, cast=int)),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# Social Auth (OAuth)
AUTHENTICATION_BACKENDS = (
    'social_core.backends.google.GoogleOAuth2',
    'social_core.backends.github.GithubOAuth2',
    'django.contrib.auth.backends.ModelBackend',
)

SOCIAL_AUTH_GOOGLE_OAUTH2_KEY = config('GOOGLE_CLIENT_ID', default='')
SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET = config('GOOGLE_CLIENT_SECRET', default='')
SOCIAL_AUTH_GOOGLE_OAUTH2_SCOPE = ['email', 'profile']
# The URI Google redirects back to after user consent. Must match Google Cloud Console exactly.
SOCIAL_AUTH_GOOGLE_OAUTH2_REDIRECT_URI = config(
    'GOOGLE_REDIRECT_URI',
    default='http://localhost/api/social/complete/google-oauth2/'
)
SOCIAL_AUTH_GOOGLE_OAUTH2_AUTH_EXTRA_ARGUMENTS = {'prompt': 'select_account'}

SOCIAL_AUTH_GITHUB_KEY = config('GITHUB_CLIENT_ID', default='')
SOCIAL_AUTH_GITHUB_SECRET = config('GITHUB_CLIENT_SECRET', default='')
SOCIAL_AUTH_GITHUB_SCOPE = ['user:email']
SOCIAL_AUTH_GITHUB_REDIRECT_URI = config(
    'GITHUB_REDIRECT_URI',
    default='http://localhost/api/social/complete/github/'
)

# Prevent social-auth from raising exceptions in views (redirects gracefully instead)
SOCIAL_AUTH_RAISE_EXCEPTIONS = True
# Only allow redirects back to our own frontend host
SOCIAL_AUTH_ALLOWED_REDIRECT_HOSTS = config('SOCIAL_AUTH_ALLOWED_REDIRECT_HOSTS', default='localhost,127.0.0.1,.vercel.app').split(',')
# After login, redirect to our JWT-issuing view
LOGIN_REDIRECT_URL = '/api/auth/oauth-redirect/'
LOGIN_ERROR_URL = config('FRONTEND_URL', default='http://localhost:3000') + '/auth/callback?error=login_failed'

SOCIAL_AUTH_PIPELINE = (
    'social_core.pipeline.social_auth.social_details',
    'social_core.pipeline.social_auth.social_uid',
    'social_core.pipeline.social_auth.auth_allowed',
    'social_core.pipeline.social_auth.social_user',
    'social_core.pipeline.user.get_username',
    'social_core.pipeline.social_auth.associate_by_email',
    'social_core.pipeline.user.create_user',
    'apps.accounts.pipeline.save_avatar',   # custom step
    'social_core.pipeline.social_auth.associate_user',
    'social_core.pipeline.social_auth.load_extra_data',
    'social_core.pipeline.user.user_details',
)

# CORS
CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', default='http://localhost:3000').split(',')
CORS_ALLOW_ALL_ORIGINS = config('CORS_ALLOW_ALL_ORIGINS', default=False, cast=bool)
CORS_ALLOW_CREDENTIALS = True

# Static / Media
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

USE_MINIO = config('USE_MINIO', default=False, cast=bool)

if USE_MINIO:
    # django-storages S3 configuration for MinIO
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    AWS_ACCESS_KEY_ID = config('MINIO_ACCESS_KEY', default='minioadmin')
    AWS_SECRET_ACCESS_KEY = config('MINIO_SECRET_KEY', default='minioadmin123')
    AWS_STORAGE_BUCKET_NAME = config('MINIO_BUCKET_NAME', default='sessions-marketplace')
    AWS_AUTO_CREATE_BUCKET = True
    AWS_S3_ENDPOINT_URL = f"http://{config('MINIO_ENDPOINT', default='minio:9000')}"
    AWS_S3_REGION_NAME = 'us-east-1' # dummy region
    AWS_S3_SIGNATURE_VERSION = 's3v4'
    AWS_S3_FILE_OVERWRITE = False
    AWS_DEFAULT_ACL = 'public-read'
    AWS_S3_USE_SSL = False
    AWS_S3_URL_PROTOCOL = 'http:'
    AWS_S3_CUSTOM_DOMAIN = f"localhost:9000/{AWS_STORAGE_BUCKET_NAME}"
    MEDIA_URL = f"http://localhost:9000/{AWS_STORAGE_BUCKET_NAME}/"


FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:3000')
LOGIN_REDIRECT_URL = '/api/auth/oauth-redirect/'

# Stripe
STRIPE_SECRET_KEY = config('STRIPE_SECRET_KEY', default='')
STRIPE_WEBHOOK_SECRET = config('STRIPE_WEBHOOK_SECRET', default='')

# Razorpay
RAZORPAY_KEY_ID = config('RAZORPAY_KEY_ID', default='')
RAZORPAY_KEY_SECRET = config('RAZORPAY_KEY_SECRET', default='')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'social_django.context_processors.backends',
                'social_django.context_processors.login_redirect',
            ],
        },
    },
]
