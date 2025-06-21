# Database Setup Guide

Hospital Management System database configuration using Neon PostgreSQL.

## 🐘 Neon PostgreSQL Setup

Neon is a serverless PostgreSQL platform that provides automatic scaling, branching, and managed infrastructure.

### 1. Create Neon Account

1. Visit [Neon Console](https://console.neon.tech/)
2. Sign up for a free account
3. Create a new project named "Hospital Management System"

### 2. Get Database Connection Details

After creating your project, you'll get:
- **Host**: `ep-xxx-xxx.region.neon.tech`
- **Database**: `neondb` (default)
- **Username**: Your username
- **Password**: Generated password
- **Port**: `5432`

### 3. Connection String Format

```
postgresql://username:password@ep-xxx-xxx.region.neon.tech/neondb?sslmode=require
```

### 4. Environment Configuration

Update your backend `.env` file:

```bash
# Neon PostgreSQL Configuration
DATABASE_URL=postgresql://username:password@ep-xxx-xxx.region.neon.tech/neondb?sslmode=require

# Alternative individual settings
DB_HOST=ep-xxx-xxx.region.neon.tech
DB_NAME=neondb
DB_USER=username
DB_PASSWORD=password
DB_PORT=5432
```

## 🔧 Local Development Alternative

For local development, you can also use a local PostgreSQL instance:

### Using Docker

```bash
# Start PostgreSQL container
docker run --name hospital-postgres \
  -e POSTGRES_DB=hospital_db \
  -e POSTGRES_USER=hospital_user \
  -e POSTGRES_PASSWORD=hospital_pass \
  -p 5432:5432 \
  -d postgres:15

# Connection string for local development
DATABASE_URL=postgresql://hospital_user:hospital_pass@localhost:5432/hospital_db
```

### Using Local Installation

1. Install PostgreSQL 15+
2. Create database and user:

```sql
CREATE DATABASE hospital_db;
CREATE USER hospital_user WITH PASSWORD 'hospital_pass';
GRANT ALL PRIVILEGES ON DATABASE hospital_db TO hospital_user;
```

## 🚀 Database Migration

After configuring the database connection:

```bash
cd backend

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Load sample data (optional)
python manage.py loaddata fixtures/sample_data.json
```

## 📊 Database Schema

The system uses the following main tables:

### Core Tables
- `auth_user` - Django's built-in user model
- `users_profile` - Extended user profiles
- `patients_patient` - Patient information
- `doctors_doctor` - Doctor profiles
- `departments_department` - Hospital departments

### Operational Tables
- `appointments_appointment` - Appointment scheduling
- `medical_records_record` - Patient medical records
- `billing_invoice` - Billing and invoicing
- `notifications_notification` - System notifications

## 🔒 Security Considerations

### Connection Security
- Always use SSL connections (`sslmode=require`)
- Use strong passwords
- Rotate credentials regularly
- Limit database access by IP if possible

### Data Protection
- Enable row-level security where appropriate
- Regular backups (Neon provides automatic backups)
- Monitor database access logs
- Implement proper user permissions

## 📈 Performance Optimization

### Indexing Strategy
```sql
-- Indexes for common queries
CREATE INDEX idx_appointments_date_doctor ON appointments_appointment(appointment_date, doctor_id);
CREATE INDEX idx_patients_user ON patients_patient(user_id);
CREATE INDEX idx_medical_records_patient ON medical_records_record(patient_id);
CREATE INDEX idx_invoices_status_date ON billing_invoice(status, created_at);
```

### Query Optimization
- Use Django ORM efficiently
- Implement proper pagination
- Use select_related() and prefetch_related()
- Monitor slow queries

## 🔄 Backup and Recovery

### Neon Automatic Backups
- Point-in-time recovery available
- Automatic daily backups
- Branch-based development workflows

### Manual Backup
```bash
# Export database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Import database
psql $DATABASE_URL < backup_20231201.sql
```

## 🌍 Environment-Specific Configuration

### Development
```bash
DATABASE_URL=postgresql://hospital_user:hospital_pass@localhost:5432/hospital_db
DEBUG=True
```

### Staging
```bash
DATABASE_URL=postgresql://username:password@staging-host.neon.tech/hospital_staging?sslmode=require
DEBUG=False
```

### Production
```bash
DATABASE_URL=postgresql://username:password@production-host.neon.tech/hospital_prod?sslmode=require
DEBUG=False
SECURE_SSL_REDIRECT=True
```

## 🔍 Monitoring and Maintenance

### Health Checks
- Monitor connection pool usage
- Track query performance
- Set up alerts for connection failures
- Monitor disk usage (for local instances)

### Regular Maintenance
- Update statistics regularly
- Monitor and optimize slow queries
- Review and update indexes
- Clean up old data as needed

## 🆘 Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check firewall settings
   - Verify host and port
   - Ensure database is running

2. **Authentication Failed**
   - Verify username and password
   - Check user permissions
   - Ensure SSL configuration

3. **SSL Connection Issues**
   - Add `?sslmode=require` to connection string
   - Check SSL certificate validity

4. **Performance Issues**
   - Review query patterns
   - Check index usage
   - Monitor connection pool

### Debug Commands
```bash
# Test database connection
python manage.py dbshell

# Check migration status
python manage.py showmigrations

# Create migration for changes
python manage.py makemigrations

# Apply migrations
python manage.py migrate
```
