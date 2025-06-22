# Monitoring & Logging Guide
## Hospital Management System - 2025 Observability Standards

This document provides comprehensive guidance for monitoring, logging, and observability for the Hospital Management System.

## 📊 Monitoring Architecture

The monitoring stack follows the three pillars of observability:

### 🔍 **Metrics** (Prometheus + Grafana)
- **Application Metrics**: Request rates, response times, error rates
- **Infrastructure Metrics**: CPU, memory, disk, network usage
- **Business Metrics**: Appointments, revenue, patient satisfaction
- **Custom Metrics**: Hospital-specific KPIs and SLAs

### 📝 **Logs** (ELK Stack + Loki)
- **Application Logs**: Django, Celery, custom application logs
- **Infrastructure Logs**: Nginx, PostgreSQL, Redis logs
- **Security Logs**: Authentication, authorization, audit trails
- **System Logs**: Operating system and container logs

### 🔗 **Traces** (Jaeger)
- **Distributed Tracing**: Request flow across services
- **Performance Analysis**: Bottleneck identification
- **Error Tracking**: Exception propagation analysis
- **Dependency Mapping**: Service interaction visualization

## 🚀 Quick Start

### Starting the Monitoring Stack

```bash
# Start monitoring services
docker-compose -f docker-compose.monitoring.yml up -d

# Verify services are running
docker-compose -f docker-compose.monitoring.yml ps

# Access monitoring interfaces
echo "Prometheus: http://localhost:9090"
echo "Grafana: http://localhost:3001 (admin/admin123)"
echo "Kibana: http://localhost:5601"
echo "Jaeger: http://localhost:16686"
```

### Monitoring Endpoints

| Service | URL | Purpose |
|---------|-----|---------|
| Prometheus | http://localhost:9090 | Metrics collection and querying |
| Grafana | http://localhost:3001 | Metrics visualization and dashboards |
| Alertmanager | http://localhost:9093 | Alert management and routing |
| Kibana | http://localhost:5601 | Log analysis and visualization |
| Jaeger | http://localhost:16686 | Distributed tracing |
| Elasticsearch | http://localhost:9200 | Log storage and search |

## 📈 Metrics Collection

### Application Metrics

The Hospital Management System exposes custom metrics via Prometheus:

```python
# Custom metrics endpoint
GET /metrics

# Example metrics
hospital_active_users_total{user_type="patient"} 1250
hospital_appointments_today_total{status="completed"} 45
hospital_average_wait_time_minutes 23.5
hospital_patient_satisfaction_score 4.2
```

### Key Performance Indicators (KPIs)

#### System Health
- **Uptime**: > 99.9%
- **Response Time**: < 200ms (95th percentile)
- **Error Rate**: < 0.1%
- **Database Connections**: < 80% of max

#### Business Metrics
- **Daily Appointments**: Target vs. Actual
- **Patient Satisfaction**: > 4.0/5.0
- **Average Wait Time**: < 30 minutes
- **Revenue per Day**: Trending analysis

#### Security Metrics
- **Failed Login Attempts**: < 10/minute
- **Suspicious Activity**: Real-time detection
- **Data Export Requests**: Audit trail
- **SSL Certificate Expiry**: 30-day warning

### Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'hospital-backend'
    static_configs:
      - targets: ['backend:8000']
    scrape_interval: 15s
    metrics_path: /metrics

  - job_name: 'postgresql'
    static_configs:
      - targets: ['postgres_exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis_exporter:9121']
