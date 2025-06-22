"""
Hospital Management System - Dashboard Views

Views for dashboard statistics and system monitoring.
"""

from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.appointments.models import Appointment
from apps.patients.models import Patient
from apps.doctors.models import Doctor
from datetime import date, datetime

User = get_user_model()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """
    Get dashboard statistics based on user role.
    
    Returns different statistics for different user roles:
    - Admin: System-wide statistics
    - Doctor: Doctor-specific statistics
    - Patient: Patient-specific statistics
    """
    user = request.user
    
    if user.role == 'admin':
        return _get_admin_stats(request)
    elif user.role == 'doctor':
        return _get_doctor_stats(request)
    elif user.role == 'patient':
        return _get_patient_stats(request)
    else:
        return _get_basic_stats(request)


def _get_admin_stats(request):
    """Get comprehensive statistics for admin users."""
    today = date.today()
    
    # User statistics
    total_users = User.objects.count()
    total_patients = User.objects.filter(role='patient').count()
    total_doctors = User.objects.filter(role='doctor').count()
    
    # Appointment statistics
    total_appointments = Appointment.objects.count()
    today_appointments = Appointment.objects.filter(appointment_date=today).count()
    pending_appointments = Appointment.objects.filter(status='scheduled').count()
    
    # System health (basic implementation - simplified)
    cpu_usage = 15.5  # Mock data for now
    memory_usage = 45.2  # Mock data for now
    disk_usage = 67.8  # Mock data for now
    
    return Response({
        'total_users': total_users,
        'total_patients': total_patients,
        'total_doctors': total_doctors,
        'total_appointments': total_appointments,
        'today_appointments': today_appointments,
        'pending_appointments': pending_appointments,
        'total_revenue': 0,  # TODO: Implement when billing is ready
        'pending_invoices': 0,  # TODO: Implement when billing is ready
        'system_health': {
            'status': 'healthy',
            'cpu_usage': cpu_usage,
            'memory_usage': memory_usage,
            'disk_usage': disk_usage,
            'uptime': '99.9%',  # TODO: Implement actual uptime tracking
            'response_time': '120ms'  # TODO: Implement actual response time tracking
        }
    })


def _get_doctor_stats(request):
    """Get statistics for doctor users."""
    user = request.user
    today = date.today()
    
    try:
        doctor = Doctor.objects.get(user=user)
        
        # Doctor's appointment statistics
        today_appointments = Appointment.objects.filter(
            doctor=doctor.user,
            appointment_date=today
        ).count()

        upcoming_appointments = Appointment.objects.filter(
            doctor=doctor.user,
            appointment_date__gt=today,
            status__in=['confirmed', 'scheduled']
        ).count()

        completed_today = Appointment.objects.filter(
            doctor=doctor.user,
            appointment_date=today,
            status='completed'
        ).count()

        pending_appointments = Appointment.objects.filter(
            doctor=doctor.user,
            status='scheduled'
        ).count()
        
        # Get next appointment
        next_appointment = Appointment.objects.filter(
            doctor=doctor.user,
            appointment_date__gte=today,
            status__in=['confirmed', 'scheduled']
        ).order_by('appointment_date', 'appointment_time').first()

        next_appointment_data = None
        if next_appointment:
            next_appointment_data = {
                'id': next_appointment.id,
                'patient_name': next_appointment.patient.user.get_full_name(),
                'time': next_appointment.appointment_time.strftime('%H:%M'),
                'date': next_appointment.appointment_date.strftime('%Y-%m-%d'),
                'type': next_appointment.appointment_type
            }

        return Response({
            'today_appointments': today_appointments,
            'upcoming_appointments': upcoming_appointments,
            'total_patients': 0,  # TODO: Implement get_total_patients method
            'completed_appointments_today': completed_today,
            'pending_appointments': pending_appointments,
            'next_appointment': next_appointment_data
        })
        
    except Doctor.DoesNotExist:
        return Response({
            'error': 'Doctor profile not found'
        }, status=404)


def _get_patient_stats(request):
    """Get statistics for patient users."""
    user = request.user
    today = date.today()
    
    try:
        patient = Patient.objects.get(user=user)
        
        # Patient's appointment statistics
        total_appointments = Appointment.objects.filter(patient=patient).count()
        upcoming_appointments = Appointment.objects.filter(
            patient=patient,
            appointment_date__gte=today,
            status__in=['confirmed', 'scheduled']
        ).count()

        completed_appointments = Appointment.objects.filter(
            patient=patient,
            status='completed'
        ).count()

        # Get next appointment
        next_appointment = Appointment.objects.filter(
            patient=patient,
            appointment_date__gte=today,
            status__in=['confirmed', 'scheduled']
        ).order_by('appointment_date', 'appointment_time').first()

        next_appointment_data = None
        if next_appointment:
            next_appointment_data = {
                'id': next_appointment.id,
                'doctor_name': next_appointment.doctor.get_full_name(),
                'time': next_appointment.appointment_time.strftime('%H:%M'),
                'date': next_appointment.appointment_date.strftime('%Y-%m-%d'),
                'type': next_appointment.appointment_type
            }
        
        return Response({
            'total_appointments': total_appointments,
            'upcoming_appointments': upcoming_appointments,
            'completed_appointments': completed_appointments,
            'next_appointment': next_appointment_data
        })
        
    except Patient.DoesNotExist:
        return Response({
            'error': 'Patient profile not found'
        }, status=404)


def _get_basic_stats(request):
    """Get basic statistics for other user roles."""
    today = date.today()
    
    return Response({
        'message': 'Dashboard statistics',
        'user_role': request.user.role,
        'today': today.strftime('%Y-%m-%d')
    })
