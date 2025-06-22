# Database Migration & Backup Guide
## Hospital Management System - 2025 Data Management Standards

This document provides comprehensive guidance for database migrations, backups, and data management for the Hospital Management System.

## 🗄️ Database Architecture

The system uses PostgreSQL 15 with the following key features:

### Database Structure
- **Primary Database**: PostgreSQL 15 with ACID compliance
- **Connection Pooling**: PgBouncer for connection management
- **Replication**: Master-slave setup for high availability
- **Backup Strategy**: Automated daily backups with point-in-time recovery
- **Monitoring**: Real-time performance monitoring and alerting

### Key Tables
- **Users & Authentication**: Custom user model with role-based access
- **Patient Management**: Patient profiles, medical records, allergies
- **Doctor Management**: Doctor profiles, specializations, availability
- **Appointments**: Scheduling system with time slots and status tracking
- **Billing**: Invoice generation, payment tracking, insurance claims
- **Audit Trail**: Complete audit log for compliance requirements

## 🚀 Quick Start

### Database Manager Script

The unified database manager provides easy access to all database operations:

```bash
# Show database status
./scripts/database/db-manager.sh status

# Run migrations
./scripts/database/db-manager.sh migrate

# Create backup
./scripts/database/db-manager.sh backup full --compress --upload

# Restore from backup
./scripts/database/db-manager.sh restore backup_20250622_120000.sql

# Open database shell
./scripts/database/db-manager.sh shell
```

## 📁 Database Scripts Structure

```
scripts/database/
├── db-manager.sh           # Unified database management interface
├── migrate.sh              # Database migration with rollback support
├── backup.sh               # Comprehensive backup solution
└── restore.sh              # Safe restore with validation
```

## 🔄 Database Migrations

### Migration Management

#### Running Migrations

```bash
# Check pending migrations
./scripts/database/db-manager.sh migrate --dry-run

# Run all pending migrations
./scripts/database/db-manager.sh migrate

# Run migrations in production (with backup)
./scripts/database/db-manager.sh migrate --environment production --backup-before

# Force migration (skip safety checks)
./scripts/database/db-manager.sh migrate --force
```

#### Migration Rollback

```bash
# Rollback to specific migration
./scripts/database/db-manager.sh rollback 0001_initial

# Rollback with backup
./scripts/database/migrate.sh --rollback 0001_initial --backup-before
```

#### Migration Safety Features

1. **Pre-migration Backup**: Automatic backup before migrations
2. **Conflict Detection**: Identifies migration conflicts
3. **Safety Validation**: Checks for dangerous operations
4. **Rollback Support**: Safe rollback to previous state
5. **Production Protection**: Extra safety checks for production

### Migration Best Practices

#### Safe Migration Patterns

```python
# ✅ Safe: Adding new columns with defaults
class Migration(migrations.Migration):
    operations = [
        migrations.AddField(
            model_name='patient',
            name='emergency_contact',
            field=models.CharField(max_length=100, default=''),
        ),
    ]

# ✅ Safe: Creating new tables
class Migration(migrations.Migration):
    operations = [
        migrations.CreateModel(
            name='MedicalHistory',
            fields=[
                ('id', models.BigAutoField(primary_key=True)),
                ('condition', models.CharField(max_length=200)),
                ('diagnosed_date', models.DateField()),
            ],
        ),
    ]

# ⚠️ Potentially dangerous: Dropping columns
class Migration(migrations.Migration):
    operations = [
        migrations.RemoveField(
            model_name='patient',
            name='old_field',  # Data loss risk
        ),
    ]
```

#### Migration Workflow

1. **Development**
   ```bash
   # Create migration
   python manage.py makemigrations
   
   # Review migration file
   cat apps/*/migrations/0001_*.py
   
   # Test migration
   ./scripts/database/db-manager.sh migrate --dry-run
   
   # Apply migration
   ./scripts/database/db-manager.sh migrate
   ```

2. **Staging**
   ```bash
   # Deploy to staging
   ./scripts/database/db-manager.sh migrate --environment staging
   
   # Validate data integrity
   ./scripts/database/db-manager.sh check
   ```

3. **Production**
   ```bash
   # Create backup
   ./scripts/database/db-manager.sh backup full --compress --encrypt
   
   # Run migration with monitoring
   ./scripts/database/db-manager.sh migrate --environment production
   
   # Validate deployment
   ./scripts/database/db-manager.sh check
   ```

