"""
Hospital Management System API - Core Views

Basic views for health checks and system status.
"""

from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import sys


@csrf_exempt
@require_http_methods(["GET"])
def health_check(request):
    """
    Health check endpoint for monitoring system status.
    
    Returns basic system information and status.
    """
    return JsonResponse({
        'status': 'healthy',
        'message': 'Hospital Management System API is running',
        'version': '1.0.0',
        'debug': settings.DEBUG,
        'python_version': sys.version,
        'django_version': getattr(settings, 'DJANGO_VERSION', 'Unknown'),
    })


@csrf_exempt
@require_http_methods(["GET"])
def api_info(request):
    """
    API information endpoint.
    
    Returns information about available API endpoints and documentation.
    """
    base_url = request.build_absolute_uri('/api/')
    
    return JsonResponse({
        'name': 'Hospital Management System API',
        'version': '1.0.0',
        'description': 'A comprehensive REST API for hospital management operations',
        'documentation': {
            'swagger': request.build_absolute_uri('/api/docs/'),
            'redoc': request.build_absolute_uri('/api/redoc/'),
            'schema': request.build_absolute_uri('/api/schema/'),
        },
        'endpoints': {
            'health': request.build_absolute_uri('/health/'),
            'admin': request.build_absolute_uri('/admin/'),
            # Will be added as we create apps
            # 'auth': f'{base_url}auth/',
            # 'patients': f'{base_url}patients/',
            # 'doctors': f'{base_url}doctors/',
            # 'appointments': f'{base_url}appointments/',
            # 'billing': f'{base_url}billing/',
        }
    })
