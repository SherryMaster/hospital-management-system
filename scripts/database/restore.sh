#!/bin/bash

# Database Restore Script for Hospital Management System
# Comprehensive restore solution with validation and rollback

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
BACKUP_DIR="$PROJECT_ROOT/backups"
LOG_FILE="$BACKUP_DIR/restore_$(date +%Y%m%d_%H%M%S).log"

# Default values
ENVIRONMENT=${ENVIRONMENT:-development}
DRY_RUN=${DRY_RUN:-false}
FORCE=${FORCE:-false}
BACKUP_BEFORE_RESTORE=${BACKUP_BEFORE_RESTORE:-true}
VALIDATE_AFTER_RESTORE=${VALIDATE_AFTER_RESTORE:-true}

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
    echo -e "${PURPLE}Database Restore Script${NC}"
    echo ""
    echo "Usage: $0 [OPTIONS] BACKUP_FILE"
    echo ""
    echo "Options:"
    echo "  --dry-run               Show what would be done without executing"
    echo "  --force                 Force restore even with warnings"
    echo "  --no-backup             Skip backup before restore"
    echo "  --no-validate           Skip validation after restore"
    echo "  --environment ENV       Environment (development, staging, production)"
    echo "  --decrypt               Decrypt backup file before restore"
    echo "  --download-from-cloud   Download backup from cloud storage"
    echo "  --help                  Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 backup_20250622_120000.sql"
    echo "  $0 --force --no-backup backup.sql.gz"
    echo "  $0 --decrypt backup.sql.gpg"
    echo "  $0 --download-from-cloud s3://bucket/backup.sql"
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
    mkdir -p "$BACKUP_DIR"/{database,media,logs,temp}
    mkdir -p "$PROJECT_ROOT/logs"
    
    # Ensure log file exists
    touch "$LOG_FILE"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check required commands
    local required_commands=("pg_restore" "psql" "pg_dump")
    
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            error "Required command not found: $cmd"
            exit 1
        fi
    done
    
    success "All prerequisites met"
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
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
        success "Database connection successful"
    else
        error "Database connection failed"
        exit 1
    fi
}

# Validate backup file
validate_backup_file() {
    local backup_file="$1"
    
    log "Validating backup file: $backup_file"
    
    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
        exit 1
    fi
    
    # Check file size
    local file_size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file" 2>/dev/null)
    if [ "$file_size" -eq 0 ]; then
        error "Backup file is empty: $backup_file"
        exit 1
    fi
    
    # Check file format
    local file_type=$(file "$backup_file")
    log "Backup file type: $file_type"
    
    # Validate PostgreSQL backup format
    if echo "$file_type" | grep -q "PostgreSQL custom database dump"; then
        success "Valid PostgreSQL custom format backup"
    elif echo "$file_type" | grep -q "gzip compressed"; then
        info "Compressed backup file detected"
    elif echo "$file_type" | grep -q "GPG symmetrically encrypted"; then
        info "Encrypted backup file detected"
    elif echo "$file_type" | grep -q "ASCII text"; then
        info "Plain SQL backup file detected"
    else
        warning "Unknown backup file format, proceeding with caution"
    fi
    
    success "Backup file validation completed"
}

