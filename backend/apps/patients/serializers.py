from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Patient, MedicalRecord
from apps.accounts.serializers import UserProfileSerializer

User = get_user_model()


class PatientSerializer(serializers.ModelSerializer):
    """
    Serializer for Patient model
    """
    user = UserProfileSerializer(read_only=True)
    age = serializers.ReadOnlyField()
    bmi = serializers.ReadOnlyField()
    bmi_category = serializers.ReadOnlyField()
    full_name = serializers.ReadOnlyField(source='get_full_name')
    contact_info = serializers.ReadOnlyField(source='get_contact_info')
    
    class Meta:
        model = Patient
        fields = [
            'id', 'user', 'patient_id', 'full_name', 'age', 'blood_type',
            'height', 'weight', 'bmi', 'bmi_category', 'marital_status',
            'occupation', 'insurance_provider', 'insurance_policy_number',
            'insurance_group_number', 'allergies', 'chronic_conditions',
            'current_medications', 'family_medical_history', 'surgical_history',
            'registration_date', 'last_visit_date', 'is_active', 'notes',
            'contact_info'
        ]
        read_only_fields = ['patient_id', 'registration_date']


class PatientCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating Patient profiles
    """
    user_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Patient
        fields = [
            'user_id', 'blood_type', 'height', 'weight', 'marital_status',
            'occupation', 'insurance_provider', 'insurance_policy_number',
            'insurance_group_number', 'allergies', 'chronic_conditions',
            'current_medications', 'family_medical_history', 'surgical_history',
            'notes'
        ]
    
    def validate_user_id(self, value):
        """Validate that user exists and doesn't already have a patient profile"""
        try:
            user = User.objects.get(id=value, role='patient')
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found or not a patient.")
        
        if hasattr(user, 'patient_profile'):
            raise serializers.ValidationError("User already has a patient profile.")
        
        return value
    
    def create(self, validated_data):
        user_id = validated_data.pop('user_id')
        user = User.objects.get(id=user_id)
        patient = Patient.objects.create(user=user, **validated_data)
        return patient


class PatientUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating Patient profiles
    """
    
    class Meta:
        model = Patient
        fields = [
            'blood_type', 'height', 'weight', 'marital_status', 'occupation',
            'insurance_provider', 'insurance_policy_number', 'insurance_group_number',
            'allergies', 'chronic_conditions', 'current_medications',
            'family_medical_history', 'surgical_history', 'is_active', 'notes'
        ]


class PatientListSerializer(serializers.ModelSerializer):
    """
    Serializer for Patient list view
    """
    full_name = serializers.ReadOnlyField(source='get_full_name')
    age = serializers.ReadOnlyField()
    email = serializers.ReadOnlyField(source='user.email')
    phone = serializers.ReadOnlyField(source='user.phone_number')
    
    class Meta:
        model = Patient
        fields = [
            'id', 'patient_id', 'full_name', 'age', 'email', 'phone',
            'blood_type', 'registration_date', 'last_visit_date', 'is_active'
        ]


class MedicalRecordSerializer(serializers.ModelSerializer):
    """
    Serializer for Medical Record model
    """
    patient_name = serializers.ReadOnlyField(source='patient.get_full_name')
    doctor_name = serializers.ReadOnlyField(source='doctor.get_full_name')
    blood_pressure = serializers.ReadOnlyField()
    vital_signs = serializers.ReadOnlyField(source='get_vital_signs')
    
    class Meta:
        model = MedicalRecord
        fields = [
            'id', 'record_id', 'patient', 'patient_name', 'doctor', 'doctor_name',
            'record_type', 'title', 'description', 'symptoms', 'diagnosis',
            'treatment_plan', 'medications_prescribed', 'follow_up_instructions',
            'temperature', 'blood_pressure_systolic', 'blood_pressure_diastolic',
            'blood_pressure', 'heart_rate', 'respiratory_rate', 'oxygen_saturation',
            'vital_signs', 'visit_date', 'created_at', 'updated_at',
            'is_confidential', 'attachments'
        ]
        read_only_fields = ['record_id', 'created_at', 'updated_at']


class MedicalRecordCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating Medical Records
    """
    
    class Meta:
        model = MedicalRecord
        fields = [
            'patient', 'doctor', 'record_type', 'title', 'description',
            'symptoms', 'diagnosis', 'treatment_plan', 'medications_prescribed',
            'follow_up_instructions', 'temperature', 'blood_pressure_systolic',
            'blood_pressure_diastolic', 'heart_rate', 'respiratory_rate',
            'oxygen_saturation', 'visit_date', 'is_confidential', 'attachments'
        ]
    
    def validate_doctor(self, value):
        """Validate that the doctor has the correct role"""
        if value.role != 'doctor':
            raise serializers.ValidationError("Selected user is not a doctor.")
        return value


