# Docker Containerization Guide
## Hospital Management System - 2025 Container Standards

This document provides comprehensive guidance for containerizing and deploying the Hospital Management System using Docker and Docker Compose.

## 🐳 Docker Architecture

The system uses a multi-container architecture with the following services:

### Production Services
- **Backend**: Django application with Gunicorn
- **Frontend**: React application with Nginx
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Worker**: Celery worker processes
- **Scheduler**: Celery beat scheduler
- **Proxy**: Nginx reverse proxy
- **Monitoring**: Prometheus, Grafana, ELK Stack

### Development Services
- **All production services** (with development configurations)
- **Flower**: Celery monitoring
- **MailHog**: Email testing
- **Adminer**: Database management
- **Redis Commander**: Redis management

## 🚀 Quick Start

### Development Environment

```bash
# Clone the repository
git clone <repository-url>
cd hospital-management-system

# Copy environment file
cp .env.example .env

# Start development environment
./scripts/docker-manager.sh dev

# Or using Docker Compose directly
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### Production Environment

```bash
# Set production environment variables
export ENVIRONMENT=production

# Start production environment
./scripts/docker-manager.sh prod

# Or using Docker Compose directly
docker-compose -f docker-compose.prod.yml up -d
```

## 📁 Docker Files Structure

```
hospital-management-system/
├── docker-compose.yml              # Base compose file
├── docker-compose.dev.yml          # Development overrides
├── docker-compose.prod.yml         # Production configuration
├── docker-compose.override.yml     # Local development overrides
├── backend/
│   ├── Dockerfile.dev              # Development backend image
│   ├── Dockerfile.prod             # Production backend image
│   ├── requirements/
│   │   ├── base.txt               # Base requirements
│   │   ├── development.txt        # Development requirements
│   │   └── production.txt         # Production requirements
│   └── scripts/
│       ├── entrypoint.dev.sh      # Development entrypoint
│       └── entrypoint.prod.sh     # Production entrypoint
├── frontend/
│   ├── Dockerfile.dev              # Development frontend image
│   ├── Dockerfile.prod             # Production frontend image
│   ├── nginx.conf                  # Nginx configuration
│   └── nginx-default.conf          # Default site configuration
├── config/
│   ├── nginx/                      # Nginx configurations
│   ├── prometheus/                 # Prometheus configuration
│   ├── grafana/                    # Grafana configuration
│   └── logstash/                   # Logstash configuration
└── scripts/
    ├── docker-manager.sh           # Docker management script
    └── health-check.sh             # Health check script
```

## 🛠️ Docker Management Script

The `docker-manager.sh` script provides easy commands for managing Docker environments:

### Basic Commands

```bash
# Start development environment
./scripts/docker-manager.sh dev

# Start production environment
./scripts/docker-manager.sh prod

# Stop all services
./scripts/docker-manager.sh stop

# Restart services
./scripts/docker-manager.sh restart

# Show service status
./scripts/docker-manager.sh status

# Show logs
./scripts/docker-manager.sh logs

# Show logs for specific service
./scripts/docker-manager.sh logs -s backend
```

### Development Commands

```bash
# Open shell in backend container
./scripts/docker-manager.sh shell backend

# Open database shell
./scripts/docker-manager.sh db-shell

# Run migrations
./scripts/docker-manager.sh migrate

# Collect static files
./scripts/docker-manager.sh collectstatic

# Run tests
./scripts/docker-manager.sh test

# Run code linting
./scripts/docker-manager.sh lint

# Format code
./scripts/docker-manager.sh format
```

### Maintenance Commands

```bash
# Build images
./scripts/docker-manager.sh build

# Rebuild images (no cache)
./scripts/docker-manager.sh rebuild

# Backup database
./scripts/docker-manager.sh backup

# Restore database
./scripts/docker-manager.sh restore backup_20250622_120000.sql

# Clean up containers and volumes
./scripts/docker-manager.sh clean

# Check service health
./scripts/docker-manager.sh health

# Update images
./scripts/docker-manager.sh update
```

## 🔧 Environment Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Environment
ENVIRONMENT=development
DEBUG=True

# Database
DB_NAME=hospital_management
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_HOST=postgres
DB_PORT=5432

# Redis
REDIS_URL=redis://redis:6379

# Security
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key

# AWS (for production)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_STORAGE_BUCKET_NAME=hospital-management-files

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Monitoring
SENTRY_DSN=your-sentry-dsn
```

### Development vs Production

| Feature | Development | Production |
|---------|-------------|------------|
| Debug Mode | Enabled | Disabled |
| Auto-reload | Enabled | Disabled |
| SSL | Optional | Required |
| Logging | Console + File | File + Sentry |
| Caching | Basic | Redis Cluster |
| Static Files | Local | AWS S3 + CDN |
| Database | Local PostgreSQL | Managed PostgreSQL |
| Monitoring | Basic | Full ELK + Prometheus |

## 🏗️ Multi-Stage Builds

### Backend Dockerfile (Production)

