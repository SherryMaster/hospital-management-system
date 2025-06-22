"""
Prometheus Metrics Middleware for Hospital Management System

This middleware collects custom application metrics for monitoring
and observability purposes.
"""

import time
import logging
from typing import Callable, Any
from django.http import HttpRequest, HttpResponse
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings
from prometheus_client import Counter, Histogram, Gauge, CollectorRegistry, generate_latest
import redis
from django.db import connection

# Create a custom registry for hospital metrics
hospital_registry = CollectorRegistry()

# HTTP Request Metrics
http_requests_total = Counter(
    'django_http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status', 'user_type'],
    registry=hospital_registry
)

http_request_duration = Histogram(
    'django_http_requests_latency_seconds',
    'HTTP request latency',
    ['method', 'endpoint', 'status'],
    buckets=[0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0],
    registry=hospital_registry
)

# Database Metrics
db_connections_active = Gauge(
    'django_db_connections_active',
    'Active database connections',
    registry=hospital_registry
)

db_query_duration = Histogram(
    'django_db_query_duration_seconds',
    'Database query duration',
    ['query_type'],
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5],
    registry=hospital_registry
)

# Business Logic Metrics
active_users = Gauge(
    'hospital_active_users_total',
    'Number of active users',
    ['user_type'],
    registry=hospital_registry
)

appointments_today = Gauge(
    'hospital_appointments_today_total',
    'Number of appointments today',
    ['status'],
    registry=hospital_registry
)

appointment_booking_attempts = Counter(
    'hospital_appointment_booking_attempts_total',
    'Total appointment booking attempts',
    ['status', 'user_type'],
    registry=hospital_registry
)

appointment_booking_failures = Counter(
    'hospital_appointment_booking_failures_total',
    'Failed appointment booking attempts',
    ['reason'],
    registry=hospital_registry
)

patient_satisfaction_score = Gauge(
    'hospital_patient_satisfaction_score',
    'Average patient satisfaction score',
    registry=hospital_registry
)

average_wait_time = Gauge(
    'hospital_average_wait_time_minutes',
    'Average patient wait time in minutes',
    registry=hospital_registry
)

revenue_today = Gauge(
    'hospital_revenue_today_total',
    'Total revenue today',
    ['payment_method'],
    registry=hospital_registry
)

# Security Metrics
failed_login_attempts = Counter(
    'hospital_failed_login_attempts_total',
    'Failed login attempts',
    ['ip_address', 'user_agent'],
    registry=hospital_registry
)

suspicious_requests = Counter(
    'hospital_suspicious_requests_total',
    'Suspicious requests detected',
    ['type', 'ip_address'],
    registry=hospital_registry
)

data_export_requests = Counter(
    'hospital_data_export_requests_total',
    'Data export requests',
    ['user_type', 'data_type'],
    registry=hospital_registry
)

# System Metrics
cache_hit_rate = Gauge(
    'hospital_cache_hit_rate',
    'Cache hit rate percentage',
    registry=hospital_registry
)

celery_queue_length = Gauge(
    'hospital_celery_queue_length',
    'Number of tasks in Celery queue',
    ['queue_name'],
    registry=hospital_registry
)

# Error Metrics
application_errors = Counter(
    'hospital_application_errors_total',
    'Application errors',
    ['error_type', 'endpoint'],
    registry=hospital_registry
)

logger = logging.getLogger(__name__)


