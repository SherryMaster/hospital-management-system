from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from phonenumber_field.modelfields import PhoneNumberField
import uuid

User = get_user_model()


class Department(models.Model):
    """
    Hospital Department model
    """

    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    head_of_department = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='departments_headed',
        limit_choices_to={'role': 'doctor'}
    )

    # Contact Information
    phone_number = PhoneNumberField(blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    location = models.CharField(max_length=200, blank=True, null=True)

    # System Information
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'doctors_department'
        verbose_name = 'Department'
        verbose_name_plural = 'Departments'
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return self.name

    def get_doctor_count(self):
        """Get number of doctors in this department"""
        return self.doctors.filter(is_active=True).count()


class Specialization(models.Model):
    """
    Medical Specialization model
    """

    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'doctors_specialization'
        verbose_name = 'Specialization'
        verbose_name_plural = 'Specializations'
        ordering = ['name']

    def __str__(self):
        return self.name


class Doctor(models.Model):
    """
    Doctor model extending User information with medical credentials
    """

    class EmploymentStatus(models.TextChoices):
        FULL_TIME = 'full_time', 'Full Time'
        PART_TIME = 'part_time', 'Part Time'
        CONTRACT = 'contract', 'Contract'
        CONSULTANT = 'consultant', 'Consultant'
        RESIDENT = 'resident', 'Resident'
        INTERN = 'intern', 'Intern'
        RETIRED = 'retired', 'Retired'

    # Primary relationship to User
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='doctor_profile',
        limit_choices_to={'role': 'doctor'}
    )

    # Professional Information
    doctor_id = models.CharField(max_length=20, unique=True)
    license_number = models.CharField(max_length=50, unique=True)

    # Department and Specializations
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='doctors'
    )

    specializations = models.ManyToManyField(
        Specialization,
        related_name='doctors',
        blank=True
    )

    # Education and Experience
    medical_school = models.CharField(max_length=200, blank=True, null=True)
    graduation_year = models.IntegerField(
        validators=[MinValueValidator(1950), MaxValueValidator(2030)],
        blank=True,
        null=True
    )

    residency_program = models.CharField(max_length=200, blank=True, null=True)
    fellowship_program = models.CharField(max_length=200, blank=True, null=True)

    years_of_experience = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(70)],
        default=0
    )

    # Employment Information
    employment_status = models.CharField(
        max_length=20,
        choices=EmploymentStatus.choices,
        default=EmploymentStatus.FULL_TIME
    )

    hire_date = models.DateField(blank=True, null=True)
    salary = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        help_text="Annual salary"
    )

    # Availability and Schedule
    consultation_fee = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=0.00,
        help_text="Standard consultation fee"
    )

    is_accepting_patients = models.BooleanField(
        default=True,
        help_text="Whether the doctor is currently accepting new patients"
    )

    max_patients_per_day = models.IntegerField(
        default=20,
        validators=[MinValueValidator(1), MaxValueValidator(100)]
    )

    # Professional Details
    certifications = models.TextField(
        blank=True,
        null=True,
        help_text="Professional certifications and credentials"
    )

    research_interests = models.TextField(
        blank=True,
        null=True,
        help_text="Areas of research interest"
    )

    publications = models.TextField(
        blank=True,
        null=True,
        help_text="Notable publications and research papers"
    )

    awards = models.TextField(
        blank=True,
        null=True,
        help_text="Awards and recognitions"
    )

    # System Information
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'doctors_doctor'
        verbose_name = 'Doctor'
        verbose_name_plural = 'Doctors'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['doctor_id']),
            models.Index(fields=['license_number']),
            models.Index(fields=['department']),
            models.Index(fields=['employment_status']),
            models.Index(fields=['is_active']),
            models.Index(fields=['is_accepting_patients']),
        ]

    def __str__(self):
        return f"Dr. {self.user.get_full_name()} ({self.doctor_id})"

    def save(self, *args, **kwargs):
        """Override save to generate doctor ID if not provided"""
        if not self.doctor_id:
            self.doctor_id = self.generate_doctor_id()
        super().save(*args, **kwargs)

    def generate_doctor_id(self):
        """Generate unique doctor ID"""
        import datetime
        year = datetime.datetime.now().year
        count = Doctor.objects.filter(
            created_at__year=year
        ).count() + 1
        return f"DR{year}{count:04d}"

    def get_full_name(self):
        """Get doctor's full name with title"""
        return f"Dr. {self.user.get_full_name()}"

    def get_specializations_list(self):
        """Get list of specialization names"""
        return list(self.specializations.values_list('name', flat=True))

    def get_current_patient_count(self):
        """Get current number of patients assigned to this doctor"""
        from apps.appointments.models import Appointment
        from datetime import date
        return Appointment.objects.filter(
            doctor=self.user,
            appointment_date=date.today(),
            status__in=['scheduled', 'in_progress']
        ).count()

    def can_accept_more_patients_today(self):
        """Check if doctor can accept more patients today"""
        return self.get_current_patient_count() < self.max_patients_per_day

    @property
    def age(self):
        """Get doctor's age"""
        return self.user.get_age()
