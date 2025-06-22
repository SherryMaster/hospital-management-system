from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from phonenumber_field.serializerfields import PhoneNumberField
from .models import User


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


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration
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
    phone_number = PhoneNumberField(required=False)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'role', 'phone_number',
            'date_of_birth', 'gender'
        ]
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
        }
    
    def validate(self, attrs):
        """Validate password confirmation"""
        if attrs.get('password') != attrs.get('password_confirm'):
            raise serializers.ValidationError({
                'password_confirm': 'Passwords do not match. Please ensure both password fields are identical.'
            })
        return attrs

    def validate_email(self, value):
        """Validate email uniqueness"""
        if not value:
            raise serializers.ValidationError('Email address is required.')

        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError('An account with this email address already exists. Please use a different email or try logging in.')

        return value.lower()

    def validate_first_name(self, value):
        """Validate first name"""
        if not value or not value.strip():
            raise serializers.ValidationError('First name is required.')
        return value.strip()

    def validate_last_name(self, value):
        """Validate last name"""
        if not value or not value.strip():
            raise serializers.ValidationError('Last name is required.')
        return value.strip()
    
    def create(self, validated_data):
        """Create new user"""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        return user


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


class UserCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating users (admin only)
    """
    password = serializers.CharField(
        write_only=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    phone_number = PhoneNumberField(required=False)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'first_name', 'last_name',
            'role', 'phone_number', 'is_active', 'is_verified'
        ]
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
        }
    
    def validate_email(self, value):
        """Validate email uniqueness"""
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()
    
    def create(self, validated_data):
        """Create new user"""
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        return user