# Download backup from cloud
download_from_cloud() {
    local cloud_path="$1"
    local local_file="$BACKUP_DIR/temp/$(basename "$cloud_path")"
    
    log "Downloading backup from cloud: $cloud_path"
    
    if [[ "$cloud_path" == s3://* ]]; then
        # AWS S3 download
        aws s3 cp "$cloud_path" "$local_file"
        
        if [ $? -eq 0 ]; then
            success "Backup downloaded from S3: $local_file"
            echo "$local_file"
        else
            error "S3 download failed"
            exit 1
        fi
    else
        error "Unsupported cloud storage: $cloud_path"
        exit 1
    fi
}

# Decrypt backup file
decrypt_backup() {
    local encrypted_file="$1"
    local decrypted_file="$BACKUP_DIR/temp/$(basename "$encrypted_file" .gpg)"
    
    log "Decrypting backup file: $encrypted_file"
    
    if [ -n "$BACKUP_ENCRYPTION_PASSPHRASE" ]; then
        gpg --batch --yes --passphrase "$BACKUP_ENCRYPTION_PASSPHRASE" \
            --decrypt --output "$decrypted_file" \
            "$encrypted_file"
    else
        gpg --batch --yes --decrypt --output "$decrypted_file" "$encrypted_file"
    fi
    
    if [ $? -eq 0 ]; then
        success "Backup decrypted: $decrypted_file"
        echo "$decrypted_file"
    else
        error "Decryption failed"
        exit 1
    fi
}

# Decompress backup file
decompress_backup() {
    local compressed_file="$1"
    local decompressed_file="${compressed_file%.gz}"
    
    log "Decompressing backup file: $compressed_file"
    
    if [[ "$compressed_file" == *.gz ]]; then
        gunzip -c "$compressed_file" > "$decompressed_file"
        
        if [ $? -eq 0 ]; then
            success "Backup decompressed: $decompressed_file"
            echo "$decompressed_file"
        else
            error "Decompression failed"
            exit 1
        fi
    else
        echo "$compressed_file"
    fi
}

# Create backup before restore
create_pre_restore_backup() {
    if [ "$BACKUP_BEFORE_RESTORE" != "true" ]; then
        log "Skipping pre-restore backup (--no-backup specified)"
        return 0
    fi
    
    log "Creating backup before restore..."
    
    local backup_file="$BACKUP_DIR/database/pre_restore_$(date +%Y%m%d_%H%M%S).sql"
    
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
        success "Pre-restore backup created: $backup_file"
        echo "$backup_file" > "$BACKUP_DIR/pre_restore_backup.txt"
    else
        error "Pre-restore backup failed"
        exit 1
    fi
}

# Stop application services
stop_application() {
    log "Stopping application services..."
    
    # Stop Django application (if running in Docker)
    if command -v docker-compose >/dev/null 2>&1; then
        cd "$PROJECT_ROOT"
        docker-compose stop backend celery_worker celery_beat 2>/dev/null || true
        success "Application services stopped"
    else
        warning "Docker Compose not available, manual service stop may be required"
    fi
}

# Start application services
start_application() {
    log "Starting application services..."
    
    # Start Django application (if running in Docker)
    if command -v docker-compose >/dev/null 2>&1; then
        cd "$PROJECT_ROOT"
        docker-compose start backend celery_worker celery_beat 2>/dev/null || true
        success "Application services started"
    else
        warning "Docker Compose not available, manual service start may be required"
    fi
}

# Restore database
restore_database() {
    local backup_file="$1"
    
    log "Restoring database from: $backup_file"
    
    if [ "$DRY_RUN" = "true" ]; then
        log "Dry run - would execute database restore"
        return 0
    fi
    
    # Check if backup is custom format or SQL
    local file_type=$(file "$backup_file")
    
    if echo "$file_type" | grep -q "PostgreSQL custom database dump"; then
        # Custom format restore
        PGPASSWORD="$DB_PASSWORD" pg_restore \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USER" \
            -d "$DB_NAME" \
            --verbose \
            --clean \
            --if-exists \
            --no-owner \
            --no-privileges \
            "$backup_file"
    else
        # SQL format restore
        PGPASSWORD="$DB_PASSWORD" psql \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USER" \
            -d "$DB_NAME" \
            -f "$backup_file"
    fi
    
    if [ $? -eq 0 ]; then
        success "Database restore completed"
    else
        error "Database restore failed"
        
        # Attempt to restore from pre-restore backup
        if [ -f "$BACKUP_DIR/pre_restore_backup.txt" ]; then
            warning "Attempting to restore from pre-restore backup..."
            local pre_restore_backup=$(cat "$BACKUP_DIR/pre_restore_backup.txt")
            restore_database "$pre_restore_backup"
        fi
        
        exit 1
    fi
}

# Validate restored database
validate_restored_database() {
    if [ "$VALIDATE_AFTER_RESTORE" != "true" ]; then
        log "Skipping post-restore validation (--no-validate specified)"
        return 0
    fi
    
    log "Validating restored database..."
    
    cd "$PROJECT_ROOT/backend"
    
    # Check database integrity
    python manage.py check --database default
    
    # Run basic queries to ensure data integrity
    python manage.py shell << 'EOF'
from django.contrib.auth import get_user_model
from accounts.models import Patient, Doctor
from appointments.models import Appointment

User = get_user_model()

try:
    # Basic counts
    user_count = User.objects.count()
    patient_count = Patient.objects.count()
    doctor_count = Doctor.objects.count()
    appointment_count = Appointment.objects.count()
    
    print(f"Validation Results:")
    print(f"- Users: {user_count}")
    print(f"- Patients: {patient_count}")
    print(f"- Doctors: {doctor_count}")
    print(f"- Appointments: {appointment_count}")
    
    # Check for data consistency
    if user_count > 0 and patient_count >= 0 and doctor_count >= 0:
        print("✅ Database validation passed")
    else:
        print("❌ Database validation failed - unexpected counts")
        exit(1)
        
except Exception as e:
    print(f"❌ Database validation failed: {e}")
    exit(1)
EOF
    
    if [ $? -eq 0 ]; then
        success "Database validation passed"
    else
        error "Database validation failed"
        return 1
    fi
}

# Generate restore report
generate_restore_report() {
    local backup_file="$1"
    
    log "Generating restore report..."
    
    local report_file="$BACKUP_DIR/restore_report_$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$report_file" << EOF
Database Restore Report
=======================
Date: $(date)
Environment: $ENVIRONMENT
User: $(whoami)
Host: $(hostname)

Restore Details:
- Backup File: $backup_file
- Backup Size: $(du -h "$backup_file" 2>/dev/null | cut -f1 || echo "Unknown")
- Dry Run: $DRY_RUN
- Force: $FORCE

Database Information:
- Host: $DB_HOST
- Port: $DB_PORT
- Database: $DB_NAME
- User: $DB_USER

Pre-restore Backup: $(cat "$BACKUP_DIR/pre_restore_backup.txt" 2>/dev/null || echo "None")

System Information:
- PostgreSQL Version: $(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT version();" 2>/dev/null | head -1)

Log File: $LOG_FILE
EOF
    
    success "Restore report generated: $report_file"
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
            --no-backup)
                BACKUP_BEFORE_RESTORE=false
                shift
                ;;
            --no-validate)
                VALIDATE_AFTER_RESTORE=false
                shift
                ;;
            --environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            --decrypt)
                DECRYPT=true
                shift
                ;;
            --download-from-cloud)
                DOWNLOAD_FROM_CLOUD=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            -*)
                error "Unknown option: $1"
                show_help
                exit 1
                ;;
            *)
                BACKUP_FILE="$1"
                shift
                ;;
        esac
    done
    
    if [ -z "$BACKUP_FILE" ]; then
        error "Backup file not specified"
        show_help
        exit 1
    fi
}

