# 🏥 Hospital Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Django](https://img.shields.io/badge/Django-4.2.7-green.svg)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![Material-UI](https://img.shields.io/badge/Material--UI-6.1.9-blue.svg)](https://mui.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

A comprehensive, production-grade Hospital Management System built with modern technologies. This system provides a complete solution for managing hospital operations including patient management, doctor scheduling, appointment booking, billing, and administrative tasks.

## 🌟 Features

### 🔐 **Authentication & Authorization**
- **Multi-role Support**: Admin, Doctor, Patient, Nurse, Receptionist, Pharmacist
- **JWT Token Authentication** with automatic refresh
- **Role-based Access Control** (RBAC)
- **Secure Password Management** with validation
- **Email Verification** and password reset

### 👥 **User Management**
- **Patient Registration** with comprehensive medical profiles
- **Doctor Management** with specializations and availability
- **Staff Management** with role assignments
- **Profile Management** with photo uploads
- **Advanced Search & Filtering**

### 📅 **Appointment System**
- **Real-time Appointment Booking**
- **Calendar Integration** with availability checking
- **Appointment Status Management** (Scheduled, Confirmed, Completed, Cancelled)
- **Automated Notifications** and reminders
- **Recurring Appointments** support

### 🏥 **Medical Records**
- **Electronic Health Records** (EHR)
- **Medical History Tracking**
- **Prescription Management**
- **Lab Results Integration**
- **Document Upload** and management

### 💰 **Billing & Invoicing**
- **Automated Invoice Generation**
- **Payment Processing** integration
- **Insurance Claims** management
- **Financial Reporting**
- **Payment History** tracking

### 📊 **Dashboard & Analytics**
- **Role-specific Dashboards**
- **Real-time Statistics**
- **Performance Metrics**
- **System Health Monitoring**
- **Custom Reports** generation

### 🔧 **System Features**
- **Responsive Design** for all devices
- **Real-time Notifications**
- **Advanced Search** capabilities
- **Data Export** (PDF, Excel)
- **Audit Logging**
- **Backup & Recovery**

## 🏗️ Architecture

### **Backend (Django REST API)**
```
backend/
├── hospital_api/          # Main Django project
│   ├── settings/         # Environment-specific settings
│   ├── urls.py          # URL routing configuration
│   └── wsgi.py          # WSGI application
├── apps/                 # Django applications
│   ├── accounts/        # User authentication & management
│   ├── patients/        # Patient management
│   ├── doctors/         # Doctor management & scheduling
│   ├── appointments/    # Appointment booking system
│   └── billing/         # Billing & invoicing
├── requirements.txt      # Python dependencies
└── manage.py            # Django management commands
```

### **Frontend (React + Material-UI)**
```
frontend/
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── auth/       # Authentication components
│   │   ├── common/     # Common UI elements
│   │   ├── forms/      # Form components
│   │   └── layout/     # Layout components
│   ├── contexts/       # React contexts (Auth, Notifications)
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page components
│   │   ├── admin/      # Admin dashboard pages
│   │   ├── doctor/     # Doctor portal pages
│   │   └── patient/    # Patient portal pages
│   ├── services/       # API service layer
│   ├── theme/          # Material-UI theme configuration
│   └── utils/          # Utility functions
└── public/             # Static assets
```

## 🚀 Quick Start

### Prerequisites
- **Python 3.11+**
- **Node.js 18+**
- **PostgreSQL 13+** (or Neon account)
- **Docker & Docker Compose** (optional)

### 🐳 Docker Setup (Recommended)

1. **Clone the repository**
```bash
git clone https://github.com/your-username/hospital-management-system.git
cd hospital-management-system
```

2. **Environment Configuration**
```bash
# Copy environment template
cp backend/.env.example backend/.env
# Edit backend/.env with your database credentials
```

3. **Start with Docker Compose**
```bash
# Development mode
npm run dev:docker

# Production mode
docker-compose up -d
```

4. **Access the application**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/api/docs/
- **Admin Panel**: http://localhost:8000/admin/

