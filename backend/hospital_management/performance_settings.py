"""
Performance Optimization Settings for Hospital Management System

Implements caching, database optimization, and performance monitoring
Following 2025 best practices for high-performance Django applications
"""

import os
from datetime import timedelta

# Database Performance Optimization
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME'),
        'USER': os.environ.get('DB_USER'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': os.environ.get('DB_HOST'),
        'PORT': os.environ.get('DB_PORT', '5432'),
        'OPTIONS': {
            'sslmode': 'require',
            'connect_timeout': 10,
            'options': '-c default_transaction_isolation=serializable'
        },
        'CONN_MAX_AGE': 600,  # Connection pooling
        'CONN_HEALTH_CHECKS': True,
        'ATOMIC_REQUESTS': True,
    }
}

# Database Connection Pooling
DATABASE_POOL_ARGS = {
    'max_overflow': 10,
    'pool_pre_ping': True,
    'pool_recycle': 300,
}

# Redis Cache Configuration
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': os.environ.get('REDIS_URL', 'redis://localhost:6379/1'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'CONNECTION_POOL_KWARGS': {
                'max_connections': 50,
                'retry_on_timeout': True,
            },
            'COMPRESSOR': 'django_redis.compressors.zlib.ZlibCompressor',
            'SERIALIZER': 'django_redis.serializers.json.JSONSerializer',
        },
        'KEY_PREFIX': 'hospital_mgmt',
        'VERSION': 1,
        'TIMEOUT': 300,  # 5 minutes default
    },
    'sessions': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': os.environ.get('REDIS_URL', 'redis://localhost:6379/2'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        },
        'KEY_PREFIX': 'sessions',
        'TIMEOUT': 1800,  # 30 minutes
    },
    'api_cache': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': os.environ.get('REDIS_URL', 'redis://localhost:6379/3'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        },
        'KEY_PREFIX': 'api',
        'TIMEOUT': 600,  # 10 minutes
    }
}

# Session Configuration
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'sessions'
SESSION_COOKIE_AGE = 1800  # 30 minutes
SESSION_SAVE_EVERY_REQUEST = False  # Performance optimization

# Cache Middleware
CACHE_MIDDLEWARE_ALIAS = 'default'
CACHE_MIDDLEWARE_SECONDS = 300
CACHE_MIDDLEWARE_KEY_PREFIX = 'middleware'

# API Response Caching
REST_FRAMEWORK_CACHE = {
    'DEFAULT_CACHE_TIMEOUT': 300,  # 5 minutes
    'DEFAULT_CACHE_KEY_FUNC': 'rest_framework_cache.utils.make_key',
    'DEFAULT_CACHE_RESPONSE_TIMEOUT': 300,
}

# Query Optimization Settings
QUERY_OPTIMIZATION = {
    'SELECT_RELATED_DEPTH': 2,
    'PREFETCH_RELATED_LOOKUPS': True,
    'BULK_OPERATIONS': True,
    'LAZY_LOADING': False,
}

# File Storage Optimization
DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
STATICFILES_STORAGE = 'storages.backends.s3boto3.S3StaticStorage'

# AWS S3 Configuration for Production
AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')
AWS_STORAGE_BUCKET_NAME = os.environ.get('AWS_STORAGE_BUCKET_NAME')
AWS_S3_REGION_NAME = os.environ.get('AWS_S3_REGION_NAME', 'us-east-1')
AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com'
AWS_DEFAULT_ACL = 'private'
AWS_S3_OBJECT_PARAMETERS = {
    'CacheControl': 'max-age=86400',  # 1 day
}
AWS_S3_FILE_OVERWRITE = False
AWS_QUERYSTRING_AUTH = True
AWS_QUERYSTRING_EXPIRE = 3600  # 1 hour

# Static Files Optimization
STATIC_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/static/'
MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/media/'

# Compression Settings
COMPRESS_ENABLED = True
COMPRESS_OFFLINE = True
COMPRESS_CSS_FILTERS = [
    'compressor.filters.css_default.CssAbsoluteFilter',
    'compressor.filters.cssmin.rCSSMinFilter',
]
COMPRESS_JS_FILTERS = [
    'compressor.filters.jsmin.JSMinFilter',
]

# Email Performance
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_USE_TLS = True
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = 587
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD')

# Celery Configuration for Async Tasks
CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/4')
CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379/5')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'UTC'
CELERY_ENABLE_UTC = True

# Celery Performance Settings
CELERY_WORKER_PREFETCH_MULTIPLIER = 1
CELERY_TASK_ACKS_LATE = True
CELERY_WORKER_MAX_TASKS_PER_CHILD = 1000
CELERY_TASK_COMPRESSION = 'gzip'
CELERY_RESULT_COMPRESSION = 'gzip'

