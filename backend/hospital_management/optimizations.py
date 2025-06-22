"""
Database and Query Optimization Utilities

Provides optimized querysets, caching decorators, and performance utilities
for the Hospital Management System
"""

import time
import functools
from typing import Any, Dict, List, Optional
from django.core.cache import cache
from django.db import models
from django.db.models import Prefetch, Q
from django.conf import settings
from django.utils import timezone
from datetime import timedelta


class OptimizedQuerySetMixin:
    """Mixin to add optimization methods to QuerySets"""
    
    def with_related(self):
        """Add common select_related and prefetch_related optimizations"""
        return self.select_related().prefetch_related()
    
    def for_api(self):
        """Optimize queryset for API responses"""
        return self.select_related().prefetch_related().only(*self.get_api_fields())
    
    def get_api_fields(self):
        """Override in model managers to specify API fields"""
        return [field.name for field in self.model._meta.fields]


class CacheManager(models.Manager):
    """Manager with built-in caching capabilities"""
    
    def get_cached(self, cache_key: str, timeout: int = 300, **kwargs):
        """Get object with caching"""
        cached_result = cache.get(cache_key)
        if cached_result is not None:
            return cached_result
        
        try:
            result = self.get(**kwargs)
            cache.set(cache_key, result, timeout)
            return result
        except self.model.DoesNotExist:
            cache.set(cache_key, None, timeout)
            raise
    
    def filter_cached(self, cache_key: str, timeout: int = 300, **kwargs):
        """Filter with caching"""
        cached_result = cache.get(cache_key)
        if cached_result is not None:
            return cached_result
        
        result = list(self.filter(**kwargs))
        cache.set(cache_key, result, timeout)
        return result


def cache_result(timeout: int = 300, key_prefix: str = ''):
    """Decorator to cache function results"""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = f"{key_prefix}:{func.__name__}:{hash(str(args) + str(kwargs))}"
            
            # Try to get from cache
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # Execute function and cache result
            result = func(*args, **kwargs)
            cache.set(cache_key, result, timeout)
            return result
        
        return wrapper
    return decorator


def invalidate_cache(pattern: str):
    """Invalidate cache keys matching pattern"""
    # This would require a more sophisticated cache backend
    # For now, we'll use a simple approach
    cache.delete_many([pattern])