class PrometheusMetricsMiddleware(MiddlewareMixin):
    """
    Middleware to collect Prometheus metrics for HTTP requests.
    """
    
    def process_request(self, request: HttpRequest) -> None:
        """Process incoming request and start timing."""
        request._prometheus_start_time = time.time()
        
        # Update active database connections
        self._update_db_connections()
        
        # Update cache metrics
        self._update_cache_metrics()
        
        # Update business metrics periodically
        if hasattr(request, 'user') and request.user.is_authenticated:
            self._update_business_metrics()
    
    def process_response(self, request: HttpRequest, response: HttpResponse) -> HttpResponse:
        """Process response and record metrics."""
        if hasattr(request, '_prometheus_start_time'):
            # Calculate request duration
            duration = time.time() - request._prometheus_start_time
            
            # Get request details
            method = request.method
            endpoint = self._get_endpoint_name(request)
            status = str(response.status_code)
            user_type = self._get_user_type(request)
            
            # Record metrics
            http_requests_total.labels(
                method=method,
                endpoint=endpoint,
                status=status,
                user_type=user_type
            ).inc()
            
            http_request_duration.labels(
                method=method,
                endpoint=endpoint,
                status=status
            ).observe(duration)
            
            # Log slow requests
            if duration > 2.0:
                logger.warning(
                    f"Slow request: {method} {endpoint} took {duration:.2f}s",
                    extra={
                        'method': method,
                        'endpoint': endpoint,
                        'duration': duration,
                        'user_type': user_type
                    }
                )
        
        return response
    
    def process_exception(self, request: HttpRequest, exception: Exception) -> None:
        """Process exceptions and record error metrics."""
        endpoint = self._get_endpoint_name(request)
        error_type = exception.__class__.__name__
        
        application_errors.labels(
            error_type=error_type,
            endpoint=endpoint
        ).inc()
        
        logger.error(
            f"Application error: {error_type} in {endpoint}",
            exc_info=True,
            extra={
                'endpoint': endpoint,
                'error_type': error_type
            }
        )
    
    def _get_endpoint_name(self, request: HttpRequest) -> str:
        """Extract endpoint name from request."""
        try:
            # Get URL pattern name
            if hasattr(request, 'resolver_match') and request.resolver_match:
                return request.resolver_match.url_name or request.resolver_match.view_name
            
            # Fallback to path with parameters normalized
            path = request.path
            
            # Normalize common patterns
            import re
            path = re.sub(r'/\d+/', '/{id}/', path)
            path = re.sub(r'/[a-f0-9-]{36}/', '/{uuid}/', path)
            
            return path
        except Exception:
            return 'unknown'
    
    def _get_user_type(self, request: HttpRequest) -> str:
        """Get user type for metrics."""
        try:
            if hasattr(request, 'user') and request.user.is_authenticated:
                if hasattr(request.user, 'role'):
                    return request.user.role
                elif request.user.is_staff:
                    return 'staff'
                elif request.user.is_superuser:
                    return 'admin'
                else:
                    return 'patient'
            return 'anonymous'
        except Exception:
            return 'unknown'
    
    def _update_db_connections(self) -> None:
        """Update database connection metrics."""
        try:
            # Get active connections count
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT count(*) FROM pg_stat_activity WHERE state = 'active'"
                )
                active_count = cursor.fetchone()[0]
                db_connections_active.set(active_count)
        except Exception as e:
            logger.error(f"Failed to update DB connection metrics: {e}")
    
    def _update_cache_metrics(self) -> None:
        """Update cache hit rate metrics."""
        try:
            if hasattr(settings, 'CACHES') and 'default' in settings.CACHES:
                # Connect to Redis and get stats
                redis_client = redis.Redis.from_url(settings.CACHES['default']['LOCATION'])
                info = redis_client.info()
                
                hits = info.get('keyspace_hits', 0)
                misses = info.get('keyspace_misses', 0)
                total = hits + misses
                
                if total > 0:
                    hit_rate = (hits / total) * 100
                    cache_hit_rate.set(hit_rate)
        except Exception as e:
            logger.error(f"Failed to update cache metrics: {e}")
    
    def _update_business_metrics(self) -> None:
        """Update business logic metrics."""
        try:
            from django.contrib.auth import get_user_model
            from accounts.models import Patient, Doctor
            from appointments.models import Appointment
            from django.utils import timezone
            from datetime import date
            
            User = get_user_model()
            
            # Update active users
            active_patients = User.objects.filter(
                is_active=True,
                last_login__gte=timezone.now() - timezone.timedelta(days=30)
            ).count()
            active_users.labels(user_type='patient').set(active_patients)
            
            # Update today's appointments
            today = date.today()
            appointments_today_count = Appointment.objects.filter(
                appointment_date=today
            ).count()
            appointments_today.labels(status='total').set(appointments_today_count)
            
            completed_appointments = Appointment.objects.filter(
                appointment_date=today,
                status='completed'
            ).count()
            appointments_today.labels(status='completed').set(completed_appointments)
            
            # Update average wait time (mock calculation)
            # In real implementation, this would be calculated from actual wait times
            import random
            avg_wait = random.uniform(15, 45)  # Mock data
            average_wait_time.set(avg_wait)
            
            # Update patient satisfaction (mock data)
            satisfaction = random.uniform(4.0, 5.0)  # Mock data
            patient_satisfaction_score.set(satisfaction)
            
        except Exception as e:
            logger.error(f"Failed to update business metrics: {e}")