## 💾 Backup Strategy

### Backup Types

#### Full Backup
```bash
# Complete database backup
./scripts/database/db-manager.sh backup full

# With compression and encryption
./scripts/database/backup.sh --type full --compress --encrypt --upload
```

#### Incremental Backup
```bash
# Changes since last backup
./scripts/database/db-manager.sh backup incremental

# Automated incremental backups
./scripts/database/backup.sh --type incremental --compress --upload
```

#### Schema-Only Backup
```bash
# Database structure only
./scripts/database/db-manager.sh backup schema-only

# For development environment setup
./scripts/database/backup.sh --type schema-only
```

#### Data-Only Backup
```bash
# Data without structure
./scripts/database/db-manager.sh backup data-only

# For data migration
./scripts/database/backup.sh --type data-only --compress
```

### Backup Features

1. **Compression**: GZip compression for space efficiency
2. **Encryption**: GPG encryption for security
3. **Cloud Upload**: Automatic upload to AWS S3
4. **Retention Management**: Automatic cleanup of old backups
5. **Integrity Validation**: Backup file validation
6. **Monitoring**: Backup success/failure notifications

### Backup Schedule

| Environment | Frequency | Type | Retention |
|-------------|-----------|------|-----------|
| Production | Daily 2 AM | Full | 30 days |
| Production | Every 4 hours | Incremental | 7 days |
| Staging | Daily 3 AM | Full | 14 days |
| Development | Weekly | Full | 7 days |

### Automated Backup Configuration

```bash
# Crontab entry for production
0 2 * * * /path/to/scripts/database/backup.sh --type full --compress --encrypt --upload
0 */4 * * * /path/to/scripts/database/backup.sh --type incremental --compress --upload

# Environment variables for automation
export BACKUP_ENCRYPTION_PASSPHRASE="your-secure-passphrase"
export AWS_BACKUP_BUCKET="hospital-management-backups"
export RETENTION_DAYS=30
```

## 🔄 Restore Operations

### Restore Process

#### Basic Restore
```bash
# Restore from local backup
./scripts/database/db-manager.sh restore backup_20250622_120000.sql

# Restore with force (skip confirmations)
./scripts/database/restore.sh backup.sql --force
```

#### Advanced Restore
```bash
# Restore encrypted backup
./scripts/database/restore.sh backup.sql.gpg --decrypt

# Restore from cloud storage
./scripts/database/restore.sh s3://bucket/backup.sql --download-from-cloud

# Restore without pre-restore backup
./scripts/database/restore.sh backup.sql --no-backup
```

### Restore Safety Features

1. **Pre-restore Backup**: Automatic backup before restore
2. **Validation**: Post-restore data integrity checks
3. **Service Management**: Automatic service stop/start
4. **Rollback Support**: Restore from pre-restore backup if needed
5. **Environment Protection**: Extra confirmations for production

### Point-in-Time Recovery

```bash
# Restore to specific timestamp
pg_restore --target-time="2025-06-22 12:00:00" backup.sql

# Using WAL files for precise recovery
pg_ctl start -D /data/postgres -o "-c recovery_target_time='2025-06-22 12:00:00'"
```

## 🔍 Database Monitoring

### Performance Monitoring

```bash
# Real-time monitoring
./scripts/database/db-manager.sh monitor

# Database size information
./scripts/database/db-manager.sh size

# Check database integrity
./scripts/database/db-manager.sh check
```

### Key Metrics

1. **Connection Count**: Active database connections
2. **Query Performance**: Slow query identification
3. **Table Statistics**: Insert/update/delete counts
4. **Index Usage**: Index efficiency analysis
5. **Lock Monitoring**: Blocking query detection
6. **Disk Usage**: Database and table sizes

### Automated Monitoring

```sql
-- Slow query monitoring
SELECT 
    query,
    mean_time,
    calls,
    total_time
FROM pg_stat_statements 
WHERE mean_time > 1000 
ORDER BY mean_time DESC;

-- Connection monitoring
SELECT 
    count(*) as active_connections,
    state
FROM pg_stat_activity 
GROUP BY state;

-- Table bloat monitoring
SELECT 
    schemaname,
    tablename,
    n_dead_tup,
    n_live_tup,
    round(n_dead_tup::float / n_live_tup::float * 100, 2) as bloat_ratio
FROM pg_stat_user_tables
WHERE n_live_tup > 0
ORDER BY bloat_ratio DESC;
```

