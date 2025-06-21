# Deployment Guide

Hospital Management System deployment instructions for development and production environments.

## 🚀 Development Deployment

### Prerequisites
- Docker & Docker Compose
- Git
- Node.js 18+ (for local frontend development)
- Python 3.11+ (for local backend development)

### Quick Start with Docker
```bash
# Clone repository
git clone <repository-url>
cd hospital-management-system

# Start development environment
docker-compose up -d

# Access applications
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# Database: localhost:5432
```

### Local Development Setup
```bash
# Start backend
./scripts/backend-start.sh

# Start frontend (in another terminal)
./scripts/frontend-start.sh

# Or start both
./scripts/dev-start.sh
```

## 🏭 Production Deployment

### Option 1: Docker Compose (Recommended)

1. **Server Setup**
```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

2. **Environment Configuration**
```bash
# Copy environment files
cp backend/.env.example backend/.env.prod
cp frontend/.env.example frontend/.env.prod

# Edit production environment variables
nano backend/.env.prod
nano frontend/.env.prod
```

3. **Deploy**
```bash
# Build and start production containers
docker-compose -f docker-compose.prod.yml up -d

# Run database migrations
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate

# Create superuser
docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser

# Collect static files
docker-compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
```

### Option 2: Separate Hosting

#### Backend Deployment (Django)
```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export DJANGO_SETTINGS_MODULE=hospital_api.settings.production
export DATABASE_URL=postgresql://user:pass@host:port/dbname

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Start with Gunicorn
gunicorn hospital_api.wsgi:application --bind 0.0.0.0:8000
```

#### Frontend Deployment (React)
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Serve with nginx or static hosting
# Copy dist/ folder to web server
```

## 🔧 Environment Variables

### Backend (.env)
```bash
# Django
SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=your-domain.com,www.your-domain.com

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# JWT
JWT_SECRET_KEY=your-jwt-secret

# Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Storage (optional)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_STORAGE_BUCKET_NAME=your-bucket
```

### Frontend (.env)
```bash
VITE_API_BASE_URL=https://api.your-domain.com
VITE_APP_NAME=Hospital Management System
VITE_APP_VERSION=1.0.0
```

## 🔒 Security Considerations

### SSL/TLS
- Use HTTPS in production
- Configure SSL certificates (Let's Encrypt recommended)
- Set secure headers in nginx

### Database Security
- Use strong passwords
- Enable SSL connections
- Regular backups
- Network isolation

### Application Security
- Keep dependencies updated
- Use environment variables for secrets
- Enable CORS properly
- Implement rate limiting

## 📊 Monitoring

### Health Checks
```bash
# Backend health
curl https://api.your-domain.com/health/

# Frontend health
curl https://your-domain.com/
```

### Logging
- Application logs: `/var/log/hospital-app/`
- Nginx logs: `/var/log/nginx/`
- Database logs: PostgreSQL logs

### Monitoring Tools
- **Application**: Django logging + Sentry
- **Infrastructure**: Prometheus + Grafana
- **Uptime**: UptimeRobot or similar

## 🔄 CI/CD Pipeline

GitHub Actions workflow for automated deployment:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to server
        run: |
          # Deployment commands
```

## 📦 Backup Strategy

### Database Backup
```bash
# Daily backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup_20231201.sql
```

### File Backup
- Static files backup
- Media files backup
- Configuration backup

## 🚨 Troubleshooting

### Common Issues
1. **Database connection errors**: Check DATABASE_URL
2. **CORS errors**: Verify ALLOWED_HOSTS and CORS settings
3. **Static files not loading**: Run collectstatic
4. **Permission errors**: Check file permissions

### Logs Location
- Backend: `docker-compose logs backend`
- Frontend: `docker-compose logs frontend`
- Database: `docker-compose logs db`