### 💻 Local Development Setup

1. **Backend Setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

2. **Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

3. **Start Development Servers**
```bash
# From project root - starts both backend and frontend
npm run dev
```

## 📋 Available Scripts

### **Development Commands**
```bash
npm run dev              # Start both frontend and backend
npm run dev:docker       # Start with Docker Compose
npm run setup           # Initial project setup
npm run install:all     # Install all dependencies
```

### **Database Management**
```bash
npm run db:migrate      # Run database migrations
npm run db:reset        # Reset database
npm run db:health       # Check database connection
```

### **Testing & Quality**
```bash
npm run test:backend    # Run backend tests
npm run test:frontend   # Run frontend tests
npm run lint           # Run code linting
npm run format         # Format code
```

### **Monitoring & Logs**
```bash
npm run status         # Check service status
npm run health         # System health check
npm run logs           # View all logs
npm run logs:backend   # Backend logs only
npm run logs:frontend  # Frontend logs only
```

## 🔧 Configuration

### **Environment Variables**

**Backend (.env)**
```env
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:password@localhost:5432/hospital_db
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

**Frontend (.env)**
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_API_TIMEOUT=10000
```

## 🧪 Testing

### **Backend Testing**
```bash
cd backend
python manage.py test
pytest --cov=apps --cov-report=html
flake8 .                # Code linting
black .                 # Code formatting
isort .                 # Import sorting
```

### **Frontend Testing**
```bash
cd frontend
npm run test           # Unit tests with Vitest
npm run test:coverage  # Coverage report
npm run test:e2e       # End-to-end tests with Playwright
npm run test:ui        # Interactive test UI
npm run lint           # ESLint code checking
npm run format         # Prettier code formatting
```

### **Test Coverage**
- Backend: 85%+ test coverage
- Frontend: 80%+ test coverage
- E2E tests for critical user flows
- API integration tests
- Performance testing included

## 📚 API Documentation

The API is fully documented using OpenAPI/Swagger:

- **Interactive Documentation**: http://localhost:8000/api/docs/
- **ReDoc Documentation**: http://localhost:8000/api/redoc/
- **OpenAPI Schema**: http://localhost:8000/api/schema/

### **Key Endpoints**
- `POST /api/auth/login/` - User authentication
- `GET /api/patients/` - List patients
- `POST /api/appointments/` - Create appointment
- `GET /api/doctors/` - List doctors
- `GET /api/dashboard/stats/` - Dashboard statistics

## 🚀 Deployment

### **Production Deployment**
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d