```

## 🚨 Alerting

### Alert Rules

Critical alerts are configured in Prometheus:

```yaml
# alert_rules.yml
groups:
  - name: hospital_critical
    rules:
      - alert: ApplicationDown
        expr: up{job="hospital-backend"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Hospital Management Backend is down"

      - alert: HighErrorRate
        expr: rate(django_http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 3m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
```

### Alert Channels

Alerts are routed through Alertmanager to:

- **Slack**: Real-time notifications for development team
- **Email**: Critical alerts for on-call engineers
- **PagerDuty**: Escalation for unresolved critical issues
- **SMS**: Emergency notifications for system outages

### Alert Severity Levels

| Severity | Response Time | Examples |
|----------|---------------|----------|
| Critical | Immediate | System down, data loss |
| Warning | 15 minutes | High resource usage, slow queries |
| Info | 1 hour | Deployment notifications, capacity alerts |

## 📝 Logging Strategy

### Log Levels and Categories

```python
# Django logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'detailed': {
            'format': '{asctime} [{levelname}] {name}: {message}',
            'style': '{',
        },
        'json': {
            'format': '{"timestamp": "{asctime}", "level": "{levelname}", "logger": "{name}", "message": "{message}"}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/var/log/hospital/django.log',
            'maxBytes': 50 * 1024 * 1024,  # 50MB
            'backupCount': 10,
            'formatter': 'json',
        },
        'security': {
            'level': 'WARNING',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/var/log/hospital/security.log',
            'formatter': 'json',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'INFO',
            'propagate': True,
        },
        'django.security': {
            'handlers': ['security'],
            'level': 'WARNING',
            'propagate': False,
        },
        'hospital_management': {
            'handlers': ['file'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}
```

### Log Categories

#### Application Logs
- **Request/Response**: HTTP request details and responses
- **Business Logic**: Appointment bookings, patient registrations
- **Database**: Query performance and connection issues
- **Cache**: Redis operations and hit/miss rates

#### Security Logs
- **Authentication**: Login attempts, password changes
- **Authorization**: Permission checks, access denials
- **Audit Trail**: Data modifications, exports, deletions
- **Suspicious Activity**: Potential security threats

#### System Logs
- **Performance**: Slow queries, high resource usage
- **Errors**: Application exceptions and stack traces
- **Deployment**: Release deployments and rollbacks
- **Health Checks**: Service health and availability

### Log Aggregation

Logs are collected and processed through:

1. **Filebeat**: Ships logs from containers to Logstash
2. **Logstash**: Processes, enriches, and routes logs
3. **Elasticsearch**: Stores and indexes log data
4. **Kibana**: Provides log search and visualization

### Log Retention

| Log Type | Retention Period | Storage |
|----------|------------------|---------|
| Application | 90 days | Hot storage |
| Security | 7 years | Cold storage |
| Audit | 7 years | Compliance storage |
| Debug | 30 days | Hot storage |

## 🔍 Distributed Tracing

### Jaeger Integration

Distributed tracing is implemented using OpenTelemetry:

```python
# Django tracing setup
from opentelemetry import trace
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

# Configure tracing
trace.set_tracer_provider(TracerProvider())
tracer = trace.get_tracer(__name__)

jaeger_exporter = JaegerExporter(
    agent_host_name="jaeger",
    agent_port=14268,
)

span_processor = BatchSpanProcessor(jaeger_exporter)
trace.get_tracer_provider().add_span_processor(span_processor)

# Example: Tracing appointment booking
@tracer.start_as_current_span("book_appointment")
def book_appointment(patient_id, doctor_id, date):
    with tracer.start_as_current_span("validate_availability"):
        # Check doctor availability
        pass
    
    with tracer.start_as_current_span("create_appointment"):
        # Create appointment record
        pass
    
    with tracer.start_as_current_span("send_confirmation"):
        # Send confirmation email
        pass
```

### Trace Analysis

Jaeger provides insights into:

- **Request Flow**: Complete request journey across services
- **Performance Bottlenecks**: Slow operations identification
- **Error Propagation**: How errors spread through the system
- **Dependency Analysis**: Service interaction patterns

## 📊 Grafana Dashboards

### Pre-built Dashboards

1. **System Overview**
   - Service health status
   - Request rates and response times
   - Error rates and availability
   - Resource utilization

2. **Application Performance**
   - API endpoint performance
   - Database query performance
   - Cache hit rates
   - Background job processing

3. **Business Metrics**
   - Daily appointments and revenue
   - Patient satisfaction scores
   - Wait times and efficiency
   - User activity patterns

4. **Security Dashboard**
   - Failed login attempts
   - Suspicious activity detection
   - Data access patterns
   - Compliance metrics

### Custom Dashboard Creation

```json
{
  "dashboard": {
    "title": "Hospital Custom Dashboard",
    "panels": [
      {
        "title": "Appointment Bookings",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(hospital_appointment_booking_attempts_total[5m])",
            "legendFormat": "Booking Rate"
          }
        ]
      }
    ]
  }
}
```

## 🔧 Monitoring Best Practices

### Metric Design

1. **Use Labels Wisely**: Avoid high cardinality labels
2. **Consistent Naming**: Follow Prometheus naming conventions
3. **Meaningful Metrics**: Focus on actionable metrics
4. **Rate vs. Counter**: Use appropriate metric types

### Alert Design

1. **Symptom-based Alerts**: Alert on user-facing issues
2. **Avoid Alert Fatigue**: Tune thresholds carefully
3. **Actionable Alerts**: Include runbook links
4. **Escalation Policies**: Define clear escalation paths

### Log Management

1. **Structured Logging**: Use JSON format for machine parsing
2. **Correlation IDs**: Track requests across services
3. **Sensitive Data**: Never log passwords or PII
4. **Log Levels**: Use appropriate log levels

## 🚨 Incident Response

### Monitoring Runbooks

#### Backend Service Down

1. **Check Service Status**
   ```bash
   docker-compose ps backend
   kubectl get pods -l app=backend
   ```

2. **Review Recent Logs**
   ```bash
   docker-compose logs backend --tail=100
   kubectl logs -l app=backend --tail=100
   ```

3. **Check Resource Usage**
   ```bash
   # CPU and Memory
   docker stats backend
   kubectl top pods
   ```

4. **Restart Service**
   ```bash
   docker-compose restart backend
   kubectl rollout restart deployment/backend
   ```

#### High Error Rate

1. **Identify Error Sources**
   - Check Grafana error rate dashboard
   - Review application logs in Kibana
   - Analyze error patterns

2. **Check Recent Deployments**
   - Review deployment history
   - Compare error rates before/after deployment
   - Consider rollback if needed

3. **Database Issues**
   - Check database connection pool
   - Review slow query logs
   - Monitor database performance metrics

#### Performance Degradation

1. **Identify Bottlenecks**
   - Review response time metrics
   - Check database query performance
   - Analyze distributed traces in Jaeger

2. **Resource Analysis**
   - CPU and memory utilization
   - Database connection usage
   - Cache hit rates

3. **Scaling Actions**
   - Horizontal pod autoscaling
   - Database connection pool tuning
   - Cache optimization

## 📋 Monitoring Checklist

### Daily Operations
- [ ] Review overnight alerts and incidents
- [ ] Check system health dashboard
- [ ] Verify backup completion
- [ ] Monitor resource utilization trends
- [ ] Review security logs for anomalies

### Weekly Operations
- [ ] Analyze performance trends
- [ ] Review and tune alert thresholds
- [ ] Update monitoring documentation
- [ ] Test alert notification channels
- [ ] Capacity planning review

### Monthly Operations
- [ ] Monitoring system maintenance
- [ ] Log retention policy review
- [ ] Dashboard optimization
- [ ] Incident response training
- [ ] Monitoring tool updates

---

## 📋 Troubleshooting Guide

### Common Issues

#### Metrics Not Appearing

1. **Check Prometheus Targets**
   ```bash
   curl http://localhost:9090/api/v1/targets
   ```

2. **Verify Metrics Endpoint**
   ```bash
   curl http://backend:8000/metrics
   ```

3. **Check Network Connectivity**
   ```bash
   docker network ls
   docker network inspect monitoring_network
   ```

#### Logs Not Flowing

1. **Check Filebeat Status**
   ```bash
   docker-compose logs filebeat
   ```

2. **Verify Logstash Processing**
   ```bash
   curl http://localhost:9600/_node/stats
   ```

3. **Check Elasticsearch Health**
   ```bash
   curl http://localhost:9200/_cluster/health
   ```

#### High Resource Usage

1. **Elasticsearch Optimization**
   - Adjust heap size
   - Configure index lifecycle management
   - Optimize shard allocation

2. **Prometheus Optimization**
   - Reduce scrape intervals
   - Implement recording rules
   - Configure retention policies

---

*This monitoring and logging system provides comprehensive observability for the Hospital Management System, ensuring reliable operations and quick incident resolution following 2025 best practices.*
