#!/bin/bash

# Database Manager Script for Hospital Management System
# Unified interface for all database operations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

# Default values
ENVIRONMENT=${ENVIRONMENT:-development}

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}" >&2
}

info() {
    echo -e "${CYAN}[$(date +'%Y-%m-%d %H:%M:%S')] ℹ️  $1${NC}"
}

# Help function
show_help() {
    echo -e "${PURPLE}Hospital Management System - Database Manager${NC}"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo -e "${CYAN}Commands:${NC}"
    echo "  migrate                 Run database migrations"
    echo "  rollback TARGET         Rollback to specific migration"
    echo "  backup [TYPE]           Create database backup"
    echo "  restore FILE            Restore from backup"
    echo "  status                  Show database status"
    echo "  shell                   Open database shell"
    echo "  reset                   Reset database (development only)"
    echo "  seed                    Load sample data"
    echo "  vacuum                  Vacuum and analyze database"
    echo "  check                   Check database integrity"
    echo "  size                    Show database size information"
    echo "  users                   Manage database users"
    echo "  permissions             Manage database permissions"
    echo "  monitor                 Monitor database performance"
    echo "  cleanup                 Clean up old data"
    echo ""
    echo -e "${CYAN}Backup Types:${NC}"
    echo "  full                    Complete database backup (default)"
    echo "  incremental             Incremental backup"
    echo "  schema-only             Schema structure only"
    echo "  data-only               Data only"
    echo ""
    echo -e "${CYAN}Options:${NC}"
    echo "  -e, --env ENV           Environment (development, staging, production)"
    echo "  --dry-run               Show what would be done"
    echo "  --force                 Force operation"
    echo "  --compress              Compress backup files"
    echo "  --encrypt               Encrypt backup files"
    echo "  --upload                Upload to cloud storage"
    echo "  -v, --verbose           Verbose output"
    echo "  -h, --help              Show this help"
    echo ""
    echo -e "${CYAN}Examples:${NC}"
    echo "  $0 migrate              # Run pending migrations"
    echo "  $0 backup full --compress --upload"
    echo "  $0 restore backup.sql --force"
    echo "  $0 status               # Show database status"
    echo "  $0 shell                # Open database shell"
}

# Load environment variables
load_env() {
    local env_file="$PROJECT_ROOT/.env"
    if [ -f "$env_file" ]; then
        export $(grep -v '^#' "$env_file" | xargs) 2>/dev/null || true
    fi
}

# Check if script exists and is executable
check_script() {
    local script_name="$1"
    local script_path="$SCRIPT_DIR/$script_name"
    
    if [ ! -f "$script_path" ]; then
        error "Script not found: $script_path"
        exit 1
    fi
    
    if [ ! -x "$script_path" ]; then
        chmod +x "$script_path"
    fi
    
    echo "$script_path"
}

# Run migration
run_migrate() {
    local migrate_script=$(check_script "migrate.sh")
    log "Running database migrations..."
    "$migrate_script" "$@"
}

# Run rollback
run_rollback() {
    local target="$1"
    if [ -z "$target" ]; then
        error "Rollback target not specified"
        exit 1
    fi
    
    local migrate_script=$(check_script "migrate.sh")
    log "Rolling back to migration: $target"
    "$migrate_script" --rollback "$target" "$@"
}

# Run backup
run_backup() {
    local backup_type="${1:-full}"
    local backup_script=$(check_script "backup.sh")
    log "Creating $backup_type backup..."
    "$backup_script" --type "$backup_type" "${@:2}"
}

# Run restore
run_restore() {
    local backup_file="$1"
    if [ -z "$backup_file" ]; then
        error "Backup file not specified"
        exit 1
    fi
    
    local restore_script=$(check_script "restore.sh")
    log "Restoring from backup: $backup_file"
    "$restore_script" "$backup_file" "${@:2}"
}

# Show database status
show_status() {
    log "Database Status Information"
    echo ""
    
    # Load environment
    load_env
    
    # Parse database connection details
    if [ -n "$DATABASE_URL" ]; then
        DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
        DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
        DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
        DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
    fi
    
    echo -e "${CYAN}Connection Information:${NC}"
    echo "  Host: $DB_HOST"
    echo "  Port: $DB_PORT"
    echo "  Database: $DB_NAME"
    echo "  User: $DB_USER"
    echo ""
    
    # Test connection
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
        success "Database connection: OK"
    else
        error "Database connection: FAILED"
        return 1
    fi
    
    # Show version
    echo -e "${CYAN}Database Version:${NC}"
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT version();" | head -1
    echo ""
    
    # Show migration status
    echo -e "${CYAN}Migration Status:${NC}"
    cd "$PROJECT_ROOT/backend"
    python manage.py showmigrations --plan | tail -10
    echo ""
    
    # Show database size
    echo -e "${CYAN}Database Size:${NC}"
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT 
            pg_size_pretty(pg_database_size('$DB_NAME')) as database_size,
            pg_size_pretty(pg_total_relation_size('auth_user')) as users_table_size,
            pg_size_pretty(pg_total_relation_size('accounts_patient')) as patients_table_size,
            pg_size_pretty(pg_total_relation_size('appointments_appointment')) as appointments_table_size;
    "
    echo ""
    
    # Show active connections
    echo -e "${CYAN}Active Connections:${NC}"
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT count(*) as active_connections 
        FROM pg_stat_activity 
        WHERE datname = '$DB_NAME';
    "
}

