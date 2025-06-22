#!/bin/bash

# Production Entrypoint Script for Hospital Management System
# Handles database migrations, static files, and application startup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" >&2
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS: $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Wait for database to be ready
wait_for_db() {
    log "Waiting for database to be ready..."
    
    # Extract database connection details from DATABASE_URL
    if [ -n "$DATABASE_URL" ]; then
        # Parse DATABASE_URL (format: postgresql://user:password@host:port/dbname)
        DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
        DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    else
        DB_HOST=${DB_HOST:-localhost}
        DB_PORT=${DB_PORT:-5432}
    fi
    
    # Wait for database connection
    until nc -z "$DB_HOST" "$DB_PORT"; do
        log "Database is unavailable - sleeping"
        sleep 1
    done
    
    success "Database is ready!"
}

# Wait for Redis to be ready
wait_for_redis() {
    log "Waiting for Redis to be ready..."
    
    # Extract Redis connection details
    if [ -n "$REDIS_URL" ]; then
        REDIS_HOST=$(echo $REDIS_URL | sed -n 's/redis:\/\/[^@]*@\?\([^:]*\):.*/\1/p')
        REDIS_PORT=$(echo $REDIS_URL | sed -n 's/.*:\([0-9]*\).*/\1/p')
    else
        REDIS_HOST=${REDIS_HOST:-localhost}
        REDIS_PORT=${REDIS_PORT:-6379}
    fi
    
    # Wait for Redis connection
    until nc -z "$REDIS_HOST" "$REDIS_PORT"; do
        log "Redis is unavailable - sleeping"
        sleep 1
    done
    
    success "Redis is ready!"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    # Check if migrations are needed
    if python manage.py showmigrations --plan | grep -q '\[ \]'; then
        log "Applying database migrations..."
        python manage.py migrate --noinput
        success "Database migrations completed!"
    else
        log "No migrations needed"
    fi
}

# Collect static files
collect_static() {
    log "Collecting static files..."
    
    # Only collect static files if not already done or if forced
    if [ "$FORCE_STATIC_COLLECTION" = "true" ] || [ ! -d "/app/staticfiles" ] || [ -z "$(ls -A /app/staticfiles)" ]; then
        python manage.py collectstatic --noinput --clear
        success "Static files collected!"
    else
        log "Static files already collected"
    fi
}

# Create superuser if needed
create_superuser() {
    if [ "$CREATE_SUPERUSER" = "true" ]; then
        log "Creating superuser..."
        
        python manage.py shell << EOF
from django.contrib.auth import get_user_model
User = get_user_model()

if not User.objects.filter(is_superuser=True).exists():
    User.objects.create_superuser(
        username='${SUPERUSER_USERNAME:-admin}',
        email='${SUPERUSER_EMAIL:-admin@hospital-management.com}',
        password='${SUPERUSER_PASSWORD:-admin123}'
    )
    print("Superuser created successfully!")
else:
    print("Superuser already exists")
EOF
        success "Superuser setup completed!"
    fi
}

# Load initial data
load_initial_data() {
    if [ "$LOAD_INITIAL_DATA" = "true" ]; then
        log "Loading initial data..."
        
        # Load fixtures if they exist
        if [ -d "/app/fixtures" ]; then
            for fixture in /app/fixtures/*.json; do
                if [ -f "$fixture" ]; then
                    log "Loading fixture: $(basename $fixture)"
                    python manage.py loaddata "$fixture"
                fi
            done
            success "Initial data loaded!"
        else
            warning "No fixtures directory found"
        fi
    fi
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Check database connection
    python manage.py check --database default
    
    # Check cache connection
    python manage.py shell << EOF
from django.core.cache import cache
try:
    cache.set('health_check', 'ok', 30)
    result = cache.get('health_check')
    if result == 'ok':
        print("Cache connection: OK")
    else:
        print("Cache connection: FAILED")
        exit(1)
except Exception as e:
    print(f"Cache connection: FAILED - {e}")
    exit(1)
EOF
    
    success "Health check passed!"
}

# Setup logging directories
setup_logging() {
    log "Setting up logging directories..."
    
    # Create log directories
    mkdir -p /var/log/hospital-management
    mkdir -p /app/logs
    
    # Set permissions
    chmod 755 /var/log/hospital-management
    chmod 755 /app/logs
    
    success "Logging directories ready!"
}

# Cleanup old log files
cleanup_logs() {
    if [ "$CLEANUP_LOGS" = "true" ]; then
        log "Cleaning up old log files..."
        
        # Remove log files older than 30 days
        find /var/log/hospital-management -name "*.log" -mtime +30 -delete 2>/dev/null || true
        find /app/logs -name "*.log" -mtime +30 -delete 2>/dev/null || true
        
        success "Log cleanup completed!"
    fi
}

# Validate environment
validate_environment() {
    log "Validating environment configuration..."
    
    # Check required environment variables
    required_vars=(
        "SECRET_KEY"
        "DATABASE_URL"
        "REDIS_URL"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    # Validate Django settings
    python manage.py check --deploy
    
    success "Environment validation passed!"
}

# Security checks
security_checks() {
    log "Running security checks..."
    
    # Check for security issues
    python manage.py check --deploy --fail-level WARNING
    
    # Validate SSL configuration in production
    if [ "$ENVIRONMENT" = "production" ]; then
        if [ "$SECURE_SSL_REDIRECT" != "True" ]; then
            warning "SSL redirect is not enabled in production"
        fi
    fi
    
    success "Security checks completed!"
}

# Performance optimization
optimize_performance() {
    log "Applying performance optimizations..."
    
    # Warm up cache
    python manage.py shell << EOF
from django.core.cache import cache
from django.conf import settings

# Warm up frequently accessed cache keys
cache.set('system_status', 'ready', 3600)
print("Cache warmed up")
EOF
    
    # Precompile templates if needed
    if [ "$PRECOMPILE_TEMPLATES" = "true" ]; then
        log "Precompiling templates..."
        # Template precompilation logic here
    fi
    
    success "Performance optimizations applied!"
}

# Main execution
main() {
    log "Starting Hospital Management System..."
    log "Environment: ${ENVIRONMENT:-production}"
    log "Django Settings: ${DJANGO_SETTINGS_MODULE}"
    
    # Setup
    setup_logging
    validate_environment
    
    # Wait for dependencies
    wait_for_db
    wait_for_redis
    
    # Database setup
    run_migrations
    create_superuser
    load_initial_data
    
    # Static files
    collect_static
    
    # Health and security
    health_check
    security_checks
    
    # Optimization
    optimize_performance
    cleanup_logs
    
    success "Initialization completed successfully!"
    
    # Execute the main command
    log "Starting application with command: $@"
    exec "$@"
}

# Error handling
trap 'error "Script failed at line $LINENO"' ERR

# Run main function with all arguments
main "$@"
