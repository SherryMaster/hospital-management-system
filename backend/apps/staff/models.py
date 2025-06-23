from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from phonenumber_field.modelfields import PhoneNumberField
import uuid

User = get_user_model()


class Administrator(models.Model):
    """
    Administrator profile model for admin users
    """
    
    class AccessLevel(models.TextChoices):
        SUPER_ADMIN = 'super_admin', 'Super Administrator'
        SYSTEM_ADMIN = 'system_admin', 'System Administrator'
        DEPARTMENT_ADMIN = 'department_admin', 'Department Administrator'
        DATA_ADMIN = 'data_admin', 'Data Administrator'
    
    # Primary relationship to User
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='admin_profile',
        limit_choices_to={'role': User.UserRole.ADMIN}
    )
    
    # Professional Information
    admin_id = models.CharField(max_length=20, unique=True)
    employee_id = models.CharField(max_length=50, unique=True)
    
    # Access and Permissions
    access_level = models.CharField(
        max_length=20,
        choices=AccessLevel.choices,
        default=AccessLevel.SYSTEM_ADMIN
    )
    
    # Department Assignment
    department = models.CharField(max_length=100, blank=True, null=True)
    
    # Employment Information
    hire_date = models.DateField(blank=True, null=True)
    salary = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        help_text="Annual salary"
    )
    
    # Contact Information
    office_phone = PhoneNumberField(blank=True, null=True)
    office_location = models.CharField(max_length=200, blank=True, null=True)
    
    # System Access
    system_permissions = models.JSONField(default=dict, blank=True)
    last_system_access = models.DateTimeField(blank=True, null=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        if not self.admin_id:
            self.admin_id = f"ADM{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.admin_id}"
    
    class Meta:
        verbose_name = "Administrator"
        verbose_name_plural = "Administrators"


class Nurse(models.Model):
    """
    Nurse profile model for nursing staff
    """
    
    class NursingLevel(models.TextChoices):
        CNA = 'cna', 'Certified Nursing Assistant'
        LPN = 'lpn', 'Licensed Practical Nurse'
        RN = 'rn', 'Registered Nurse'
        BSN = 'bsn', 'Bachelor of Science in Nursing'
        MSN = 'msn', 'Master of Science in Nursing'
        NP = 'np', 'Nurse Practitioner'
    
    class ShiftType(models.TextChoices):
        DAY = 'day', 'Day Shift (7AM-7PM)'
        NIGHT = 'night', 'Night Shift (7PM-7AM)'
        ROTATING = 'rotating', 'Rotating Shifts'
        ON_CALL = 'on_call', 'On-Call'
    
    class EmploymentStatus(models.TextChoices):
        FULL_TIME = 'full_time', 'Full Time'
        PART_TIME = 'part_time', 'Part Time'
        CONTRACT = 'contract', 'Contract'
        PER_DIEM = 'per_diem', 'Per Diem'
        TRAVEL = 'travel', 'Travel Nurse'
    
    # Primary relationship to User
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='nurse_profile',
        limit_choices_to={'role': User.UserRole.NURSE}
    )
    
    # Professional Information
    nurse_id = models.CharField(max_length=20, unique=True)
    license_number = models.CharField(max_length=50, unique=True)
    nursing_level = models.CharField(
        max_length=10,
        choices=NursingLevel.choices,
        default=NursingLevel.RN
    )
    
    # Department and Specialization
    department = models.CharField(max_length=100)
    unit = models.CharField(max_length=100, blank=True, null=True)
    specializations = models.JSONField(default=list, blank=True)
    
    # Education and Certifications
    nursing_school = models.CharField(max_length=200, blank=True, null=True)
    graduation_year = models.IntegerField(
        validators=[MinValueValidator(1950), MaxValueValidator(2030)],
        blank=True,
        null=True
    )
    certifications = models.JSONField(default=list, blank=True)
    license_expiry_date = models.DateField(blank=True, null=True)
    
    # Employment Information
    employment_status = models.CharField(
        max_length=20,
        choices=EmploymentStatus.choices,
        default=EmploymentStatus.FULL_TIME
    )
    hire_date = models.DateField(blank=True, null=True)
    hourly_rate = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        blank=True,
        null=True
    )
    
    # Schedule and Availability
    shift_preference = models.CharField(
        max_length=20,
        choices=ShiftType.choices,
        default=ShiftType.DAY
    )
    years_of_experience = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(50)],
        default=0
    )
    
    # Performance and Status
    is_active = models.BooleanField(default=True)
    supervisor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='supervised_nurses',
        limit_choices_to={'role__in': [User.UserRole.ADMIN, User.UserRole.NURSE]}
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        if not self.nurse_id:
            self.nurse_id = f"NUR{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.nurse_id}"
    
    class Meta:
        verbose_name = "Nurse"
        verbose_name_plural = "Nurses"


