#!/bin/bash

# Database Backup Script for Hospital Management System
# Comprehensive backup solution with encryption and cloud storage

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
LOG_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).log"

# Default values
ENVIRONMENT=${ENVIRONMENT:-development}
BACKUP_TYPE=${BACKUP_TYPE:-full}
COMPRESS=${COMPRESS:-true}
ENCRYPT=${ENCRYPT:-false}
UPLOAD_TO_CLOUD=${UPLOAD_TO_CLOUD:-false}
RETENTION_DAYS=${RETENTION_DAYS:-30}

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
    echo -e "${PURPLE}Database Backup Script${NC}"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --type TYPE         Backup type (full, incremental, schema-only, data-only)"
    echo "  --compress          Compress backup files (default: true)"
    echo "  --no-compress       Disable compression"
    echo "  --encrypt           Encrypt backup files"
    echo "  --upload            Upload to cloud storage"
    echo "  --retention DAYS    Retention period in days (default: 30)"
    echo "  --environment ENV   Environment (development, staging, production)"
    echo "  --help              Show this help"
    echo ""
    echo "Examples:"
    echo "  $0                          # Full backup with compression"
    echo "  $0 --type incremental      # Incremental backup"
    echo "  $0 --encrypt --upload      # Encrypted backup uploaded to cloud"
    echo "  $0 --type schema-only      # Schema-only backup"
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
    mkdir -p "$BACKUP_DIR"/{database,media,logs,encrypted}
    mkdir -p "$PROJECT_ROOT/logs"
    
    # Ensure log file exists
    touch "$LOG_FILE"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check required commands
    local required_commands=("pg_dump" "psql")
    
    if [ "$COMPRESS" = "true" ]; then
        required_commands+=("gzip")
    fi
    
    if [ "$ENCRYPT" = "true" ]; then
        required_commands+=("gpg")
    fi
    
    if [ "$UPLOAD_TO_CLOUD" = "true" ]; then
        required_commands+=("aws")
    fi
    
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

# Create database backup
create_database_backup() {
    local backup_type="$1"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/database/${ENVIRONMENT}_${backup_type}_${timestamp}"
    
    log "Creating $backup_type database backup..."
    
    case $backup_type in
        full)
            backup_file="${backup_file}.sql"
            PGPASSWORD="$DB_PASSWORD" pg_dump \
                -h "$DB_HOST" \
                -p "$DB_PORT" \
                -U "$DB_USER" \
                -d "$DB_NAME" \
                --verbose \
                --no-password \
                --format=custom \
                --file="$backup_file"
            ;;
        schema-only)
            backup_file="${backup_file}_schema.sql"
            PGPASSWORD="$DB_PASSWORD" pg_dump \
                -h "$DB_HOST" \
                -p "$DB_PORT" \
                -U "$DB_USER" \
                -d "$DB_NAME" \
                --verbose \
                --no-password \
                --schema-only \
                --format=custom \
                --file="$backup_file"
            ;;
        data-only)
            backup_file="${backup_file}_data.sql"
            PGPASSWORD="$DB_PASSWORD" pg_dump \
                -h "$DB_HOST" \
                -p "$DB_PORT" \
                -U "$DB_USER" \
                -d "$DB_NAME" \
                --verbose \
                --no-password \
                --data-only \
                --format=custom \
                --file="$backup_file"
            ;;
        incremental)
            # For incremental backups, we'll use WAL archiving
            backup_file="${backup_file}_incremental.sql"
            create_incremental_backup "$backup_file"
            ;;
        *)
            error "Unknown backup type: $backup_type"
            exit 1
            ;;
    esac
    
    if [ $? -eq 0 ]; then
        success "Database backup created: $backup_file"
        echo "$backup_file"
    else
        error "Database backup failed"
        exit 1
    fi
}