def metrics_view(request: HttpRequest) -> HttpResponse:
    """
    Django view to expose Prometheus metrics.
    """
    metrics_data = generate_latest(hospital_registry)
    return HttpResponse(
        metrics_data,
        content_type='text/plain; charset=utf-8'
    )


class SecurityMetricsMiddleware(MiddlewareMixin):
    """
    Middleware to collect security-related metrics.
    """
    
    def process_request(self, request: HttpRequest) -> None:
        """Process request for security metrics."""
        # Detect suspicious patterns
        self._check_suspicious_activity(request)
    
    def _check_suspicious_activity(self, request: HttpRequest) -> None:
        """Check for suspicious activity patterns."""
        try:
            user_agent = request.META.get('HTTP_USER_AGENT', '')
            ip_address = self._get_client_ip(request)
            
            # Check for bot-like behavior
            suspicious_agents = [
                'bot', 'crawler', 'spider', 'scraper',
                'curl', 'wget', 'python-requests'
            ]
            
            if any(agent in user_agent.lower() for agent in suspicious_agents):
                suspicious_requests.labels(
                    type='bot_activity',
                    ip_address=ip_address
                ).inc()
            
            # Check for SQL injection attempts
            query_string = request.META.get('QUERY_STRING', '')
            if any(pattern in query_string.lower() for pattern in [
                'union select', 'drop table', 'insert into',
                'delete from', 'update set', '--', ';'
            ]):
                suspicious_requests.labels(
                    type='sql_injection',
                    ip_address=ip_address
                ).inc()
            
            # Check for XSS attempts
            if any(pattern in query_string.lower() for pattern in [
                '<script', 'javascript:', 'onerror=', 'onload='
            ]):
                suspicious_requests.labels(
                    type='xss_attempt',
                    ip_address=ip_address
                ).inc()
                
        except Exception as e:
            logger.error(f"Failed to check suspicious activity: {e}")
    
    def _get_client_ip(self, request: HttpRequest) -> str:
        """Get client IP address."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip or 'unknown'


# Custom metric collection functions
def record_appointment_booking(status: str, user_type: str, reason: str = None) -> None:
    """Record appointment booking metrics."""
    appointment_booking_attempts.labels(
        status=status,
        user_type=user_type
    ).inc()
    
    if status == 'failed' and reason:
        appointment_booking_failures.labels(reason=reason).inc()


def record_failed_login(ip_address: str, user_agent: str) -> None:
    """Record failed login attempt."""
    failed_login_attempts.labels(
        ip_address=ip_address,
        user_agent=user_agent[:100]  # Truncate long user agents
    ).inc()


def record_data_export(user_type: str, data_type: str) -> None:
    """Record data export request."""
    data_export_requests.labels(
        user_type=user_type,
        data_type=data_type
    ).inc()


def update_celery_queue_metrics() -> None:
    """Update Celery queue length metrics."""
    try:
        from celery import current_app
        
        # Get queue lengths
        inspect = current_app.control.inspect()
        active_queues = inspect.active_queues()
        
        if active_queues:
            for worker, queues in active_queues.items():
                for queue_info in queues:
                    queue_name = queue_info['name']
                    # This is a simplified example
                    # In practice, you'd need to get actual queue lengths
                    celery_queue_length.labels(queue_name=queue_name).set(0)
                    
    except Exception as e:
        logger.error(f"Failed to update Celery metrics: {e}")
