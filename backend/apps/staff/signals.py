"""
Signal handlers for staff profile creation
"""

import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model

from .models import Administrator, Nurse, Receptionist, Pharmacist

User = get_user_model()
logger = logging.getLogger(__name__)


@receiver(post_save, sender=User)
def create_staff_profile(sender, instance, created, **kwargs):
    """
    Create appropriate staff profile when a staff user is created
    """
    if not created:
        return
    
    try:
        # Create Administrator profile for admin users
        if instance.role == User.UserRole.ADMIN and not hasattr(instance, 'admin_profile'):
            admin = Administrator.objects.create(
                user=instance,
                employee_id=f"EMP{instance.id:06d}",
                access_level=Administrator.AccessLevel.SYSTEM_ADMIN,
                department="Administration"
            )
            logger.info(f"Administrator profile created for user: {instance.username} (ID: {admin.admin_id})")
        
        # Create Nurse profile for nurse users
        elif instance.role == User.UserRole.NURSE and not hasattr(instance, 'nurse_profile'):
            nurse = Nurse.objects.create(
                user=instance,
                license_number=f"NUR{instance.id:06d}",
                department="General Nursing",
                nursing_level=Nurse.NursingLevel.RN,
                employment_status=Nurse.EmploymentStatus.FULL_TIME,
                shift_preference=Nurse.ShiftType.DAY,
                years_of_experience=0
            )
            logger.info(f"Nurse profile created for user: {instance.username} (ID: {nurse.nurse_id})")
        
        # Create Receptionist profile for receptionist users
        elif instance.role == User.UserRole.RECEPTIONIST and not hasattr(instance, 'receptionist_profile'):
            receptionist = Receptionist.objects.create(
                user=instance,
                employee_id=f"EMP{instance.id:06d}",
                department="Front Desk",
                employment_status=Receptionist.EmploymentStatus.FULL_TIME,
                shift_preference=Receptionist.ShiftType.MORNING,
                can_schedule_appointments=True
            )
            logger.info(f"Receptionist profile created for user: {instance.username} (ID: {receptionist.receptionist_id})")
        
        # Create Pharmacist profile for pharmacist users
        elif instance.role == User.UserRole.PHARMACIST and not hasattr(instance, 'pharmacist_profile'):
            pharmacist = Pharmacist.objects.create(
                user=instance,
                license_number=f"PHA{instance.id:06d}",
                pharmacist_level=Pharmacist.PharmacistLevel.STAFF,
                employment_status=Pharmacist.EmploymentStatus.FULL_TIME,
                department="Pharmacy",
                years_of_experience=0,
                can_dispense_controlled_substances=True
            )
            logger.info(f"Pharmacist profile created for user: {instance.username} (ID: {pharmacist.pharmacist_id})")
            
    except Exception as e:
        logger.error(f"Failed to create staff profile for {instance.username}: {str(e)}")


@receiver(post_save, sender=User)
def update_staff_permissions(sender, instance, created, **kwargs):
    """
    Update user permissions based on role
    """
    if instance.role == User.UserRole.ADMIN:
        instance.is_staff = True
        instance.is_superuser = True
    elif instance.role in [User.UserRole.NURSE, User.UserRole.RECEPTIONIST, User.UserRole.PHARMACIST]:
        instance.is_staff = True
        instance.is_superuser = False
    elif instance.role in [User.UserRole.DOCTOR, User.UserRole.PATIENT]:
        # Doctors and patients handled by their respective apps
        pass
