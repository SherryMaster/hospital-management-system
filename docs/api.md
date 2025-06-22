# Hospital Management System API Documentation

Comprehensive REST API documentation for the Hospital Management System.

## Base URL
- Development: `http://localhost:8000/api/`
- Production: `https://your-domain.com/api/`

## Authentication

All API endpoints (except authentication) require JWT token authentication.

### Headers
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

## Authentication Endpoints

### POST /auth/login/
User login with email/username and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "patient",
    "is_verified": true
  }
}
```

### POST /auth/refresh/
Refresh JWT access token.

**Request:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### POST /auth/logout/
Logout user and blacklist refresh token.

**Request:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### POST /auth/register/
Register new user account.

**Request:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword123",
  "password_confirm": "securepassword123",
  "first_name": "John",
  "last_name": "Doe",
  "role": "patient",
  "phone_number": "+1234567890"
}
```

### GET /auth/profile/
Get current user profile information.

**Response:**
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "first_name": "John",
  "middle_name": "",
  "last_name": "Doe",
  "full_name": "John Doe",
  "role": "patient",
  "date_of_birth": "1990-01-01",
  "age": 34,
  "gender": "M",
  "phone_number": "+1234567890",
  "address_line_1": "123 Main St",
  "city": "New York",
  "state": "NY",
  "postal_code": "10001",
  "country": "USA",
  "is_verified": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

## User Management Endpoints

### GET /auth/users/
List all users (admin only).

**Query Parameters:**
- `role` - Filter by user role (admin, doctor, patient, nurse, receptionist, pharmacist)
- `is_active` - Filter by active status (true/false)
- `search` - Search by name, email, or username
- `page` - Page number for pagination
- `page_size` - Items per page (max 100)

