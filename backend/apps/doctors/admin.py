from django.contrib import admin
from django.utils.html import format_html
from .models import Department, Specialization, Doctor


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    """Admin configuration for Department model"""

    list_display = [
        'name', 'head_of_department', 'get_doctor_count',
        'location', 'is_active', 'created_at'
    ]

    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description', 'location']
    readonly_fields = ['created_at', 'updated_at', 'get_doctor_count']

    fieldsets = (
        ('Department Information', {
            'fields': ('name', 'description', 'head_of_department')
        }),
        ('Contact Information', {
            'fields': ('phone_number', 'email', 'location')
        }),
        ('System Information', {
            'fields': ('is_active', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Specialization)
class SpecializationAdmin(admin.ModelAdmin):
    """Admin configuration for Specialization model"""

    list_display = ['name', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name', 'description']

    fieldsets = (
        ('Specialization Information', {
            'fields': ('name', 'description', 'is_active')
        }),
    )


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    """Admin configuration for Doctor model"""

    list_display = [
        'doctor_id', 'get_full_name', 'department', 'employment_status',
        'years_of_experience', 'is_accepting_patients', 'is_active'
    ]

    list_filter = [
        'department', 'employment_status', 'specializations',
        'is_accepting_patients', 'is_active', 'hire_date'
    ]

    search_fields = [
        'doctor_id', 'license_number', 'user__first_name',
        'user__last_name', 'user__email', 'medical_school'
    ]

    readonly_fields = [
        'doctor_id', 'created_at', 'updated_at', 'age',
        'get_current_patient_count', 'can_accept_more_patients_today'
    ]

    filter_horizontal = ['specializations']

    fieldsets = (
        ('Doctor Information', {
            'fields': (
                'user', 'doctor_id', 'license_number',
                'department', 'specializations'
            )
        }),
        ('Education & Experience', {
            'fields': (
                'medical_school', 'graduation_year', 'residency_program',
                'fellowship_program', 'years_of_experience'
            )
        }),
        ('Employment Information', {
            'fields': (
                'employment_status', 'hire_date', 'salary'
            ),
            'classes': ('collapse',)
        }),
        ('Practice Information', {
            'fields': (
                'consultation_fee', 'is_accepting_patients',
                'max_patients_per_day', 'get_current_patient_count',
                'can_accept_more_patients_today'
            )
        }),
        ('Professional Details', {
            'fields': (
                'certifications', 'research_interests',
                'publications', 'awards'
            ),
            'classes': ('collapse',)
        }),
        ('System Information', {
            'fields': ('is_active', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_full_name(self, obj):
        return obj.get_full_name()
    get_full_name.short_description = 'Full Name'
    get_full_name.admin_order_field = 'user__first_name'

    def age(self, obj):
        return obj.age
    age.short_description = 'Age'

    def get_current_patient_count(self, obj):
        return obj.get_current_patient_count()
    get_current_patient_count.short_description = 'Today\'s Patients'

    def can_accept_more_patients_today(self, obj):
        can_accept = obj.can_accept_more_patients_today()
        color = 'green' if can_accept else 'red'
        text = 'Yes' if can_accept else 'No'
        return format_html(
            '<span style="color: {};">{}</span>',
            color, text
        )
    can_accept_more_patients_today.short_description = 'Can Accept More Today'
