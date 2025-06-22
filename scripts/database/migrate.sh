#!/bin/bash

# Database Migration Script for Hospital Management System
# Handles safe database migrations with rollback capabilities

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
BACKUP_DIR="$PROJECT_ROOT/backups/migrations"
LOG_FILE="$BACKUP_DIR/migration_$(date +%Y%m%d_%H%M%S).log"

# Default values
ENVIRONMENT=${ENVIRONMENT:-development}
DRY_RUN=${DRY_RUN:-false}
FORCE=${FORCE:-false}
ROLLBACK=${ROLLBACK:-false}

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}" | tee -a "$LOG_FILE" >&2
}

info() {
    echo -e "${PURPLE}[$(date +'%Y-%m-%d %H:%M:%S')] ℹ️  $1${NC}" | tee -a "$LOG_FILE"
}

# Help function
show_help() {
    echo -e "${PURPLE}Database Migration Script${NC}"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --dry-run           Show what would be done without executing"
    echo "  --force             Force migration even with warnings"
    echo "  --rollback TARGET   Rollback to specific migration"
    echo "  --environment ENV   Set environment (development, staging, production)"
    echo "  --backup-before     Create backup before migration"
    echo "  --no-backup         Skip backup creation"
    echo "  --help              Show this help"
    echo ""
    echo "Examples:"
    echo "  $0                          # Run pending migrations"
    echo "  $0 --dry-run               # Show pending migrations"
    echo "  $0 --rollback 0001         # Rollback to migration 0001"
    echo "  $0 --environment production --backup-before"
}

# Load environment variables
load_env() {
    local env_file="$PROJECT_ROOT/.env"
    if [ -f "$env_file" ]; then
        log "Loading environment variables from $env_file"
        export $(grep -v '^#' "$env_file" | xargs) 2>/dev/null || true
    else
        warning "Environment file not found: $env_file"
    fi
}

# Setup directories
setup_directories() {
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$PROJECT_ROOT/logs"
    
    # Ensure log file exists
    touch "$LOG_FILE"
}

# Check database connection
check_database_connection() {
    log "Checking database connection..."
    
    if [ -n "$DATABASE_URL" ]; then
        # Parse DATABASE_URL
        DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
        DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
        DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
        DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
    fi
    
    # Test connection
    if command -v psql >/dev/null 2>&1; then
        if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
            success "Database connection successful"
        else
            error "Database connection failed"
            exit 1
        fi
    else
        warning "psql not available, skipping connection test"
    fi
}

# Create pre-migration backup
create_backup() {
    if [ "$NO_BACKUP" = "true" ]; then
        log "Skipping backup creation (--no-backup specified)"
        return 0
    fi
    
    log "Creating pre-migration backup..."
    
    local backup_file="$BACKUP_DIR/pre_migration_$(date +%Y%m%d_%H%M%S).sql"
    
    if command -v pg_dump >/dev/null 2>&1; then
        PGPASSWORD="$DB_PASSWORD" pg_dump \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USER" \
            -d "$DB_NAME" \
            --verbose \
            --no-password \
            --format=custom \
            --file="$backup_file"
        
        if [ $? -eq 0 ]; then
            success "Backup created: $backup_file"
            echo "$backup_file" > "$BACKUP_DIR/latest_backup.txt"
        else
            error "Backup creation failed"
            exit 1
        fi
    else
        error "pg_dump not available"
        exit 1
    fi
}

# Check for pending migrations
check_pending_migrations() {
    log "Checking for pending migrations..."
    
    cd "$PROJECT_ROOT/backend"
    
    local pending_migrations
    pending_migrations=$(python manage.py showmigrations --plan | grep '\[ \]' | wc -l)
    
    if [ "$pending_migrations" -gt 0 ]; then
        info "Found $pending_migrations pending migrations"
        
        if [ "$DRY_RUN" = "true" ]; then
            log "Pending migrations (dry run):"
            python manage.py showmigrations --plan | grep '\[ \]'
        fi
        
        return 0
    else
        success "No pending migrations found"
        return 1
    fi
}