```dockerfile
# Builder stage
FROM python:3.11-slim as builder
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
RUN apt-get update && apt-get install -y build-essential libpq-dev gcc
WORKDIR /app
COPY requirements/production.txt requirements.txt
RUN pip install --user --no-cache-dir -r requirements.txt

# Production stage
FROM python:3.11-slim as production
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
RUN apt-get update && apt-get install -y libpq5 curl netcat-openbsd
RUN groupadd -r appuser && useradd -r -g appuser appuser
WORKDIR /app
COPY --from=builder --chown=appuser:appuser /root/.local /home/appuser/.local
COPY --chown=appuser:appuser . .
USER appuser
EXPOSE 8000
CMD ["gunicorn", "--config", "gunicorn.conf.py", "hospital_management.wsgi:application"]
```

### Frontend Dockerfile (Production)

```dockerfile
# Builder stage
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production --silent
COPY . .
RUN npm run build

# Production stage
FROM nginx:1.24-alpine as production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🔍 Health Checks

### Built-in Health Checks

All containers include health checks:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/health/"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 60s
```

### Comprehensive Health Check Script

```bash
# Run comprehensive health check
./scripts/health-check.sh

# Check specific components
./scripts/health-check.sh --backend-url http://localhost:8000
```

## 📊 Monitoring and Logging

### Prometheus Metrics

Access Prometheus at `http://localhost:9090`

Key metrics monitored:
- Request rate and latency
- Error rates
- Database connections
- Cache hit rates
- System resources

### Grafana Dashboards

Access Grafana at `http://localhost:3001`

Pre-configured dashboards:
- Application Performance
- Infrastructure Monitoring
- Business Metrics
- Error Tracking

### ELK Stack Logging

- **Elasticsearch**: `http://localhost:9200`
- **Kibana**: `http://localhost:5601`
- **Logstash**: Processes logs from all services

### Log Aggregation

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
    labels: "service,environment"
```

## 🔒 Security Considerations

### Container Security

1. **Non-root Users**: All containers run as non-root users
2. **Read-only Filesystems**: Where possible
3. **Resource Limits**: CPU and memory limits set
4. **Network Isolation**: Services communicate through internal networks
5. **Secret Management**: Sensitive data via environment variables or secrets

### Network Security

```yaml
networks:
  hospital_network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

### Volume Security

```yaml
volumes:
  postgres_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /encrypted/postgres/data
```

## 🚀 Deployment Strategies

### Blue-Green Deployment

```bash
# Deploy to green environment
docker-compose -f docker-compose.prod.yml -p hospital-green up -d

# Switch traffic (update load balancer)
# Verify deployment
./scripts/health-check.sh --backend-url http://green.hospital.com

# Remove blue environment
docker-compose -f docker-compose.prod.yml -p hospital-blue down
```

### Rolling Updates

```bash
# Update backend service
docker-compose -f docker-compose.prod.yml up -d --no-deps backend

# Update with zero downtime
docker-compose -f docker-compose.prod.yml up -d --scale backend=2
docker-compose -f docker-compose.prod.yml stop backend_old
```

## 🔧 Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check port usage
   netstat -tulpn | grep :8000
   
   # Use different ports
   docker-compose up -d -p 8001:8000
   ```

2. **Permission Issues**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   
   # Fix Docker socket permissions
   sudo usermod -aG docker $USER
   ```

3. **Memory Issues**
   ```bash
   # Increase Docker memory limit
   # Docker Desktop: Settings > Resources > Memory
   
   # Check container memory usage
   docker stats
   ```

4. **Database Connection Issues**
   ```bash
   # Check database logs
   docker-compose logs postgres
   
   # Test connection
   docker-compose exec postgres psql -U postgres -d hospital_management
   ```

### Debug Commands

```bash
# View container logs
docker-compose logs -f backend

# Execute commands in container
docker-compose exec backend python manage.py shell

# Inspect container
docker inspect hospital_backend_prod

# Check resource usage
docker stats

# View network configuration
docker network ls
docker network inspect hospital_network
```

## 📈 Performance Optimization

### Resource Limits

```yaml
deploy:
  resources:
    limits:
      memory: 2G
      cpus: '1.0'
    reservations:
      memory: 1G
      cpus: '0.5'
```

### Caching Strategies

1. **Multi-layer Caching**
   - Application cache (Redis)
   - Database query cache
   - Static file cache (Nginx)
   - CDN cache (CloudFront)

2. **Image Optimization**
   - Multi-stage builds
   - Layer caching
   - Base image optimization
   - Security scanning

### Scaling

```bash
# Scale services
docker-compose up -d --scale backend=3 --scale celery_worker=2

# Auto-scaling with Docker Swarm
docker service update --replicas 5 hospital_backend
```

## 🔄 Backup and Recovery

### Database Backup

```bash
# Automated backup
docker-compose exec postgres pg_dump -U postgres hospital_management > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U postgres -d hospital_management < backup.sql
```

### Volume Backup

```bash
# Backup volumes
docker run --rm -v hospital_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data

# Restore volumes
docker run --rm -v hospital_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_backup.tar.gz -C /
```

---

## 📋 Deployment Checklist

### Pre-deployment
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Database migrations tested
- [ ] Static files collected
- [ ] Health checks passing
- [ ] Security scan completed
- [ ] Performance testing done
- [ ] Backup strategy verified

### Post-deployment
- [ ] All services running
- [ ] Health checks passing
- [ ] Monitoring active
- [ ] Logs flowing correctly
- [ ] Performance metrics normal
- [ ] Security monitoring active
- [ ] Backup jobs scheduled

---

*This Docker containerization provides a robust, scalable, and secure deployment solution for the Hospital Management System following 2025 best practices.*
