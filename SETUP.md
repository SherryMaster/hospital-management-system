# Hospital Management System - Setup Guide

This guide explains how to set up and run the Hospital Management System in both development and production environments.

## 🚀 Quick Start

### Development Mode (Local)
For development, we run both backend and frontend locally without Docker for faster development cycles.

**Windows:**
```bash
# Run the development startup script
scripts\dev-start.bat
```

This script will:
- Check for Python and Node.js
- Set up Python virtual environment
- Install backend dependencies
- Install frontend dependencies
- Run database migrations
- Start both backend (Django) and frontend (React) servers

**Access your application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Admin Panel: http://localhost:8000/admin/
- API Documentation: http://localhost:8000/api/docs/

### Production Mode (Docker)
For production deployment, use Docker Compose:

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your production values
# Update POSTGRES_PASSWORD, SECRET_KEY, ALLOWED_HOSTS, etc.

# Build and start production containers
docker-compose up -d

# Run initial migrations (first time only)
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py collectstatic --noinput
docker-compose exec backend python manage.py createsuperuser
```

**Production services:**
- Application: http://localhost (port 80)
- HTTPS: https://localhost (port 443, if SSL configured)

## 📁 File Structure

```
hospital-management-system/
├── docker-compose.yml          # Production Docker setup
├── .env.example               # Environment variables template
├── scripts/
│   ├── dev-start.bat         # Development startup script
│   └── database/             # Database management scripts
├── backend/
│   ├── Dockerfile.prod       # Production backend Docker image
│   └── ...                   # Django application files
├── frontend/
│   ├── Dockerfile.prod       # Production frontend Docker image
│   └── ...                   # React application files
└── deployment/               # Nginx and deployment configs
```

## 🔧 Requirements

### Development
- Python 3.11+
- Node.js 18+
- Git

### Production
- Docker
- Docker Compose

## 🛠️ Manual Development Setup

If you prefer to set up manually:

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# or: source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🐳 Docker Commands

```bash
# Start production environment
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild images
docker-compose build

# Run backend commands
docker-compose exec backend python manage.py <command>
```

## 🔒 Environment Variables

Copy `.env.example` to `.env` and update:

- `POSTGRES_PASSWORD`: Strong database password
- `SECRET_KEY`: Django secret key (generate new one)
- `ALLOWED_HOSTS`: Your domain names
- `DEBUG`: Set to `False` for production

## 📝 Notes

- **Development**: Uses local Python/Node.js for faster development
- **Production**: Uses Docker for consistent deployment
- **Database**: SQLite for development, PostgreSQL for production
- **Static Files**: Served by Django dev server in development, Nginx in production

## 🆘 Troubleshooting

1. **Port conflicts**: Ensure ports 8000, 5173, 80, 443 are available
2. **Permission issues**: Run scripts as administrator if needed
3. **Database issues**: Check database connection and migrations
4. **Docker issues**: Ensure Docker is running and has sufficient resources

For more detailed information, see the individual README files in backend/ and frontend/ directories.