# Main function
main() {
    parse_args "$@"
    
    log "Starting database restore process"
    log "Environment: $ENVIRONMENT"
    log "Backup file: $BACKUP_FILE"
    
    # Setup
    setup_directories
    load_env
    check_prerequisites
    check_database_connection
    
    # Process backup file
    local processed_backup="$BACKUP_FILE"
    
    # Download from cloud if needed
    if [ "$DOWNLOAD_FROM_CLOUD" = "true" ]; then
        processed_backup=$(download_from_cloud "$BACKUP_FILE")
    fi
    
    # Decrypt if needed
    if [ "$DECRYPT" = "true" ] || [[ "$processed_backup" == *.gpg ]]; then
        processed_backup=$(decrypt_backup "$processed_backup")
    fi
    
    # Decompress if needed
    if [[ "$processed_backup" == *.gz ]]; then
        processed_backup=$(decompress_backup "$processed_backup")
    fi
    
    # Validate backup file
    validate_backup_file "$processed_backup"
    
    # Safety checks for production
    if [ "$ENVIRONMENT" = "production" ] && [ "$FORCE" != "true" ]; then
        warning "Restoring in production environment!"
        echo "Are you sure you want to continue? (yes/no)"
        read -r response
        if [ "$response" != "yes" ]; then
            info "Restore cancelled by user"
            exit 0
        fi
    fi
    
    # Create pre-restore backup
    create_pre_restore_backup
    
    # Stop application
    stop_application
    
    # Restore database
    restore_database "$processed_backup"
    
    # Validate restored database
    validate_restored_database
    
    # Start application
    start_application
    
    # Generate report
    generate_restore_report "$processed_backup"
    
    success "Database restore completed successfully"
}

# Error handling
trap 'error "Restore script failed at line $LINENO"' ERR

# Run main function with all arguments
main "$@"