# Create incremental backup
create_incremental_backup() {
    local backup_file="$1"
    
    log "Creating incremental backup..."
    
    # Get last backup timestamp
    local last_backup_file="$BACKUP_DIR/database/last_backup_timestamp.txt"
    local last_timestamp=""
    
    if [ -f "$last_backup_file" ]; then
        last_timestamp=$(cat "$last_backup_file")
        log "Last backup timestamp: $last_timestamp"
    else
        warning "No previous backup found, creating full backup instead"
        create_database_backup "full"
        return
    fi
    
    # Create incremental backup using pg_dump with timestamp filter
    PGPASSWORD="$DB_PASSWORD" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --verbose \
        --no-password \
        --format=custom \
        --file="$backup_file" \
        --where="updated_at > '$last_timestamp'"
    
    # Update last backup timestamp
    date -u +"%Y-%m-%d %H:%M:%S" > "$last_backup_file"
}

# Create media files backup
create_media_backup() {
    log "Creating media files backup..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local media_backup_file="$BACKUP_DIR/media/${ENVIRONMENT}_media_${timestamp}.tar"
    local media_dir="$PROJECT_ROOT/backend/media"
    
    if [ -d "$media_dir" ] && [ "$(ls -A "$media_dir")" ]; then
        tar -cf "$media_backup_file" -C "$PROJECT_ROOT/backend" media/
        
        if [ $? -eq 0 ]; then
            success "Media backup created: $media_backup_file"
            echo "$media_backup_file"
        else
            error "Media backup failed"
            return 1
        fi
    else
        info "No media files to backup"
        return 0
    fi
}

# Compress backup files
compress_backup() {
    local backup_file="$1"
    
    if [ "$COMPRESS" != "true" ]; then
        return 0
    fi
    
    log "Compressing backup: $(basename "$backup_file")"
    
    gzip "$backup_file"
    
    if [ $? -eq 0 ]; then
        success "Backup compressed: ${backup_file}.gz"
        echo "${backup_file}.gz"
    else
        error "Compression failed"
        return 1
    fi
}

# Encrypt backup files
encrypt_backup() {
    local backup_file="$1"
    
    if [ "$ENCRYPT" != "true" ]; then
        echo "$backup_file"
        return 0
    fi
    
    log "Encrypting backup: $(basename "$backup_file")"
    
    local encrypted_file="$BACKUP_DIR/encrypted/$(basename "$backup_file").gpg"
    
    # Use GPG with passphrase from environment
    if [ -n "$BACKUP_ENCRYPTION_PASSPHRASE" ]; then
        gpg --batch --yes --passphrase "$BACKUP_ENCRYPTION_PASSPHRASE" \
            --symmetric --cipher-algo AES256 \
            --output "$encrypted_file" \
            "$backup_file"
    else
        # Use GPG with recipient (public key encryption)
        if [ -n "$BACKUP_GPG_RECIPIENT" ]; then
            gpg --batch --yes --trust-model always \
                --encrypt --recipient "$BACKUP_GPG_RECIPIENT" \
                --output "$encrypted_file" \
                "$backup_file"
        else
            error "No encryption method configured (BACKUP_ENCRYPTION_PASSPHRASE or BACKUP_GPG_RECIPIENT)"
            return 1
        fi
    fi
    
    if [ $? -eq 0 ]; then
        success "Backup encrypted: $encrypted_file"
        # Remove unencrypted file
        rm "$backup_file"
        echo "$encrypted_file"
    else
        error "Encryption failed"
        return 1
    fi
}

# Upload to cloud storage
upload_to_cloud() {
    local backup_file="$1"
    
    if [ "$UPLOAD_TO_CLOUD" != "true" ]; then
        return 0
    fi
    
    log "Uploading backup to cloud storage: $(basename "$backup_file")"
    
    # AWS S3 upload
    if [ -n "$AWS_BACKUP_BUCKET" ]; then
        local s3_path="s3://$AWS_BACKUP_BUCKET/hospital-management/$ENVIRONMENT/$(date +%Y/%m/%d)/$(basename "$backup_file")"
        
        aws s3 cp "$backup_file" "$s3_path" \
            --storage-class STANDARD_IA \
            --server-side-encryption AES256
        
        if [ $? -eq 0 ]; then
            success "Backup uploaded to S3: $s3_path"
        else
            error "S3 upload failed"
            return 1
        fi
    else
        warning "AWS_BACKUP_BUCKET not configured, skipping cloud upload"
    fi
}

