# Database Schema

Hospital Management System database design and schema documentation.

## Database Technology
- **Primary**: PostgreSQL (Neon)
- **ORM**: Django ORM
- **Migrations**: Django migrations

## Core Models

### User Model
Custom user model with role-based access.

```python
class User(AbstractUser):
    email = EmailField(unique=True)
    role = CharField(choices=USER_ROLES)
    phone = CharField(max_length=15)
    is_active = BooleanField(default=True)
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)
```

**Roles:**
- `ADMIN` - System administrator
- `DOCTOR` - Medical doctor
- `PATIENT` - Patient
- `RECEPTIONIST` - Front desk staff

### Patient Model
Patient information and medical records.

```python
class Patient(Model):
    user = OneToOneField(User)
    date_of_birth = DateField()
    gender = CharField(choices=GENDER_CHOICES)
    blood_type = CharField(choices=BLOOD_TYPE_CHOICES)
    allergies = TextField(blank=True)
    emergency_contact = CharField(max_length=15)
    medical_history = TextField(blank=True)
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)
```

### Doctor Model
Doctor profiles and specializations.

```python
class Doctor(Model):
    user = OneToOneField(User)
    license_number = CharField(max_length=50, unique=True)
    specialization = CharField(max_length=100)
    department = ForeignKey(Department)
    consultation_fee = DecimalField(max_digits=10, decimal_places=2)
    experience_years = PositiveIntegerField()
    is_available = BooleanField(default=True)
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)
```

### Department Model
Hospital departments.

```python
class Department(Model):
    name = CharField(max_length=100, unique=True)
    description = TextField(blank=True)
    head_doctor = ForeignKey(Doctor, null=True, blank=True)
    created_at = DateTimeField(auto_now_add=True)
```

### Appointment Model
Appointment scheduling and management.

```python
class Appointment(Model):
    patient = ForeignKey(Patient)
    doctor = ForeignKey(Doctor)
    appointment_date = DateTimeField()
    duration = DurationField(default=timedelta(minutes=30))
    status = CharField(choices=APPOINTMENT_STATUS_CHOICES)
    reason = TextField()
    notes = TextField(blank=True)
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)
```

**Appointment Status:**
- `SCHEDULED` - Appointment scheduled
- `CONFIRMED` - Appointment confirmed
- `IN_PROGRESS` - Appointment in progress
- `COMPLETED` - Appointment completed
- `CANCELLED` - Appointment cancelled
- `NO_SHOW` - Patient didn't show up

### Medical Record Model
Patient medical records and treatment history.

```python
class MedicalRecord(Model):
    patient = ForeignKey(Patient)
    doctor = ForeignKey(Doctor)
    appointment = ForeignKey(Appointment, null=True)
    diagnosis = TextField()
    treatment = TextField()
    prescription = TextField(blank=True)
    notes = TextField(blank=True)
    created_at = DateTimeField(auto_now_add=True)
```

### Invoice Model
Billing and payment tracking.

```python
class Invoice(Model):
    patient = ForeignKey(Patient)
    appointment = ForeignKey(Appointment, null=True)
    amount = DecimalField(max_digits=10, decimal_places=2)
    tax_amount = DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = DecimalField(max_digits=10, decimal_places=2)
    status = CharField(choices=INVOICE_STATUS_CHOICES)
    due_date = DateField()
    paid_date = DateField(null=True, blank=True)
    created_at = DateTimeField(auto_now_add=True)
```

**Invoice Status:**
- `PENDING` - Payment pending
- `PAID` - Payment completed
- `OVERDUE` - Payment overdue
- `CANCELLED` - Invoice cancelled

## Relationships

### One-to-One
- User ↔ Patient
- User ↔ Doctor

### One-to-Many
- Department → Doctor
- Doctor → Appointment
- Patient → Appointment
- Patient → MedicalRecord
- Doctor → MedicalRecord
- Patient → Invoice

### Many-to-Many
- Doctor ↔ Patient (through appointments)

## Indexes

Key database indexes for performance:
- User email (unique)
- Doctor license_number (unique)
- Appointment date + doctor
- Patient user_id
- Invoice status + due_date

## Constraints

- Email uniqueness across users
- Doctor license number uniqueness
- Appointment time conflicts prevention
- Patient age validation
- Invoice amount validation
