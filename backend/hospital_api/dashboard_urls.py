"""
Hospital Management System - Dashboard URLs

URL patterns for dashboard and statistics endpoints.
"""

from django.urls import path
from . import dashboard_views

urlpatterns = [
    path('stats/', dashboard_views.dashboard_stats, name='dashboard-stats'),
]