# Clean old backups
cleanup_old_backups() {
    log "Cleaning up old backups (retention: $RETENTION_DAYS days)..."
    
    # Clean local backups
    find "$BACKUP_DIR" -type f -name "*.sql*" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    find "$BACKUP_DIR" -type f -name "*.tar*" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    find "$BACKUP_DIR" -type f -name "*.gpg" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    
    # Clean cloud backups (if configured)
    if [ "$UPLOAD_TO_CLOUD" = "true" ] && [ -n "$AWS_BACKUP_BUCKET" ]; then
        local cutoff_date=$(date -d "$RETENTION_DAYS days ago" +%Y-%m-%d)
        
        aws s3 ls "s3://$AWS_BACKUP_BUCKET/hospital-management/$ENVIRONMENT/" --recursive | \
        while read -r line; do
            local file_date=$(echo "$line" | awk '{print $1}')
            local file_path=$(echo "$line" | awk '{print $4}')
            
            if [[ "$file_date" < "$cutoff_date" ]]; then
                aws s3 rm "s3://$AWS_BACKUP_BUCKET/$file_path"
                log "Deleted old cloud backup: $file_path"
            fi
        done
    fi
    
    success "Old backups cleaned up"
}

# Generate backup report
generate_backup_report() {
    local backup_files=("$@")
    
    log "Generating backup report..."
    
    local report_file="$BACKUP_DIR/backup_report_$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$report_file" << EOF
Backup Report
=============
Date: $(date)
Environment: $ENVIRONMENT
Backup Type: $BACKUP_TYPE
User: $(whoami)
Host: $(hostname)

Database Information:
- Host: $DB_HOST
- Port: $DB_PORT
- Database: $DB_NAME
- User: $DB_USER

Backup Files Created:
EOF
    
    for file in "${backup_files[@]}"; do
        if [ -f "$file" ]; then
            local size=$(du -h "$file" | cut -f1)
            echo "- $(basename "$file") ($size)" >> "$report_file"
        fi
    done
    
    cat >> "$report_file" << EOF

Backup Settings:
- Compression: $COMPRESS
- Encryption: $ENCRYPT
- Cloud Upload: $UPLOAD_TO_CLOUD
- Retention Days: $RETENTION_DAYS

System Information:
- PostgreSQL Version: $(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT version();" 2>/dev/null | head -1)
- Disk Space: $(df -h "$BACKUP_DIR" | tail -1)

Log File: $LOG_FILE
EOF
    
    success "Backup report generated: $report_file"
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --type)
                BACKUP_TYPE="$2"
                shift 2
                ;;
            --compress)
                COMPRESS=true
                shift
                ;;
            --no-compress)
                COMPRESS=false
                shift
                ;;
            --encrypt)
                ENCRYPT=true
                shift
                ;;
            --upload)
                UPLOAD_TO_CLOUD=true
                shift
                ;;
            --retention)
                RETENTION_DAYS="$2"
                shift 2
                ;;
            --environment)
                ENVIRONMENT="$2"
                shift 2
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
    
    log "Starting backup process"
    log "Environment: $ENVIRONMENT"
    log "Backup type: $BACKUP_TYPE"
    
    # Setup
    setup_directories
    load_env
    check_prerequisites
    check_database_connection
    
    # Create backups
    local backup_files=()
    
    # Database backup
    local db_backup
    db_backup=$(create_database_backup "$BACKUP_TYPE")
    
    # Media backup
    local media_backup
    media_backup=$(create_media_backup)
    
    # Process backup files
    for backup_file in "$db_backup" "$media_backup"; do
        if [ -n "$backup_file" ] && [ -f "$backup_file" ]; then
            # Compress
            if [ "$COMPRESS" = "true" ]; then
                backup_file=$(compress_backup "$backup_file")
            fi
            
            # Encrypt
            if [ "$ENCRYPT" = "true" ]; then
                backup_file=$(encrypt_backup "$backup_file")
            fi
            
            # Upload to cloud
            if [ "$UPLOAD_TO_CLOUD" = "true" ]; then
                upload_to_cloud "$backup_file"
            fi
            
            backup_files+=("$backup_file")
        fi
    done
    
    # Cleanup old backups
    cleanup_old_backups
    
    # Generate report
    generate_backup_report "${backup_files[@]}"
    
    success "Backup process completed successfully"
}

# Error handling
trap 'error "Backup script failed at line $LINENO"' ERR

# Run main function with all arguments
main "$@"
