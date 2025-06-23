from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from phonenumber_field.serializerfields import PhoneNumberField
from .models import User

# Import related models for choices (avoid circular import by importing here)
try:
    from apps.patients.models import Patient
except ImportError:
    Patient = None

try:
    from apps.doctors.models import Doctor
except ImportError:
    Doctor = None

try:
    from apps.staff.models import Nurse, Administrator, Receptionist, Pharmacist
except ImportError:
    Nurse = Administrator = Receptionist = Pharmacist = None


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT token serializer that includes user information and supports email login
    """
    email = serializers.EmailField()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Remove the username field and add email field
        del self.fields['username']

    def validate(self, attrs):
        # Convert email to username for authentication
        email = attrs.get('email')
        password = attrs.get('password')

        if not email:
            raise serializers.ValidationError({
                'email': 'Email address is required.'
            })

        if not password:
            raise serializers.ValidationError({
                'password': 'Password is required.'
            })

        # Check if user exists with this email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({
                'email': 'No account found with this email address. Please check your email or create a new account.'
            })

        # Check if account is active
        if not user.is_active:
            raise serializers.ValidationError({
                'non_field_errors': 'Your account has been deactivated. Please contact the administrator for assistance.'
            })

        # Replace email with username for parent validation
        attrs['username'] = user.username
        del attrs['email']

        # Validate password using Django's authenticate function directly
        from django.contrib.auth import authenticate

        authenticated_user = authenticate(
            username=user.username,
            password=password
        )

        if not authenticated_user:
            raise serializers.ValidationError({
                'password': 'Incorrect password. Please check your password and try again.'
            })

        # If authentication successful, proceed with parent validation
        data = super().validate(attrs)

        # Add custom user data to the token response
        data.update({
            'user': {
                'id': self.user.id,
                'username': self.user.username,
                'email': self.user.email,
                'first_name': self.user.first_name,
                'last_name': self.user.last_name,
                'full_name': self.user.get_full_name(),
                'role': self.user.role,
                'is_verified': self.user.is_verified,
                'profile_picture': self.user.profile_picture.url if self.user.profile_picture else None,
            }
        })

        return data
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add custom claims to the token
        token['role'] = user.role
        token['email'] = user.email
        token['full_name'] = user.get_full_name()
        
        return token


class PatientRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for patient-only registration with comprehensive patient fields
    """
    password = serializers.CharField(
        write_only=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
    )
    phone_number = PhoneNumberField(required=True)

    # Patient-specific fields
    blood_type = serializers.ChoiceField(
        choices=[('', 'Select Blood Type')] + (list(Patient.BloodType.choices) if Patient else []),
        required=False,
        allow_blank=True
    )
    marital_status = serializers.ChoiceField(
        choices=[('', 'Select Marital Status')] + (list(Patient.MaritalStatus.choices) if Patient else []),
        required=False,
        allow_blank=True
    )
    occupation = serializers.CharField(max_length=100, required=False, allow_blank=True)

    # Insurance Information
    insurance_provider = serializers.CharField(max_length=100, required=False, allow_blank=True)
    insurance_policy_number = serializers.CharField(max_length=50, required=False, allow_blank=True)
    insurance_group_number = serializers.CharField(max_length=50, required=False, allow_blank=True)

    # Medical History
    allergies = serializers.CharField(required=False, allow_blank=True)
    chronic_conditions = serializers.CharField(required=False, allow_blank=True)
    current_medications = serializers.CharField(required=False, allow_blank=True)
    family_medical_history = serializers.CharField(required=False, allow_blank=True)
    surgical_history = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'email', 'password', 'password_confirm',
            'first_name', 'middle_name', 'last_name', 'phone_number',
            'date_of_birth', 'gender', 'address_line_1', 'address_line_2',
            'city', 'state', 'postal_code', 'country',
            'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship',
            # Patient-specific fields
            'blood_type', 'marital_status', 'occupation',
            'insurance_provider', 'insurance_policy_number', 'insurance_group_number',
            'allergies', 'chronic_conditions', 'current_medications',
            'family_medical_history', 'surgical_history'
        ]
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
            'date_of_birth': {'required': True},
            'gender': {'required': True},
            'address_line_1': {'required': True},
            'city': {'required': True},
            'state': {'required': True},
            'postal_code': {'required': True},
            'country': {'required': True},
            'emergency_contact_name': {'required': True},
            'emergency_contact_phone': {'required': True},
            'emergency_contact_relationship': {'required': True},
        }

    def validate_email(self, value):
        """Validate email uniqueness"""
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def validate(self, attrs):
        """Validate password confirmation and other fields"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Password confirmation does not match.'
            })

        # Ensure role is always patient for this serializer
        attrs['role'] = User.UserRole.PATIENT

        # Validate required fields for complete patient profile
        required_fields = [
            'first_name', 'last_name', 'email', 'phone_number', 'date_of_birth', 'gender',
            'address_line_1', 'city', 'state', 'postal_code', 'country',
            'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship'
        ]

        missing_fields = []
        for field in required_fields:
            if not attrs.get(field) or (isinstance(attrs.get(field), str) and not attrs.get(field).strip()):
                missing_fields.append(field.replace('_', ' ').title())

        if missing_fields:
            raise serializers.ValidationError({
                'non_field_errors': f'The following required fields are missing or empty: {", ".join(missing_fields)}'
            })

        # Validate phone numbers
        if attrs.get('phone_number'):
            try:
                from phonenumber_field.phonenumber import PhoneNumber
                phone = PhoneNumber.from_string(str(attrs['phone_number']), region='PK')
                if not phone.is_valid():
                    raise serializers.ValidationError({'phone_number': 'Invalid phone number format.'})
            except Exception:
                raise serializers.ValidationError({'phone_number': 'Invalid phone number format.'})

        if attrs.get('emergency_contact_phone'):
            try:
                from phonenumber_field.phonenumber import PhoneNumber
                phone = PhoneNumber.from_string(str(attrs['emergency_contact_phone']), region='PK')
                if not phone.is_valid():
                    raise serializers.ValidationError({'emergency_contact_phone': 'Invalid emergency contact phone number format.'})
            except Exception:
                raise serializers.ValidationError({'emergency_contact_phone': 'Invalid emergency contact phone number format.'})

        # Validate date of birth
        if attrs.get('date_of_birth'):
            from datetime import date, datetime
            try:
                if isinstance(attrs['date_of_birth'], str):
                    birth_date = datetime.strptime(attrs['date_of_birth'], '%Y-%m-%d').date()
                else:
                    birth_date = attrs['date_of_birth']

                today = date.today()
                age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))

                if birth_date > today:
                    raise serializers.ValidationError({'date_of_birth': 'Date of birth cannot be in the future.'})
                if age > 150:
                    raise serializers.ValidationError({'date_of_birth': 'Invalid date of birth.'})
                if age < 0:
                    raise serializers.ValidationError({'date_of_birth': 'Date of birth cannot be in the future.'})
            except ValueError:
                raise serializers.ValidationError({'date_of_birth': 'Invalid date format. Use YYYY-MM-DD.'})

        return attrs

    def create(self, validated_data):
        """Create new patient user with complete profile"""
        from django.db import transaction

        # Extract patient-specific fields
        patient_fields = {
            'blood_type': validated_data.pop('blood_type', ''),
            'marital_status': validated_data.pop('marital_status', ''),
            'occupation': validated_data.pop('occupation', ''),
            'insurance_provider': validated_data.pop('insurance_provider', ''),
            'insurance_policy_number': validated_data.pop('insurance_policy_number', ''),
            'insurance_group_number': validated_data.pop('insurance_group_number', ''),
            'allergies': validated_data.pop('allergies', ''),
            'chronic_conditions': validated_data.pop('chronic_conditions', ''),
            'current_medications': validated_data.pop('current_medications', ''),
            'family_medical_history': validated_data.pop('family_medical_history', ''),
            'surgical_history': validated_data.pop('surgical_history', ''),
        }

        # Remove password confirmation
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')

        # Auto-generate username from email
        email = validated_data['email']
        base_username = email.split('@')[0]
        username = base_username

        # Ensure username is unique
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        validated_data['username'] = username
        validated_data['role'] = User.UserRole.PATIENT

        # Use transaction to ensure atomicity and prevent signal interference
        with transaction.atomic():
            # Temporarily disable signals to prevent duplicate patient creation
            from django.db.models.signals import post_save
            from apps.accounts.signals import user_post_save

            # Disconnect the signal temporarily
            post_save.disconnect(user_post_save, sender=User)

            try:
                # Create user
                user = User.objects.create_user(
                    password=password,
                    **validated_data
                )

                # Create patient profile with complete information
                if Patient:
                    Patient.objects.create(
                        user=user,
                        blood_type=patient_fields['blood_type'] or Patient.BloodType.UNKNOWN,
                        marital_status=patient_fields['marital_status'] or Patient.MaritalStatus.SINGLE,
                        occupation=patient_fields['occupation'],
                        insurance_provider=patient_fields['insurance_provider'],
                        insurance_policy_number=patient_fields['insurance_policy_number'],
                        insurance_group_number=patient_fields['insurance_group_number'],
                        allergies=patient_fields['allergies'],
                        chronic_conditions=patient_fields['chronic_conditions'],
                        current_medications=patient_fields['current_medications'],
                        family_medical_history=patient_fields['family_medical_history'],
                        surgical_history=patient_fields['surgical_history'],
                    )

            finally:
                # Reconnect the signal
                post_save.connect(user_post_save, sender=User)

        return user


# Keep the old serializer for backward compatibility but rename it
class UserRegistrationSerializer(PatientRegistrationSerializer):
    """
    Legacy user registration serializer - now redirects to patient registration
    """
    pass



class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for user profile information
    """
    age = serializers.ReadOnlyField()
    full_name = serializers.ReadOnlyField(source='get_full_name')
    initials = serializers.ReadOnlyField(source='get_initials')
    full_address = serializers.ReadOnlyField(source='get_full_address')
    phone_number = PhoneNumberField(read_only=True)
    emergency_contact_phone = PhoneNumberField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'middle_name', 'last_name',
            'full_name', 'initials', 'role', 'date_of_birth', 'age', 'gender',
            'phone_number', 'emergency_contact_name', 'emergency_contact_phone',
            'emergency_contact_relationship', 'address_line_1', 'address_line_2',
            'city', 'state', 'postal_code', 'country', 'full_address',
            'profile_picture', 'bio', 'is_verified', 'preferred_language',
            'timezone', 'receive_notifications', 'receive_email_updates',
            'created_at', 'last_login'
        ]
        read_only_fields = [
            'id', 'username', 'role', 'is_verified', 'created_at', 'last_login'
        ]


