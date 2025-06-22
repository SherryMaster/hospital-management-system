from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

# Import Patient and Doctor models for auto profile creation
try:
    from apps.patients.models import Patient
except ImportError:
    Patient = None

try:
    from apps.doctors.models import Doctor
except ImportError:
    Doctor = None


@receiver(post_save, sender=User)
def user_post_save(sender, instance, created, **kwargs):
    """
    Signal handler for User post_save
    Handles user creation and update events
    """
    if created:
        # Log user creation
        logger.info(f"New user created: {instance.username} ({instance.role})")

        # Auto-create Patient profile for patient users
        if instance.role == 'patient' and Patient:
            try:
                # Check if patient profile already exists
                if not hasattr(instance, 'patient_profile'):
                    patient = Patient.objects.create(
                        user=instance,
                        # Set basic required fields with defaults
                        blood_type=Patient.BloodType.UNKNOWN,
                        marital_status=Patient.MaritalStatus.SINGLE,
                    )
                    logger.info(f"Patient profile created for user: {instance.username} (ID: {patient.patient_id})")
            except Exception as e:
                logger.error(f"Failed to create patient profile for {instance.username}: {str(e)}")

        # Auto-create Doctor profile for doctor users
        elif instance.role == 'doctor' and Doctor:
            try:
                # Check if doctor profile already exists
                if not hasattr(instance, 'doctor_profile'):
                    doctor = Doctor.objects.create(
                        user=instance,
                        # Set basic required fields with defaults
                        license_number=f"LIC{instance.id:06d}",  # Temporary license number
                        employment_status=Doctor.EmploymentStatus.FULL_TIME,
                        consultation_fee=0.00,
                        years_of_experience=0,
                        is_accepting_patients=True,
                    )
                    logger.info(f"Doctor profile created for user: {instance.username} (ID: {doctor.doctor_id})")
            except Exception as e:
                logger.error(f"Failed to create doctor profile for {instance.username}: {str(e)}")

        # Send welcome email (if email backend is configured)
        if instance.email and settings.EMAIL_BACKEND != 'django.core.mail.backends.console.EmailBackend':
            try:
                send_mail(
                    subject=f'Welcome to {settings.HOSPITAL_NAME}',
                    message=f'Hello {instance.get_full_name()},\n\n'
                           f'Welcome to {settings.HOSPITAL_NAME}! Your account has been created successfully.\n\n'
                           f'Username: {instance.username}\n'
                           f'Role: {instance.get_role_display()}\n\n'
                           f'Please log in to complete your profile.\n\n'
                           f'Best regards,\n{settings.HOSPITAL_NAME} Team',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[instance.email],
                    fail_silently=True,
                )
                logger.info(f"Welcome email sent to {instance.email}")
            except Exception as e:
                logger.error(f"Failed to send welcome email to {instance.email}: {str(e)}")

    else:
        # Log user update
        logger.info(f"User updated: {instance.username}")


@receiver(pre_save, sender=User)
def user_pre_save(sender, instance, **kwargs):
    """
    Signal handler for User pre_save
    Handles data validation and cleanup before saving
    """
    # Ensure email is lowercase
    if instance.email:
        instance.email = instance.email.lower().strip()
    
    # Clean up name fields
    if instance.first_name:
        instance.first_name = instance.first_name.strip().title()
    if instance.middle_name:
        instance.middle_name = instance.middle_name.strip().title()
    if instance.last_name:
        instance.last_name = instance.last_name.strip().title()
    
    # Set staff status based on role
    if instance.role == 'admin':
        instance.is_staff = True
        instance.is_superuser = True
    elif instance.role in ['doctor', 'nurse', 'receptionist', 'pharmacist']:
        instance.is_staff = True
        instance.is_superuser = False
    else:
        instance.is_staff = False
        instance.is_superuser = False
