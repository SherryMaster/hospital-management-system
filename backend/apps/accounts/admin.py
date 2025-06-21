from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom User Admin with enhanced functionality"""

    # List display
    list_display = [
        'username', 'email', 'get_full_name', 'role',
        'is_active', 'is_verified', 'created_at', 'profile_picture_preview'
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

    def get_queryset(self, request):
        """Optimize queryset for admin list view"""
        return super().get_queryset(request).select_related()

    # Actions
    actions = ['activate_users', 'deactivate_users', 'verify_users']

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