class MedicalRecordListSerializer(serializers.ModelSerializer):
    """
    Serializer for Medical Record list view
    """
    patient_name = serializers.ReadOnlyField(source='patient.get_full_name')
    doctor_name = serializers.ReadOnlyField(source='doctor.get_full_name')
    
    class Meta:
        model = MedicalRecord
        fields = [
            'id', 'record_id', 'patient_name', 'doctor_name', 'record_type',
            'title', 'visit_date', 'created_at', 'is_confidential'
        ]


class PatientMedicalHistorySerializer(serializers.ModelSerializer):
    """
    Serializer for Patient's complete medical history
    """
    user = UserProfileSerializer(read_only=True)
    medical_records = MedicalRecordListSerializer(many=True, read_only=True)
    age = serializers.ReadOnlyField()
    bmi = serializers.ReadOnlyField()
    bmi_category = serializers.ReadOnlyField()
    
    class Meta:
        model = Patient
        fields = [
            'id', 'patient_id', 'user', 'age', 'blood_type', 'height', 'weight',
            'bmi', 'bmi_category', 'allergies', 'chronic_conditions',
            'current_medications', 'family_medical_history', 'surgical_history',
            'medical_records', 'registration_date', 'last_visit_date'
        ]


class VitalSignsSerializer(serializers.Serializer):
    """
    Serializer for vital signs data
    """
    temperature = serializers.FloatField(required=False, allow_null=True)
    blood_pressure_systolic = serializers.IntegerField(required=False, allow_null=True)
    blood_pressure_diastolic = serializers.IntegerField(required=False, allow_null=True)
    heart_rate = serializers.IntegerField(required=False, allow_null=True)
    respiratory_rate = serializers.IntegerField(required=False, allow_null=True)
    oxygen_saturation = serializers.FloatField(required=False, allow_null=True)
    
    def validate_temperature(self, value):
        if value is not None and (value < 30 or value > 45):
            raise serializers.ValidationError("Temperature must be between 30°C and 45°C")
        return value
    
    def validate_blood_pressure_systolic(self, value):
        if value is not None and (value < 50 or value > 300):
            raise serializers.ValidationError("Systolic pressure must be between 50 and 300 mmHg")
        return value
    
    def validate_blood_pressure_diastolic(self, value):
        if value is not None and (value < 30 or value > 200):
            raise serializers.ValidationError("Diastolic pressure must be between 30 and 200 mmHg")
        return value
    
    def validate_heart_rate(self, value):
        if value is not None and (value < 30 or value > 250):
            raise serializers.ValidationError("Heart rate must be between 30 and 250 BPM")
        return value
    
    def validate_respiratory_rate(self, value):
        if value is not None and (value < 5 or value > 60):
            raise serializers.ValidationError("Respiratory rate must be between 5 and 60 breaths per minute")
        return value
    
    def validate_oxygen_saturation(self, value):
        if value is not None and (value < 50 or value > 100):
            raise serializers.ValidationError("Oxygen saturation must be between 50% and 100%")
        return value
