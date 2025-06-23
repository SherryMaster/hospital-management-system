from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe

from .models import Administrator, Nurse, Receptionist, Pharmacist


@admin.register(Administrator)
class AdministratorAdmin(admin.ModelAdmin):
    """Admin interface for Administrator profiles"""
    
    list_display = [
        'admin_id', 'get_full_name', 'employee_id', 'access_level',
        'department', 'is_active_user', 'hire_date', 'created_at'
    ]
    
    list_filter = [
        'access_level', 'department', 'hire_date', 'created_at',
        'user__is_active', 'user__is_verified'
    ]
    
    search_fields = [
        'admin_id', 'employee_id', 'user__first_name', 'user__last_name',
        'user__email', 'department', 'office_location'
    ]
    
    readonly_fields = ['admin_id', 'created_at', 'updated_at', 'last_system_access']
    
    fieldsets = (
        ('User Information', {
            'fields': ('user', 'admin_id')
        }),
        ('Professional Details', {
            'fields': ('employee_id', 'access_level', 'department')
        }),
        ('Employment Information', {
            'fields': ('hire_date', 'salary')
        }),
        ('Contact & Location', {
            'fields': ('office_phone', 'office_location')
        }),
        ('System Access', {
            'fields': ('system_permissions', 'last_system_access'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username
    get_full_name.short_description = 'Full Name'
    
    def is_active_user(self, obj):
        return obj.user.is_active
    is_active_user.boolean = True
    is_active_user.short_description = 'Active'


@admin.register(Nurse)
class NurseAdmin(admin.ModelAdmin):
    """Admin interface for Nurse profiles"""
    
    list_display = [
        'nurse_id', 'get_full_name', 'license_number', 'nursing_level',
        'department', 'employment_status', 'shift_preference', 'is_active', 'created_at'
    ]
    
    list_filter = [
        'nursing_level', 'department', 'employment_status', 'shift_preference',
        'is_active', 'hire_date', 'created_at', 'user__is_active'
    ]
    
    search_fields = [
        'nurse_id', 'license_number', 'user__first_name', 'user__last_name',
        'user__email', 'department', 'unit', 'nursing_school'
    ]
    
    readonly_fields = ['nurse_id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('User Information', {
            'fields': ('user', 'nurse_id')
        }),
        ('Professional Details', {
            'fields': ('license_number', 'nursing_level', 'license_expiry_date')
        }),
        ('Department & Specialization', {
            'fields': ('department', 'unit', 'specializations')
        }),
        ('Education & Certifications', {
            'fields': ('nursing_school', 'graduation_year', 'certifications')
        }),
        ('Employment Information', {
            'fields': ('employment_status', 'hire_date', 'hourly_rate', 'years_of_experience')
        }),
        ('Schedule & Availability', {
            'fields': ('shift_preference',)
        }),
        ('Management', {
            'fields': ('is_active', 'supervisor')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username
    get_full_name.short_description = 'Full Name'


@admin.register(Receptionist)
class ReceptionistAdmin(admin.ModelAdmin):
    """Admin interface for Receptionist profiles"""
    
    list_display = [
        'receptionist_id', 'get_full_name', 'employee_id', 'department',
        'employment_status', 'shift_preference', 'is_active', 'created_at'
    ]
    
    list_filter = [
        'department', 'employment_status', 'shift_preference', 'is_active',
        'hire_date', 'created_at', 'can_schedule_appointments', 'can_handle_billing'
    ]
    
    search_fields = [
        'receptionist_id', 'employee_id', 'user__first_name', 'user__last_name',
        'user__email', 'department', 'desk_location'
    ]
    
    readonly_fields = ['receptionist_id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('User Information', {
            'fields': ('user', 'receptionist_id')
        }),
        ('Professional Details', {
            'fields': ('employee_id', 'department', 'desk_location')
        }),
        ('Employment Information', {
            'fields': ('employment_status', 'hire_date', 'hourly_rate')
        }),
        ('Schedule', {
            'fields': ('shift_preference',)
        }),
        ('Skills & Certifications', {
            'fields': ('languages_spoken', 'computer_skills', 'certifications')
        }),
        ('Access & Permissions', {
            'fields': (
                'system_access_level', 'can_schedule_appointments',
                'can_handle_billing', 'can_access_medical_records'
            )
        }),
        ('Management', {
            'fields': ('is_active', 'supervisor')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username
    get_full_name.short_description = 'Full Name'


@admin.register(Pharmacist)
class PharmacistAdmin(admin.ModelAdmin):
    """Admin interface for Pharmacist profiles"""
    
    list_display = [
        'pharmacist_id', 'get_full_name', 'license_number', 'pharmacist_level',
        'department', 'employment_status', 'is_active', 'created_at'
    ]
    
    list_filter = [
        'pharmacist_level', 'department', 'employment_status', 'is_active',
        'hire_date', 'created_at', 'can_dispense_controlled_substances',
        'can_provide_clinical_consultations'
    ]
    
    search_fields = [
        'pharmacist_id', 'license_number', 'user__first_name', 'user__last_name',
        'user__email', 'pharmacy_school', 'pharmacy_location'
    ]
    
    readonly_fields = ['pharmacist_id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('User Information', {
            'fields': ('user', 'pharmacist_id')
        }),
        ('Professional Details', {
            'fields': ('license_number', 'pharmacist_level', 'license_expiry_date')
        }),
        ('Education & Certifications', {
            'fields': (
                'pharmacy_school', 'graduation_year', 'degree_type',
                'certifications', 'specializations'
            )
        }),
        ('Employment Information', {
            'fields': ('employment_status', 'hire_date', 'salary', 'years_of_experience')
        }),
        ('Department & Location', {
            'fields': ('department', 'pharmacy_location')
        }),
        ('Permissions & Access', {
            'fields': (
                'can_dispense_controlled_substances', 'can_provide_clinical_consultations',
                'can_modify_prescriptions'
            )
        }),
        ('Management', {
            'fields': ('is_active', 'supervisor')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username
    get_full_name.short_description = 'Full Name'