# Open database shell
open_shell() {
    load_env
    
    if [ -n "$DATABASE_URL" ]; then
        DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
        DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
        DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
        DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
    fi
    
    log "Opening database shell..."
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"
}

# Reset database (development only)
reset_database() {
    if [ "$ENVIRONMENT" = "production" ]; then
        error "Database reset not allowed in production"
        exit 1
    fi
    
    warning "This will completely reset the database. Are you sure? (yes/no)"
    read -r response
    if [ "$response" != "yes" ]; then
        info "Database reset cancelled"
        exit 0
    fi
    
    log "Resetting database..."
    cd "$PROJECT_ROOT/backend"
    
    # Drop all tables
    python manage.py flush --noinput
    
    # Run migrations
    python manage.py migrate
    
    success "Database reset completed"
}

# Load sample data
seed_database() {
    log "Loading sample data..."
    cd "$PROJECT_ROOT/backend"
    
    # Load fixtures if they exist
    if [ -d "fixtures" ]; then
        for fixture in fixtures/*.json; do
            if [ -f "$fixture" ]; then
                log "Loading fixture: $(basename "$fixture")"
                python manage.py loaddata "$fixture"
            fi
        done
    fi
    
    # Run custom seed command if it exists
    if python manage.py help seed >/dev/null 2>&1; then
        python manage.py seed
    fi
    
    success "Sample data loaded"
}

# Vacuum and analyze database
vacuum_database() {
    log "Vacuuming and analyzing database..."
    load_env
    
    if [ -n "$DATABASE_URL" ]; then
        DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
        DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
        DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
        DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
    fi
    
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "VACUUM ANALYZE;"
    
    success "Database vacuum and analyze completed"
}

# Check database integrity
check_database() {
    log "Checking database integrity..."
    cd "$PROJECT_ROOT/backend"
    
    # Django checks
    python manage.py check --database default
    
    # Custom integrity checks
    python manage.py shell << 'EOF'
from django.contrib.auth import get_user_model
from accounts.models import Patient, Doctor
from appointments.models import Appointment

User = get_user_model()

# Check for orphaned records
orphaned_patients = Patient.objects.filter(user__isnull=True).count()
orphaned_appointments = Appointment.objects.filter(patient__isnull=True).count()

print(f"Orphaned patients: {orphaned_patients}")
print(f"Orphaned appointments: {orphaned_appointments}")

if orphaned_patients == 0 and orphaned_appointments == 0:
    print("✅ Database integrity check passed")
else:
    print("⚠️ Database integrity issues found")
EOF
    
    success "Database integrity check completed"
}

# Show database size information
show_size() {
    log "Database Size Information"
    load_env
    
    if [ -n "$DATABASE_URL" ]; then
        DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
        DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
        DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
        DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
    fi
    
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT 
            schemaname,
            tablename,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
            pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY size_bytes DESC
        LIMIT 20;
    "
}

# Monitor database performance
monitor_database() {
    log "Database Performance Monitoring"
    load_env
    
    if [ -n "$DATABASE_URL" ]; then
        DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
        DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
        DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
        DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
    fi
    
    echo -e "${CYAN}Active Queries:${NC}"
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT 
            pid,
            now() - pg_stat_activity.query_start AS duration,
            query 
        FROM pg_stat_activity 
        WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'
        AND state = 'active';
    "
    
    echo -e "${CYAN}Table Statistics:${NC}"
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT 
            schemaname,
            tablename,
            n_tup_ins as inserts,
            n_tup_upd as updates,
            n_tup_del as deletes,
            n_live_tup as live_tuples,
            n_dead_tup as dead_tuples
        FROM pg_stat_user_tables
        ORDER BY n_live_tup DESC
        LIMIT 10;
    "
}

# Clean up old data
cleanup_database() {
    log "Cleaning up old database data..."
    cd "$PROJECT_ROOT/backend"
    
    # Run custom cleanup command if it exists
    if python manage.py help cleanup >/dev/null 2>&1; then
        python manage.py cleanup
    else
        warning "No cleanup command found"
    fi
    
    success "Database cleanup completed"
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--env)
                ENVIRONMENT="$2"
                shift 2
                ;;
            --dry-run)
                DRY_RUN="--dry-run"
                shift
                ;;
            --force)
                FORCE="--force"
                shift
                ;;
            --compress)
                COMPRESS="--compress"
                shift
                ;;
            --encrypt)
                ENCRYPT="--encrypt"
                shift
                ;;
            --upload)
                UPLOAD="--upload"
                shift
                ;;
            -v|--verbose)
                VERBOSE="--verbose"
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                COMMAND="$1"
                shift
                break
                ;;
        esac
    done
}

# Main function
main() {
    parse_args "$@"
    
    # Load environment
    load_env
    
    # Execute command
    case $COMMAND in
        migrate)
            run_migrate $DRY_RUN $FORCE $VERBOSE "$@"
            ;;
        rollback)
            run_rollback "$@"
            ;;
        backup)
            run_backup "$@" $COMPRESS $ENCRYPT $UPLOAD
            ;;
        restore)
            run_restore "$@" $FORCE
            ;;
        status)
            show_status
            ;;
        shell)
            open_shell
            ;;
        reset)
            reset_database
            ;;
        seed)
            seed_database
            ;;
        vacuum)
            vacuum_database
            ;;
        check)
            check_database
            ;;
        size)
            show_size
            ;;
        monitor)
            monitor_database
            ;;
        cleanup)
            cleanup_database
            ;;
        ""|help)
            show_help
            ;;
        *)
            error "Unknown command: $COMMAND"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