# Check for migration conflicts
check_migration_conflicts() {
    log "Checking for migration conflicts..."
    
    cd "$PROJECT_ROOT/backend"
    
    # Check for multiple leaf nodes (potential conflicts)
    local conflicts
    conflicts=$(python manage.py showmigrations --plan | grep -E "^\s*\[\s*\]\s*\w+\.\d+_" | tail -n 20)
    
    if echo "$conflicts" | grep -q "Conflicting migrations"; then
        error "Migration conflicts detected!"
        echo "$conflicts"
        
        if [ "$FORCE" != "true" ]; then
            error "Use --force to proceed anyway (not recommended)"
            exit 1
        else
            warning "Proceeding with conflicts due to --force flag"
        fi
    else
        success "No migration conflicts detected"
    fi
}

# Validate migration safety
validate_migration_safety() {
    log "Validating migration safety..."
    
    cd "$PROJECT_ROOT/backend"
    
    # Check for potentially dangerous operations
    local dangerous_operations=(
        "DROP TABLE"
        "DROP COLUMN"
        "ALTER COLUMN.*DROP"
        "TRUNCATE"
        "DELETE FROM"
    )
    
    local migration_files
    migration_files=$(find . -name "*.py" -path "*/migrations/*" -newer "$BACKUP_DIR/last_migration_check" 2>/dev/null || find . -name "*.py" -path "*/migrations/*")
    
    local dangerous_found=false
    
    for file in $migration_files; do
        for operation in "${dangerous_operations[@]}"; do
            if grep -qi "$operation" "$file"; then
                warning "Potentially dangerous operation found in $file: $operation"
                dangerous_found=true
            fi
        done
    done
    
    if [ "$dangerous_found" = "true" ]; then
        if [ "$FORCE" != "true" ] && [ "$ENVIRONMENT" = "production" ]; then
            error "Dangerous operations detected in production. Use --force to proceed."
            exit 1
        else
            warning "Proceeding with dangerous operations"
        fi
    else
        success "No dangerous operations detected"
    fi
    
    # Update check timestamp
    touch "$BACKUP_DIR/last_migration_check"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    cd "$PROJECT_ROOT/backend"
    
    if [ "$DRY_RUN" = "true" ]; then
        log "Dry run - would execute: python manage.py migrate"
        python manage.py showmigrations --plan
        return 0
    fi
    
    # Set Django settings based on environment
    case $ENVIRONMENT in
        production)
            export DJANGO_SETTINGS_MODULE=hospital_management.settings.production
            ;;
        staging)
            export DJANGO_SETTINGS_MODULE=hospital_management.settings.staging
            ;;
        *)
            export DJANGO_SETTINGS_MODULE=hospital_management.settings.development
            ;;
    esac
    
    # Run migrations with verbose output
    python manage.py migrate --verbosity=2
    
    if [ $? -eq 0 ]; then
        success "Migrations completed successfully"
    else
        error "Migration failed"
        
        # Attempt to restore from backup if available
        if [ -f "$BACKUP_DIR/latest_backup.txt" ]; then
            warning "Attempting to restore from backup..."
            restore_from_backup "$(cat "$BACKUP_DIR/latest_backup.txt")"
        fi
        
        exit 1
    fi
}

# Rollback to specific migration
rollback_migration() {
    local target_migration="$1"
    
    if [ -z "$target_migration" ]; then
        error "Target migration not specified for rollback"
        exit 1
    fi
    
    log "Rolling back to migration: $target_migration"
    
    cd "$PROJECT_ROOT/backend"
    
    if [ "$DRY_RUN" = "true" ]; then
        log "Dry run - would execute: python manage.py migrate $target_migration"
        return 0
    fi
    
    # Create backup before rollback
    if [ "$NO_BACKUP" != "true" ]; then
        create_backup
    fi
    
    # Perform rollback
    python manage.py migrate "$target_migration"
    
    if [ $? -eq 0 ]; then
        success "Rollback completed successfully"
    else
        error "Rollback failed"
        exit 1
    fi
}

