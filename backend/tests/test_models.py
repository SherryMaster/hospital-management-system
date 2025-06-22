"""
Model Unit Tests for Hospital Management System

Tests all Django models including validation, relationships, and custom methods.
Uses Django's latest testing practices for 2025.
"""

import pytest
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal

from apps.patients.models import Patient, MedicalRecord
from apps.doctors.models import Doctor, Department
from apps.appointments.models import Appointment
from apps.billing.models import Invoice

User = get_user_model()


class UserModelTest(TestCase):
    """Test cases for User model"""

    def setUp(self):
        """Set up test data"""
        self.user_data = {
            'email': 'test@example.com',
            'first_name': 'John',
            'last_name': 'Doe',
            'phone': '+1234567890',
            'role': 'patient'
        }

    def test_create_user_with_email(self):
        """Test creating a user with email"""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            first_name='John',
            last_name='Doe'
        )
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.first_name, 'John')
        self.assertEqual(user.last_name, 'Doe')
        self.assertTrue(user.check_password('testpass123'))
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_create_superuser(self):
        """Test creating a superuser"""
        admin_user = User.objects.create_superuser(
            email='admin@example.com',
            password='adminpass123'
        )
        self.assertEqual(admin_user.email, 'admin@example.com')
        self.assertTrue(admin_user.is_active)
        self.assertTrue(admin_user.is_staff)
        self.assertTrue(admin_user.is_superuser)

    def test_user_string_representation(self):
        """Test user string representation"""
        user = User.objects.create_user(**self.user_data, password='testpass123')
        self.assertEqual(str(user), 'John Doe (Patient)')

    def test_user_full_name_property(self):
        """Test user full_name property"""
        user = User.objects.create_user(**self.user_data, password='testpass123')
        self.assertEqual(user.get_full_name(), 'John Doe')

    def test_email_normalization(self):
        """Test email normalization"""
        user = User.objects.create_user(
            email='Test@EXAMPLE.COM',
            password='testpass123'
        )
        self.assertEqual(user.email, 'test@example.com')

    def test_user_without_email_raises_error(self):
        """Test creating user without email raises error"""
        with self.assertRaises(ValueError):
            User.objects.create_user(email='', password='testpass123')

    def test_user_role_choices(self):
        """Test user role validation"""
        valid_roles = ['admin', 'doctor', 'nurse', 'receptionist', 'patient', 'pharmacist']
        for role in valid_roles:
            user = User.objects.create_user(
                email=f'test_{role}@example.com',
                password='testpass123',
                role=role
            )
            self.assertEqual(user.role, role)


class UserProfileModelTest(TestCase):
    """Test cases for UserProfile model"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='John',
            last_name='Doe'
        )

    def test_user_profile_creation(self):
        """Test user profile creation"""
        profile = UserProfile.objects.create(
            user=self.user,
            date_of_birth=datetime(1990, 1, 1).date(),
            gender='M',
            address='123 Main St',
            emergency_contact='Jane Doe - +1987654321'
        )
        self.assertEqual(profile.user, self.user)
        self.assertEqual(profile.gender, 'M')
        self.assertEqual(profile.address, '123 Main St')

    def test_user_profile_string_representation(self):
        """Test user profile string representation"""
        profile = UserProfile.objects.create(
            user=self.user,
            date_of_birth=datetime(1990, 1, 1).date()
        )
        self.assertEqual(str(profile), 'Profile for John Doe')

    def test_user_profile_age_property(self):
        """Test user profile age calculation"""
        birth_date = datetime.now().date() - timedelta(days=365 * 25)  # 25 years ago
        profile = UserProfile.objects.create(
            user=self.user,
            date_of_birth=birth_date
        )
        self.assertEqual(profile.age, 25)


class DepartmentModelTest(TestCase):
    """Test cases for Department model"""

    def test_department_creation(self):
        """Test department creation"""
        department = Department.objects.create(
            name='Cardiology',
            description='Heart and cardiovascular care',
            head_of_department='Dr. Smith'
        )
        self.assertEqual(department.name, 'Cardiology')
        self.assertEqual(department.description, 'Heart and cardiovascular care')
        self.assertTrue(department.is_active)

    def test_department_string_representation(self):
        """Test department string representation"""
        department = Department.objects.create(name='Cardiology')
        self.assertEqual(str(department), 'Cardiology')

    def test_department_unique_name(self):
        """Test department name uniqueness"""
        Department.objects.create(name='Cardiology')
        with self.assertRaises(IntegrityError):
            Department.objects.create(name='Cardiology')


class PatientModelTest(TestCase):
    """Test cases for Patient model"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email='patient@example.com',
            password='testpass123',
            first_name='Jane',
            last_name='Smith',
            role='patient'
        )

    def test_patient_creation(self):
        """Test patient creation"""
        patient = Patient.objects.create(
            user=self.user,
            patient_id='P001',
            blood_type='O+',
            emergency_contact='John Smith - +1234567890'
        )
        self.assertEqual(patient.user, self.user)
        self.assertEqual(patient.patient_id, 'P001')
        self.assertEqual(patient.blood_type, 'O+')

    def test_patient_string_representation(self):
        """Test patient string representation"""
        patient = Patient.objects.create(
            user=self.user,
            patient_id='P001'
        )
        self.assertEqual(str(patient), 'Jane Smith (P001)')

    def test_patient_unique_patient_id(self):
        """Test patient ID uniqueness"""
        Patient.objects.create(user=self.user, patient_id='P001')
        user2 = User.objects.create_user(
            email='patient2@example.com',
            password='testpass123',
            role='patient'
        )
        with self.assertRaises(IntegrityError):
            Patient.objects.create(user=user2, patient_id='P001')


