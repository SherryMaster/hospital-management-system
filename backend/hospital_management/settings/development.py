"""
Development Settings for Hospital Management System

Optimized for local development with debugging and testing features
"""

import os
from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

# Development hosts
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '*.ngrok.io',  # For ngrok tunneling
]

# Database Configuration for Development
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'hospital_management_dev'),
        'USER': os.environ.get('DB_USER', 'postgres'),
        'PASSWORD': os.environ.get('DB_PASSWORD', 'password'),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
        'OPTIONS': {
            'connect_timeout': 10,
        },
        'CONN_MAX_AGE': 0,  # Disable connection pooling in development
    }
}

# Redis Configuration for Development
REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379')

CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': f'{REDIS_URL}/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        },
        'KEY_PREFIX': 'hospital_dev',
        'TIMEOUT': 300,
    },
    'sessions': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': f'{REDIS_URL}/2',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        },
        'KEY_PREFIX': 'sessions_dev',
        'TIMEOUT': 1800,
    },
}

# Session Configuration for Development
SESSION_COOKIE_SECURE = False
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'

# CSRF Configuration for Development
CSRF_COOKIE_SECURE = False
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Lax'

# Disable HTTPS redirects in development
SECURE_SSL_REDIRECT = False
SECURE_PROXY_SSL_HEADER = None

# Email Configuration for Development
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Celery Configuration for Development
CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', f'{REDIS_URL}/4')
CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', f'{REDIS_URL}/5')
CELERY_TASK_ALWAYS_EAGER = True  # Execute tasks synchronously in development
CELERY_TASK_EAGER_PROPAGATES = True

# Static Files Configuration for Development
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Development-specific middleware
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'hospital_management.middleware.PerformanceMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# CORS Configuration for Development
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# Development-specific apps
INSTALLED_APPS += [
    'django_extensions',  # For shell_plus and other dev tools
    'debug_toolbar',      # For debugging
]

# Debug Toolbar Configuration
if DEBUG:
    MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']
    
    INTERNAL_IPS = [
        '127.0.0.1',
        'localhost',
    ]
    
    DEBUG_TOOLBAR_CONFIG = {
        'SHOW_TOOLBAR_CALLBACK': lambda request: DEBUG,
        'SHOW_TEMPLATE_CONTEXT': True,
    }

# Logging Configuration for Development
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
        'colored': {
            'format': '\033[92m{levelname}\033[0m {asctime} \033[94m{module}\033[0m {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'colored',
        },
        'file': {
            'level': 'DEBUG',
            'class': 'logging.FileHandler',
            'filename': 'logs/development.log',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'DEBUG',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'hospital_management': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}

# Performance Monitoring for Development
PERFORMANCE_MONITORING = {
    'ENABLE_QUERY_PROFILING': True,
    'SLOW_QUERY_THRESHOLD': 0.1,  # 100ms
    'ENABLE_MEMORY_PROFILING': True,
    'ENABLE_REQUEST_PROFILING': True,
    'PROFILE_PERCENTAGE': 100,  # Profile all requests in development
}

# Development-specific JWT settings
SIMPLE_JWT.update({
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),  # Longer for development
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),  # Longer for development
})

# API Rate Limiting for Development (more permissive)
REST_FRAMEWORK.update({
    'DEFAULT_THROTTLE_RATES': {
        'anon': '1000/hour',
        'user': '10000/hour',
        'login': '100/min',
        'password_reset': '50/hour',
    }
})

# Development-specific settings
DEVELOPMENT_SETTINGS = {
    'ENABLE_API_DOCS': True,
    'ENABLE_ADMIN_DOCS': True,
    'SHOW_DEBUG_TOOLBAR': True,
    'ENABLE_SHELL_PLUS': True,
    'AUTO_RELOAD': True,
}

# Test Database Configuration
if 'test' in sys.argv or 'pytest' in sys.modules:
    DATABASES['default'] = {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
    
    # Disable migrations for faster tests
    class DisableMigrations:
        def __contains__(self, item):
            return True
        
        def __getitem__(self, item):
            return None
    
    MIGRATION_MODULES = DisableMigrations()
    
    # Use dummy cache for tests
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
        }
    }
    
    # Disable Celery for tests
    CELERY_TASK_ALWAYS_EAGER = True
    CELERY_TASK_EAGER_PROPAGATES = True

# Django Extensions Configuration
SHELL_PLUS_PRINT_SQL = True
SHELL_PLUS_PRINT_SQL_TRUNCATE = 1000

# File Upload Settings for Development
FILE_UPLOAD_MAX_MEMORY_SIZE = 10485760  # 10MB for development
DATA_UPLOAD_MAX_MEMORY_SIZE = 10485760  # 10MB for development

# Create logs directory if it doesn't exist
import os
os.makedirs('logs', exist_ok=True)