# Restore from backup
restore_from_backup() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ] || [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
        return 1
    fi
    
    warning "Restoring database from backup: $backup_file"
    
    # Drop and recreate database (be very careful!)
    if [ "$ENVIRONMENT" = "production" ] && [ "$FORCE" != "true" ]; then
        error "Cannot restore in production without --force flag"
        return 1
    fi
    
    PGPASSWORD="$DB_PASSWORD" pg_restore \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --clean \
        --if-exists \
        --verbose \
        "$backup_file"
    
    if [ $? -eq 0 ]; then
        success "Database restored from backup"
    else
        error "Database restore failed"
        return 1
    fi
}

# Post-migration checks
post_migration_checks() {
    log "Running post-migration checks..."
    
    cd "$PROJECT_ROOT/backend"
    
    # Check database integrity
    python manage.py check --database default
    
    # Run basic queries to ensure data integrity
    python manage.py shell << 'EOF'
from django.contrib.auth import get_user_model
from accounts.models import Patient, Doctor
from appointments.models import Appointment

User = get_user_model()

# Basic counts
print(f"Users: {User.objects.count()}")
print(f"Patients: {Patient.objects.count()}")
print(f"Doctors: {Doctor.objects.count()}")
print(f"Appointments: {Appointment.objects.count()}")

print("Post-migration checks completed successfully")
EOF
    
    if [ $? -eq 0 ]; then
        success "Post-migration checks passed"
    else
        warning "Post-migration checks failed"
    fi
}

# Generate migration report
generate_migration_report() {
    log "Generating migration report..."
    
    local report_file="$BACKUP_DIR/migration_report_$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$report_file" << EOF
Migration Report
================
Date: $(date)
Environment: $ENVIRONMENT
User: $(whoami)
Host: $(hostname)

Database Information:
- Host: $DB_HOST
- Port: $DB_PORT
- Database: $DB_NAME
- User: $DB_USER

Migration Status:
$(cd "$PROJECT_ROOT/backend" && python manage.py showmigrations)

System Information:
- Python Version: $(python --version)
- Django Version: $(cd "$PROJECT_ROOT/backend" && python -c "import django; print(django.get_version())")
- PostgreSQL Version: $(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT version();" 2>/dev/null | head -1)

Log File: $LOG_FILE
EOF
    
    success "Migration report generated: $report_file"
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --force)
                FORCE=true
                shift
                ;;
            --rollback)
                ROLLBACK=true
                ROLLBACK_TARGET="$2"
                shift 2
                ;;
            --environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            --backup-before)
                BACKUP_BEFORE=true
                shift
                ;;
            --no-backup)
                NO_BACKUP=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# Main function
main() {
    parse_args "$@"
    
    log "Starting database migration process"
    log "Environment: $ENVIRONMENT"
    log "Dry run: $DRY_RUN"
    
    # Setup
    setup_directories
    load_env
    check_database_connection
    
    if [ "$ROLLBACK" = "true" ]; then
        # Rollback operation
        rollback_migration "$ROLLBACK_TARGET"
    else
        # Forward migration
        if [ "$BACKUP_BEFORE" = "true" ] || [ "$ENVIRONMENT" = "production" ]; then
            create_backup
        fi
        
        if check_pending_migrations; then
            check_migration_conflicts
            validate_migration_safety
            run_migrations
            post_migration_checks
        else
            info "No migrations to run"
        fi
    fi
    
    generate_migration_report
    success "Migration process completed successfully"
}

# Error handling
trap 'error "Migration script failed at line $LINENO"' ERR

# Run main function with all arguments
main "$@"