## 🛠️ Database Maintenance

### Regular Maintenance Tasks

#### Daily Tasks
```bash
# Vacuum and analyze
./scripts/database/db-manager.sh vacuum

# Check database integrity
./scripts/database/db-manager.sh check

# Monitor performance
./scripts/database/db-manager.sh monitor
```

#### Weekly Tasks
```bash
# Full backup
./scripts/database/db-manager.sh backup full --compress --encrypt

# Clean up old data
./scripts/database/db-manager.sh cleanup

# Update table statistics
./scripts/database/db-manager.sh vacuum
```

#### Monthly Tasks
```bash
# Reindex tables
REINDEX DATABASE hospital_management;

# Update PostgreSQL statistics
ANALYZE;

# Review and optimize queries
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
```

### Database Optimization

#### Index Optimization
```sql
-- Find missing indexes
SELECT 
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch
FROM pg_stat_user_tables
WHERE seq_scan > idx_scan
ORDER BY seq_tup_read DESC;

-- Create optimal indexes
CREATE INDEX CONCURRENTLY idx_appointments_date_doctor 
ON appointments_appointment(appointment_date, doctor_id);

CREATE INDEX CONCURRENTLY idx_patients_search 
ON accounts_patient USING gin(to_tsvector('english', first_name || ' ' || last_name));
```

#### Query Optimization
```sql
-- Analyze query performance
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM appointments_appointment 
WHERE appointment_date = '2025-06-22' 
AND doctor_id = 1;

-- Optimize with proper indexes
CREATE INDEX idx_appointments_date_doctor 
ON appointments_appointment(appointment_date, doctor_id);
```

## 🔒 Security & Compliance

### Data Protection

1. **Encryption at Rest**: Database files encrypted
2. **Encryption in Transit**: SSL/TLS connections
3. **Access Control**: Role-based database permissions
4. **Audit Logging**: Complete audit trail
5. **Backup Encryption**: Encrypted backup files

### HIPAA Compliance

```sql
-- Audit trail for patient data access
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    action VARCHAR(50),
    table_name VARCHAR(50),
    record_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    timestamp TIMESTAMP DEFAULT NOW(),
    ip_address INET
);

-- Trigger for automatic audit logging
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (
        user_id, action, table_name, record_id, 
        old_values, new_values, ip_address
    ) VALUES (
        current_setting('app.user_id')::INTEGER,
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
        inet_client_addr()
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

### Data Retention

```sql
-- Automatic data cleanup for compliance
DELETE FROM audit_log 
WHERE timestamp < NOW() - INTERVAL '7 years';

-- Archive old appointment data
INSERT INTO appointments_archive 
SELECT * FROM appointments_appointment 
WHERE appointment_date < NOW() - INTERVAL '2 years';

DELETE FROM appointments_appointment 
WHERE appointment_date < NOW() - INTERVAL '2 years';
```

## 🚨 Disaster Recovery

### Recovery Procedures

#### Database Corruption
1. Stop application services
2. Assess corruption extent
3. Restore from latest backup
4. Apply WAL files for point-in-time recovery
5. Validate data integrity
6. Restart services

#### Hardware Failure
1. Activate standby server
2. Update DNS/load balancer
3. Restore from backup if needed
4. Monitor performance
5. Plan hardware replacement

#### Data Center Outage
1. Activate disaster recovery site
2. Restore from cloud backups
3. Update application configuration
4. Validate all systems
5. Communicate with stakeholders

### Recovery Time Objectives

| Scenario | RTO | RPO |
|----------|-----|-----|
| Database Corruption | 2 hours | 15 minutes |
| Hardware Failure | 1 hour | 5 minutes |
| Data Center Outage | 4 hours | 1 hour |

---

## 📋 Database Management Checklist

### Daily Operations
- [ ] Check backup completion
- [ ] Monitor database performance
- [ ] Review error logs
- [ ] Validate replication status
- [ ] Check disk space usage

### Weekly Operations
- [ ] Run full backup
- [ ] Analyze slow queries
- [ ] Update table statistics
- [ ] Review security logs
- [ ] Test restore procedures

### Monthly Operations
- [ ] Performance tuning review
- [ ] Index optimization
- [ ] Capacity planning
- [ ] Security audit
- [ ] Disaster recovery test

---

*This database management system ensures reliable, secure, and compliant data operations for the Hospital Management System following 2025 best practices.*