**Response:**
```json
{
  "count": 156,
  "next": "http://localhost:8000/api/auth/users/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "full_name": "John Doe",
      "role": "patient",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /auth/users/
Create new user (admin only).

## Doctor Management Endpoints

### GET /doctors/
List all doctors.

**Query Parameters:**
- `department` - Filter by department ID
- `specialization` - Filter by specialization ID
- `is_accepting_patients` - Filter by availability (true/false)
- `search` - Search by name or license number

**Response:**
```json
{
  "count": 12,
  "results": [
    {
      "id": 1,
      "user": {
        "id": 2,
        "full_name": "Dr. Jane Smith",
        "email": "jane.smith@hospital.com"
      },
      "doctor_id": "DR20241001",
      "license_number": "MD123456",
      "department": 1,
      "department_name": "Cardiology",
      "specializations": [1, 2],
      "specializations_list": ["Cardiology", "Internal Medicine"],
      "years_of_experience": 10,
      "consultation_fee": "150.00",
      "is_accepting_patients": true,
      "max_patients_per_day": 20,
      "current_patient_count": 15
    }
  ]
}
```

### GET /doctors/{id}/
Get doctor details.

### GET /doctors/{id}/availability/
Get doctor availability schedule.

### GET /doctors/departments/
List all departments.

**Response:**
```json
{
  "results": [
    {
      "id": 1,
      "name": "Cardiology",
      "description": "Heart and cardiovascular care",
      "head_of_department": 2,
      "head_of_department_name": "Dr. Jane Smith",
      "doctor_count": 5,
      "phone_number": "+1234567890",
      "email": "cardiology@hospital.com",
      "location": "Building A, Floor 3"
    }
  ]
}
```

### GET /doctors/specializations/
List all specializations.

**Response:**
```json
{
  "results": [
    {
      "id": 1,
      "name": "Cardiology",
      "description": "Heart and cardiovascular diseases",
      "department": 1,
      "department_name": "Cardiology"
    }
  ]
}
```

## Patient Management Endpoints

### GET /patients/
List all patients (staff only).

**Query Parameters:**
- `search` - Search by name, patient ID, or email
- `blood_type` - Filter by blood type
- `is_active` - Filter by active status

**Response:**
```json
{
  "count": 89,
  "results": [
    {
      "id": 1,
      "user": {
        "id": 3,
        "full_name": "John Doe",
        "email": "john@example.com",
        "phone_number": "+1234567890"
      },
      "patient_id": "P20241001",
      "blood_type": "O+",
      "age": 34,
      "height": 1.75,
      "weight": 70.5,
      "bmi": 23.02,
      "bmi_category": "Normal",
      "allergies": "Penicillin",
      "chronic_conditions": "Hypertension",
      "registration_date": "2024-01-01T00:00:00Z",
      "last_visit_date": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### GET /patients/{id}/
Get patient details.

### GET /patients/me/
Get current user's patient profile.

### GET /patients/{id}/records/
Get patient's medical records.

**Response:**
```json
{
  "results": [
    {
      "id": 1,
      "patient": 1,
      "doctor": 2,
      "doctor_name": "Dr. Jane Smith",
      "visit_date": "2024-01-15T10:30:00Z",
      "chief_complaint": "Chest pain",
      "diagnosis": "Angina pectoris",
      "treatment_plan": "Medication and lifestyle changes",
      "medications_prescribed": "Nitroglycerin 0.4mg",
      "follow_up_date": "2024-02-15",
      "notes": "Patient responded well to treatment"
    }
  ]
}
```

## Appointment Management Endpoints

### GET /appointments/
List all appointments.

**Query Parameters:**
- `patient` - Filter by patient ID
- `doctor` - Filter by doctor ID
- `status` - Filter by status (scheduled, confirmed, completed, cancelled, no_show)
- `date` - Filter by appointment date (YYYY-MM-DD)
- `date_from` - Filter appointments from date
- `date_to` - Filter appointments to date

**Response:**
```json
{
  "count": 234,
  "results": [
    {
      "id": 1,
      "patient": {
        "id": 1,
        "patient_id": "P20241001",
        "full_name": "John Doe"
      },
      "doctor": {
        "id": 2,
        "doctor_id": "DR20241001",
        "full_name": "Dr. Jane Smith"
      },
      "department": {
        "id": 1,
        "name": "Cardiology"
      },
      "appointment_date": "2024-01-20",
      "appointment_time": "10:30:00",
      "status": "scheduled",
      "appointment_type": "consultation",
      "chief_complaint": "Chest pain",
      "notes": "Follow-up appointment",
      "created_at": "2024-01-15T09:00:00Z"
    }
  ]
}
```

### POST /appointments/
Create new appointment.

**Request:**
```json
{
  "patient": 1,
  "doctor": 2,
  "appointment_date": "2024-01-20",
  "appointment_time": "10:30:00",
  "appointment_type": "consultation",
  "chief_complaint": "Chest pain",
  "notes": "Follow-up appointment"
}
```

### GET /appointments/{id}/
Get appointment details.

### PATCH /appointments/{id}/
Update appointment.

### DELETE /appointments/{id}/
Cancel appointment.

### GET /appointments/my/
Get current user's appointments (patient or doctor view).

### GET /appointments/calendar/
Get appointments in calendar format.

**Query Parameters:**
- `start_date` - Start date for calendar view
- `end_date` - End date for calendar view
- `doctor` - Filter by doctor ID

### GET /appointments/today/
Get today's appointments.

## Billing Endpoints

### GET /billing/invoices/
List all invoices.

**Response:**
```json
{
  "count": 45,
  "results": [
    {
      "id": 1,
      "invoice_number": "INV-2024-001",
      "patient": {
        "id": 1,
        "full_name": "John Doe"
      },
      "appointment": 1,
      "total_amount": "150.00",
      "paid_amount": "150.00",
      "status": "paid",
      "issue_date": "2024-01-15",
      "due_date": "2024-02-15",
      "payment_date": "2024-01-16"
    }
  ]
}
```

### GET /billing/invoices/{id}/
Get invoice details.

## Dashboard & Statistics Endpoints

### GET /dashboard/stats/
Get dashboard statistics (role-based).

**Response for Admin:**
```json
{
  "total_users": 156,
  "total_patients": 89,
  "total_doctors": 12,
  "total_appointments": 234,
  "pending_appointments": 18,
  "total_revenue": 45670.50,
  "pending_invoices": 7,
  "today_appointments": 15,
  "system_health": {
    "status": "healthy",
    "uptime": "99.9%",
    "response_time": "120ms"
  }
}
```

**Response for Doctor:**
```json
{
  "today_appointments": 8,
  "upcoming_appointments": 12,
  "total_patients": 45,
  "completed_appointments_today": 3,
  "pending_appointments": 5,
  "next_appointment": {
    "id": 123,
    "patient_name": "John Doe",
    "time": "14:30:00",
    "type": "consultation"
  }
}
```

**Response for Patient:**
```json
{
  "upcoming_appointments": 2,
  "last_visit": "2024-01-15",
  "next_appointment": {
    "id": 124,
    "doctor_name": "Dr. Jane Smith",
    "date": "2024-01-25",
    "time": "10:30:00"
  },
  "pending_invoices": 1,
  "medical_records_count": 5
}
```

## Error Handling

### Standard Error Response
```json
{
  "detail": "Error message",
  "code": "error_code"
}
```

### Validation Error Response
```json
{
  "field_name": ["This field is required."],
  "another_field": ["Invalid value."]
}
```

## Status Codes

- `200` - OK
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## Rate Limiting

API requests are limited to:
- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users

## Pagination

List endpoints support pagination:

```json
{
  "count": 100,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    // Data array
  ]
}
```

Query parameters:
- `page` - Page number
- `page_size` - Items per page (max 100)

## Health Check

### GET /health/
System health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "message": "Hospital Management System API is running",
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00Z"
}
```
