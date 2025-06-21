"""
Hospital Management System - Database Configuration

Centralized database configuration for different environments.
Supports SQLite (development), PostgreSQL (production), and Neon (cloud).
"""

import os
import dj_database_url
from decouple import config


def get_database_config():
    """
    Get database configuration based on environment variables.
    
    Priority:
    1. DATABASE_URL (full connection string)
    2. Individual DB_* variables
    3. Default SQLite for development
    """
    
    # Check for DATABASE_URL first
    database_url = config('DATABASE_URL', default=None)
    
    if database_url:
        # Parse DATABASE_URL
        db_config = dj_database_url.parse(database_url)
        
        # Add connection options for PostgreSQL
        if 'postgresql' in database_url:
            db_config.update({
                'OPTIONS': {
                    'sslmode': 'require' if 'sslmode=require' in database_url else 'prefer',
                },
                'CONN_MAX_AGE': config('DB_CONN_MAX_AGE', default=60, cast=int),
                'CONN_HEALTH_CHECKS': True,
            })
            
        return db_config
    
    # Check for individual database variables
    db_engine = config('DB_ENGINE', default=None)
    
    if db_engine:
        return {
            'ENGINE': db_engine,
            'NAME': config('DB_NAME'),
            'USER': config('DB_USER', default=''),
            'PASSWORD': config('DB_PASSWORD', default=''),
            'HOST': config('DB_HOST', default='localhost'),
            'PORT': config('DB_PORT', default='5432'),
            'OPTIONS': {
                'sslmode': config('DB_SSL_MODE', default='prefer'),
            } if 'postgresql' in db_engine else {},
            'CONN_MAX_AGE': config('DB_CONN_MAX_AGE', default=60, cast=int),
            'CONN_HEALTH_CHECKS': True,
        }
    
    # Default to SQLite for development
    return {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(os.path.dirname(os.path.dirname(__file__)), 'db.sqlite3'),
    }


def get_test_database_config():
    """
    Get test database configuration.
    Always uses SQLite for faster testing.
    """
    return {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }


# Database configurations for different environments
DATABASE_CONFIGS = {
    'development': {
        'default': get_database_config(),
    },
    'testing': {
        'default': get_test_database_config(),
    },
    'production': {
        'default': get_database_config(),
    },
}


def get_databases_config(environment='development'):
    """
    Get complete databases configuration for Django settings.
    
    Args:
        environment (str): Environment name (development, testing, production)
        
    Returns:
        dict: Django DATABASES configuration
    """
    return DATABASE_CONFIGS.get(environment, DATABASE_CONFIGS['development'])


# Connection pool settings for production
PRODUCTION_DB_SETTINGS = {
    'CONN_MAX_AGE': 300,  # 5 minutes
    'CONN_HEALTH_CHECKS': True,
    'OPTIONS': {
        'MAX_CONNS': 20,
        'MIN_CONNS': 5,
    }
}


def apply_production_settings(db_config):
    """
    Apply production-specific database settings.
    
    Args:
        db_config (dict): Database configuration
        
    Returns:
        dict: Updated database configuration
    """
    if config('DEBUG', default=True, cast=bool) is False:
        db_config.update(PRODUCTION_DB_SETTINGS)
        
        # Add SSL settings for production PostgreSQL
        if 'postgresql' in db_config.get('ENGINE', ''):
            db_config.setdefault('OPTIONS', {})
            db_config['OPTIONS'].update({
                'sslmode': 'require',
                'sslcert': config('DB_SSL_CERT', default=None),
                'sslkey': config('DB_SSL_KEY', default=None),
                'sslrootcert': config('DB_SSL_ROOT_CERT', default=None),
            })
            
            # Remove None values
            db_config['OPTIONS'] = {
                k: v for k, v in db_config['OPTIONS'].items() 
                if v is not None
            }
    
    return db_config


# Neon-specific configuration
def get_neon_config():
    """
    Get Neon PostgreSQL configuration.
    
    Neon is a serverless PostgreSQL platform with specific requirements.
    """
    neon_url = config('NEON_DATABASE_URL', default=None)
    
    if not neon_url:
        return None
        
    config_dict = dj_database_url.parse(neon_url)
    
    # Neon-specific settings
    config_dict.update({
        'OPTIONS': {
            'sslmode': 'require',
            'application_name': 'hospital_management_system',
        },
        'CONN_MAX_AGE': 300,  # 5 minutes
        'CONN_HEALTH_CHECKS': True,
        'ATOMIC_REQUESTS': True,  # Wrap each request in a transaction
    })
    
    return config_dict


# Database health check utilities
def check_database_connection(database_alias='default'):
    """
    Check if database connection is working.
    
    Args:
        database_alias (str): Database alias to check
        
    Returns:
        tuple: (success: bool, message: str)
    """
    try:
        from django.db import connections
        
        connection = connections[database_alias]
        connection.ensure_connection()
        
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
            
        return True, "Database connection successful"
        
    except Exception as e:
        return False, f"Database connection failed: {str(e)}"


def get_database_info(database_alias='default'):
    """
    Get database information for monitoring.
    
    Args:
        database_alias (str): Database alias
        
    Returns:
        dict: Database information
    """
    try:
        from django.db import connections
        
        connection = connections[database_alias]
        db_settings = connection.settings_dict
        
        return {
            'engine': db_settings.get('ENGINE', 'Unknown'),
            'name': db_settings.get('NAME', 'Unknown'),
            'host': db_settings.get('HOST', 'localhost'),
            'port': db_settings.get('PORT', 'default'),
            'user': db_settings.get('USER', 'Unknown'),
            'is_usable': connection.is_usable(),
            'queries_count': len(connection.queries),
        }
        
    except Exception as e:
        return {'error': str(e)}


# Export main configuration function
def configure_databases():
    """
    Configure databases based on current environment.
    
    Returns:
        dict: Django DATABASES configuration
    """
    # Check for Neon configuration first
    neon_config = get_neon_config()
    if neon_config:
        return {'default': apply_production_settings(neon_config)}
    
    # Use standard configuration
    environment = 'production' if not config('DEBUG', default=True, cast=bool) else 'development'
    db_config = get_databases_config(environment)
    
    # Apply production settings if needed
    if environment == 'production':
        db_config['default'] = apply_production_settings(db_config['default'])
    
    return db_config
