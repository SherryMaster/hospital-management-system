#!/bin/bash

# Docker Management Script for Hospital Management System
# Provides easy commands for managing Docker environments

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
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env"

# Default environment
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
    echo -e "${PURPLE}Hospital Management System - Docker Manager${NC}"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo -e "${CYAN}Commands:${NC}"
    echo "  dev                 Start development environment"
    echo "  prod                Start production environment"
    echo "  staging             Start staging environment"
    echo "  stop                Stop all services"
    echo "  restart             Restart all services"
    echo "  build               Build all images"
    echo "  rebuild             Rebuild all images (no cache)"
    echo "  logs                Show logs for all services"
    echo "  shell               Open shell in backend container"
    echo "  db-shell            Open database shell"
    echo "  migrate             Run database migrations"
    echo "  collectstatic       Collect static files"
    echo "  test                Run tests"
    echo "  lint                Run code linting"
    echo "  format              Format code"
    echo "  backup              Backup database"
    echo "  restore             Restore database from backup"
    echo "  clean               Clean up containers and volumes"
    echo "  status              Show status of all services"
    echo "  health              Check health of all services"
    echo "  update              Update all images"
    echo ""
    echo -e "${CYAN}Options:${NC}"
    echo "  -e, --env ENV       Set environment (development, staging, production)"
    echo "  -f, --file FILE     Use specific docker-compose file"
    echo "  -s, --service SVC   Target specific service"
    echo "  -v, --verbose       Verbose output"
    echo "  -h, --help          Show this help"
    echo ""
    echo -e "${CYAN}Examples:${NC}"
    echo "  $0 dev              Start development environment"
    echo "  $0 prod -e production"
    echo "  $0 logs -s backend"
    echo "  $0 shell backend"
    echo "  $0 test --verbose"
}

# Check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Check if Docker Compose is available
check_docker_compose() {
    if ! command -v docker-compose >/dev/null 2>&1; then
        if ! docker compose version >/dev/null 2>&1; then
            error "Docker Compose is not available. Please install Docker Compose."
            exit 1
        fi
        DOCKER_COMPOSE="docker compose"
    else
        DOCKER_COMPOSE="docker-compose"
    fi
}

# Get Docker Compose file based on environment
get_compose_file() {
    case $ENVIRONMENT in
        development)
            echo "-f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.override.yml"
            ;;
        staging)
            echo "-f docker-compose.yml -f docker-compose.staging.yml"
            ;;
        production)
            echo "-f docker-compose.prod.yml"
            ;;
        *)
            echo "-f docker-compose.yml"
            ;;
    esac
}

# Load environment variables
load_env() {
    if [ -f "$ENV_FILE" ]; then
        log "Loading environment variables from $ENV_FILE"
        export $(grep -v '^#' "$ENV_FILE" | xargs)
    else
        warning "Environment file not found: $ENV_FILE"
        warning "Using default values"
    fi
}

# Start services
start_services() {
    local compose_files=$(get_compose_file)
    log "Starting $ENVIRONMENT environment..."
    
    cd "$PROJECT_ROOT"
    $DOCKER_COMPOSE $compose_files up -d
    
    success "Services started successfully!"
    show_status
}

# Stop services
stop_services() {
    local compose_files=$(get_compose_file)
    log "Stopping services..."
    
    cd "$PROJECT_ROOT"
    $DOCKER_COMPOSE $compose_files down
    
    success "Services stopped successfully!"
}

# Restart services
restart_services() {
    local compose_files=$(get_compose_file)
    log "Restarting services..."
    
    cd "$PROJECT_ROOT"
    $DOCKER_COMPOSE $compose_files restart
    
    success "Services restarted successfully!"
}

# Build images
build_images() {
    local compose_files=$(get_compose_file)
    local no_cache=""
    
    if [ "$1" = "rebuild" ]; then
        no_cache="--no-cache"
        log "Rebuilding all images (no cache)..."
    else
        log "Building images..."
    fi
    
    cd "$PROJECT_ROOT"
    $DOCKER_COMPOSE $compose_files build $no_cache
    
    success "Images built successfully!"
}

# Show logs
show_logs() {
    local compose_files=$(get_compose_file)
    local service=""
    
    if [ -n "$TARGET_SERVICE" ]; then
        service="$TARGET_SERVICE"
        log "Showing logs for service: $service"
    else
        log "Showing logs for all services"
    fi
    
    cd "$PROJECT_ROOT"
    $DOCKER_COMPOSE $compose_files logs -f $service
}

# Open shell
open_shell() {
    local service="${1:-backend}"
    local compose_files=$(get_compose_file)
    
    log "Opening shell in $service container..."
    
    cd "$PROJECT_ROOT"
    $DOCKER_COMPOSE $compose_files exec $service /bin/bash
}

# Open database shell
open_db_shell() {
    local compose_files=$(get_compose_file)
    
    log "Opening database shell..."
    
    cd "$PROJECT_ROOT"
    $DOCKER_COMPOSE $compose_files exec postgres psql -U ${DB_USER:-postgres} -d ${DB_NAME:-hospital_management}
}

# Run migrations
run_migrations() {
    local compose_files=$(get_compose_file)
    
    log "Running database migrations..."
    
    cd "$PROJECT_ROOT"
    $DOCKER_COMPOSE $compose_files exec backend python manage.py migrate
    
    success "Migrations completed successfully!"
}

# Collect static files
collect_static() {
    local compose_files=$(get_compose_file)
    
    log "Collecting static files..."
    
    cd "$PROJECT_ROOT"
    $DOCKER_COMPOSE $compose_files exec backend python manage.py collectstatic --noinput
    
    success "Static files collected successfully!"
}