class DoctorModelTest(TestCase):
    """Test cases for Doctor model"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email='doctor@example.com',
            password='testpass123',
            first_name='Dr. John',
            last_name='Smith',
            role='doctor'
        )
        self.department = Department.objects.create(name='Cardiology')

    def test_doctor_creation(self):
        """Test doctor creation"""
        doctor = Doctor.objects.create(
            user=self.user,
            doctor_id='D001',
            department=self.department,
            specialization='Cardiologist',
            license_number='LIC123456',
            consultation_fee=Decimal('200.00')
        )
        self.assertEqual(doctor.user, self.user)
        self.assertEqual(doctor.doctor_id, 'D001')
        self.assertEqual(doctor.department, self.department)
        self.assertEqual(doctor.consultation_fee, Decimal('200.00'))

    def test_doctor_string_representation(self):
        """Test doctor string representation"""
        doctor = Doctor.objects.create(
            user=self.user,
            doctor_id='D001',
            department=self.department
        )
        self.assertEqual(str(doctor), 'Dr. John Smith (D001) - Cardiology')

    def test_doctor_unique_license_number(self):
        """Test doctor license number uniqueness"""
        Doctor.objects.create(
            user=self.user,
            doctor_id='D001',
            department=self.department,
            license_number='LIC123456'
        )
        user2 = User.objects.create_user(
            email='doctor2@example.com',
            password='testpass123',
            role='doctor'
        )
        with self.assertRaises(IntegrityError):
            Doctor.objects.create(
                user=user2,
                doctor_id='D002',
                department=self.department,
                license_number='LIC123456'
            )


class AppointmentModelTest(TestCase):
    """Test cases for Appointment model"""

    def setUp(self):
        """Set up test data"""
        self.patient_user = User.objects.create_user(
            email='patient@example.com',
            password='testpass123',
            role='patient'
        )
        self.doctor_user = User.objects.create_user(
            email='doctor@example.com',
            password='testpass123',
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

    def test_appointment_creation(self):
        """Test appointment creation"""
        appointment_date = timezone.now().date() + timedelta(days=1)
        appointment_time = timezone.now().time()
        
        appointment = Appointment.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            appointment_date=appointment_date,
            appointment_time=appointment_time,
            appointment_type='consultation',
            chief_complaint='Chest pain'
        )
        self.assertEqual(appointment.patient, self.patient)
        self.assertEqual(appointment.doctor, self.doctor)
        self.assertEqual(appointment.status, 'pending')
        self.assertEqual(appointment.appointment_type, 'consultation')

    def test_appointment_string_representation(self):
        """Test appointment string representation"""
        appointment_date = timezone.now().date() + timedelta(days=1)
        appointment_time = timezone.now().time()
        
        appointment = Appointment.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            appointment_date=appointment_date,
            appointment_time=appointment_time
        )
        expected_str = f"{self.patient.user.full_name} with {self.doctor.user.full_name} on {appointment_date}"
        self.assertEqual(str(appointment), expected_str)

    def test_appointment_status_choices(self):
        """Test appointment status validation"""
        appointment_date = timezone.now().date() + timedelta(days=1)
        appointment_time = timezone.now().time()
        
        valid_statuses = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show']
        for status in valid_statuses:
            appointment = Appointment.objects.create(
                patient=self.patient,
                doctor=self.doctor,
                appointment_date=appointment_date,
                appointment_time=appointment_time,
                status=status
            )
            self.assertEqual(appointment.status, status)


class InvoiceModelTest(TestCase):
    """Test cases for Invoice model"""

    def setUp(self):
        """Set up test data"""
        self.patient_user = User.objects.create_user(
            email='patient@example.com',
            password='testpass123',
            role='patient'
        )
        self.patient = Patient.objects.create(
            user=self.patient_user,
            patient_id='P001'
        )

    def test_invoice_creation(self):
        """Test invoice creation"""
        invoice = Invoice.objects.create(
            patient=self.patient,
            invoice_number='INV001',
            amount=Decimal('150.00'),
            description='Consultation fee',
            due_date=timezone.now().date() + timedelta(days=30)
        )
        self.assertEqual(invoice.patient, self.patient)
        self.assertEqual(invoice.amount, Decimal('150.00'))
        self.assertEqual(invoice.status, 'pending')

    def test_invoice_string_representation(self):
        """Test invoice string representation"""
        invoice = Invoice.objects.create(
            patient=self.patient,
            invoice_number='INV001',
            amount=Decimal('150.00')
        )
        expected_str = f"Invoice INV001 - {self.patient.user.full_name} - $150.00"
        self.assertEqual(str(invoice), expected_str)

    def test_invoice_unique_invoice_number(self):
        """Test invoice number uniqueness"""
        Invoice.objects.create(
            patient=self.patient,
            invoice_number='INV001',
            amount=Decimal('150.00')
        )
        with self.assertRaises(IntegrityError):
            Invoice.objects.create(
                patient=self.patient,
                invoice_number='INV001',
                amount=Decimal('200.00')
            )


class MedicalRecordModelTest(TestCase):
    """Test cases for MedicalRecord model"""

    def setUp(self):
        """Set up test data"""
        self.patient_user = User.objects.create_user(
            email='patient@example.com',
            password='testpass123',
            role='patient'
        )
        self.doctor_user = User.objects.create_user(
            email='doctor@example.com',
            password='testpass123',
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

    def test_medical_record_creation(self):
        """Test medical record creation"""
        record = MedicalRecord.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            diagnosis='Hypertension',
            treatment='Blood pressure medication',
            notes='Patient responding well to treatment'
        )
        self.assertEqual(record.patient, self.patient)
        self.assertEqual(record.doctor, self.doctor)
        self.assertEqual(record.diagnosis, 'Hypertension')

    def test_medical_record_string_representation(self):
        """Test medical record string representation"""
        record = MedicalRecord.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            diagnosis='Hypertension'
        )
        expected_str = f"{self.patient.user.full_name} - Hypertension ({record.created_at.date()})"
        self.assertEqual(str(record), expected_str)


# Pytest fixtures for more advanced testing
@pytest.fixture
def user_factory():
    """Factory for creating test users"""
    def _create_user(role='patient', **kwargs):
        defaults = {
            'email': f'test_{role}@example.com',
            'password': 'testpass123',
            'first_name': 'Test',
            'last_name': 'User',
            'role': role
        }
        defaults.update(kwargs)
        return User.objects.create_user(**defaults)
    return _create_user


@pytest.fixture
def department_factory():
    """Factory for creating test departments"""
    def _create_department(**kwargs):
        defaults = {
            'name': 'Test Department',
            'description': 'Test department description'
        }
        defaults.update(kwargs)
        return Department.objects.create(**defaults)
    return _create_department