# Health check
curl http://your-domain.com/health/
```

### **Environment Setup**
- Configure production database (PostgreSQL recommended)
- Set up SSL certificates (Let's Encrypt or custom)
- Configure environment variables for security
- Set up monitoring and logging (Grafana, Prometheus)
- Configure backup strategies
- Set up CI/CD pipelines

### **Scaling Options**
- **Horizontal Scaling**: Multiple backend instances behind load balancer
- **Database Scaling**: Read replicas and connection pooling
- **CDN Integration**: Static asset delivery optimization
- **Caching**: Redis for session and query caching
- **Monitoring**: Real-time performance and error tracking

### **Security Considerations**
- HTTPS enforcement
- CORS configuration
- Rate limiting
- SQL injection protection
- XSS protection
- CSRF protection
- Input validation and sanitization

## 🛠️ Technology Stack

### **Backend Technologies**
- **Framework**: Django 4.2.7 with Django REST Framework
- **Database**: PostgreSQL 15+ (with SQLite for development)
- **Authentication**: JWT with SimpleJWT
- **API Documentation**: drf-spectacular (OpenAPI 3.0)
- **Testing**: pytest, factory-boy, coverage
- **Code Quality**: flake8, black, isort
- **Production Server**: Gunicorn with Nginx

### **Frontend Technologies**
- **Framework**: React 18.3.1 with modern hooks
- **UI Library**: Material-UI 6.1.9 (MUI)
- **Routing**: React Router 6.28.0
- **HTTP Client**: Axios 1.7.9
- **Build Tool**: Vite 6.3.5
- **Testing**: Vitest, React Testing Library, Playwright
- **Code Quality**: ESLint, Prettier

### **DevOps & Infrastructure**
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: Nginx
- **Database**: PostgreSQL with connection pooling
- **Monitoring**: Health checks and logging
- **CI/CD**: GitHub Actions ready
- **Security**: HTTPS, CORS, rate limiting

## 🔍 System Requirements

### **Minimum Requirements**
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 20GB SSD
- **Network**: 100 Mbps

### **Recommended Requirements**
- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Storage**: 50GB+ SSD
- **Network**: 1 Gbps
- **OS**: Ubuntu 20.04+ or CentOS 8+

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Follow coding standards**:
   - Backend: PEP 8, type hints, docstrings
   - Frontend: ESLint rules, component documentation
4. **Write tests** for new features
5. **Update documentation** as needed
6. **Commit your changes** (`git commit -m 'Add amazing feature'`)
7. **Push to the branch** (`git push origin feature/amazing-feature`)
8. **Open a Pull Request** with detailed description

### **Development Guidelines**
- Follow existing code patterns and conventions
- Write comprehensive tests for new features
- Update documentation for API changes
- Use meaningful commit messages
- Keep pull requests focused and small

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📈 Performance & Monitoring

### **Performance Metrics**
- **API Response Time**: < 200ms average
- **Page Load Time**: < 2 seconds
- **Database Queries**: Optimized with indexing
- **Concurrent Users**: 1000+ supported
- **Uptime**: 99.9% target availability

### **Monitoring Features**
- Real-time system health monitoring
- Performance metrics dashboard
- Error tracking and alerting
- Database performance monitoring
- User activity analytics

## 🔒 Security Features

### **Authentication & Authorization**
- Multi-factor authentication (MFA) ready
- Role-based access control (RBAC)
- Session management with JWT
- Password strength enforcement
- Account lockout protection

### **Data Protection**
- Data encryption at rest and in transit
- GDPR compliance features
- Audit logging for all actions
- Secure file upload handling
- Regular security updates

### **API Security**
- Rate limiting and throttling
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF token validation

## 🆘 Support & Documentation

### **Getting Help**
- 📧 **Email**: your.email@example.com
- 🐛 **Issues**: [GitHub Issues](https://github.com/your-username/hospital-management-system/issues)
- 📖 **Documentation**: [Project Wiki](https://github.com/your-username/hospital-management-system/wiki)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/your-username/hospital-management-system/discussions)

### **Documentation Links**
- [API Documentation](docs/api.md)
- [Database Schema](docs/database.md)
- [Deployment Guide](docs/deployment.md)
- [Security Guidelines](SECURITY.md)
- [Performance Optimization](PERFORMANCE.md)

## 🚀 Roadmap

### **Version 2.0 (Planned)**
- [ ] Mobile application (React Native)
- [ ] Telemedicine integration
- [ ] AI-powered diagnosis assistance
- [ ] Advanced reporting and analytics
- [ ] Multi-language support
- [ ] Integration with medical devices

### **Version 1.5 (In Progress)**
- [ ] Enhanced notification system
- [ ] Advanced search capabilities
- [ ] Bulk operations support
- [ ] Export/import functionality
- [ ] Performance optimizations

## 🙏 Acknowledgments

- **Django REST Framework** for the robust API foundation
- **Material-UI** for the beautiful and accessible UI components
- **React community** for the excellent ecosystem
- **PostgreSQL** for reliable data management
- **Docker** for containerization simplicity
- **All contributors** who helped make this project better

## 📊 Project Statistics

- **Lines of Code**: 50,000+
- **Test Coverage**: 85%+
- **API Endpoints**: 100+
- **Database Tables**: 25+
- **React Components**: 200+
- **Development Time**: 6+ months

---

**Built with ❤️ for better healthcare management**

*This project is actively maintained and continuously improved. Star ⭐ the repository if you find it useful!*
