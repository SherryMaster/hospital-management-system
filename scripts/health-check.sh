#!/bin/bash

# Health Check Script for Hospital Management System
# Comprehensive health monitoring for all services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL=${BACKEND_URL:-http://localhost:8000}
FRONTEND_URL=${FRONTEND_URL:-http://localhost:3000}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
REDIS_HOST=${REDIS_HOST:-localhost}
REDIS_PORT=${REDIS_PORT:-6379}
TIMEOUT=${TIMEOUT:-10}

# Health check results
HEALTH_STATUS=0
FAILED_CHECKS=()

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
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
    HEALTH_STATUS=1
}

# Check if a service is reachable
check_service() {
    local service_name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    
    log "Checking $service_name at $url"
    
    if command -v curl >/dev/null 2>&1; then
        local response_code
        response_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$url" || echo "000")
        
        if [ "$response_code" = "$expected_status" ]; then
            success "$service_name is healthy (HTTP $response_code)"
            return 0
        else
            error "$service_name health check failed (HTTP $response_code)"
            FAILED_CHECKS+=("$service_name")
            return 1
        fi
    else
        warning "curl not available, skipping HTTP check for $service_name"
        return 0
    fi
}

# Check TCP connection
check_tcp() {
    local service_name="$1"
    local host="$2"
    local port="$3"
    
    log "Checking TCP connection to $service_name at $host:$port"
    
    if command -v nc >/dev/null 2>&1; then
        if nc -z -w "$TIMEOUT" "$host" "$port" >/dev/null 2>&1; then
            success "$service_name TCP connection is healthy"
            return 0
        else
            error "$service_name TCP connection failed"
            FAILED_CHECKS+=("$service_name")
            return 1
        fi
    elif command -v telnet >/dev/null 2>&1; then
        if timeout "$TIMEOUT" telnet "$host" "$port" </dev/null >/dev/null 2>&1; then
            success "$service_name TCP connection is healthy"
            return 0
        else
            error "$service_name TCP connection failed"
            FAILED_CHECKS+=("$service_name")
            return 1
        fi
    else
        warning "nc or telnet not available, skipping TCP check for $service_name"
        return 0
    fi
}

# Check database connection
check_database() {
    log "Checking database connection"
    
    if command -v psql >/dev/null 2>&1; then
        if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
            success "Database connection is healthy"
            return 0
        else
            error "Database connection failed"
            FAILED_CHECKS+=("Database")
            return 1
        fi
    else
        # Fallback to TCP check
        check_tcp "Database" "$DB_HOST" "$DB_PORT"
    fi
}

# Check Redis connection
check_redis() {
    log "Checking Redis connection"
    
    if command -v redis-cli >/dev/null 2>&1; then
        if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping >/dev/null 2>&1; then
            success "Redis connection is healthy"
            return 0
        else
            error "Redis connection failed"
            FAILED_CHECKS+=("Redis")
            return 1
        fi
    else
        # Fallback to TCP check
        check_tcp "Redis" "$REDIS_HOST" "$REDIS_PORT"
    fi
}

# Check backend API endpoints
check_backend_api() {
    log "Checking backend API endpoints"
    
    # Health endpoint
    check_service "Backend Health" "$BACKEND_URL/health/"
    
    # API root
    check_service "Backend API Root" "$BACKEND_URL/api/"
    
    # Admin interface
    check_service "Backend Admin" "$BACKEND_URL/admin/" "302"
    
    # Static files
    check_service "Backend Static" "$BACKEND_URL/static/" "404"
}

# Check frontend application
check_frontend() {
    log "Checking frontend application"
    
    # Main application
    check_service "Frontend App" "$FRONTEND_URL/"
    
    # Check if it's a React app
    if curl -s --max-time "$TIMEOUT" "$FRONTEND_URL/" | grep -q "react" >/dev/null 2>&1; then
        success "Frontend appears to be a React application"
    else
        warning "Frontend may not be a React application or not fully loaded"
    fi
}

# Check Docker containers (if running in Docker)
check_docker_containers() {
    if command -v docker >/dev/null 2>&1; then
        log "Checking Docker containers"
        
        local containers
        containers=$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "(hospital|backend|frontend|postgres|redis)" || true)
        
        if [ -n "$containers" ]; then
            success "Docker containers found:"
            echo "$containers"
            
            # Check if any containers are unhealthy
            local unhealthy
            unhealthy=$(docker ps --filter "health=unhealthy" --format "{{.Names}}" | grep -E "(hospital|backend|frontend|postgres|redis)" || true)
            
            if [ -n "$unhealthy" ]; then
                error "Unhealthy containers found: $unhealthy"
                FAILED_CHECKS+=("Docker Containers")
            else
                success "All containers are healthy"
            fi
        else
            warning "No hospital-related Docker containers found"
        fi
    else
        log "Docker not available, skipping container checks"
    fi
}

