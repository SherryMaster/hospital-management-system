from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from phonenumber_field.modelfields import PhoneNumberField
import uuid

User = get_user_model()


class Patient(models.Model):
    """
    Patient model extending User information with medical details
    """

    class BloodType(models.TextChoices):
        A_POSITIVE = 'A+', 'A+'
        A_NEGATIVE = 'A-', 'A-'
        B_POSITIVE = 'B+', 'B+'
        B_NEGATIVE = 'B-', 'B-'
        AB_POSITIVE = 'AB+', 'AB+'
        AB_NEGATIVE = 'AB-', 'AB-'
        O_POSITIVE = 'O+', 'O+'
        O_NEGATIVE = 'O-', 'O-'
        UNKNOWN = 'UNK', 'Unknown'

    class MaritalStatus(models.TextChoices):
        SINGLE = 'single', 'Single'
        MARRIED = 'married', 'Married'
        DIVORCED = 'divorced', 'Divorced'
        WIDOWED = 'widowed', 'Widowed'
        SEPARATED = 'separated', 'Separated'
        OTHER = 'other', 'Other'

    # Primary relationship to User
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='patient_profile',
        limit_choices_to={'role': User.UserRole.PATIENT}
    )

    # Patient Identification
    patient_id = models.CharField(
        max_length=20,
        unique=True,
        help_text="Unique patient identifier"
    )

    # Medical Information
    blood_type = models.CharField(
        max_length=3,
        choices=BloodType.choices,
        default=BloodType.UNKNOWN,
        help_text="Patient's blood type"
    )

    height = models.FloatField(
        validators=[MinValueValidator(0.1), MaxValueValidator(3.0)],
        blank=True,
        null=True,
        help_text="Height in meters"
    )

    weight = models.FloatField(
        validators=[MinValueValidator(0.1), MaxValueValidator(1000.0)],
        blank=True,
        null=True,
        help_text="Weight in kilograms"
    )

    # Personal Information
    marital_status = models.CharField(
        max_length=20,
        choices=MaritalStatus.choices,
        blank=True,
        null=True
    )

    occupation = models.CharField(max_length=100, blank=True, null=True)

    # Insurance Information
    insurance_provider = models.CharField(max_length=100, blank=True, null=True)
    insurance_policy_number = models.CharField(max_length=50, blank=True, null=True)
    insurance_group_number = models.CharField(max_length=50, blank=True, null=True)

    # Medical History
    allergies = models.TextField(
        blank=True,
        null=True,
        help_text="Known allergies and reactions"
    )

    chronic_conditions = models.TextField(
        blank=True,
        null=True,
        help_text="Chronic medical conditions"
    )

    current_medications = models.TextField(
        blank=True,
        null=True,
        help_text="Current medications and dosages"
    )

    family_medical_history = models.TextField(
        blank=True,
        null=True,
        help_text="Family medical history"
    )

    surgical_history = models.TextField(
        blank=True,
        null=True,
        help_text="Previous surgeries and procedures"
    )

    # System Information
    registration_date = models.DateTimeField(auto_now_add=True)
    last_visit_date = models.DateTimeField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True, null=True, help_text="Additional notes")

    class Meta:
        db_table = 'patients_patient'
        verbose_name = 'Patient'
        verbose_name_plural = 'Patients'
        ordering = ['-registration_date']
        indexes = [
            models.Index(fields=['patient_id']),
            models.Index(fields=['blood_type']),
            models.Index(fields=['registration_date']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.user.get_full_name()} ({self.patient_id})"

    def save(self, *args, **kwargs):
        """Override save to generate patient ID if not provided"""
        if not self.patient_id:
            self.patient_id = self.generate_patient_id()
        super().save(*args, **kwargs)

    def generate_patient_id(self):
        """Generate unique patient ID"""
        import datetime
        year = datetime.datetime.now().year
        # Get the count of patients registered this year
        count = Patient.objects.filter(
            registration_date__year=year
        ).count() + 1
        return f"P{year}{count:05d}"

    @property
    def age(self):
        """Get patient's age"""
        return self.user.get_age()

    @property
    def bmi(self):
        """Calculate BMI if height and weight are available"""
        if self.height and self.weight:
            return round(self.weight / (self.height ** 2), 2)
        return None

    @property
    def bmi_category(self):
        """Get BMI category"""
        bmi = self.bmi
        if not bmi:
            return None

        if bmi < 18.5:
            return "Underweight"
        elif bmi < 25:
            return "Normal weight"
        elif bmi < 30:
            return "Overweight"
        else:
            return "Obese"

    def get_full_name(self):
        """Get patient's full name"""
        return self.user.get_full_name()

    def get_contact_info(self):
        """Get formatted contact information"""
        return {
            'phone': str(self.user.phone_number) if self.user.phone_number else None,
            'email': self.user.email,
            'address': self.user.get_full_address()
        }


class MedicalRecord(models.Model):
    """
    Medical Record model for tracking patient visits and treatments
    """

    class RecordType(models.TextChoices):
        CONSULTATION = 'consultation', 'Consultation'
        DIAGNOSIS = 'diagnosis', 'Diagnosis'
        TREATMENT = 'treatment', 'Treatment'
        PRESCRIPTION = 'prescription', 'Prescription'
        LAB_RESULT = 'lab_result', 'Lab Result'
        IMAGING = 'imaging', 'Imaging'
        SURGERY = 'surgery', 'Surgery'
        VACCINATION = 'vaccination', 'Vaccination'
        DISCHARGE = 'discharge', 'Discharge Summary'
        OTHER = 'other', 'Other'

    # Relationships
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name='medical_records'
    )

    doctor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='medical_records_created',
        limit_choices_to={'role': 'doctor'}
    )

    # Record Information
    record_id = models.CharField(max_length=20, unique=True)
    record_type = models.CharField(
        max_length=20,
        choices=RecordType.choices,
        default=RecordType.CONSULTATION
    )

    title = models.CharField(max_length=200, help_text="Brief title of the record")
    description = models.TextField(help_text="Detailed description of the visit/treatment")

    # Medical Details
    symptoms = models.TextField(blank=True, null=True)
    diagnosis = models.TextField(blank=True, null=True)
    treatment_plan = models.TextField(blank=True, null=True)
    medications_prescribed = models.TextField(blank=True, null=True)
    follow_up_instructions = models.TextField(blank=True, null=True)

    # Vital Signs
    temperature = models.FloatField(blank=True, null=True, help_text="Temperature in Celsius")
    blood_pressure_systolic = models.IntegerField(blank=True, null=True)
    blood_pressure_diastolic = models.IntegerField(blank=True, null=True)
    heart_rate = models.IntegerField(blank=True, null=True, help_text="Heart rate in BPM")
    respiratory_rate = models.IntegerField(blank=True, null=True, help_text="Breaths per minute")
    oxygen_saturation = models.FloatField(blank=True, null=True, help_text="SpO2 percentage")

    # System Information
    visit_date = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_confidential = models.BooleanField(default=False)

    # File attachments
    attachments = models.FileField(
        upload_to='medical_records/',
        blank=True,
        null=True,
        help_text="Lab results, images, or other documents"
    )

    class Meta:
        db_table = 'patients_medical_record'
        verbose_name = 'Medical Record'
        verbose_name_plural = 'Medical Records'
        ordering = ['-visit_date']
        indexes = [
            models.Index(fields=['record_id']),
            models.Index(fields=['patient', 'visit_date']),
            models.Index(fields=['record_type']),
            models.Index(fields=['visit_date']),
        ]

    def __str__(self):
        return f"{self.patient.get_full_name()} - {self.title} ({self.visit_date.date()})"

    def save(self, *args, **kwargs):
        """Override save to generate record ID if not provided"""
        if not self.record_id:
            self.record_id = self.generate_record_id()
        super().save(*args, **kwargs)

    def generate_record_id(self):
        """Generate unique medical record ID"""
        import datetime
        year = datetime.datetime.now().year
        count = MedicalRecord.objects.filter(
            created_at__year=year
        ).count() + 1
        return f"MR{year}{count:06d}"

    @property
    def blood_pressure(self):
        """Get formatted blood pressure"""
        if self.blood_pressure_systolic and self.blood_pressure_diastolic:
            return f"{self.blood_pressure_systolic}/{self.blood_pressure_diastolic}"
        return None

    def get_vital_signs(self):
        """Get all vital signs as a dictionary"""
        return {
            'temperature': self.temperature,
            'blood_pressure': self.blood_pressure,
            'heart_rate': self.heart_rate,
            'respiratory_rate': self.respiratory_rate,
            'oxygen_saturation': self.oxygen_saturation,
        }
