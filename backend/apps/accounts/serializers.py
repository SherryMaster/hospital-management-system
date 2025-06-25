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
    from apps.doctors.models import Doctor, Department, Specialization
except ImportError:
    Doctor = Department = Specialization = None

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
        except User.MultipleObjectsReturned:
            # Handle duplicate email case - this should not happen with proper constraints
            # but we'll handle it gracefully by getting the most recent active user
            user = User.objects.filter(email=email, is_active=True).order_by('-date_joined').first()
            if not user:
                # If no active users, get the most recent one
                user = User.objects.filter(email=email).order_by('-date_joined').first()

            # Log this issue for admin attention
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Multiple users found with email {email}. Using most recent user ID: {user.id}")

            if not user:
                raise serializers.ValidationError({
                    'email': 'Account configuration error. Please contact support.'
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

    # Include patient profile information for patients
    patient_profile = serializers.SerializerMethodField()

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
            'created_at', 'last_login', 'patient_profile'
        ]
        read_only_fields = [
            'id', 'username', 'role', 'is_verified', 'created_at', 'last_login'
        ]

    def get_patient_profile(self, obj):
        """Get patient profile information if user is a patient"""
        if obj.role == User.UserRole.PATIENT and hasattr(obj, 'patient_profile'):
            return {
                'id': obj.patient_profile.id,
                'patient_id': obj.patient_profile.patient_id,
                'blood_type': obj.patient_profile.blood_type,
                'height': obj.patient_profile.height,
                'weight': obj.patient_profile.weight,
                'marital_status': obj.patient_profile.marital_status,
                'allergies': obj.patient_profile.allergies,
                'chronic_conditions': obj.patient_profile.chronic_conditions,
                'current_medications': obj.patient_profile.current_medications,
                'family_medical_history': obj.patient_profile.family_medical_history,
                'surgical_history': obj.patient_profile.surgical_history,
                'age': obj.patient_profile.age,
                'bmi': obj.patient_profile.bmi,
                'bmi_category': obj.patient_profile.bmi_category,
            }
        return None


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


class AdminUserCreateSerializer(serializers.ModelSerializer):
    """
    Unified serializer for creating any user type from admin interface
    Handles role-specific validation and profile creation
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

    # Date field with proper format
    date_of_birth = serializers.DateField(
        input_formats=['%Y-%m-%d'],
        required=True,
        help_text="Date format: YYYY-MM-DD"
    )

    # Role selection field
    role = serializers.ChoiceField(
        choices=User.UserRole.choices,
        required=True
    )

    # Patient-specific fields
    blood_type = serializers.ChoiceField(
        choices=[('', 'Select Blood Type')] + (list(Patient.BloodType.choices) if Patient else []),
        required=False,
        allow_blank=True
    )
    height = serializers.FloatField(required=False, allow_null=True)
    weight = serializers.FloatField(required=False, allow_null=True)
    marital_status = serializers.ChoiceField(
        choices=[('', 'Select Status')] + (list(Patient.MaritalStatus.choices) if Patient else []),
        required=False,
        allow_blank=True
    )
    allergies = serializers.CharField(required=False, allow_blank=True)
    chronic_conditions = serializers.CharField(required=False, allow_blank=True)
    current_medications = serializers.CharField(required=False, allow_blank=True)
    family_medical_history = serializers.CharField(required=False, allow_blank=True)
    surgical_history = serializers.CharField(required=False, allow_blank=True)

    # Doctor-specific fields
    license_number = serializers.CharField(max_length=50, required=False, allow_blank=True)
    department = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.filter(is_active=True) if Department else [],
        required=False,
        allow_null=True
    )
    specializations = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False,
        allow_empty=True
    )
    medical_school = serializers.CharField(max_length=200, required=False, allow_blank=True)
    graduation_year = serializers.IntegerField(required=False, allow_null=True)
    years_of_experience = serializers.IntegerField(required=False, allow_null=True)
    consultation_fee = serializers.DecimalField(max_digits=8, decimal_places=2, required=False, allow_null=True)
    employment_status = serializers.ChoiceField(
        choices=[('', 'Select Status')] + (list(Doctor.EmploymentStatus.choices) if Doctor else []),
        required=False,
        allow_blank=True
    )

    # Nurse-specific fields
    nursing_level = serializers.ChoiceField(
        choices=[('', 'Select Level')] + (list(Nurse.NursingLevel.choices) if Nurse else []),
        required=False,
        allow_blank=True
    )
    nursing_school = serializers.CharField(max_length=200, required=False, allow_blank=True)
    shift_preference = serializers.ChoiceField(
        choices=[('', 'Select Shift')] + (list(Nurse.ShiftType.choices) if Nurse else []),
        required=False,
        allow_blank=True
    )
    unit = serializers.CharField(max_length=100, required=False, allow_blank=True)

    # Administrator-specific fields
    access_level = serializers.ChoiceField(
        choices=[('', 'Select Level')] + (list(Administrator.AccessLevel.choices) if Administrator else []),
        required=False,
        allow_blank=True
    )
    office_location = serializers.CharField(max_length=200, required=False, allow_blank=True)

    # Receptionist-specific fields
    reception_area = serializers.CharField(max_length=100, required=False, allow_blank=True)
    languages_spoken = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False,
        allow_empty=True
    )

    # Pharmacist-specific fields
    pharmacy_license_number = serializers.CharField(max_length=50, required=False, allow_blank=True)
    pharmacy_school = serializers.CharField(max_length=200, required=False, allow_blank=True)
    can_dispense_controlled_substances = serializers.BooleanField(required=False, default=True)

    class Meta:
        model = User
        fields = [
            # Basic user fields
            'username', 'email', 'password', 'password_confirm', 'first_name', 'last_name',
            'role', 'phone_number', 'date_of_birth', 'gender', 'address_line_1', 'address_line_2', 'city', 'state',
            'postal_code', 'country', 'emergency_contact_name', 'emergency_contact_phone',
            'emergency_contact_relationship',
            # Patient fields
            'blood_type', 'height', 'weight', 'marital_status', 'allergies', 'chronic_conditions',
            'current_medications', 'family_medical_history', 'surgical_history',
            # Doctor fields
            'license_number', 'department', 'specializations', 'medical_school',
            'graduation_year', 'years_of_experience', 'consultation_fee', 'employment_status',
            # Nurse fields
            'nursing_level', 'nursing_school', 'shift_preference', 'unit',
            # Administrator fields
            'access_level', 'office_location',
            # Receptionist fields
            'reception_area', 'languages_spoken',
            # Pharmacist fields
            'pharmacy_license_number', 'pharmacy_school', 'can_dispense_controlled_substances'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'password_confirm': {'write_only': True},
        }

    def validate(self, attrs):
        """Validate data based on selected role"""
        # Password confirmation validation
        if attrs.get('password') != attrs.get('password_confirm'):
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})

        role = attrs.get('role')
        if not role:
            raise serializers.ValidationError({'role': 'User role is required.'})

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

        # Role-specific validation
        if role == User.UserRole.PATIENT:
            self._validate_patient_fields(attrs)
        elif role == User.UserRole.DOCTOR:
            self._validate_doctor_fields(attrs)
        elif role == User.UserRole.NURSE:
            self._validate_nurse_fields(attrs)
        elif role == User.UserRole.ADMIN:
            self._validate_admin_fields(attrs)
        elif role == User.UserRole.RECEPTIONIST:
            self._validate_receptionist_fields(attrs)
        elif role == User.UserRole.PHARMACIST:
            self._validate_pharmacist_fields(attrs)

        return attrs

    def _validate_patient_fields(self, attrs):
        """Validate patient-specific fields"""
        # Basic validation - most patient fields are optional for admin creation
        pass

    def _validate_doctor_fields(self, attrs):
        """Validate doctor-specific fields"""
        required_fields = ['license_number']
        for field in required_fields:
            if not attrs.get(field):
                raise serializers.ValidationError({field: f'{field.replace("_", " ").title()} is required for doctors.'})

    def _validate_nurse_fields(self, attrs):
        """Validate nurse-specific fields"""
        required_fields = ['license_number', 'nursing_level']
        for field in required_fields:
            if not attrs.get(field):
                raise serializers.ValidationError({field: f'{field.replace("_", " ").title()} is required for nurses.'})

    def _validate_admin_fields(self, attrs):
        """Validate administrator-specific fields"""
        required_fields = ['access_level']
        for field in required_fields:
            if not attrs.get(field):
                raise serializers.ValidationError({field: f'{field.replace("_", " ").title()} is required for administrators.'})

    def _validate_receptionist_fields(self, attrs):
        """Validate receptionist-specific fields"""
        # Basic validation - most receptionist fields are optional
        pass

    def _validate_pharmacist_fields(self, attrs):
        """Validate pharmacist-specific fields"""
        required_fields = ['pharmacy_license_number']
        for field in required_fields:
            if not attrs.get(field):
                raise serializers.ValidationError({field: f'{field.replace("_", " ").title()} is required for pharmacists.'})

    def create(self, validated_data):
        """Create user with role-specific profile"""
        # Extract role-specific data
        role = validated_data.get('role')
        password = validated_data.pop('password')
        validated_data.pop('password_confirm', None)

        # Extract role-specific fields
        patient_fields = self._extract_patient_fields(validated_data)
        doctor_fields = self._extract_doctor_fields(validated_data)
        nurse_fields = self._extract_nurse_fields(validated_data)
        admin_fields = self._extract_admin_fields(validated_data)
        receptionist_fields = self._extract_receptionist_fields(validated_data)
        pharmacist_fields = self._extract_pharmacist_fields(validated_data)

        # Disconnect the signal temporarily to avoid automatic profile creation
        from django.db.models.signals import post_save
        from .signals import user_post_save
        post_save.disconnect(user_post_save, sender=User)

        try:
            # Create user
            user = User.objects.create_user(password=password, **validated_data)

            # Create role-specific profile
            if role == User.UserRole.PATIENT and Patient:
                self._create_patient_profile(user, patient_fields)
            elif role == User.UserRole.DOCTOR and Doctor:
                self._create_doctor_profile(user, doctor_fields)
            elif role == User.UserRole.NURSE and Nurse:
                self._create_nurse_profile(user, nurse_fields)
            elif role == User.UserRole.ADMIN and Administrator:
                self._create_admin_profile(user, admin_fields)
            elif role == User.UserRole.RECEPTIONIST and Receptionist:
                self._create_receptionist_profile(user, receptionist_fields)
            elif role == User.UserRole.PHARMACIST and Pharmacist:
                self._create_pharmacist_profile(user, pharmacist_fields)

        finally:
            # Reconnect the signal
            post_save.connect(user_post_save, sender=User)

        return user

    def _extract_patient_fields(self, validated_data):
        """Extract patient-specific fields from validated data"""
        patient_fields = {}
        patient_field_names = [
            'blood_type', 'height', 'weight', 'marital_status', 'allergies',
            'chronic_conditions', 'current_medications', 'family_medical_history', 'surgical_history'
        ]
        for field in patient_field_names:
            if field in validated_data:
                patient_fields[field] = validated_data.pop(field)
        return patient_fields

    def _extract_doctor_fields(self, validated_data):
        """Extract doctor-specific fields from validated data"""
        doctor_fields = {}
        doctor_field_names = [
            'license_number', 'department', 'specializations', 'medical_school',
            'graduation_year', 'years_of_experience', 'consultation_fee', 'employment_status'
        ]
        for field in doctor_field_names:
            if field in validated_data:
                doctor_fields[field] = validated_data.pop(field)
        return doctor_fields

    def _extract_nurse_fields(self, validated_data):
        """Extract nurse-specific fields from validated data"""
        nurse_fields = {}
        nurse_field_names = [
            'license_number', 'nursing_level', 'nursing_school', 'shift_preference', 'unit'
        ]
        for field in nurse_field_names:
            if field in validated_data:
                nurse_fields[field] = validated_data.pop(field)
        return nurse_fields

    def _extract_admin_fields(self, validated_data):
        """Extract administrator-specific fields from validated data"""
        admin_fields = {}
        admin_field_names = ['access_level', 'office_location']
        for field in admin_field_names:
            if field in validated_data:
                admin_fields[field] = validated_data.pop(field)
        return admin_fields

    def _extract_receptionist_fields(self, validated_data):
        """Extract receptionist-specific fields from validated data"""
        receptionist_fields = {}
        receptionist_field_names = ['reception_area', 'languages_spoken']
        for field in receptionist_field_names:
            if field in validated_data:
                receptionist_fields[field] = validated_data.pop(field)
        return receptionist_fields

    def _extract_pharmacist_fields(self, validated_data):
        """Extract pharmacist-specific fields from validated data"""
        pharmacist_fields = {}
        pharmacist_field_names = [
            'pharmacy_license_number', 'pharmacy_school', 'can_dispense_controlled_substances'
        ]
        for field in pharmacist_field_names:
            if field in validated_data:
                pharmacist_fields[field] = validated_data.pop(field)
        return pharmacist_fields

    def _create_patient_profile(self, user, patient_fields):
        """Create patient profile with provided fields"""
        Patient.objects.create(
            user=user,
            blood_type=patient_fields.get('blood_type', Patient.BloodType.UNKNOWN),
            height=patient_fields.get('height'),
            weight=patient_fields.get('weight'),
            marital_status=patient_fields.get('marital_status'),
            allergies=patient_fields.get('allergies', ''),
            chronic_conditions=patient_fields.get('chronic_conditions', ''),
            current_medications=patient_fields.get('current_medications', ''),
            family_medical_history=patient_fields.get('family_medical_history', ''),
            surgical_history=patient_fields.get('surgical_history', ''),
        )

    def _create_doctor_profile(self, user, doctor_fields):
        """Create doctor profile with provided fields"""
        # Get department (already validated as PrimaryKeyRelatedField)
        department = doctor_fields.get('department')

        doctor = Doctor.objects.create(
            user=user,
            license_number=doctor_fields.get('license_number'),
            department=department,
            medical_school=doctor_fields.get('medical_school', ''),
            graduation_year=doctor_fields.get('graduation_year'),
            years_of_experience=doctor_fields.get('years_of_experience', 0),
            consultation_fee=doctor_fields.get('consultation_fee', 0.00),
            employment_status=doctor_fields.get('employment_status', Doctor.EmploymentStatus.FULL_TIME),
            is_accepting_patients=True,
        )

        # Handle specializations
        if doctor_fields.get('specializations') and Specialization:
            for spec_name in doctor_fields['specializations']:
                specialization, _ = Specialization.objects.get_or_create(name=spec_name)
                doctor.specializations.add(specialization)

    def _create_nurse_profile(self, user, nurse_fields):
        """Create nurse profile with provided fields"""
        Nurse.objects.create(
            user=user,
            license_number=nurse_fields.get('license_number'),
            nursing_level=nurse_fields.get('nursing_level', Nurse.NursingLevel.RN),
            department=nurse_fields.get('unit', ''),
            unit=nurse_fields.get('unit', ''),
            nursing_school=nurse_fields.get('nursing_school', ''),
            shift_preference=nurse_fields.get('shift_preference', Nurse.ShiftType.DAY),
            employment_status=Nurse.EmploymentStatus.FULL_TIME,
            is_active=True,
        )

    def _create_admin_profile(self, user, admin_fields):
        """Create administrator profile with provided fields"""
        Administrator.objects.create(
            user=user,
            access_level=admin_fields.get('access_level', Administrator.AccessLevel.SYSTEM_ADMIN),
            office_location=admin_fields.get('office_location', ''),
        )

    def _create_receptionist_profile(self, user, receptionist_fields):
        """Create receptionist profile with provided fields"""
        Receptionist.objects.create(
            user=user,
            reception_area=receptionist_fields.get('reception_area', ''),
            languages_spoken=receptionist_fields.get('languages_spoken', []),
            employment_status=Receptionist.EmploymentStatus.FULL_TIME,
            is_active=True,
        )

    def _create_pharmacist_profile(self, user, pharmacist_fields):
        """Create pharmacist profile with provided fields"""
        Pharmacist.objects.create(
            user=user,
            license_number=pharmacist_fields.get('pharmacy_license_number'),
            pharmacy_school=pharmacist_fields.get('pharmacy_school', ''),
            can_dispense_controlled_substances=pharmacist_fields.get('can_dispense_controlled_substances', True),
            employment_status=Pharmacist.EmploymentStatus.FULL_TIME,
            is_active=True,
        )


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
