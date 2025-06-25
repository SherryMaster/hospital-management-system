from django.contrib.auth.models import AbstractUser, UserManager
from django.db import models
from django.core.validators import RegexValidator
from phonenumber_field.modelfields import PhoneNumberField
from PIL import Image
import os


class CustomUserManager(UserManager):
    """
    Custom user manager for handling user creation with roles
    """

    def create_superuser(self, username, email=None, password=None, **extra_fields):
        """
        Create and save a superuser with admin role
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')  # Set role to admin for superusers

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(username, email, password, **extra_fields)

    def create_user(self, username, email=None, password=None, **extra_fields):
        """
        Create and save a regular user
        """
        if not username:
            raise ValueError('The Username field must be set')

        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user


class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser
    Supports multiple user roles: Admin, Doctor, Patient, Staff
    """

    # Use custom manager
    objects = CustomUserManager()

    # Override email field to make it unique
    email = models.EmailField(
        'email address',
        unique=True,
        help_text='Required. Enter a valid email address.',
        error_messages={
            'unique': "A user with this email address already exists.",
        },
    )

    class UserRole(models.TextChoices):
        ADMIN = 'admin', 'Administrator'
        DOCTOR = 'doctor', 'Doctor'
        PATIENT = 'patient', 'Patient'
        NURSE = 'nurse', 'Nurse'
        RECEPTIONIST = 'receptionist', 'Receptionist'
        PHARMACIST = 'pharmacist', 'Pharmacist'

    class Gender(models.TextChoices):
        MALE = 'M', 'Male'
        FEMALE = 'F', 'Female'
        OTHER = 'O', 'Other'
        PREFER_NOT_TO_SAY = 'P', 'Prefer not to say'

    # Basic Information
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.PATIENT,
        help_text="User role in the hospital system"
    )

    # Personal Information
    middle_name = models.CharField(max_length=50, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    gender = models.CharField(
        max_length=1,
        choices=Gender.choices,
        blank=True,
        null=True
    )

    # Contact Information
    phone_number = PhoneNumberField(
        blank=True,
        null=True,
        help_text="Primary phone number"
    )
    emergency_contact_name = models.CharField(max_length=100, blank=True, null=True)
    emergency_contact_phone = PhoneNumberField(blank=True, null=True)
    emergency_contact_relationship = models.CharField(max_length=50, blank=True, null=True)

    # Address Information
    address_line_1 = models.CharField(max_length=255, blank=True, null=True)
    address_line_2 = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    postal_code = models.CharField(max_length=20, blank=True, null=True)
    country = models.CharField(max_length=100, default='United States')

    # Profile Information
    profile_picture = models.ImageField(
        upload_to='profile_pictures/',
        blank=True,
        null=True,
        help_text="Profile picture (max 5MB)"
    )
    bio = models.TextField(blank=True, null=True, help_text="Brief biography or description")

    # System Information
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False, help_text="Email verification status")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login_ip = models.GenericIPAddressField(blank=True, null=True)

    # Preferences
    preferred_language = models.CharField(max_length=10, default='en')
    timezone = models.CharField(max_length=50, default='UTC')
    receive_notifications = models.BooleanField(default=True)
    receive_email_updates = models.BooleanField(default=True)

    class Meta:
        db_table = 'accounts_user'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['role']),
            models.Index(fields=['email']),
            models.Index(fields=['is_active']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.get_full_name()} ({self.get_role_display()})"

    def get_full_name(self):
        """Return the full name of the user"""
        if self.middle_name:
            return f"{self.first_name} {self.middle_name} {self.last_name}".strip()
        return f"{self.first_name} {self.last_name}".strip() or self.username

    def get_short_name(self):
        """Return the short name for the user"""
        return self.first_name or self.username

    def get_initials(self):
        """Return user initials"""
        first_initial = self.first_name[0] if self.first_name else ''
        last_initial = self.last_name[0] if self.last_name else ''
        return f"{first_initial}{last_initial}".upper() or self.username[0].upper()

    def get_age(self):
        """Calculate and return user's age"""
        if not self.date_of_birth:
            return None
        from datetime import date
        today = date.today()
        return today.year - self.date_of_birth.year - (
            (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )

    def get_full_address(self):
        """Return formatted full address"""
        address_parts = [
            self.address_line_1,
            self.address_line_2,
            self.city,
            self.state,
            self.postal_code,
            self.country
        ]
        return ', '.join(filter(None, address_parts))

    def save(self, *args, **kwargs):
        """Override save to handle profile picture resizing"""
        super().save(*args, **kwargs)

        # Resize profile picture if it exists
        if self.profile_picture:
            img = Image.open(self.profile_picture.path)
            if img.height > 300 or img.width > 300:
                output_size = (300, 300)
                img.thumbnail(output_size)
                img.save(self.profile_picture.path)

    @property
    def is_admin(self):
        return self.role == self.UserRole.ADMIN

    @property
    def is_doctor(self):
        return self.role == self.UserRole.DOCTOR

    @property
    def is_patient(self):
        return self.role == self.UserRole.PATIENT

    @property
    def is_staff_member(self):
        return self.role in [
            self.UserRole.NURSE,
            self.UserRole.RECEPTIONIST,
            self.UserRole.PHARMACIST
        ]
