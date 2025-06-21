# Hospital Management System

A comprehensive, production-grade Hospital Management System built with Django REST API backend and React Material UI frontend.

## 🏗️ Architecture

This project follows a **decoupled client-server architecture**:

- **Backend**: Django REST API (headless) serving as the core engine
- **Frontend**: React SPA with Material UI for responsive, modern interface  
- **Database**: Neon PostgreSQL for scalable, managed database infrastructure
- **Deployment**: Independent deployment of frontend and backend services

## 📁 Project Structure

```
hospital-management-system/
├── backend/                 # Django REST API
│   ├── hospital_api/       # Main Django project
│   ├── apps/               # Django applications
│   ├── requirements.txt    # Python dependencies
│   ├── manage.py          # Django management script
│   └── .env.example       # Environment variables template
├── frontend/               # React application
│   ├── src/               # React source code
│   ├── public/            # Static assets
│   ├── package.json       # Node.js dependencies
│   └── .env.example       # Environment variables template
├── deployment/             # Deployment configurations
│   ├── docker/            # Docker configurations
│   ├── nginx/             # Nginx configurations
│   └── scripts/           # Deployment scripts
├── docs/                  # Project documentation
├── scripts/               # Development scripts
├── docker-compose.yml     # Development environment
├── docker-compose.prod.yml # Production environment
└── README.md             # This file
```

## 🚀 Quick Start

### Option 1: Using Development Scripts (Recommended)
```bash
# Initial setup (first time only)
make setup
# or: bash scripts/dev-manage.sh setup

# Start development environment
make dev
# or: bash scripts/dev-start.sh
# or: npm run dev
```

### Option 2: Using Docker
```bash
# Start with Docker Compose
make dev-docker
# or: bash scripts/dev-start.sh --docker
# or: npm run dev:docker
```

### Option 3: Manual Setup
```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

### Production Mode
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🔧 Development Commands

### Using Make (Recommended)
```bash
make help          # Show all available commands
make setup         # Initial project setup
make dev           # Start development environment
make dev-docker    # Start with Docker
make status        # Check service status
make health        # Run health checks
make stop          # Stop all services
make clean         # Clean build artifacts
make test          # Run all tests
make lint          # Run code linting
make format        # Format code
```

### Using NPM Scripts
```bash
npm run dev        # Start development environment
npm run setup      # Initial project setup
npm run status     # Check service status
npm run health     # Run health checks
npm run stop       # Stop all services
npm run test:backend   # Run backend tests
npm run test:frontend  # Run frontend tests
npm run lint       # Run linting
npm run format     # Format code
```

### Using Development Manager
```bash
bash scripts/dev-manage.sh        # Interactive menu
bash scripts/dev-manage.sh start  # Start development
bash scripts/dev-manage.sh status # Check status
bash scripts/dev-manage.sh health # Health check
```

## 🔧 Development Setup

See individual setup instructions:
- [Backend Setup](./backend/README.md)
- [Frontend Setup](./frontend/README.md)
- [Database Setup](./docs/database-setup.md)

## 📚 Documentation

- [API Documentation](./docs/api.md)
- [Database Schema](./docs/database.md)
- [Deployment Guide](./docs/deployment.md)

## 🏥 Features

- **Patient Management**: Comprehensive patient records and medical history
- **Doctor Portal**: Schedule management and patient access
- **Appointment System**: Intelligent booking and scheduling
- **Role-Based Access**: Secure, role-specific interfaces
- **Billing System**: Automated invoicing and payment tracking
- **Electronic Health Records**: Centralized medical record management

## 🛠️ Technology Stack

### Backend
- Python 3.11+
- Django 4.2+
- Django REST Framework
- PostgreSQL (Neon)
- JWT Authentication

### Frontend  
- React 18+
- Vite
- Material-UI (MUI)
- React Router
- Axios

### DevOps
- Docker & Docker Compose
- Nginx
- GitHub Actions (CI/CD)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