# Check system resources
check_system_resources() {
    log "Checking system resources"
    
    # Check disk space
    local disk_usage
    disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$disk_usage" -gt 90 ]; then
        error "Disk usage is high: ${disk_usage}%"
        FAILED_CHECKS+=("Disk Space")
    elif [ "$disk_usage" -gt 80 ]; then
        warning "Disk usage is moderate: ${disk_usage}%"
    else
        success "Disk usage is healthy: ${disk_usage}%"
    fi
    
    # Check memory usage
    if command -v free >/dev/null 2>&1; then
        local memory_usage
        memory_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
        
        if [ "$memory_usage" -gt 90 ]; then
            error "Memory usage is high: ${memory_usage}%"
            FAILED_CHECKS+=("Memory")
        elif [ "$memory_usage" -gt 80 ]; then
            warning "Memory usage is moderate: ${memory_usage}%"
        else
            success "Memory usage is healthy: ${memory_usage}%"
        fi
    fi
    
    # Check load average
    if command -v uptime >/dev/null 2>&1; then
        local load_avg
        load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
        success "System load average: $load_avg"
    fi
}

# Check log files for errors
check_logs() {
    log "Checking recent log files for errors"
    
    local log_dirs=("/var/log/hospital-management" "./logs" "/app/logs")
    local error_count=0
    
    for log_dir in "${log_dirs[@]}"; do
        if [ -d "$log_dir" ]; then
            # Check for recent errors in log files
            local recent_errors
            recent_errors=$(find "$log_dir" -name "*.log" -mtime -1 -exec grep -l "ERROR\|CRITICAL\|FATAL" {} \; 2>/dev/null | wc -l)
            
            if [ "$recent_errors" -gt 0 ]; then
                warning "Found $recent_errors log files with recent errors in $log_dir"
                error_count=$((error_count + recent_errors))
            fi
        fi
    done
    
    if [ "$error_count" -eq 0 ]; then
        success "No recent errors found in log files"
    else
        warning "Total log files with recent errors: $error_count"
    fi
}

# Check SSL certificates (if HTTPS is enabled)
check_ssl_certificates() {
    if [ "${BACKEND_URL:0:5}" = "https" ] || [ "${FRONTEND_URL:0:5}" = "https" ]; then
        log "Checking SSL certificates"
        
        for url in "$BACKEND_URL" "$FRONTEND_URL"; do
            if [ "${url:0:5}" = "https" ]; then
                local domain
                domain=$(echo "$url" | sed 's|https://||' | sed 's|/.*||')
                
                if command -v openssl >/dev/null 2>&1; then
                    local cert_expiry
                    cert_expiry=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
                    
                    if [ -n "$cert_expiry" ]; then
                        success "SSL certificate for $domain expires: $cert_expiry"
                    else
                        warning "Could not check SSL certificate for $domain"
                    fi
                else
                    warning "openssl not available, skipping SSL certificate check"
                fi
            fi
        done
    else
        log "HTTPS not enabled, skipping SSL certificate checks"
    fi
}

# Generate health report
generate_report() {
    echo ""
    echo "=================================="
    echo "    HEALTH CHECK SUMMARY"
    echo "=================================="
    echo "Timestamp: $(date)"
    echo "Environment: ${ENVIRONMENT:-unknown}"
    echo ""
    
    if [ "$HEALTH_STATUS" -eq 0 ]; then
        success "Overall health status: HEALTHY"
    else
        error "Overall health status: UNHEALTHY"
        echo ""
        echo "Failed checks:"
        for check in "${FAILED_CHECKS[@]}"; do
            echo "  - $check"
        done
    fi
    
    echo ""
    echo "=================================="
}

# Main health check function
main() {
    log "Starting comprehensive health check for Hospital Management System"
    echo ""
    
    # Load environment variables if available
    if [ -f ".env" ]; then
        export $(grep -v '^#' .env | xargs) 2>/dev/null || true
    fi
    
    # Run all health checks
    check_system_resources
    echo ""
    
    check_docker_containers
    echo ""
    
    check_database
    echo ""
    
    check_redis
    echo ""
    
    check_backend_api
    echo ""
    
    check_frontend
    echo ""
    
    check_logs
    echo ""
    
    check_ssl_certificates
    echo ""
    
    # Generate final report
    generate_report
    
    # Exit with appropriate code
    exit "$HEALTH_STATUS"
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Hospital Management System Health Check"
        echo ""
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --help, -h          Show this help message"
        echo "  --backend-url URL   Backend URL (default: http://localhost:8000)"
        echo "  --frontend-url URL  Frontend URL (default: http://localhost:3000)"
        echo "  --timeout SECONDS   Request timeout (default: 10)"
        echo ""
        echo "Environment variables:"
        echo "  BACKEND_URL         Backend URL"
        echo "  FRONTEND_URL        Frontend URL"
        echo "  DB_HOST             Database host"
        echo "  DB_PORT             Database port"
        echo "  REDIS_HOST          Redis host"
        echo "  REDIS_PORT          Redis port"
        echo "  TIMEOUT             Request timeout"
        exit 0
        ;;
    --backend-url)
        BACKEND_URL="$2"
        shift 2
        ;;
    --frontend-url)
        FRONTEND_URL="$2"
        shift 2
        ;;
    --timeout)
        TIMEOUT="$2"
        shift 2
        ;;
esac

# Run main function
main "$@"