# Task Routing
CELERY_TASK_ROUTES = {
    'hospital_management.tasks.send_email': {'queue': 'email'},
    'hospital_management.tasks.generate_report': {'queue': 'reports'},
    'hospital_management.tasks.backup_data': {'queue': 'maintenance'},
}

# Logging Performance
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'performance': {
            'format': '{levelname} {asctime} {name} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'performance_file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/performance.log',
            'maxBytes': 1024*1024*10,  # 10MB
            'backupCount': 5,
            'formatter': 'performance',
        },
        'slow_queries': {
            'level': 'WARNING',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/slow_queries.log',
            'maxBytes': 1024*1024*10,  # 10MB
            'backupCount': 5,
            'formatter': 'performance',
        },
    },
    'loggers': {
        'performance': {
            'handlers': ['performance_file'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.db.backends': {
            'handlers': ['slow_queries'],
            'level': 'WARNING',
            'propagate': False,
        },
    },
}

# Performance Monitoring
PERFORMANCE_MONITORING = {
    'ENABLE_QUERY_PROFILING': True,
    'SLOW_QUERY_THRESHOLD': 0.5,  # 500ms
    'ENABLE_MEMORY_PROFILING': True,
    'ENABLE_REQUEST_PROFILING': True,
    'PROFILE_PERCENTAGE': 10,  # Profile 10% of requests
}

# API Performance Settings
REST_FRAMEWORK.update({
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'MAX_PAGE_SIZE': 100,
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour'
    },
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'SEARCH_PARAM': 'search',
    'ORDERING_PARAM': 'ordering',
})

# Database Query Optimization
DATABASE_QUERY_OPTIMIZATION = {
    'ENABLE_QUERY_CACHE': True,
    'QUERY_CACHE_TIMEOUT': 300,
    'ENABLE_BULK_OPERATIONS': True,
    'BATCH_SIZE': 1000,
    'ENABLE_PREFETCH_RELATED': True,
    'ENABLE_SELECT_RELATED': True,
}

# Memory Optimization
MEMORY_OPTIMIZATION = {
    'ENABLE_GARBAGE_COLLECTION': True,
    'GC_THRESHOLD': (700, 10, 10),
    'ENABLE_MEMORY_POOLING': True,
    'MAX_MEMORY_USAGE': '512MB',
}

# Response Compression
MIDDLEWARE = [
    'django.middleware.gzip.GZipMiddleware',  # Add at the top
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Static file serving
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'hospital_management.middleware.PerformanceMiddleware',  # Custom performance middleware
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Static Files Optimization
STATICFILES_FINDERS = [
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
    'compressor.finders.CompressorFinder',
]

# WhiteNoise Configuration
WHITENOISE_USE_FINDERS = True
WHITENOISE_AUTOREFRESH = True
WHITENOISE_MAX_AGE = 31536000  # 1 year

# Template Optimization
TEMPLATES[0]['OPTIONS'].update({
    'context_processors': [
        'django.template.context_processors.debug',
        'django.template.context_processors.request',
        'django.contrib.auth.context_processors.auth',
        'django.contrib.messages.context_processors.messages',
    ],
    'loaders': [
        ('django.template.loaders.cached.Loader', [
            'django.template.loaders.filesystem.Loader',
            'django.template.loaders.app_directories.Loader',
        ]),
    ],
})

# Performance Metrics Collection
PERFORMANCE_METRICS = {
    'COLLECT_RESPONSE_TIMES': True,
    'COLLECT_QUERY_COUNTS': True,
    'COLLECT_MEMORY_USAGE': True,
    'COLLECT_CACHE_HITS': True,
    'METRICS_RETENTION_DAYS': 30,
}

# Health Check Configuration
HEALTH_CHECK = {
    'DISK_USAGE_MAX': 90,  # 90% max disk usage
    'MEMORY_MIN': 100,     # 100MB min available memory
    'DATABASE_TIMEOUT': 5,  # 5 seconds max DB response
    'CACHE_TIMEOUT': 1,     # 1 second max cache response
}

# Production Optimizations
if os.environ.get('ENVIRONMENT') == 'production':
    # Enable all optimizations in production
    DEBUG = False
    TEMPLATE_DEBUG = False
    
    # Optimize database connections
    DATABASES['default']['CONN_MAX_AGE'] = 3600  # 1 hour
    
    # Enable aggressive caching
    CACHE_MIDDLEWARE_SECONDS = 3600  # 1 hour
    
    # Optimize static files
    STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
    
    # Enable compression
    COMPRESS_ENABLED = True
    COMPRESS_OFFLINE = True
    
    # Optimize sessions
    SESSION_COOKIE_AGE = 3600  # 1 hour
    
else:
    # Development optimizations
    CACHE_MIDDLEWARE_SECONDS = 60  # 1 minute
    SESSION_COOKIE_AGE = 1800  # 30 minutes