class QueryOptimizer:
    """Utility class for query optimization"""
    
    @staticmethod
    def optimize_appointment_queries():
        """Optimize appointment-related queries"""
        from appointments.models import Appointment
        
        return Appointment.objects.select_related(
            'patient__user',
            'doctor__user',
            'department'
        ).prefetch_related(
            'medical_records',
            'prescriptions'
        )
    
    @staticmethod
    def optimize_patient_queries():
        """Optimize patient-related queries"""
        from accounts.models import Patient
        
        return Patient.objects.select_related(
            'user'
        ).prefetch_related(
            'appointments__doctor__user',
            'medical_records',
            'prescriptions'
        )
    
    @staticmethod
    def optimize_doctor_queries():
        """Optimize doctor-related queries"""
        from accounts.models import Doctor
        
        return Doctor.objects.select_related(
            'user',
            'department'
        ).prefetch_related(
            'appointments__patient__user',
            'availability_slots',
            'specializations'
        )
    
    @staticmethod
    def get_dashboard_data(user_role: str, user_id: int):
        """Get optimized dashboard data based on user role"""
        cache_key = f"dashboard_data:{user_role}:{user_id}"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return cached_data
        
        if user_role == 'patient':
            data = QueryOptimizer._get_patient_dashboard_data(user_id)
        elif user_role == 'doctor':
            data = QueryOptimizer._get_doctor_dashboard_data(user_id)
        elif user_role == 'admin':
            data = QueryOptimizer._get_admin_dashboard_data()
        else:
            data = {}
        
        cache.set(cache_key, data, 300)  # Cache for 5 minutes
        return data
    
    @staticmethod
    def _get_patient_dashboard_data(patient_id: int):
        """Get patient dashboard data"""
        from appointments.models import Appointment
        from accounts.models import Patient
        
        try:
            patient = Patient.objects.select_related('user').get(user_id=patient_id)
            
            # Get upcoming appointments
            upcoming_appointments = Appointment.objects.filter(
                patient=patient,
                appointment_date__gte=timezone.now().date()
            ).select_related(
                'doctor__user',
                'department'
            ).order_by('appointment_date', 'appointment_time')[:5]
            
            # Get recent medical records
            recent_records = patient.medical_records.select_related(
                'doctor__user'
            ).order_by('-created_at')[:5]
            
            return {
                'patient': patient,
                'upcoming_appointments': list(upcoming_appointments),
                'recent_records': list(recent_records),
                'total_appointments': patient.appointments.count(),
            }
        except Patient.DoesNotExist:
            return {}
    
    @staticmethod
    def _get_doctor_dashboard_data(doctor_id: int):
        """Get doctor dashboard data"""
        from appointments.models import Appointment
        from accounts.models import Doctor
        
        try:
            doctor = Doctor.objects.select_related('user', 'department').get(user_id=doctor_id)
            
            today = timezone.now().date()
            
            # Get today's appointments
            todays_appointments = Appointment.objects.filter(
                doctor=doctor,
                appointment_date=today
            ).select_related(
                'patient__user'
            ).order_by('appointment_time')
            
            # Get upcoming appointments
            upcoming_appointments = Appointment.objects.filter(
                doctor=doctor,
                appointment_date__gt=today
            ).select_related(
                'patient__user'
            ).order_by('appointment_date', 'appointment_time')[:10]
            
            # Get patient count
            patient_count = doctor.appointments.values('patient').distinct().count()
            
            return {
                'doctor': doctor,
                'todays_appointments': list(todays_appointments),
                'upcoming_appointments': list(upcoming_appointments),
                'total_patients': patient_count,
                'todays_count': todays_appointments.count(),
            }
        except Doctor.DoesNotExist:
            return {}
    
    @staticmethod
    def _get_admin_dashboard_data():
        """Get admin dashboard data"""
        from appointments.models import Appointment
        from accounts.models import Patient, Doctor
        from django.contrib.auth import get_user_model
        
        User = get_user_model()
        today = timezone.now().date()
        
        # Get counts
        total_users = User.objects.count()
        total_patients = Patient.objects.count()
        total_doctors = Doctor.objects.count()
        total_appointments = Appointment.objects.count()
        
        # Get today's appointments
        todays_appointments = Appointment.objects.filter(
            appointment_date=today
        ).count()
        
        # Get recent registrations
        recent_users = User.objects.select_related().order_by('-date_joined')[:5]
        
        return {
            'total_users': total_users,
            'total_patients': total_patients,
            'total_doctors': total_doctors,
            'total_appointments': total_appointments,
            'todays_appointments': todays_appointments,
            'recent_users': list(recent_users),
        }


class BulkOperationsMixin:
    """Mixin for efficient bulk operations"""
    
    def bulk_create_optimized(self, objects: List[models.Model], batch_size: int = 1000):
        """Optimized bulk create with batching"""
        created_objects = []
        for i in range(0, len(objects), batch_size):
            batch = objects[i:i + batch_size]
            created_objects.extend(
                self.bulk_create(batch, ignore_conflicts=True)
            )
        return created_objects
    
    def bulk_update_optimized(self, objects: List[models.Model], fields: List[str], batch_size: int = 1000):
        """Optimized bulk update with batching"""
        for i in range(0, len(objects), batch_size):
            batch = objects[i:i + batch_size]
            self.bulk_update(batch, fields)


