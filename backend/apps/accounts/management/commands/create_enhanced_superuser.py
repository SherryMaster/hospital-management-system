"""
Enhanced createsuperuser management command that collects complete admin profile information
"""

import getpass
import sys
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import transaction
from phonenumber_field.phonenumber import PhoneNumber

User = get_user_model()

# Import staff models
try:
    from apps.staff.models import Administrator
except ImportError:
    Administrator = None


class Command(BaseCommand):
    help = 'Create a superuser with complete admin profile information (Enhanced version)'
    requires_migrations_checks = True

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.UserModel = User

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            help='Specifies the login for the superuser.',
        )
        parser.add_argument(
            '--email',
            help='Specifies the email for the superuser.',
        )
        parser.add_argument(
            '--noinput', '--no-input',
            action='store_false',
            dest='interactive',
            help='Tells Django to NOT prompt the user for input of any kind.',
        )

    def handle(self, *args, **options):
        username = options['username']
        email = options['email']
        interactive = options['interactive']

        # Do quick and dirty validation if --noinput
        if not interactive:
            if username is None:
                raise CommandError("You must use --username with --noinput.")
            if email is None:
                raise CommandError("You must use --email with --noinput.")

        password = None
        user_data = {}
        admin_data = {}

        # Prompt for username
        if interactive and not username:
            username = self._get_input_data(
                'Username',
                default='admin',
                validator=self._validate_username
            )

        # Prompt for email
        if interactive and not email:
            email = self._get_input_data(
                'Email address',
                validator=self._validate_email
            )

        if interactive:
            # Collect basic user information
            self.stdout.write("\n" + "="*50)
            self.stdout.write("BASIC INFORMATION")
            self.stdout.write("="*50)
            
            user_data['first_name'] = self._get_input_data(
                'First name',
                required=True
            )
            user_data['middle_name'] = self._get_input_data(
                'Middle name (optional)',
                required=False
            )
            user_data['last_name'] = self._get_input_data(
                'Last name',
                required=True
            )
            user_data['date_of_birth'] = self._get_date_input(
                'Date of birth (YYYY-MM-DD)',
                required=True
            )
            user_data['gender'] = self._get_choice_input(
                'Gender',
                choices=[('M', 'Male'), ('F', 'Female'), ('O', 'Other'), ('P', 'Prefer not to say')],
                required=True
            )

            # Contact information
            self.stdout.write("\n" + "="*50)
            self.stdout.write("CONTACT INFORMATION")
            self.stdout.write("="*50)
            
            user_data['phone_number'] = self._get_phone_input(
                'Phone number',
                required=True
            )

            # Address information
            self.stdout.write("\n" + "="*50)
            self.stdout.write("ADDRESS INFORMATION")
            self.stdout.write("="*50)
            
            user_data['address_line_1'] = self._get_input_data(
                'Address line 1',
                required=True
            )
            user_data['address_line_2'] = self._get_input_data(
                'Address line 2 (optional)',
                required=False
            )
            user_data['city'] = self._get_input_data(
                'City',
                required=True
            )
            user_data['state'] = self._get_input_data(
                'State/Province',
                required=True
            )
            user_data['postal_code'] = self._get_input_data(
                'Postal code',
                required=True
            )
            user_data['country'] = self._get_input_data(
                'Country',
                default='Pakistan',
                required=True
            )

            # Emergency contact
            self.stdout.write("\n" + "="*50)
            self.stdout.write("EMERGENCY CONTACT")
            self.stdout.write("="*50)
            
            user_data['emergency_contact_name'] = self._get_input_data(
                'Emergency contact name',
                required=True
            )
            user_data['emergency_contact_phone'] = self._get_phone_input(
                'Emergency contact phone',
                required=True
            )
            user_data['emergency_contact_relationship'] = self._get_input_data(
                'Emergency contact relationship',
                required=True
            )

            # Admin-specific information
            if Administrator:
                self.stdout.write("\n" + "="*50)
                self.stdout.write("ADMINISTRATOR INFORMATION")
                self.stdout.write("="*50)
                
                admin_data['employee_id'] = self._get_input_data(
                    'Employee ID',
                    required=True
                )
                admin_data['access_level'] = self._get_choice_input(
                    'Access level',
                    choices=Administrator.AccessLevel.choices,
                    default='super_admin',
                    required=True
                )
                admin_data['department'] = self._get_input_data(
                    'Department',
                    default='Administration',
                    required=True
                )
                admin_data['office_phone'] = self._get_phone_input(
                    'Office phone (optional)',
                    required=False
                )
                admin_data['office_location'] = self._get_input_data(
                    'Office location (optional)',
                    required=False
                )

        # Get password
        if interactive:
            self.stdout.write("\n" + "="*50)
            self.stdout.write("SECURITY")
            self.stdout.write("="*50)
            
            while password is None:
                password = getpass.getpass('Password: ')
                password2 = getpass.getpass('Password (again): ')
                if password != password2:
                    self.stderr.write("Error: Your passwords didn't match.")
                    password = None
                    continue
                if password.strip() == '':
                    self.stderr.write("Error: Blank passwords aren't allowed.")
                    password = None
                    continue
        else:
            password = getpass.getpass('Password: ')

        # Create the user
        try:
            with transaction.atomic():
                user = self.UserModel.objects.create_superuser(
                    username=username,
                    email=email,
                    password=password,
                    role=User.UserRole.ADMIN,
                    **user_data
                )

                # Create admin profile if Administrator model is available
                if Administrator and admin_data:
                    Administrator.objects.create(
                        user=user,
                        **admin_data
                    )

                self.stdout.write(
                    self.style.SUCCESS(
                        f'Superuser "{username}" created successfully with complete profile!'
                    )
                )

        except Exception as e:
            raise CommandError(f'Error creating superuser: {str(e)}')

    def _get_input_data(self, field_name, default=None, required=True, validator=None):
        """Get input data with validation"""
        while True:
            if default:
                prompt = f'{field_name} (default: {default}): '
            else:
                prompt = f'{field_name}: '
            
            value = input(prompt).strip()
            
            if not value and default:
                value = default
            
            if not value and required:
                self.stderr.write(f"Error: {field_name} is required.")
                continue
            
            if validator:
                try:
                    validator(value)
                except ValidationError as e:
                    self.stderr.write(f"Error: {e.message}")
                    continue
            
            return value

    def _get_choice_input(self, field_name, choices, default=None, required=True):
        """Get choice input with validation"""
        self.stdout.write(f"\nAvailable choices for {field_name}:")
        for value, label in choices:
            marker = " (default)" if value == default else ""
            self.stdout.write(f"  {value}: {label}{marker}")
        
        while True:
            value = input(f'{field_name}: ').strip()
            
            if not value and default:
                value = default
            
            if not value and required:
                self.stderr.write(f"Error: {field_name} is required.")
                continue
            
            valid_choices = [choice[0] for choice in choices]
            if value not in valid_choices:
                self.stderr.write(f"Error: Invalid choice. Choose from: {', '.join(valid_choices)}")
                continue
            
            return value

    def _get_date_input(self, field_name, required=True):
        """Get date input with validation"""
        while True:
            value = input(f'{field_name}: ').strip()
            
            if not value and required:
                self.stderr.write(f"Error: {field_name} is required.")
                continue
            
            if value:
                try:
                    from datetime import datetime
                    datetime.strptime(value, '%Y-%m-%d')
                except ValueError:
                    self.stderr.write("Error: Invalid date format. Use YYYY-MM-DD.")
                    continue
            
            return value

    def _get_phone_input(self, field_name, required=True):
        """Get phone number input with validation"""
        while True:
            value = input(f'{field_name}: ').strip()
            
            if not value and required:
                self.stderr.write(f"Error: {field_name} is required.")
                continue
            
            if value:
                try:
                    phone = PhoneNumber.from_string(value, region='PK')
                    if not phone.is_valid():
                        raise ValueError("Invalid phone number")
                    return str(phone)
                except Exception:
                    self.stderr.write("Error: Invalid phone number format.")
                    continue
            
            return value

    def _validate_username(self, username):
        """Validate username"""
        if self.UserModel.objects.filter(username=username).exists():
            raise ValidationError("A user with this username already exists.")

    def _validate_email(self, email):
        """Validate email"""
        validate_email(email)
        if self.UserModel.objects.filter(email=email).exists():
            raise ValidationError("A user with this email already exists.")
