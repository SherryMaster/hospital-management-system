from django.contrib import admin
from django.utils.html import format_html
from .models import Patient, MedicalRecord


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    """Admin configuration for Patient model"""

    list_display = [
        'patient_id', 'get_full_name', 'blood_type', 'age',
        'registration_date', 'last_visit_date', 'is_active'
    ]

    list_filter = [
        'blood_type', 'marital_status', 'is_active',
        'registration_date', 'user__gender'
    ]

    search_fields = [
        'patient_id', 'user__first_name', 'user__last_name',
        'user__email', 'user__phone_number', 'insurance_provider'
    ]

    readonly_fields = ['patient_id', 'registration_date', 'age', 'bmi', 'bmi_category']

    fieldsets = (
        ('Patient Information', {
            'fields': ('user', 'patient_id', 'registration_date')
        }),
        ('Medical Information', {
            'fields': (
                'blood_type', 'height', 'weight', 'bmi', 'bmi_category',
                'allergies', 'chronic_conditions', 'current_medications'
            )
        }),
        ('Personal Information', {
            'fields': ('marital_status', 'occupation')
        }),
        ('Insurance Information', {
            'fields': (
                'insurance_provider', 'insurance_policy_number',
                'insurance_group_number'
            ),
            'classes': ('collapse',)
        }),
        ('Medical History', {
            'fields': (
                'family_medical_history', 'surgical_history'
            ),
            'classes': ('collapse',)
        }),
        ('System Information', {
            'fields': ('last_visit_date', 'is_active', 'notes'),
            'classes': ('collapse',)
        }),
    )

    def get_full_name(self, obj):
        return obj.user.get_full_name()
    get_full_name.short_description = 'Full Name'
    get_full_name.admin_order_field = 'user__first_name'

    def age(self, obj):
        return obj.age
    age.short_description = 'Age'


class MedicalRecordInline(admin.TabularInline):
    """Inline admin for Medical Records"""
    model = MedicalRecord
    extra = 0
    readonly_fields = ['record_id', 'created_at']
    fields = [
        'record_id', 'record_type', 'title', 'visit_date',
        'doctor', 'created_at'
    ]


@admin.register(MedicalRecord)
class MedicalRecordAdmin(admin.ModelAdmin):
    """Admin configuration for Medical Record model"""

    list_display = [
        'record_id', 'patient', 'record_type', 'title',
        'visit_date', 'doctor', 'is_confidential'
    ]

    list_filter = [
        'record_type', 'visit_date', 'is_confidential',
        'created_at', 'doctor'
    ]

    search_fields = [
        'record_id', 'patient__patient_id', 'patient__user__first_name',
        'patient__user__last_name', 'title', 'description'
    ]

    readonly_fields = ['record_id', 'created_at', 'updated_at', 'blood_pressure']

    fieldsets = (
        ('Record Information', {
            'fields': (
                'record_id', 'patient', 'doctor', 'record_type',
                'title', 'visit_date'
            )
        }),
        ('Medical Details', {
            'fields': (
                'description', 'symptoms', 'diagnosis',
                'treatment_plan', 'medications_prescribed',
                'follow_up_instructions'
            )
        }),
        ('Vital Signs', {
            'fields': (
                'temperature', 'blood_pressure_systolic',
                'blood_pressure_diastolic', 'blood_pressure',
                'heart_rate', 'respiratory_rate', 'oxygen_saturation'
            ),
            'classes': ('collapse',)
        }),
        ('System Information', {
            'fields': (
                'is_confidential', 'attachments',
                'created_at', 'updated_at'
            ),
            'classes': ('collapse',)
        }),
    )

    def blood_pressure(self, obj):
        return obj.blood_pressure or 'Not recorded'
    blood_pressure.short_description = 'Blood Pressure'


# Add Medical Records inline to Patient admin
PatientAdmin.inlines = [MedicalRecordInline]
