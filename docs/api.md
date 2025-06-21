# API Documentation

Hospital Management System REST API documentation.

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

## Endpoints Overview

### Authentication
- `POST /auth/login/` - User login
- `POST /auth/logout/` - User logout
- `POST /auth/refresh/` - Refresh JWT token
- `POST /auth/register/` - User registration

### Users
- `GET /users/` - List users
- `GET /users/{id}/` - Get user details
- `PUT /users/{id}/` - Update user
- `DELETE /users/{id}/` - Delete user

### Patients
- `GET /patients/` - List patients
- `POST /patients/` - Create patient
- `GET /patients/{id}/` - Get patient details
- `PUT /patients/{id}/` - Update patient
- `DELETE /patients/{id}/` - Delete patient

### Doctors
- `GET /doctors/` - List doctors
- `POST /doctors/` - Create doctor
- `GET /doctors/{id}/` - Get doctor details
- `PUT /doctors/{id}/` - Update doctor
- `GET /doctors/{id}/availability/` - Get doctor availability

### Appointments
- `GET /appointments/` - List appointments
- `POST /appointments/` - Create appointment
- `GET /appointments/{id}/` - Get appointment details
- `PUT /appointments/{id}/` - Update appointment
- `DELETE /appointments/{id}/` - Cancel appointment

### Billing
- `GET /billing/invoices/` - List invoices
- `POST /billing/invoices/` - Create invoice
- `GET /billing/invoices/{id}/` - Get invoice details
- `PUT /billing/invoices/{id}/` - Update invoice

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {}
  }
}
```

## Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
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
