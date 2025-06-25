from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, date, time
from .models import Appointment
from apps.patients.serializers import PatientListSerializer
from apps.accounts.serializers import UserProfileSerializer

User = get_user_model()


class AppointmentSerializer(serializers.ModelSerializer):
    """
    Serializer for Appointment model
    """
    patient_name = serializers.ReadOnlyField(source='patient.get_full_name')
    doctor_name = serializers.ReadOnlyField(source='doctor.get_full_name')
    department_name = serializers.ReadOnlyField(source='department.name')
    duration_display = serializers.ReadOnlyField(source='get_duration_display')
    end_time = serializers.ReadOnlyField()
    is_today = serializers.ReadOnlyField()
    is_upcoming = serializers.ReadOnlyField()
    can_be_cancelled = serializers.ReadOnlyField()
    can_be_rescheduled = serializers.ReadOnlyField()
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'appointment_id', 'patient', 'patient_name', 'doctor', 'doctor_name',
            'department', 'department_name', 'appointment_date', 'appointment_time',
            'end_time', 'duration', 'duration_display', 'appointment_type', 'status',
            'priority', 'chief_complaint', 'symptoms', 'notes', 'is_follow_up',
            'previous_appointment', 'created_at', 'updated_at', 'created_by',
            'cancelled_at', 'cancelled_by', 'cancellation_reason', 'reminder_sent',
            'reminder_sent_at', 'is_today', 'is_upcoming', 'can_be_cancelled',
            'can_be_rescheduled'
        ]
        read_only_fields = [
            'appointment_id', 'created_at', 'updated_at', 'cancelled_at',
            'cancelled_by', 'reminder_sent', 'reminder_sent_at'
        ]


class AppointmentCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating appointments
    """
    
    class Meta:
        model = Appointment
        fields = [
            'patient', 'doctor', 'appointment_date', 'appointment_time',
            'duration', 'appointment_type', 'priority', 'chief_complaint',
            'symptoms', 'notes', 'is_follow_up', 'previous_appointment'
        ]
    
    def validate_appointment_date(self, value):
        """Validate appointment date is not in the past"""
        if value < date.today():
            raise serializers.ValidationError("Cannot schedule appointments in the past.")
        return value
    
    def validate_appointment_time(self, value):
        """Validate appointment time is within working hours"""
        if value < time(9, 0) or value > time(17, 0):
            raise serializers.ValidationError("Appointments can only be scheduled between 9:00 AM and 5:00 PM.")
        return value
    
    def validate_doctor(self, value):
        """Validate doctor exists and is accepting patients"""
        if value.role != 'doctor':
            raise serializers.ValidationError("Selected user is not a doctor.")
        
        if hasattr(value, 'doctor_profile') and not value.doctor_profile.is_accepting_patients:
            raise serializers.ValidationError("This doctor is not currently accepting new patients.")
        
        return value
    
    def validate(self, attrs):
        """Cross-field validation"""
        appointment_date = attrs.get('appointment_date')
        appointment_time = attrs.get('appointment_time')
        doctor = attrs.get('doctor')
        
        if appointment_date and appointment_time:
            # Check if appointment is in the past
            appointment_datetime = datetime.combine(appointment_date, appointment_time)
            # Make appointment_datetime timezone-aware
            appointment_datetime = timezone.make_aware(appointment_datetime)
            if appointment_datetime < timezone.now():
                raise serializers.ValidationError("Cannot schedule appointments in the past.")
            
            # Check for conflicting appointments
            if doctor:
                conflicting_appointments = Appointment.objects.filter(
                    doctor=doctor,
                    appointment_date=appointment_date,
                    appointment_time=appointment_time,
                    status__in=['scheduled', 'confirmed', 'in_progress']
                )
                
                if self.instance:
                    conflicting_appointments = conflicting_appointments.exclude(id=self.instance.id)
                
                if conflicting_appointments.exists():
                    raise serializers.ValidationError("Doctor already has an appointment at this time.")
        
        return attrs
    
    def create(self, validated_data):
        """Create appointment with current user as creator"""
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class AppointmentUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating appointments
    """

    class Meta:
        model = Appointment
        fields = [
            'patient', 'doctor', 'department', 'appointment_date', 'appointment_time',
            'duration', 'appointment_type', 'status', 'priority', 'chief_complaint',
            'symptoms', 'notes'
        ]
    
    def validate_appointment_date(self, value):
        """Validate appointment date is not in the past"""
        if value < date.today():
            raise serializers.ValidationError("Cannot schedule appointments in the past.")
        return value
    
    def validate_appointment_time(self, value):
        """Validate appointment time is within working hours"""
        if value < time(9, 0) or value > time(17, 0):
            raise serializers.ValidationError("Appointments can only be scheduled between 9:00 AM and 5:00 PM.")
        return value
    
    def validate(self, data):
        """Validate appointment data"""
        # Check for conflicts if doctor is being changed
        if 'doctor' in data and 'appointment_date' in data and 'appointment_time' in data:
            doctor = data['doctor']
            appointment_date = data['appointment_date']
            appointment_time = data['appointment_time']

            # Check for existing appointments at the same time (excluding current appointment)
            existing_appointments = Appointment.objects.filter(
                doctor=doctor,
                appointment_date=appointment_date,
                appointment_time=appointment_time,
                status__in=['scheduled', 'confirmed', 'in_progress']
            )

            if self.instance:
                existing_appointments = existing_appointments.exclude(id=self.instance.id)

            if existing_appointments.exists():
                raise serializers.ValidationError(
                    "Doctor already has an appointment at this time."
                )

        return data

    def validate_status(self, value):
        """Validate status transitions"""
        if self.instance:
            current_status = self.instance.status

            # Define allowed status transitions
            allowed_transitions = {
                'scheduled': ['confirmed', 'cancelled', 'no_show'],
                'confirmed': ['in_progress', 'cancelled', 'no_show'],
                'in_progress': ['completed', 'cancelled'],
                'completed': [],  # Cannot change from completed
                'cancelled': [],  # Cannot change from cancelled
                'no_show': [],   # Cannot change from no_show
                'rescheduled': []  # Cannot change from rescheduled
            }

            if value != current_status and value not in allowed_transitions.get(current_status, []):
                raise serializers.ValidationError(
                    f"Cannot change status from '{current_status}' to '{value}'"
                )

        return value


