"""
Management command to fix existing superuser roles and profiles
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction

User = get_user_model()

# Import models
try:
    from apps.staff.models import Administrator
except ImportError:
    Administrator = None

try:
    from apps.patients.models import Patient
except ImportError:
    Patient = None


class Command(BaseCommand):
    help = 'Fix existing superuser roles and profiles'

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            help='Username of the superuser to fix',
        )

    def handle(self, *args, **options):
        username = options.get('username')
        
        if username:
            users = User.objects.filter(username=username, is_superuser=True)
        else:
            users = User.objects.filter(is_superuser=True)
        
        if not users.exists():
            self.stdout.write(
                self.style.WARNING('No superusers found to fix.')
            )
            return
        
        for user in users:
            self.stdout.write(f"Fixing superuser: {user.username}")
            
            with transaction.atomic():
                # Fix role
                if user.role != User.UserRole.ADMIN:
                    old_role = user.role
                    user.role = User.UserRole.ADMIN
                    user.save()
                    self.stdout.write(
                        self.style.SUCCESS(f"  ✓ Changed role from '{old_role}' to 'admin'")
                    )
                
                # Remove patient profile if exists
                if hasattr(user, 'patient_profile') and Patient:
                    patient_id = user.patient_profile.patient_id
                    user.patient_profile.delete()
                    self.stdout.write(
                        self.style.SUCCESS(f"  ✓ Removed patient profile (ID: {patient_id})")
                    )
                
                # Create admin profile if doesn't exist
                if not hasattr(user, 'admin_profile') and Administrator:
                    admin = Administrator.objects.create(
                        user=user,
                        employee_id=f"EMP{user.id:06d}",
                        access_level=Administrator.AccessLevel.SUPER_ADMIN,
                        department="Administration"
                    )
                    self.stdout.write(
                        self.style.SUCCESS(f"  ✓ Created admin profile (ID: {admin.admin_id})")
                    )
                elif hasattr(user, 'admin_profile'):
                    self.stdout.write(
                        self.style.WARNING(f"  - Admin profile already exists (ID: {user.admin_profile.admin_id})")
                    )
                
                # Ensure proper permissions
                if not user.is_staff:
                    user.is_staff = True
                    user.save()
                    self.stdout.write(
                        self.style.SUCCESS("  ✓ Set is_staff to True")
                    )
                
                self.stdout.write(
                    self.style.SUCCESS(f"✅ Successfully fixed superuser: {user.username}")
                )
        
        self.stdout.write(
            self.style.SUCCESS(f"\n🎉 Fixed {users.count()} superuser(s) successfully!")
        )
