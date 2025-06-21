from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Department, Specialization, Doctor
from apps.accounts.serializers import UserProfileSerializer

User = get_user_model()


class DepartmentSerializer(serializers.ModelSerializer):
    """
    Serializer for Department model
    """
    head_of_department_name = serializers.ReadOnlyField(source='head_of_department.get_full_name')
    doctor_count = serializers.ReadOnlyField(source='get_doctor_count')
    
    class Meta:
        model = Department
        fields = [
            'id', 'name', 'description', 'head_of_department', 'head_of_department_name',
            'phone_number', 'email', 'location', 'doctor_count', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class DepartmentListSerializer(serializers.ModelSerializer):
    """
    Serializer for Department list view
    """
    head_of_department_name = serializers.ReadOnlyField(source='head_of_department.get_full_name')
    doctor_count = serializers.ReadOnlyField(source='get_doctor_count')
    
    class Meta:
        model = Department
        fields = [
            'id', 'name', 'head_of_department_name', 'location',
            'doctor_count', 'is_active'
        ]


class SpecializationSerializer(serializers.ModelSerializer):
    """
    Serializer for Specialization model
    """
    
    class Meta:
        model = Specialization
        fields = ['id', 'name', 'description', 'is_active']


class DoctorSerializer(serializers.ModelSerializer):
    """
    Serializer for Doctor model
    """
    user = UserProfileSerializer(read_only=True)
    department_name = serializers.ReadOnlyField(source='department.name')
    specializations_list = serializers.ReadOnlyField(source='get_specializations_list')
    full_name = serializers.ReadOnlyField(source='get_full_name')
    age = serializers.ReadOnlyField()
    current_patient_count = serializers.ReadOnlyField(source='get_current_patient_count')
    can_accept_more_patients = serializers.ReadOnlyField(source='can_accept_more_patients_today')
    
    class Meta:
        model = Doctor
        fields = [
            'id', 'user', 'doctor_id', 'license_number', 'full_name', 'age',
            'department', 'department_name', 'specializations', 'specializations_list',
            'medical_school', 'graduation_year', 'residency_program', 'fellowship_program',
            'years_of_experience', 'employment_status', 'hire_date', 'salary',
            'consultation_fee', 'is_accepting_patients', 'max_patients_per_day',
            'current_patient_count', 'can_accept_more_patients', 'certifications',
            'research_interests', 'publications', 'awards', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['doctor_id', 'created_at', 'updated_at']


class DoctorCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating Doctor profiles
    """
    user_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Doctor
        fields = [
            'user_id', 'license_number', 'department', 'specializations',
            'medical_school', 'graduation_year', 'residency_program',
            'fellowship_program', 'years_of_experience', 'employment_status',
            'hire_date', 'salary', 'consultation_fee', 'is_accepting_patients',
            'max_patients_per_day', 'certifications', 'research_interests',
            'publications', 'awards'
        ]
    
    def validate_user_id(self, value):
        """Validate that user exists and doesn't already have a doctor profile"""
        try:
            user = User.objects.get(id=value, role='doctor')
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found or not a doctor.")
        
        if hasattr(user, 'doctor_profile'):
            raise serializers.ValidationError("User already has a doctor profile.")
        
        return value
    
    def validate_license_number(self, value):
        """Validate license number uniqueness"""
        if Doctor.objects.filter(license_number=value).exists():
            raise serializers.ValidationError("A doctor with this license number already exists.")
        return value
    
    def create(self, validated_data):
        user_id = validated_data.pop('user_id')
        user = User.objects.get(id=user_id)
        specializations = validated_data.pop('specializations', [])
        
        doctor = Doctor.objects.create(user=user, **validated_data)
        doctor.specializations.set(specializations)
        return doctor


class DoctorUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating Doctor profiles
    """
    
    class Meta:
        model = Doctor
        fields = [
            'license_number', 'department', 'specializations', 'medical_school',
            'graduation_year', 'residency_program', 'fellowship_program',
            'years_of_experience', 'employment_status', 'hire_date', 'salary',
            'consultation_fee', 'is_accepting_patients', 'max_patients_per_day',
            'certifications', 'research_interests', 'publications', 'awards',
            'is_active'
        ]
    
    def validate_license_number(self, value):
        """Validate license number uniqueness (excluding current doctor)"""
        if value and Doctor.objects.filter(license_number=value).exclude(id=self.instance.id).exists():
            raise serializers.ValidationError("A doctor with this license number already exists.")
        return value


class DoctorListSerializer(serializers.ModelSerializer):
    """
    Serializer for Doctor list view
    """
    full_name = serializers.ReadOnlyField(source='get_full_name')
    department_name = serializers.ReadOnlyField(source='department.name')
    specializations_list = serializers.ReadOnlyField(source='get_specializations_list')
    email = serializers.ReadOnlyField(source='user.email')
    phone = serializers.ReadOnlyField(source='user.phone_number')
    
    class Meta:
        model = Doctor
        fields = [
            'id', 'doctor_id', 'full_name', 'email', 'phone', 'department_name',
            'specializations_list', 'years_of_experience', 'consultation_fee',
            'is_accepting_patients', 'employment_status', 'is_active'
        ]


class DoctorAvailabilitySerializer(serializers.Serializer):
    """
    Serializer for doctor availability information
    """
    doctor_id = serializers.CharField(read_only=True)
    full_name = serializers.CharField(read_only=True)
    department = serializers.CharField(read_only=True)
    specializations = serializers.ListField(read_only=True)
    consultation_fee = serializers.DecimalField(max_digits=8, decimal_places=2, read_only=True)
    is_accepting_patients = serializers.BooleanField(read_only=True)
    max_patients_per_day = serializers.IntegerField(read_only=True)
    current_patient_count = serializers.IntegerField(read_only=True)
    can_accept_more_patients = serializers.BooleanField(read_only=True)
    available_slots = serializers.ListField(read_only=True)


class MyDoctorProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for doctor's own profile view
    """
    user = UserProfileSerializer(read_only=True)
    department_name = serializers.ReadOnlyField(source='department.name')
    specializations_list = serializers.ReadOnlyField(source='get_specializations_list')
    age = serializers.ReadOnlyField()
    current_patient_count = serializers.ReadOnlyField(source='get_current_patient_count')
    can_accept_more_patients = serializers.ReadOnlyField(source='can_accept_more_patients_today')
    
    class Meta:
        model = Doctor
        fields = [
            'id', 'user', 'doctor_id', 'license_number', 'age', 'department',
            'department_name', 'specializations', 'specializations_list',
            'medical_school', 'graduation_year', 'residency_program',
            'fellowship_program', 'years_of_experience', 'employment_status',
            'hire_date', 'consultation_fee', 'is_accepting_patients',
            'max_patients_per_day', 'current_patient_count', 'can_accept_more_patients',
            'certifications', 'research_interests', 'publications', 'awards',
            'created_at', 'updated_at'
        ]


class DoctorScheduleSerializer(serializers.Serializer):
    """
    Serializer for doctor's schedule information
    """
    date = serializers.DateField()
    appointments = serializers.ListField(read_only=True)
    total_appointments = serializers.IntegerField(read_only=True)
    available_slots = serializers.ListField(read_only=True)
    is_available = serializers.BooleanField(read_only=True)