class AppointmentListSerializer(serializers.ModelSerializer):
    """
    Serializer for appointment list view
    """
    patient_name = serializers.ReadOnlyField(source='patient.get_full_name')
    doctor_name = serializers.ReadOnlyField(source='doctor.get_full_name')
    department_name = serializers.ReadOnlyField(source='department.name')
    duration_display = serializers.ReadOnlyField(source='get_duration_display')

    # Include nested patient and doctor objects for editing
    patient = serializers.SerializerMethodField()
    doctor = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = [
            'id', 'appointment_id', 'patient', 'patient_name', 'doctor', 'doctor_name',
            'department', 'department_name', 'appointment_date', 'appointment_time',
            'duration_display', 'appointment_type', 'status', 'priority', 'chief_complaint',
            'notes', 'is_today', 'is_upcoming'
        ]

    def get_patient(self, obj):
        """Return patient data for editing"""
        if obj.patient:
            return {
                'id': obj.patient.id,
                'full_name': obj.patient.get_full_name(),
                'patient_id': obj.patient.patient_id,
                'phone': getattr(obj.patient, 'phone', ''),
                'email': getattr(obj.patient.user, 'email', ''),
                'address': getattr(obj.patient, 'address', '')
            }
        return None

    def get_doctor(self, obj):
        """Return doctor data for editing"""
        if obj.doctor:
            return {
                'id': obj.doctor.id,
                'full_name': obj.doctor.get_full_name(),
                'specialization': getattr(obj.doctor, 'specialization', ''),
                'phone': getattr(obj.doctor, 'phone', ''),
                'email': getattr(obj.doctor, 'email', '')
            }
        return None

    def get_department(self, obj):
        """Return department data"""
        if obj.department:
            return {
                'id': obj.department.id,
                'name': obj.department.name
            }
        return None


class AppointmentCalendarSerializer(serializers.ModelSerializer):
    """
    Serializer for calendar view of appointments
    """
    patient_name = serializers.ReadOnlyField(source='patient.get_full_name')
    doctor_name = serializers.ReadOnlyField(source='doctor.get_full_name')
    end_time = serializers.ReadOnlyField()
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'appointment_id', 'patient_name', 'doctor_name',
            'appointment_date', 'appointment_time', 'end_time', 'duration',
            'appointment_type', 'status', 'priority', 'chief_complaint'
        ]


class MyAppointmentSerializer(serializers.ModelSerializer):
    """
    Serializer for patient's own appointments
    """
    doctor_name = serializers.ReadOnlyField(source='doctor.get_full_name')
    department_name = serializers.ReadOnlyField(source='department.name')
    duration_display = serializers.ReadOnlyField(source='get_duration_display')
    can_be_cancelled = serializers.ReadOnlyField()
    can_be_rescheduled = serializers.ReadOnlyField()
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'appointment_id', 'doctor_name', 'department_name',
            'appointment_date', 'appointment_time', 'duration_display',
            'appointment_type', 'status', 'priority', 'chief_complaint',
            'symptoms', 'notes', 'created_at', 'can_be_cancelled',
            'can_be_rescheduled'
        ]


class AppointmentStatusUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating appointment status only
    """
    
    class Meta:
        model = Appointment
        fields = ['status', 'cancellation_reason']
    
    def validate_status(self, value):
        """Validate status transitions"""
        if self.instance:
            current_status = self.instance.status
            
            # Define allowed status transitions
            allowed_transitions = {
                'scheduled': ['confirmed', 'cancelled', 'no_show'],
                'confirmed': ['in_progress', 'cancelled', 'no_show'],
                'in_progress': ['completed', 'cancelled'],
                'completed': [],
                'cancelled': [],
                'no_show': [],
                'rescheduled': []
            }
            
            if value != current_status and value not in allowed_transitions.get(current_status, []):
                raise serializers.ValidationError(
                    f"Cannot change status from '{current_status}' to '{value}'"
                )
        
        return value
    
    def update(self, instance, validated_data):
        """Update appointment status with additional logic"""
        new_status = validated_data.get('status')
        
        if new_status == 'cancelled':
            instance.cancelled_at = timezone.now()
            instance.cancelled_by = self.context['request'].user
            instance.cancellation_reason = validated_data.get('cancellation_reason', '')
        
        return super().update(instance, validated_data)
