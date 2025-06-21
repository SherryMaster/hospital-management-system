from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import User


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT token serializer that includes user information
    """
    
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add custom user data to the token response
        data.update({
            'user': {
                'id': self.user.id,
                'username': self.user.username,
                'email': self.user.email,
                'first_name': self.user.first_name,
                'last_name': self.user.last_name,
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
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def validate_email(self, value):
        """Validate email uniqueness"""
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()
    
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