def performance_monitor(func):
    """Decorator to monitor function performance"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        
        try:
            result = func(*args, **kwargs)
            duration = time.time() - start_time
            
            # Log performance if slow
            if duration > 1.0:  # 1 second threshold
                import logging
                logger = logging.getLogger('performance')
                logger.warning(
                    f"Slow function: {func.__name__} took {duration:.3f}s"
                )
            
            return result
        except Exception as e:
            duration = time.time() - start_time
            import logging
            logger = logging.getLogger('performance')
            logger.error(
                f"Function error: {func.__name__} failed after {duration:.3f}s: {str(e)}"
            )
            raise
    
    return wrapper


class DatabaseOptimizer:
    """Database optimization utilities"""
    
    @staticmethod
    def analyze_slow_queries():
        """Analyze slow queries from logs"""
        # This would analyze database logs for slow queries
        # Implementation depends on database backend
        pass
    
    @staticmethod
    def suggest_indexes():
        """Suggest database indexes based on query patterns"""
        suggestions = []
        
        # Common index suggestions for hospital management
        suggestions.extend([
            "CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON appointments_appointment(appointment_date, appointment_time);",
            "CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON appointments_appointment(doctor_id, appointment_date);",
            "CREATE INDEX IF NOT EXISTS idx_appointments_patient_date ON appointments_appointment(patient_id, appointment_date);",
            "CREATE INDEX IF NOT EXISTS idx_users_email ON auth_user(email);",
            "CREATE INDEX IF NOT EXISTS idx_users_role ON accounts_user(role);",
            "CREATE INDEX IF NOT EXISTS idx_medical_records_patient ON medical_records_medicalrecord(patient_id);",
            "CREATE INDEX IF NOT EXISTS idx_medical_records_date ON medical_records_medicalrecord(created_at);",
        ])
        
        return suggestions
    
    @staticmethod
    def optimize_database():
        """Run database optimization commands"""
        from django.db import connection
        
        with connection.cursor() as cursor:
            # PostgreSQL specific optimizations
            if 'postgresql' in settings.DATABASES['default']['ENGINE']:
                cursor.execute("VACUUM ANALYZE;")
                cursor.execute("REINDEX DATABASE %s;" % settings.DATABASES['default']['NAME'])
    
    @staticmethod
    def get_query_statistics():
        """Get database query statistics"""
        from django.db import connection
        
        stats = {
            'total_queries': len(connection.queries),
            'query_time': sum(float(q['time']) for q in connection.queries),
            'slow_queries': [q for q in connection.queries if float(q['time']) > 0.1],
        }
        
        return stats


# Cache invalidation utilities
class CacheInvalidator:
    """Utility for cache invalidation"""
    
    @staticmethod
    def invalidate_user_cache(user_id: int):
        """Invalidate all cache entries for a user"""
        patterns = [
            f"dashboard_data:*:{user_id}",
            f"user_profile:{user_id}",
            f"user_appointments:{user_id}",
            f"user_medical_records:{user_id}",
        ]
        
        for pattern in patterns:
            cache.delete(pattern)
    
    @staticmethod
    def invalidate_appointment_cache(appointment_id: int):
        """Invalidate appointment-related cache"""
        patterns = [
            f"appointment:{appointment_id}",
            f"doctor_schedule:*",
            f"patient_appointments:*",
            f"dashboard_data:*",
        ]
        
        for pattern in patterns:
            cache.delete(pattern)
    
    @staticmethod
    def invalidate_all_dashboard_cache():
        """Invalidate all dashboard cache entries"""
        cache.delete_pattern("dashboard_data:*")


# Performance testing utilities
class PerformanceTester:
    """Utility for performance testing"""
    
    @staticmethod
    def benchmark_query(queryset, iterations: int = 100):
        """Benchmark a queryset execution"""
        times = []
        
        for _ in range(iterations):
            start_time = time.time()
            list(queryset)  # Force evaluation
            end_time = time.time()
            times.append(end_time - start_time)
        
        return {
            'min_time': min(times),
            'max_time': max(times),
            'avg_time': sum(times) / len(times),
            'total_time': sum(times),
        }
    
    @staticmethod
    def profile_view(view_func, request):
        """Profile a view function"""
        import cProfile
        import pstats
        import io
        
        profiler = cProfile.Profile()
        profiler.enable()
        
        response = view_func(request)
        
        profiler.disable()
        
        # Get profiling results
        s = io.StringIO()
        ps = pstats.Stats(profiler, stream=s).sort_stats('cumulative')
        ps.print_stats()
        
        return {
            'response': response,
            'profile_data': s.getvalue(),
        }
