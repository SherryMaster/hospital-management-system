# Backend - Django REST API

Hospital Management System backend built with Django REST Framework.

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- PostgreSQL (or Neon account)
- Virtual environment tool (venv/virtualenv)

### Setup

1. **Create virtual environment**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Environment setup**
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. **Database setup**
```bash
python manage.py migrate
python manage.py createsuperuser
```

5. **Run development server**
```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000/`

## 📁 Project Structure

```
backend/
├── hospital_api/          # Main Django project
│   ├── settings/         # Settings modules
│   ├── urls.py          # URL configuration
│   └── wsgi.py          # WSGI configuration
├── apps/                 # Django applications
│   ├── users/           # User management
│   ├── patients/        # Patient management
│   ├── doctors/         # Doctor management
│   ├── appointments/    # Appointment system
│   └── billing/         # Billing system
├── requirements.txt      # Python dependencies
├── manage.py            # Django management script
└── .env.example         # Environment variables template
```

## 🔧 Development

### Running Tests
```bash
python manage.py test
```

### API Documentation
Visit `http://localhost:8000/api/docs/` for interactive API documentation.

## 🌐 API Endpoints

- `/api/auth/` - Authentication endpoints
- `/api/users/` - User management
- `/api/patients/` - Patient management
- `/api/doctors/` - Doctor management
- `/api/appointments/` - Appointment system
- `/api/billing/` - Billing system

## 🔒 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```
