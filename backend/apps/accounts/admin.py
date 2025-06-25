from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import User

# Import Patient and Doctor models for inline editing
try:
    from apps.patients.models import Patient
except ImportError:
    Patient = None

try:
    from apps.doctors.models import Doctor
except ImportError:
    Doctor = None


# Inline admin classes for Patient and Doctor profiles
class PatientInline(admin.StackedInline):
    """Inline admin for Patient profile"""
    model = Patient
    can_delete = False
    verbose_name_plural = 'Patient Profile'
    fields = [
        'patient_id', 'blood_type', 'marital_status', 'height', 'weight',
        'allergies', 'chronic_conditions', 'current_medications', 'is_active'
    ]
    readonly_fields = ['patient_id']


class DoctorInline(admin.StackedInline):
    """Inline admin for Doctor profile"""
    model = Doctor
    can_delete = False
    verbose_name_plural = 'Doctor Profile'
    fields = [
        'doctor_id', 'license_number', 'department', 'employment_status',
        'consultation_fee', 'years_of_experience', 'is_accepting_patients', 'is_active'
    ]
    readonly_fields = ['doctor_id']


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom User Admin with enhanced functionality"""

    # List display
    list_display = [
        'username', 'email', 'get_full_name', 'role',
        'has_profile', 'is_active', 'is_verified', 'created_at', 'profile_picture_preview'
    ]

    # List filters
    list_filter = [
        'role', 'is_active', 'is_verified', 'gender',
        'created_at', 'last_login', 'is_staff', 'is_superuser'
    ]

    # Search fields
    search_fields = [
        'username', 'email', 'first_name', 'last_name',
        'phone_number', 'city', 'state'
    ]

    # Ordering
    ordering = ['-created_at']

    # Readonly fields
    readonly_fields = [
        'created_at', 'updated_at', 'last_login', 'date_joined',
        'last_login_ip', 'profile_picture_preview'
    ]

    # Fieldsets for detailed view
    fieldsets = (
        ('Authentication', {
            'fields': ('username', 'password', 'email', 'is_verified')
        }),
        ('Personal Information', {
            'fields': (
                'first_name', 'middle_name', 'last_name',
                'date_of_birth', 'gender', 'profile_picture', 'profile_picture_preview', 'bio'
            )
        }),
        ('Contact Information', {
            'fields': (
                'phone_number', 'emergency_contact_name',
                'emergency_contact_phone', 'emergency_contact_relationship'
            )
        }),
        ('Address', {
            'fields': (
                'address_line_1', 'address_line_2', 'city',
                'state', 'postal_code', 'country'
            ),
            'classes': ('collapse',)
        }),
        ('System Information', {
            'fields': (
                'role', 'is_active', 'is_staff', 'is_superuser',
                'groups', 'user_permissions'
            )
        }),
        ('Preferences', {
            'fields': (
                'preferred_language', 'timezone', 'receive_notifications',
                'receive_email_updates'
            ),
            'classes': ('collapse',)
        }),
        ('Important Dates', {
            'fields': ('last_login', 'date_joined', 'created_at', 'updated_at', 'last_login_ip'),
            'classes': ('collapse',)
        }),
    )

    # Add fieldsets for creating new users
    add_fieldsets = (
        ('Authentication', {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'role'),
        }),
        ('Personal Information', {
            'classes': ('wide',),
            'fields': ('first_name', 'last_name', 'phone_number'),
        }),
    )

    # Custom methods
    def profile_picture_preview(self, obj):
        """Display profile picture preview in admin"""
        if obj.profile_picture:
            return format_html(
                '<img src="{}" width="50" height="50" style="border-radius: 50%;" />',
                obj.profile_picture.url
            )
        return "No Image"
    profile_picture_preview.short_description = "Profile Picture"

    def has_profile(self, obj):
        """Check if user has associated profile based on role"""
        if obj.role == 'patient' and Patient:
            return hasattr(obj, 'patient_profile')
        elif obj.role == 'doctor' and Doctor:
            return hasattr(obj, 'doctor_profile')
        return True  # Other roles don't need profiles
    has_profile.boolean = True
    has_profile.short_description = "Has Profile"

    def get_queryset(self, request):
        """Optimize queryset for admin list view"""
        qs = super().get_queryset(request).select_related()
        # Prefetch related profiles for better performance
        if Patient:
            qs = qs.prefetch_related('patient_profile')
        if Doctor:
            qs = qs.prefetch_related('doctor_profile')
        return qs

    def get_inlines(self, request, obj):
        """Dynamically add inlines based on user role"""
        inlines = []
        if obj and obj.role == 'patient' and Patient:
            inlines.append(PatientInline)
        elif obj and obj.role == 'doctor' and Doctor:
            inlines.append(DoctorInline)
        return inlines

    # Actions
    actions = ['activate_users', 'deactivate_users', 'verify_users', 'create_missing_profiles']

    def activate_users(self, request, queryset):
        """Bulk activate users"""
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} users were successfully activated.')
    activate_users.short_description = "Activate selected users"

    def deactivate_users(self, request, queryset):
        """Bulk deactivate users"""
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} users were successfully deactivated.')
    deactivate_users.short_description = "Deactivate selected users"

    def verify_users(self, request, queryset):
        """Bulk verify users"""
        updated = queryset.update(is_verified=True)
        self.message_user(request, f'{updated} users were successfully verified.')
    verify_users.short_description = "Verify selected users"

    def create_missing_profiles(self, request, queryset):
        """Create missing Patient/Doctor profiles for selected users"""
        created_patients = 0
        created_doctors = 0
        errors = []

        for user in queryset:
            try:
                if user.role == 'patient' and Patient and not hasattr(user, 'patient_profile'):
                    Patient.objects.create(
                        user=user,
                        blood_type=Patient.BloodType.UNKNOWN,
                        marital_status=Patient.MaritalStatus.SINGLE,
                    )
                    created_patients += 1
                elif user.role == 'doctor' and Doctor and not hasattr(user, 'doctor_profile'):
                    Doctor.objects.create(
                        user=user,
                        license_number=f"LIC{user.id:06d}",
                        employment_status=Doctor.EmploymentStatus.FULL_TIME,
                        consultation_fee=0.00,
                        years_of_experience=0,
                        is_accepting_patients=True,
                    )
                    created_doctors += 1
            except Exception as e:
                errors.append(f"Error creating profile for {user.username}: {str(e)}")

        message = f'Created {created_patients} patient profiles and {created_doctors} doctor profiles.'
        if errors:
            message += f' Errors: {"; ".join(errors)}'

        self.message_user(request, message)
    create_missing_profiles.short_description = "Create missing profiles for selected users"