class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating user profile
    """
    phone_number = PhoneNumberField(required=False)
    emergency_contact_phone = PhoneNumberField(required=False)

    class Meta:
        model = User
        fields = [
            'first_name', 'middle_name', 'last_name', 'date_of_birth', 'gender',
            'phone_number', 'emergency_contact_name', 'emergency_contact_phone',
            'emergency_contact_relationship', 'address_line_1', 'address_line_2',
            'city', 'state', 'postal_code', 'country', 'profile_picture', 'bio',
            'preferred_language', 'timezone', 'receive_notifications',
            'receive_email_updates'
        ]
    
    def validate_email(self, value):
        """Validate email uniqueness (excluding current user)"""
        if value and User.objects.filter(email=value.lower()).exclude(id=self.instance.id).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower() if value else value


class PasswordChangeSerializer(serializers.Serializer):
    """
    Serializer for password change
    """
    old_password = serializers.CharField(style={'input_type': 'password'})
    new_password = serializers.CharField(
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    new_password_confirm = serializers.CharField(style={'input_type': 'password'})
    
    def validate_old_password(self, value):
        """Validate old password"""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value
    
    def validate(self, attrs):
        """Validate new password confirmation"""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("New passwords don't match.")
        return attrs
    
    def save(self):
        """Change user password"""
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class UserListSerializer(serializers.ModelSerializer):
    """
    Serializer for user list (admin view)
    """
    full_name = serializers.ReadOnlyField(source='get_full_name')
    age = serializers.ReadOnlyField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'full_name', 'role', 'age',
            'is_active', 'is_verified', 'created_at', 'last_login'
        ]


class DoctorCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating doctor users with complete profile (admin only)
    """
    password = serializers.CharField(
        write_only=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    phone_number = PhoneNumberField(required=True)

    # Doctor-specific fields
    license_number = serializers.CharField(max_length=50, required=True)
    specializations = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False,
        allow_empty=True
    )
    department = serializers.CharField(max_length=100, required=True)
    medical_school = serializers.CharField(max_length=200, required=False, allow_blank=True)
    graduation_year = serializers.IntegerField(required=False, allow_null=True)
    years_of_experience = serializers.IntegerField(required=False, default=0)
    consultation_fee = serializers.DecimalField(max_digits=8, decimal_places=2, required=False, default=0.00)
    employment_status = serializers.ChoiceField(
        choices=Doctor.EmploymentStatus.choices if Doctor else [],
        required=False,
        default='full_time'
    )

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'first_name', 'middle_name', 'last_name',
            'phone_number', 'date_of_birth', 'gender', 'address_line_1', 'address_line_2',
            'city', 'state', 'postal_code', 'country', 'is_active', 'is_verified',
            # Doctor-specific fields
            'license_number', 'specializations', 'department', 'medical_school',
            'graduation_year', 'years_of_experience', 'consultation_fee', 'employment_status'
        ]
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
            'date_of_birth': {'required': True},
            'gender': {'required': True},
        }

    def validate_email(self, value):
        """Validate email uniqueness"""
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def validate_license_number(self, value):
        """Validate license number uniqueness"""
        if Doctor and Doctor.objects.filter(license_number=value).exists():
            raise serializers.ValidationError("A doctor with this license number already exists.")
        return value

    def create(self, validated_data):
        """Create new doctor user with complete profile"""
        from django.db import transaction

        # Extract doctor-specific fields
        doctor_fields = {
            'license_number': validated_data.pop('license_number'),
            'specializations': validated_data.pop('specializations', []),
            'department': validated_data.pop('department'),
            'medical_school': validated_data.pop('medical_school', ''),
            'graduation_year': validated_data.pop('graduation_year', None),
            'years_of_experience': validated_data.pop('years_of_experience', 0),
            'consultation_fee': validated_data.pop('consultation_fee', 0.00),
            'employment_status': validated_data.pop('employment_status', 'full_time'),
        }

        # Set role to doctor
        validated_data['role'] = User.UserRole.DOCTOR
        password = validated_data.pop('password')

        # Use transaction to ensure atomicity and prevent signal interference
        with transaction.atomic():
            # Temporarily disable signals to prevent duplicate doctor creation
            from django.db.models.signals import post_save
            from apps.accounts.signals import user_post_save

            # Disconnect the signal temporarily
            post_save.disconnect(user_post_save, sender=User)

            try:
                # Create user
                user = User.objects.create_user(password=password, **validated_data)

                # Create doctor profile with complete information
                if Doctor:
                    Doctor.objects.create(
                        user=user,
                        license_number=doctor_fields['license_number'],
                        department=doctor_fields['department'],
                        medical_school=doctor_fields['medical_school'],
                        graduation_year=doctor_fields['graduation_year'],
                        years_of_experience=doctor_fields['years_of_experience'],
                        consultation_fee=doctor_fields['consultation_fee'],
                        employment_status=doctor_fields['employment_status'],
                        is_accepting_patients=True,
                    )
                    # Set specializations if provided
                    if doctor_fields['specializations']:
                        # This would require a proper many-to-many relationship setup
                        pass

            finally:
                # Reconnect the signal
                post_save.connect(user_post_save, sender=User)

        return user


class NurseCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating nurse users with complete profile (admin only)
    """
    password = serializers.CharField(
        write_only=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    phone_number = PhoneNumberField(required=True)

    # Nurse-specific fields
    license_number = serializers.CharField(max_length=50, required=True)
    nursing_level = serializers.ChoiceField(
        choices=Nurse.NursingLevel.choices if Nurse else [],
        required=False,
        default='rn'
    )
    department = serializers.CharField(max_length=100, required=True)
    unit = serializers.CharField(max_length=100, required=False, allow_blank=True)
    nursing_school = serializers.CharField(max_length=200, required=False, allow_blank=True)
    graduation_year = serializers.IntegerField(required=False, allow_null=True)
    years_of_experience = serializers.IntegerField(required=False, default=0)
    shift_preference = serializers.ChoiceField(
        choices=Nurse.ShiftType.choices if Nurse else [],
        required=False,
        default='day'
    )
    employment_status = serializers.ChoiceField(
        choices=Nurse.EmploymentStatus.choices if Nurse else [],
        required=False,
        default='full_time'
    )

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'first_name', 'middle_name', 'last_name',
            'phone_number', 'date_of_birth', 'gender', 'address_line_1', 'address_line_2',
            'city', 'state', 'postal_code', 'country', 'is_active', 'is_verified',
            # Nurse-specific fields
            'license_number', 'nursing_level', 'department', 'unit', 'nursing_school',
            'graduation_year', 'years_of_experience', 'shift_preference', 'employment_status'
        ]
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
            'date_of_birth': {'required': True},
            'gender': {'required': True},
        }

    def validate_email(self, value):
        """Validate email uniqueness"""
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def validate_license_number(self, value):
        """Validate license number uniqueness"""
        if Nurse and Nurse.objects.filter(license_number=value).exists():
            raise serializers.ValidationError("A nurse with this license number already exists.")
        return value

    def create(self, validated_data):
        """Create new nurse user with complete profile"""
        from django.db import transaction

        # Extract nurse-specific fields
        nurse_fields = {
            'license_number': validated_data.pop('license_number'),
            'nursing_level': validated_data.pop('nursing_level', 'rn'),
            'department': validated_data.pop('department'),
            'unit': validated_data.pop('unit', ''),
            'nursing_school': validated_data.pop('nursing_school', ''),
            'graduation_year': validated_data.pop('graduation_year', None),
            'years_of_experience': validated_data.pop('years_of_experience', 0),
            'shift_preference': validated_data.pop('shift_preference', 'day'),
            'employment_status': validated_data.pop('employment_status', 'full_time'),
        }

        # Set role to nurse
        validated_data['role'] = User.UserRole.NURSE
        password = validated_data.pop('password')

        # Use transaction to ensure atomicity and prevent signal interference
        with transaction.atomic():
            # Temporarily disable signals to prevent duplicate nurse creation
            from django.db.models.signals import post_save
            from apps.staff.signals import create_staff_profile

            # Disconnect the signal temporarily
            post_save.disconnect(create_staff_profile, sender=User)

            try:
                # Create user
                user = User.objects.create_user(password=password, **validated_data)

                # Create nurse profile with complete information
                if Nurse:
                    Nurse.objects.create(
                        user=user,
                        license_number=nurse_fields['license_number'],
                        nursing_level=nurse_fields['nursing_level'],
                        department=nurse_fields['department'],
                        unit=nurse_fields['unit'],
                        nursing_school=nurse_fields['nursing_school'],
                        graduation_year=nurse_fields['graduation_year'],
                        years_of_experience=nurse_fields['years_of_experience'],
                        shift_preference=nurse_fields['shift_preference'],
                        employment_status=nurse_fields['employment_status'],
                        is_active=True,
                    )

            finally:
                # Reconnect the signal
                post_save.connect(create_staff_profile, sender=User)

        return user


# Keep the old serializer for backward compatibility
class UserCreateSerializer(DoctorCreateSerializer):
    """
    Legacy user creation serializer - now redirects to doctor creation
    """
    pass
