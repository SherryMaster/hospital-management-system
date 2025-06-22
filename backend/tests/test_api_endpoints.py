"""
API Endpoint Tests for Hospital Management System

Comprehensive tests for all API endpoints including CRUD operations and edge cases.
Uses Django REST Framework testing practices for 2025.
"""

import pytest
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal

from accounts.models import UserProfile
from patients.models import Patient, MedicalRecord
from doctors.models import Doctor, Department
from appointments.models import Appointment
from billing.models import Invoice

User = get_user_model()


class AuthenticationAPITest(APITestCase):
    """Test cases for authentication API endpoints"""

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

    def test_user_registration(self):
        """Test user registration endpoint"""
        url = reverse('auth:register')
        response = self.client.post(url, self.user_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['email'], self.user_data['email'])

    def test_user_registration_invalid_email(self):
        """Test user registration with invalid email"""
        url = reverse('auth:register')
        invalid_data = self.user_data.copy()
        invalid_data['email'] = 'invalid-email'
        
        response = self.client.post(url, invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_user_registration_duplicate_email(self):
        """Test user registration with duplicate email"""
        User.objects.create_user(**self.user_data)
        
        url = reverse('auth:register')
        response = self.client.post(url, self.user_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_user_login(self):
        """Test user login endpoint"""
        user = User.objects.create_user(**self.user_data)
        
        url = reverse('auth:login')
        login_data = {
            'email': self.user_data['email'],
            'password': self.user_data['password']
        }
        response = self.client.post(url, login_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)

    def test_user_login_invalid_credentials(self):
        """Test user login with invalid credentials"""
        User.objects.create_user(**self.user_data)
        
        url = reverse('auth:login')
        login_data = {
            'email': self.user_data['email'],
            'password': 'wrongpassword'
        }
        response = self.client.post(url, login_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_refresh(self):
        """Test token refresh endpoint"""
        user = User.objects.create_user(**self.user_data)
        refresh = RefreshToken.for_user(user)
        
        url = reverse('auth:token_refresh')
        response = self.client.post(url, {'refresh': str(refresh)}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_user_profile_endpoint(self):
        """Test user profile endpoint"""
        user = User.objects.create_user(**self.user_data)
        self.client.force_authenticate(user=user)
        
        url = reverse('auth:profile')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], user.email)
        self.assertEqual(response.data['first_name'], user.first_name)


class UserManagementAPITest(APITestCase):
    """Test cases for user management API endpoints"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            password='adminpass123',
            role='admin',
            is_staff=True
        )
        self.regular_user = User.objects.create_user(
            email='user@example.com',
            password='userpass123',
            role='patient'
        )

    def test_list_users_as_admin(self):
        """Test listing users as admin"""
        self.client.force_authenticate(user=self.admin_user)
        
        url = reverse('users:user-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_list_users_as_regular_user(self):
        """Test listing users as regular user (should be forbidden)"""
        self.client.force_authenticate(user=self.regular_user)
        
        url = reverse('users:user-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_user_as_admin(self):
        """Test creating user as admin"""
        self.client.force_authenticate(user=self.admin_user)
        
        url = reverse('users:user-list')
        user_data = {
            'email': 'newuser@example.com',
            'password': 'newpass123',
            'first_name': 'New',
            'last_name': 'User',
            'role': 'doctor'
        }
        response = self.client.post(url, user_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['email'], user_data['email'])

    def test_update_user_as_admin(self):
        """Test updating user as admin"""
        self.client.force_authenticate(user=self.admin_user)
        
        url = reverse('users:user-detail', kwargs={'pk': self.regular_user.pk})
        update_data = {'first_name': 'Updated'}
        response = self.client.patch(url, update_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], 'Updated')

    def test_delete_user_as_admin(self):
        """Test deleting user as admin"""
        self.client.force_authenticate(user=self.admin_user)
        
        url = reverse('users:user-detail', kwargs={'pk': self.regular_user.pk})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(pk=self.regular_user.pk).exists())


class PatientAPITest(APITestCase):
    """Test cases for patient API endpoints"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.doctor_user = User.objects.create_user(
            email='doctor@example.com',
            password='doctorpass123',
            role='doctor'
        )
        self.patient_user = User.objects.create_user(
            email='patient@example.com',
            password='patientpass123',
            role='patient'
        )
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

    def test_list_patients_as_doctor(self):
        """Test listing patients as doctor"""
        self.client.force_authenticate(user=self.doctor_user)
        
        url = reverse('patients:patient-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_list_patients_as_patient(self):
        """Test listing patients as patient (should only see own record)"""
        self.client.force_authenticate(user=self.patient_user)
        
        url = reverse('patients:patient-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], self.patient.id)

    def test_retrieve_patient_as_doctor(self):
        """Test retrieving patient details as doctor"""
        self.client.force_authenticate(user=self.doctor_user)
        
        url = reverse('patients:patient-detail', kwargs={'pk': self.patient.pk})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['patient_id'], self.patient.patient_id)

    def test_update_patient_as_patient(self):
        """Test updating own patient record"""
        self.client.force_authenticate(user=self.patient_user)
        
        url = reverse('patients:patient-detail', kwargs={'pk': self.patient.pk})
        update_data = {'blood_type': 'A+'}
        response = self.client.patch(url, update_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['blood_type'], 'A+')

    def test_patient_medical_records(self):
        """Test retrieving patient medical records"""
        # Create a medical record
        MedicalRecord.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            diagnosis='Test diagnosis',
            treatment='Test treatment'
        )
        
        self.client.force_authenticate(user=self.patient_user)
        
        url = reverse('patients:patient-medical-records', kwargs={'pk': self.patient.pk})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['diagnosis'], 'Test diagnosis')


