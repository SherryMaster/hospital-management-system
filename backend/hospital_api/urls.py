"""
Hospital Management System API - URL Configuration

Main URL routing for the Hospital Management System API.
Includes routes for admin, API endpoints, and documentation.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from . import views

urlpatterns = [
    # Admin interface
    path('admin/', admin.site.urls),

    # Health check and API info
    path('health/', views.health_check, name='health-check'),
    path('api/', views.api_info, name='api-info'),
    path('api/health/', views.health_check, name='api-health-check'),

    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # Dashboard endpoints
    path('api/dashboard/', include('hospital_api.dashboard_urls')),

    # API endpoints
    path('api/auth/', include('apps.accounts.urls')),
    path('api/patients/', include('apps.patients.urls')),
    path('api/doctors/', include('apps.doctors.urls')),
    path('api/appointments/', include('apps.appointments.urls')),
    path('api/billing/', include('apps.billing.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
