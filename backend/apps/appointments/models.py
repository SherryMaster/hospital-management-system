from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from datetime import datetime, timedelta, time
import uuid

User = get_user_model()


class Appointment(models.Model):
    """
    Appointment model for scheduling patient visits
    """

    class Status(models.TextChoices):
        SCHEDULED = 'scheduled', 'Scheduled'
        CONFIRMED = 'confirmed', 'Confirmed'
        IN_PROGRESS = 'in_progress', 'In Progress'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'
        NO_SHOW = 'no_show', 'No Show'
        RESCHEDULED = 'rescheduled', 'Rescheduled'

    class Priority(models.TextChoices):
        LOW = 'low', 'Low'
        NORMAL = 'normal', 'Normal'
        HIGH = 'high', 'High'
        URGENT = 'urgent', 'Urgent'
        EMERGENCY = 'emergency', 'Emergency'

    class AppointmentType(models.TextChoices):
        CONSULTATION = 'consultation', 'Consultation'
        FOLLOW_UP = 'follow_up', 'Follow-up'
        CHECKUP = 'checkup', 'Regular Checkup'
        PROCEDURE = 'procedure', 'Medical Procedure'
        SURGERY = 'surgery', 'Surgery'
        EMERGENCY = 'emergency', 'Emergency'
        TELEMEDICINE = 'telemedicine', 'Telemedicine'

    # Relationships
    patient = models.ForeignKey(
        'patients.Patient',
        on_delete=models.CASCADE,
        related_name='appointments'
    )

    doctor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='doctor_appointments',
        limit_choices_to={'role': 'doctor'}
    )

    department = models.ForeignKey(
        'doctors.Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='appointments'
    )

    # Appointment Details
    appointment_id = models.CharField(max_length=20, unique=True)
    appointment_date = models.DateField()
    appointment_time = models.TimeField()

    duration = models.IntegerField(
        default=30,
        validators=[MinValueValidator(15), MaxValueValidator(480)],
        help_text="Duration in minutes"
    )

    appointment_type = models.CharField(
        max_length=20,
        choices=AppointmentType.choices,
        default=AppointmentType.CONSULTATION
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.SCHEDULED
    )

    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.NORMAL
    )

    # Appointment Information
    chief_complaint = models.TextField(
        help_text="Patient's main concern or reason for visit"
    )

    symptoms = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True, help_text="Additional notes")

    # Follow-up Information
    is_follow_up = models.BooleanField(default=False)
    previous_appointment = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='follow_up_appointments'
    )

    # System Information
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='appointments_created'
    )

    # Cancellation Information
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancelled_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='appointments_cancelled'
    )
    cancellation_reason = models.TextField(blank=True, null=True)

    # Reminder Information
    reminder_sent = models.BooleanField(default=False)
    reminder_sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'appointments_appointment'
        verbose_name = 'Appointment'
        verbose_name_plural = 'Appointments'
        ordering = ['appointment_date', 'appointment_time']
        indexes = [
            models.Index(fields=['appointment_id']),
            models.Index(fields=['patient', 'appointment_date']),
            models.Index(fields=['doctor', 'appointment_date']),
            models.Index(fields=['appointment_date', 'appointment_time']),
            models.Index(fields=['status']),
            models.Index(fields=['priority']),
        ]

        # Ensure no double booking for the same doctor at the same time
        constraints = [
            models.UniqueConstraint(
                fields=['doctor', 'appointment_date', 'appointment_time'],
                condition=models.Q(status__in=['scheduled', 'confirmed', 'in_progress']),
                name='unique_doctor_appointment_time'
            )
        ]

    def __str__(self):
        return f"{self.patient.get_full_name()} - Dr. {self.doctor.get_full_name()} ({self.appointment_date} {self.appointment_time})"

    def save(self, *args, **kwargs):
        """Override save to generate appointment ID and validate"""
        if not self.appointment_id:
            self.appointment_id = self.generate_appointment_id()

        # Set department from doctor if not provided
        if not self.department and hasattr(self.doctor, 'doctor_profile'):
            self.department = self.doctor.doctor_profile.department

        self.clean()
        super().save(*args, **kwargs)

    def clean(self):
        """Validate appointment data"""
        # Check if appointment is in the past
        if self.appointment_date and self.appointment_time:
            appointment_datetime = datetime.combine(self.appointment_date, self.appointment_time)
            if appointment_datetime < datetime.now():
                raise ValidationError("Cannot schedule appointments in the past")

        # Check doctor availability
        if self.doctor and hasattr(self.doctor, 'doctor_profile'):
            if not self.doctor.doctor_profile.is_accepting_patients:
                raise ValidationError("This doctor is not currently accepting patients")

    def generate_appointment_id(self):
        """Generate unique appointment ID"""
        import datetime
        year = datetime.datetime.now().year
        count = Appointment.objects.filter(
            created_at__year=year
        ).count() + 1
        return f"APT{year}{count:06d}"

    @property
    def end_time(self):
        """Calculate appointment end time"""
        start_datetime = datetime.combine(self.appointment_date, self.appointment_time)
        end_datetime = start_datetime + timedelta(minutes=self.duration)
        return end_datetime.time()

    @property
    def is_today(self):
        """Check if appointment is today"""
        from datetime import date
        return self.appointment_date == date.today()

    @property
    def is_upcoming(self):
        """Check if appointment is in the future"""
        appointment_datetime = datetime.combine(self.appointment_date, self.appointment_time)
        return appointment_datetime > datetime.now()

    @property
    def is_past(self):
        """Check if appointment is in the past"""
        appointment_datetime = datetime.combine(self.appointment_date, self.appointment_time)
        return appointment_datetime < datetime.now()

    def can_be_cancelled(self):
        """Check if appointment can be cancelled"""
        return self.status in ['scheduled', 'confirmed'] and self.is_upcoming

    def can_be_rescheduled(self):
        """Check if appointment can be rescheduled"""
        return self.status in ['scheduled', 'confirmed'] and self.is_upcoming

    def get_duration_display(self):
        """Get formatted duration"""
        hours = self.duration // 60
        minutes = self.duration % 60
        if hours > 0:
            return f"{hours}h {minutes}m" if minutes > 0 else f"{hours}h"
        return f"{minutes}m"
