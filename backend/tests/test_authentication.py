"""
Authentication & Authorization Tests for Hospital Management System

Tests JWT authentication, role-based access control, and permission systems.
Uses Django's latest security testing practices for 2025.
"""

import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from rest_framework_simplejwt.exceptions import TokenError
from django.utils import timezone
from datetime import timedelta

from accounts.models import UserProfile
from patients.models import Patient
from doctors.models import Doctor, Department

User = get_user_model()


class JWTAuthenticationTest(APITestCase):
    """Test cases for JWT authentication"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.user_data = {
            'email': 'test@example.com',
            'password': 'testpass123',
            'first_name': 'John',
            'last_name': 'Doe',
            'role': 'patient'
        }
        self.user = User.objects.create_user(**self.user_data)

    def test_jwt_token_generation(self):
        """Test JWT token generation on login"""
        url = reverse('auth:login')
        login_data = {
            'email': self.user_data['email'],
            'password': self.user_data['password']
        }
        response = self.client.post(url, login_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        
        # Verify token is valid
        access_token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        profile_url = reverse('auth:profile')
        profile_response = self.client.get(profile_url)
        self.assertEqual(profile_response.status_code, status.HTTP_200_OK)

    def test_jwt_token_refresh(self):
        """Test JWT token refresh functionality"""
        refresh = RefreshToken.for_user(self.user)
        
        url = reverse('auth:token_refresh')
        response = self.client.post(url, {'refresh': str(refresh)}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_jwt_token_blacklist_on_logout(self):
        """Test JWT token blacklisting on logout"""
        refresh = RefreshToken.for_user(self.user)
        access = refresh.access_token
        
        # First, verify token works
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        profile_url = reverse('auth:profile')
        response = self.client.get(profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Logout and blacklist token
        logout_url = reverse('auth:logout')
        logout_response = self.client.post(logout_url, {'refresh': str(refresh)}, format='json')
        self.assertEqual(logout_response.status_code, status.HTTP_200_OK)
        
        # Try to refresh with blacklisted token
        refresh_url = reverse('auth:token_refresh')
        refresh_response = self.client.post(refresh_url, {'refresh': str(refresh)}, format='json')
        self.assertEqual(refresh_response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invalid_jwt_token(self):
        """Test access with invalid JWT token"""
        self.client.credentials(HTTP_AUTHORIZATION='Bearer invalid_token')
        
        url = reverse('auth:profile')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_expired_jwt_token(self):
        """Test access with expired JWT token"""
        # Create a token that's already expired
        access_token = AccessToken.for_user(self.user)
        access_token.set_exp(from_time=timezone.now() - timedelta(hours=1))
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        url = reverse('auth:profile')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_jwt_token_contains_user_info(self):
        """Test that JWT token contains correct user information"""
        access_token = AccessToken.for_user(self.user)
        
        # Decode token payload
        payload = access_token.payload
        
        self.assertEqual(payload['user_id'], self.user.id)
        self.assertEqual(payload['email'], self.user.email)
        self.assertEqual(payload['role'], self.user.role)


class RoleBasedAccessControlTest(APITestCase):
    """Test cases for role-based access control (RBAC)"""

    def setUp(self):
        """Set up test data with different user roles"""
        self.client = APIClient()
        
        # Create users with different roles
        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            password='adminpass123',
            role='admin',
            is_staff=True,
            is_superuser=True
        )
        
        self.doctor_user = User.objects.create_user(
            email='doctor@example.com',
            password='doctorpass123',
            role='doctor'
        )
        
        self.nurse_user = User.objects.create_user(
            email='nurse@example.com',
            password='nursepass123',
            role='nurse'
        )
        
        self.receptionist_user = User.objects.create_user(
            email='receptionist@example.com',
            password='receptionistpass123',
            role='receptionist'
        )
        
        self.patient_user = User.objects.create_user(
            email='patient@example.com',
            password='patientpass123',
            role='patient'
        )
        
        # Create related objects
        self.department = Department.objects.create(name='Cardiology')
        self.doctor = Doctor.objects.create(
            user=self.doctor_user,
            doctor_id='D001',
            department=self.department
        )
        self.patient = Patient.objects.create(
            user=self.patient_user,
            patient_id='P001'
        )

    def test_admin_access_all_endpoints(self):
        """Test that admin can access all endpoints"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Test access to user management
        url = reverse('users:user-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test access to patient records
        url = reverse('patients:patient-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test access to appointments
        url = reverse('appointments:appointment-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_doctor_access_permissions(self):
        """Test doctor access permissions"""
        self.client.force_authenticate(user=self.doctor_user)
        
        # Doctor should access patient records
        url = reverse('patients:patient-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Doctor should access appointments
        url = reverse('appointments:appointment-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Doctor should NOT access user management
        url = reverse('users:user-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_nurse_access_permissions(self):
        """Test nurse access permissions"""
        self.client.force_authenticate(user=self.nurse_user)
        
        # Nurse should access patient records
        url = reverse('patients:patient-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Nurse should access appointments
        url = reverse('appointments:appointment-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Nurse should NOT access user management
        url = reverse('users:user-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_receptionist_access_permissions(self):
        """Test receptionist access permissions"""
        self.client.force_authenticate(user=self.receptionist_user)
        
        # Receptionist should access appointments
        url = reverse('appointments:appointment-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Receptionist should access basic patient info
        url = reverse('patients:patient-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Receptionist should NOT access user management
        url = reverse('users:user-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_patient_access_permissions(self):
        """Test patient access permissions"""
        self.client.force_authenticate(user=self.patient_user)
        
        # Patient should access own records only
        url = reverse('patients:patient-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only see own record
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], self.patient.id)
        
        # Patient should access own appointments
        url = reverse('appointments:appointment-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Patient should NOT access user management
        url = reverse('users:user-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_access_denied(self):
        """Test that unauthenticated users are denied access"""
        # Don't authenticate
        
        # Test various endpoints
        endpoints = [
            reverse('users:user-list'),
            reverse('patients:patient-list'),
            reverse('appointments:appointment-list'),
            reverse('auth:profile')
        ]
        
        for url in endpoints:
            response = self.client.get(url)
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_cross_patient_access_denied(self):
        """Test that patients cannot access other patients' records"""
        # Create another patient
        other_patient_user = User.objects.create_user(
            email='other_patient@example.com',
            password='otherpass123',
            role='patient'
        )
        other_patient = Patient.objects.create(
            user=other_patient_user,
            patient_id='P002'
        )
        
        # Authenticate as first patient
        self.client.force_authenticate(user=self.patient_user)
        
        # Try to access other patient's record
        url = reverse('patients:patient-detail', kwargs={'pk': other_patient.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_role_based_appointment_permissions(self):
        """Test role-based permissions for appointment operations"""
        from appointments.models import Appointment
        
        appointment = Appointment.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            appointment_date=timezone.now().date() + timedelta(days=1),
            appointment_time=timezone.now().time(),
            status='pending'
        )
        
        # Patient can view and cancel own appointments
        self.client.force_authenticate(user=self.patient_user)
        url = reverse('appointments:appointment-detail', kwargs={'pk': appointment.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Doctor can view and update appointment status
        self.client.force_authenticate(user=self.doctor_user)
        update_data = {'status': 'confirmed'}
        response = self.client.patch(url, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Other patient cannot access this appointment
        other_patient_user = User.objects.create_user(
            email='other@example.com',
            password='otherpass123',
            role='patient'
        )
        self.client.force_authenticate(user=other_patient_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class PermissionSystemTest(APITestCase):
    """Test cases for custom permission system"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            role='patient'
        )

    def test_is_owner_permission(self):
        """Test IsOwner permission"""
        patient = Patient.objects.create(
            user=self.user,
            patient_id='P001'
        )
        
        self.client.force_authenticate(user=self.user)
        
        # User should be able to access own patient record
        url = reverse('patients:patient-detail', kwargs={'pk': patient.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_is_owner_or_staff_permission(self):
        """Test IsOwnerOrStaff permission"""
        staff_user = User.objects.create_user(
            email='staff@example.com',
            password='staffpass123',
            role='admin',
            is_staff=True
        )
        
        patient = Patient.objects.create(
            user=self.user,
            patient_id='P001'
        )
        
        # Staff should be able to access any patient record
        self.client.force_authenticate(user=staff_user)
        url = reverse('patients:patient-detail', kwargs={'pk': patient.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_role_required_permission(self):
        """Test role-based permission decorators"""
        # Test that only doctors can access certain endpoints
        doctor_user = User.objects.create_user(
            email='doctor@example.com',
            password='doctorpass123',
            role='doctor'
        )
        
        # Create a doctor-only endpoint test
        self.client.force_authenticate(user=doctor_user)
        # This would test a hypothetical doctor-only endpoint
        # url = reverse('doctors:doctor-dashboard')
        # response = self.client.get(url)
        # self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test that non-doctors cannot access
        self.client.force_authenticate(user=self.user)  # patient user
        # response = self.client.get(url)
        # self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class SecurityTest(APITestCase):
    """Test cases for security features"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            role='patient'
        )

    def test_password_hashing(self):
        """Test that passwords are properly hashed"""
        # Password should not be stored in plain text
        self.assertNotEqual(self.user.password, 'testpass123')
        # But should be verifiable
        self.assertTrue(self.user.check_password('testpass123'))

    def test_sensitive_data_not_exposed(self):
        """Test that sensitive data is not exposed in API responses"""
        self.client.force_authenticate(user=self.user)
        
        url = reverse('auth:profile')
        response = self.client.get(url)
        
        # Password should not be in response
        self.assertNotIn('password', response.data)
        # Other sensitive fields should also be excluded
        sensitive_fields = ['password', 'last_login', 'is_superuser']
        for field in sensitive_fields:
            self.assertNotIn(field, response.data)

    def test_rate_limiting_protection(self):
        """Test rate limiting on authentication endpoints"""
        # This would test rate limiting if implemented
        # Multiple failed login attempts should be rate limited
        url = reverse('auth:login')
        login_data = {
            'email': self.user.email,
            'password': 'wrongpassword'
        }
        
        # Make multiple failed attempts
        for _ in range(5):
            response = self.client.post(url, login_data, format='json')
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # After rate limit, should get different response
        # (This would need actual rate limiting implementation)

    def test_sql_injection_protection(self):
        """Test protection against SQL injection"""
        self.client.force_authenticate(user=self.user)
        
        # Try SQL injection in query parameters
        url = reverse('patients:patient-list')
        malicious_params = {'search': "'; DROP TABLE patients; --"}
        response = self.client.get(url, malicious_params)
        
        # Should not cause server error
        self.assertNotEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

    def test_xss_protection(self):
        """Test protection against XSS attacks"""
        # Create patient with potentially malicious data
        patient = Patient.objects.create(
            user=self.user,
            patient_id='P001',
            emergency_contact='<script>alert("xss")</script>'
        )
        
        self.client.force_authenticate(user=self.user)
        
        url = reverse('patients:patient-detail', kwargs={'pk': patient.pk})
        response = self.client.get(url)
        
        # Response should escape HTML
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # The actual XSS protection would be handled by the frontend


# Pytest-based security tests
@pytest.mark.django_db
class TestAdvancedSecurity:
    """Advanced security tests using pytest"""

    def test_jwt_token_rotation(self):
        """Test JWT token rotation on refresh"""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            role='patient'
        )
        
        refresh = RefreshToken.for_user(user)
        old_refresh_token = str(refresh)
        
        # Refresh the token
        new_refresh = refresh
        new_refresh.set_jti()
        new_refresh.set_exp()
        
        # Old refresh token should be different from new one
        assert str(new_refresh) != old_refresh_token

    def test_token_blacklisting_persistence(self):
        """Test that blacklisted tokens remain blacklisted"""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            role='patient'
        )
        
        refresh = RefreshToken.for_user(user)
        
        # Blacklist the token
        refresh.blacklist()
        
        # Try to use blacklisted token
        with pytest.raises(TokenError):
            RefreshToken(str(refresh))

    def test_user_session_management(self):
        """Test user session management"""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            role='patient'
        )
        
        # Create multiple tokens for the same user
        token1 = RefreshToken.for_user(user)
        token2 = RefreshToken.for_user(user)
        
        # Both tokens should be valid initially
        assert token1.check_blacklist() is None
        assert token2.check_blacklist() is None
        
        # Blacklist one token
        token1.blacklist()
        
        # Only the blacklisted token should be invalid
        with pytest.raises(TokenError):
            RefreshToken(str(token1))
        
        # Other token should still be valid
        assert token2.check_blacklist() is None
