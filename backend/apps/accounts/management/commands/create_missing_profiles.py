"""
Management command to create missing Patient and Doctor profiles for existing users.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.patients.models import Patient
from apps.doctors.models import Doctor

User = get_user_model()


class Command(BaseCommand):
    help = 'Create missing Patient and Doctor profiles for existing users'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be created without actually creating profiles',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No profiles will be created'))
        
        # Find patient users without profiles
        patient_users_without_profiles = User.objects.filter(
            role='patient'
        ).exclude(
            id__in=Patient.objects.values_list('user_id', flat=True)
        )
        
        # Find doctor users without profiles
        doctor_users_without_profiles = User.objects.filter(
            role='doctor'
        ).exclude(
            id__in=Doctor.objects.values_list('user_id', flat=True)
        )
        
        self.stdout.write(f'Found {patient_users_without_profiles.count()} patient users without profiles')
        self.stdout.write(f'Found {doctor_users_without_profiles.count()} doctor users without profiles')
        
        if not dry_run:
            # Create patient profiles
            created_patients = 0
            for user in patient_users_without_profiles:
                try:
                    patient = Patient.objects.create(
                        user=user,
                        blood_type=Patient.BloodType.UNKNOWN,
                        marital_status=Patient.MaritalStatus.SINGLE,
                    )
                    created_patients += 1
                    self.stdout.write(
                        self.style.SUCCESS(f'Created patient profile for {user.username} (ID: {patient.patient_id})')
                    )
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f'Failed to create patient profile for {user.username}: {str(e)}')
                    )
            
            # Create doctor profiles
            created_doctors = 0
            for user in doctor_users_without_profiles:
                try:
                    doctor = Doctor.objects.create(
                        user=user,
                        license_number=f"LIC{user.id:06d}",
                        employment_status=Doctor.EmploymentStatus.FULL_TIME,
                        consultation_fee=0.00,
                        years_of_experience=0,
                        is_accepting_patients=True,
                    )
                    created_doctors += 1
                    self.stdout.write(
                        self.style.SUCCESS(f'Created doctor profile for {user.username} (ID: {doctor.doctor_id})')
                    )
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f'Failed to create doctor profile for {user.username}: {str(e)}')
                    )
            
            self.stdout.write(
                self.style.SUCCESS(f'Successfully created {created_patients} patient profiles and {created_doctors} doctor profiles')
            )
        else:
            # Show what would be created
            for user in patient_users_without_profiles:
                self.stdout.write(f'Would create patient profile for: {user.username} ({user.email})')
            
            for user in doctor_users_without_profiles:
                self.stdout.write(f'Would create doctor profile for: {user.username} ({user.email})')
