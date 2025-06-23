"""
Tests for access control and validation in user registration and creation
"""

from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
import json

User = get_user_model()


class AccessControlTestCase(APITestCase):
    """Test access control for user registration and creation"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Create an admin user for testing admin-only endpoints
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123',
            role=User.UserRole.ADMIN,
            first_name='Admin',
            last_name='User',
            is_staff=True,
            is_superuser=True
        )
        
        # Create a regular patient user
        self.patient_user = User.objects.create_user(
            username='patient',
            email='patient@test.com',
            password='testpass123',
            role=User.UserRole.PATIENT,
            first_name='Patient',
            last_name='User'
        )

    def test_patient_registration_allows_only_patients(self):
        """Test that patient registration endpoint only allows patient role"""
        url = reverse('accounts:register')
        
        # Valid patient registration data
        patient_data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'email': 'john.doe@test.com',
            'phone_number': '+923001234567',
            'date_of_birth': '1990-01-01',
            'gender': 'M',
            'address_line_1': '123 Main St',
            'city': 'Karachi',
            'state': 'Sindh',
            'postal_code': '12345',
            'country': 'Pakistan',
            'emergency_contact_name': 'Jane Doe',
            'emergency_contact_phone': '+923001234568',
            'emergency_contact_relationship': 'Spouse',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!'
        }
        
        # Test successful patient registration
        response = self.client.post(url, patient_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('Patient registered successfully', response.data['message'])
        
        # Test that specifying doctor role is rejected
        doctor_data = patient_data.copy()
        doctor_data['email'] = 'doctor@test.com'
        doctor_data['role'] = 'doctor'
        
        response = self.client.post(url, doctor_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('Public registration is only available for patients', response.data['error'])

    def test_admin_only_doctor_creation(self):
        """Test that only admins can create doctor accounts"""
        url = reverse('accounts:create_doctor')
        
        doctor_data = {
            'username': 'doctor1',
            'first_name': 'Dr. John',
            'last_name': 'Smith',
            'email': 'dr.smith@test.com',
            'phone_number': '+923001234567',
            'date_of_birth': '1980-01-01',
            'gender': 'M',
            'license_number': 'DOC123456',
            'department': 'Cardiology',
            'password': 'SecurePass123!'
        }
        
        # Test unauthenticated access is denied
        response = self.client.post(url, doctor_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Test patient user cannot create doctor
        self.client.force_authenticate(user=self.patient_user)
        response = self.client.post(url, doctor_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test admin user can create doctor
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(url, doctor_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('Doctor', response.data['message'])

    def test_admin_only_nurse_creation(self):
        """Test that only admins can create nurse accounts"""
        url = reverse('accounts:create_nurse')
        
        nurse_data = {
            'username': 'nurse1',
            'first_name': 'Nurse',
            'last_name': 'Johnson',
            'email': 'nurse.johnson@test.com',
            'phone_number': '+923001234567',
            'date_of_birth': '1985-01-01',
            'gender': 'F',
            'license_number': 'NUR123456',
            'department': 'Emergency',
            'password': 'SecurePass123!'
        }
        
        # Test unauthenticated access is denied
        response = self.client.post(url, nurse_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Test patient user cannot create nurse
        self.client.force_authenticate(user=self.patient_user)
        response = self.client.post(url, nurse_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test admin user can create nurse
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(url, nurse_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('Nurse', response.data['message'])

    def test_data_completeness_validation(self):
        """Test that required fields are validated for completeness"""
        url = reverse('accounts:register')
        
        # Test with missing required fields
        incomplete_data = {
            'first_name': 'John',
            'email': 'incomplete@test.com',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!'
        }
        
        response = self.client.post(url, incomplete_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Should contain validation errors for missing fields
        self.assertTrue(
            'non_field_errors' in response.data or 
            any(field in response.data for field in ['last_name', 'phone_number', 'date_of_birth'])
        )

    def test_role_manipulation_prevention(self):
        """Test that role manipulation is prevented in various scenarios"""
        # Test patient registration with role manipulation
        url = reverse('accounts:register')
        
        malicious_data = {
            'first_name': 'Malicious',
            'last_name': 'User',
            'email': 'malicious@test.com',
            'phone_number': '+923001234567',
            'date_of_birth': '1990-01-01',
            'gender': 'M',
            'address_line_1': '123 Main St',
            'city': 'Karachi',
            'state': 'Sindh',
            'postal_code': '12345',
            'country': 'Pakistan',
            'emergency_contact_name': 'Emergency Contact',
            'emergency_contact_phone': '+923001234568',
            'emergency_contact_relationship': 'Friend',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!',
            'role': 'admin'  # Attempting to set admin role
        }
        
        response = self.client.post(url, malicious_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('Public registration is only available for patients', response.data['error'])

    def test_phone_number_validation(self):
        """Test phone number validation"""
        url = reverse('accounts:register')
        
        base_data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'email': 'john.phone@test.com',
            'date_of_birth': '1990-01-01',
            'gender': 'M',
            'address_line_1': '123 Main St',
            'city': 'Karachi',
            'state': 'Sindh',
            'postal_code': '12345',
            'country': 'Pakistan',
            'emergency_contact_name': 'Jane Doe',
            'emergency_contact_relationship': 'Spouse',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!'
        }
        
        # Test invalid phone number
        invalid_phone_data = base_data.copy()
        invalid_phone_data['phone_number'] = 'invalid-phone'
        invalid_phone_data['emergency_contact_phone'] = '+923001234568'
        
        response = self.client.post(url, invalid_phone_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test valid phone number
        valid_phone_data = base_data.copy()
        valid_phone_data['phone_number'] = '+923001234567'
        valid_phone_data['emergency_contact_phone'] = '+923001234568'
        
        response = self.client.post(url, valid_phone_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_date_of_birth_validation(self):
        """Test date of birth validation"""
        url = reverse('accounts:register')
        
        base_data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'email': 'john.dob@test.com',
            'phone_number': '+923001234567',
            'gender': 'M',
            'address_line_1': '123 Main St',
            'city': 'Karachi',
            'state': 'Sindh',
            'postal_code': '12345',
            'country': 'Pakistan',
            'emergency_contact_name': 'Jane Doe',
            'emergency_contact_phone': '+923001234568',
            'emergency_contact_relationship': 'Spouse',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!'
        }
        
        # Test future date of birth
        future_dob_data = base_data.copy()
        future_dob_data['date_of_birth'] = '2030-01-01'
        
        response = self.client.post(url, future_dob_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test valid date of birth
        valid_dob_data = base_data.copy()
        valid_dob_data['date_of_birth'] = '1990-01-01'
        
        response = self.client.post(url, valid_dob_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