class AppointmentAPITest(APITestCase):
    """Test cases for appointment API endpoints"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.patient_user = User.objects.create_user(
            email='patient@example.com',
            password='patientpass123',
            role='patient'
        )
        self.doctor_user = User.objects.create_user(
            email='doctor@example.com',
            password='doctorpass123',
            role='doctor'
        )
        self.department = Department.objects.create(name='Cardiology')
        self.patient = Patient.objects.create(
            user=self.patient_user,
            patient_id='P001'
        )
        self.doctor = Doctor.objects.create(
            user=self.doctor_user,
            doctor_id='D001',
            department=self.department
        )

    def test_create_appointment_as_patient(self):
        """Test creating appointment as patient"""
        self.client.force_authenticate(user=self.patient_user)
        
        url = reverse('appointments:appointment-list')
        appointment_data = {
            'doctor': self.doctor.id,
            'appointment_date': (timezone.now().date() + timedelta(days=1)).isoformat(),
            'appointment_time': '10:00:00',
            'appointment_type': 'consultation',
            'chief_complaint': 'Chest pain'
        }
        response = self.client.post(url, appointment_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['patient'], self.patient.id)
        self.assertEqual(response.data['doctor'], self.doctor.id)

    def test_list_appointments_as_patient(self):
        """Test listing appointments as patient"""
        # Create an appointment
        Appointment.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            appointment_date=timezone.now().date() + timedelta(days=1),
            appointment_time=timezone.now().time()
        )
        
        self.client.force_authenticate(user=self.patient_user)
        
        url = reverse('appointments:appointment-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_update_appointment_status_as_doctor(self):
        """Test updating appointment status as doctor"""
        appointment = Appointment.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            appointment_date=timezone.now().date() + timedelta(days=1),
            appointment_time=timezone.now().time(),
            status='pending'
        )
        
        self.client.force_authenticate(user=self.doctor_user)
        
        url = reverse('appointments:appointment-detail', kwargs={'pk': appointment.pk})
        update_data = {'status': 'confirmed'}
        response = self.client.patch(url, update_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'confirmed')

    def test_cancel_appointment_as_patient(self):
        """Test cancelling appointment as patient"""
        appointment = Appointment.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            appointment_date=timezone.now().date() + timedelta(days=1),
            appointment_time=timezone.now().time(),
            status='confirmed'
        )
        
        self.client.force_authenticate(user=self.patient_user)
        
        url = reverse('appointments:appointment-cancel', kwargs={'pk': appointment.pk})
        cancel_data = {'reason': 'Personal emergency'}
        response = self.client.post(url, cancel_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        appointment.refresh_from_db()
        self.assertEqual(appointment.status, 'cancelled')

    def test_get_available_time_slots(self):
        """Test getting available time slots for a doctor"""
        self.client.force_authenticate(user=self.patient_user)
        
        url = reverse('appointments:available-slots')
        params = {
            'doctor': self.doctor.id,
            'date': (timezone.now().date() + timedelta(days=1)).isoformat()
        }
        response = self.client.get(url, params)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)


class BillingAPITest(APITestCase):
    """Test cases for billing API endpoints"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.patient_user = User.objects.create_user(
            email='patient@example.com',
            password='patientpass123',
            role='patient'
        )
        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            password='adminpass123',
            role='admin',
            is_staff=True
        )
        self.patient = Patient.objects.create(
            user=self.patient_user,
            patient_id='P001'
        )

    def test_list_invoices_as_patient(self):
        """Test listing invoices as patient"""
        # Create an invoice
        Invoice.objects.create(
            patient=self.patient,
            invoice_number='INV001',
            amount=Decimal('150.00'),
            description='Consultation fee'
        )
        
        self.client.force_authenticate(user=self.patient_user)
        
        url = reverse('billing:invoice-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_create_invoice_as_admin(self):
        """Test creating invoice as admin"""
        self.client.force_authenticate(user=self.admin_user)
        
        url = reverse('billing:invoice-list')
        invoice_data = {
            'patient': self.patient.id,
            'invoice_number': 'INV002',
            'amount': '200.00',
            'description': 'Follow-up consultation',
            'due_date': (timezone.now().date() + timedelta(days=30)).isoformat()
        }
        response = self.client.post(url, invoice_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['invoice_number'], 'INV002')

    def test_pay_invoice_as_patient(self):
        """Test paying invoice as patient"""
        invoice = Invoice.objects.create(
            patient=self.patient,
            invoice_number='INV003',
            amount=Decimal('100.00'),
            description='Test invoice'
        )
        
        self.client.force_authenticate(user=self.patient_user)
        
        url = reverse('billing:invoice-pay', kwargs={'pk': invoice.pk})
        payment_data = {
            'payment_method': 'credit_card',
            'amount': '100.00'
        }
        response = self.client.post(url, payment_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        invoice.refresh_from_db()
        self.assertEqual(invoice.status, 'paid')


# Pytest-based tests for more advanced scenarios
@pytest.mark.django_db
class TestAPIPermissions:
    """Test API permissions using pytest"""

    def test_patient_cannot_access_admin_endpoints(self, api_client):
        """Test that patients cannot access admin-only endpoints"""
        patient_user = User.objects.create_user(
            email='patient@example.com',
            password='testpass123',
            role='patient'
        )
        api_client.force_authenticate(user=patient_user)
        
        # Try to access admin-only endpoint
        url = reverse('users:user-list')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_doctor_can_access_patient_records(self, api_client):
        """Test that doctors can access patient records"""
        doctor_user = User.objects.create_user(
            email='doctor@example.com',
            password='testpass123',
            role='doctor'
        )
        patient_user = User.objects.create_user(
            email='patient@example.com',
            password='testpass123',
            role='patient'
        )
        
        department = Department.objects.create(name='Test Department')
        doctor = Doctor.objects.create(
            user=doctor_user,
            doctor_id='D001',
            department=department
        )
        patient = Patient.objects.create(
            user=patient_user,
            patient_id='P001'
        )
        
        api_client.force_authenticate(user=doctor_user)
        
        url = reverse('patients:patient-detail', kwargs={'pk': patient.pk})
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK


@pytest.fixture
def api_client():
    """Fixture for API client"""
    from rest_framework.test import APIClient
    return APIClient()