# Run tests
run_tests() {
    local compose_files=$(get_compose_file)
    local verbose=""
    
    if [ "$VERBOSE" = "true" ]; then
        verbose="-v"
    fi
    
    log "Running tests..."
    
    cd "$PROJECT_ROOT"
    $DOCKER_COMPOSE $compose_files exec backend python manage.py test $verbose
    
    success "Tests completed!"
}

# Run linting
run_lint() {
    local compose_files=$(get_compose_file)
    
    log "Running code linting..."
    
    cd "$PROJECT_ROOT"
    $DOCKER_COMPOSE $compose_files exec backend flake8 .
    $DOCKER_COMPOSE $compose_files exec backend mypy .
    
    success "Linting completed!"
}

# Format code
format_code() {
    local compose_files=$(get_compose_file)
    
    log "Formatting code..."
    
    cd "$PROJECT_ROOT"
    $DOCKER_COMPOSE $compose_files exec backend black .
    $DOCKER_COMPOSE $compose_files exec backend isort .
    
    success "Code formatting completed!"
}

# Backup database
backup_database() {
    local compose_files=$(get_compose_file)
    local backup_file="backup_$(date +%Y%m%d_%H%M%S).sql"
    
    log "Creating database backup: $backup_file"
    
    cd "$PROJECT_ROOT"
    mkdir -p backups
    $DOCKER_COMPOSE $compose_files exec -T postgres pg_dump -U ${DB_USER:-postgres} ${DB_NAME:-hospital_management} > "backups/$backup_file"
    
    success "Database backup created: backups/$backup_file"
}

# Restore database
restore_database() {
    local backup_file="$1"
    local compose_files=$(get_compose_file)
    
    if [ -z "$backup_file" ]; then
        error "Please specify backup file to restore"
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
        exit 1
    fi
    
    log "Restoring database from: $backup_file"
    
    cd "$PROJECT_ROOT"
    $DOCKER_COMPOSE $compose_files exec -T postgres psql -U ${DB_USER:-postgres} -d ${DB_NAME:-hospital_management} < "$backup_file"
    
    success "Database restored successfully!"
}

# Clean up
cleanup() {
    local compose_files=$(get_compose_file)
    
    warning "This will remove all containers, networks, and volumes. Are you sure? (y/N)"
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        log "Cleaning up containers and volumes..."
        
        cd "$PROJECT_ROOT"
        $DOCKER_COMPOSE $compose_files down -v --remove-orphans
        docker system prune -f
        
        success "Cleanup completed!"
    else
        info "Cleanup cancelled"
    fi
}

# Show status
show_status() {
    local compose_files=$(get_compose_file)
    
    log "Service status:"
    
    cd "$PROJECT_ROOT"
    $DOCKER_COMPOSE $compose_files ps
}

# Health check
health_check() {
    local compose_files=$(get_compose_file)
    
    log "Checking service health..."
    
    cd "$PROJECT_ROOT"
    
    # Check if services are running
    if ! $DOCKER_COMPOSE $compose_files ps | grep -q "Up"; then
        error "No services are running"
        return 1
    fi
    
    # Check backend health
    if curl -f http://localhost:8000/health/ >/dev/null 2>&1; then
        success "Backend is healthy"
    else
        error "Backend health check failed"
    fi
    
    # Check frontend health (if running)
    if curl -f http://localhost:3000/ >/dev/null 2>&1; then
        success "Frontend is healthy"
    else
        warning "Frontend health check failed or not running"
    fi
    
    # Check database connection
    if $DOCKER_COMPOSE $compose_files exec -T postgres pg_isready -U ${DB_USER:-postgres} >/dev/null 2>&1; then
        success "Database is healthy"
    else
        error "Database health check failed"
    fi
    
    # Check Redis connection
    if $DOCKER_COMPOSE $compose_files exec -T redis redis-cli ping >/dev/null 2>&1; then
        success "Redis is healthy"
    else
        error "Redis health check failed"
    fi
}

# Update images
update_images() {
    local compose_files=$(get_compose_file)
    
    log "Updating Docker images..."
    
    cd "$PROJECT_ROOT"
    $DOCKER_COMPOSE $compose_files pull
    
    success "Images updated successfully!"
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--env)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -f|--file)
                COMPOSE_FILE="$2"
                shift 2
                ;;
            -s|--service)
                TARGET_SERVICE="$2"
                shift 2
                ;;
            -v|--verbose)
                VERBOSE=true
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
    
    # Check prerequisites
    check_docker
    check_docker_compose
    load_env
    
    # Execute command
    case $COMMAND in
        dev|development)
            ENVIRONMENT=development
            start_services
            ;;
        prod|production)
            ENVIRONMENT=production
            start_services
            ;;
        staging)
            ENVIRONMENT=staging
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        build)
            build_images
            ;;
        rebuild)
            build_images rebuild
            ;;
        logs)
            show_logs
            ;;
        shell)
            open_shell "$@"
            ;;
        db-shell)
            open_db_shell
            ;;
        migrate)
            run_migrations
            ;;
        collectstatic)
            collect_static
            ;;
        test)
            run_tests
            ;;
        lint)
            run_lint
            ;;
        format)
            format_code
            ;;
        backup)
            backup_database
            ;;
        restore)
            restore_database "$@"
            ;;
        clean)
            cleanup
            ;;
        status)
            show_status
            ;;
        health)
            health_check
            ;;
        update)
            update_images
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