class Receptionist(models.Model):
    """
    Receptionist profile model for front desk staff
    """
    
    class ShiftType(models.TextChoices):
        MORNING = 'morning', 'Morning Shift (6AM-2PM)'
        AFTERNOON = 'afternoon', 'Afternoon Shift (2PM-10PM)'
        EVENING = 'evening', 'Evening Shift (10PM-6AM)'
        ROTATING = 'rotating', 'Rotating Shifts'
    
    class EmploymentStatus(models.TextChoices):
        FULL_TIME = 'full_time', 'Full Time'
        PART_TIME = 'part_time', 'Part Time'
        CONTRACT = 'contract', 'Contract'
        TEMPORARY = 'temporary', 'Temporary'
    
    # Primary relationship to User
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='receptionist_profile',
        limit_choices_to={'role': User.UserRole.RECEPTIONIST}
    )
    
    # Professional Information
    receptionist_id = models.CharField(max_length=20, unique=True)
    employee_id = models.CharField(max_length=50, unique=True)
    
    # Department and Location
    department = models.CharField(max_length=100)
    desk_location = models.CharField(max_length=100, blank=True, null=True)
    
    # Employment Information
    employment_status = models.CharField(
        max_length=20,
        choices=EmploymentStatus.choices,
        default=EmploymentStatus.FULL_TIME
    )
    hire_date = models.DateField(blank=True, null=True)
    hourly_rate = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        blank=True,
        null=True
    )
    
    # Schedule and Availability
    shift_preference = models.CharField(
        max_length=20,
        choices=ShiftType.choices,
        default=ShiftType.MORNING
    )
    
    # Skills and Certifications
    languages_spoken = models.JSONField(default=list, blank=True)
    computer_skills = models.JSONField(default=list, blank=True)
    certifications = models.JSONField(default=list, blank=True)
    
    # Access and Permissions
    system_access_level = models.CharField(max_length=50, default='basic')
    can_schedule_appointments = models.BooleanField(default=True)
    can_handle_billing = models.BooleanField(default=False)
    can_access_medical_records = models.BooleanField(default=False)
    
    # Performance and Status
    is_active = models.BooleanField(default=True)
    supervisor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='supervised_receptionists',
        limit_choices_to={'role__in': [User.UserRole.ADMIN, User.UserRole.RECEPTIONIST]}
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        if not self.receptionist_id:
            self.receptionist_id = f"REC{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.receptionist_id}"
    
    class Meta:
        verbose_name = "Receptionist"
        verbose_name_plural = "Receptionists"


class Pharmacist(models.Model):
    """
    Pharmacist profile model for pharmacy staff
    """
    
    class PharmacistLevel(models.TextChoices):
        STAFF = 'staff', 'Staff Pharmacist'
        CLINICAL = 'clinical', 'Clinical Pharmacist'
        CONSULTANT = 'consultant', 'Consultant Pharmacist'
        CHIEF = 'chief', 'Chief Pharmacist'
    
    class EmploymentStatus(models.TextChoices):
        FULL_TIME = 'full_time', 'Full Time'
        PART_TIME = 'part_time', 'Part Time'
        CONTRACT = 'contract', 'Contract'
        CONSULTANT = 'consultant', 'Consultant'
    
    # Primary relationship to User
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='pharmacist_profile',
        limit_choices_to={'role': User.UserRole.PHARMACIST}
    )
    
    # Professional Information
    pharmacist_id = models.CharField(max_length=20, unique=True)
    license_number = models.CharField(max_length=50, unique=True)
    pharmacist_level = models.CharField(
        max_length=20,
        choices=PharmacistLevel.choices,
        default=PharmacistLevel.STAFF
    )
    
    # Education and Certifications
    pharmacy_school = models.CharField(max_length=200, blank=True, null=True)
    graduation_year = models.IntegerField(
        validators=[MinValueValidator(1950), MaxValueValidator(2030)],
        blank=True,
        null=True
    )
    degree_type = models.CharField(max_length=50, blank=True, null=True)  # PharmD, BS Pharmacy, etc.
    certifications = models.JSONField(default=list, blank=True)
    specializations = models.JSONField(default=list, blank=True)
    license_expiry_date = models.DateField(blank=True, null=True)
    
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
    
    # Department and Location
    department = models.CharField(max_length=100, default='Pharmacy')
    pharmacy_location = models.CharField(max_length=100, blank=True, null=True)
    
    # Experience and Skills
    years_of_experience = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(50)],
        default=0
    )
    
    # Permissions and Access
    can_dispense_controlled_substances = models.BooleanField(default=True)
    can_provide_clinical_consultations = models.BooleanField(default=False)
    can_modify_prescriptions = models.BooleanField(default=False)
    
    # Performance and Status
    is_active = models.BooleanField(default=True)
    supervisor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='supervised_pharmacists',
        limit_choices_to={'role__in': [User.UserRole.ADMIN, User.UserRole.PHARMACIST]}
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        if not self.pharmacist_id:
            self.pharmacist_id = f"PHA{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.pharmacist_id}"
    
    class Meta:
        verbose_name = "Pharmacist"
        verbose_name_plural = "Pharmacists"
