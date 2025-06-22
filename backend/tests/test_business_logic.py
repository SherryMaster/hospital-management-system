"""
Business Logic Tests for Hospital Management System

Tests appointment scheduling logic, validation rules, and business constraints.
Uses Django's latest testing practices for 2025.
"""

import pytest
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, timedelta, time
from decimal import Decimal

from patients.models import Patient, MedicalRecord
from doctors.models import Doctor, DoctorAvailability, Department
from appointments.models import Appointment, TimeSlot
from billing.models import Invoice, Payment

User = get_user_model()


class AppointmentSchedulingLogicTest(TestCase):
    """Test cases for appointment scheduling business logic"""

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
            department=self.department,
            consultation_fee=Decimal('200.00')
        )

    def test_appointment_scheduling_within_working_hours(self):
        """Test that appointments can only be scheduled within working hours"""
        # Create doctor availability
        DoctorAvailability.objects.create(
            doctor=self.doctor,
            day_of_week=1,  # Monday
            start_time=time(9, 0),
            end_time=time(17, 0),
            is_available=True
        )
        
        # Valid appointment within working hours
        next_monday = timezone.now().date() + timedelta(days=(7 - timezone.now().weekday()))
        valid_appointment = Appointment.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            appointment_date=next_monday,
            appointment_time=time(10, 0),
            appointment_type='consultation'
        )
        self.assertEqual(valid_appointment.status, 'pending')

    def test_appointment_scheduling_outside_working_hours_fails(self):
        """Test that appointments cannot be scheduled outside working hours"""
        # Create doctor availability
        DoctorAvailability.objects.create(
            doctor=self.doctor,
            day_of_week=1,  # Monday
            start_time=time(9, 0),
            end_time=time(17, 0),
            is_available=True
        )
        
        # Try to schedule outside working hours
        next_monday = timezone.now().date() + timedelta(days=(7 - timezone.now().weekday()))
        
        with self.assertRaises(ValidationError):
            appointment = Appointment(
                patient=self.patient,
                doctor=self.doctor,
                appointment_date=next_monday,
                appointment_time=time(18, 0),  # After working hours
                appointment_type='consultation'
            )
            appointment.full_clean()

    def test_double_booking_prevention(self):
        """Test that double booking is prevented"""
        appointment_date = timezone.now().date() + timedelta(days=1)
        appointment_time = time(10, 0)
        
        # Create first appointment
        Appointment.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            appointment_date=appointment_date,
            appointment_time=appointment_time,
            status='confirmed'
        )
        
        # Try to create second appointment at same time
        with self.assertRaises(ValidationError):
            duplicate_appointment = Appointment(
                patient=self.patient,
                doctor=self.doctor,
                appointment_date=appointment_date,
                appointment_time=appointment_time,
                appointment_type='consultation'
            )
            duplicate_appointment.full_clean()

    def test_appointment_minimum_advance_booking(self):
        """Test minimum advance booking requirement"""
        # Try to book appointment for today (should fail)
        today = timezone.now().date()
        
        with self.assertRaises(ValidationError):
            appointment = Appointment(
                patient=self.patient,
                doctor=self.doctor,
                appointment_date=today,
                appointment_time=time(10, 0),
                appointment_type='consultation'
            )
            appointment.full_clean()

    def test_appointment_maximum_advance_booking(self):
        """Test maximum advance booking limit"""
        # Try to book appointment too far in advance (e.g., 6 months)
        far_future = timezone.now().date() + timedelta(days=180)
        
        with self.assertRaises(ValidationError):
            appointment = Appointment(
                patient=self.patient,
                doctor=self.doctor,
                appointment_date=far_future,
                appointment_time=time(10, 0),
                appointment_type='consultation'
            )
            appointment.full_clean()

    def test_appointment_cancellation_logic(self):
        """Test appointment cancellation business logic"""
        appointment = Appointment.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            appointment_date=timezone.now().date() + timedelta(days=2),
            appointment_time=time(10, 0),
            status='confirmed'
        )
        
        # Cancel appointment
        appointment.status = 'cancelled'
        appointment.cancellation_reason = 'Patient emergency'
        appointment.cancelled_at = timezone.now()
        appointment.save()
        
        self.assertEqual(appointment.status, 'cancelled')
        self.assertIsNotNone(appointment.cancelled_at)

    def test_appointment_rescheduling_logic(self):
        """Test appointment rescheduling business logic"""
        original_date = timezone.now().date() + timedelta(days=2)
        new_date = timezone.now().date() + timedelta(days=3)
        
        appointment = Appointment.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            appointment_date=original_date,
            appointment_time=time(10, 0),
            status='confirmed'
        )
        
        # Reschedule appointment
        appointment.appointment_date = new_date
        appointment.appointment_time = time(11, 0)
        appointment.save()
        
        self.assertEqual(appointment.appointment_date, new_date)
        self.assertEqual(appointment.appointment_time, time(11, 0))

    def test_emergency_appointment_priority(self):
        """Test emergency appointment scheduling priority"""
        # Create emergency appointment
        emergency_appointment = Appointment.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            appointment_date=timezone.now().date() + timedelta(days=1),
            appointment_time=time(10, 0),
            appointment_type='emergency',
            priority='high'
        )
        
        self.assertEqual(emergency_appointment.priority, 'high')
        self.assertEqual(emergency_appointment.appointment_type, 'emergency')


class DoctorAvailabilityLogicTest(TestCase):
    """Test cases for doctor availability business logic"""

    def setUp(self):
        """Set up test data"""
        self.doctor_user = User.objects.create_user(
            email='doctor@example.com',
            password='testpass123',
            role='doctor'
        )
        self.department = Department.objects.create(name='Cardiology')
        self.doctor = Doctor.objects.create(
            user=self.doctor_user,
            doctor_id='D001',
            department=self.department
        )

    def test_doctor_availability_creation(self):
        """Test creating doctor availability"""
        availability = DoctorAvailability.objects.create(
            doctor=self.doctor,
            day_of_week=1,  # Monday
            start_time=time(9, 0),
            end_time=time(17, 0),
            is_available=True
        )
        
        self.assertEqual(availability.doctor, self.doctor)
        self.assertEqual(availability.day_of_week, 1)
        self.assertTrue(availability.is_available)

    def test_doctor_availability_overlap_validation(self):
        """Test that overlapping availability slots are not allowed"""
        # Create first availability slot
        DoctorAvailability.objects.create(
            doctor=self.doctor,
            day_of_week=1,  # Monday
            start_time=time(9, 0),
            end_time=time(17, 0),
            is_available=True
        )
        
        # Try to create overlapping slot
        with self.assertRaises(ValidationError):
            overlapping_availability = DoctorAvailability(
                doctor=self.doctor,
                day_of_week=1,  # Same day
                start_time=time(16, 0),  # Overlaps with existing slot
                end_time=time(18, 0),
                is_available=True
            )
            overlapping_availability.full_clean()

    def test_doctor_break_time_scheduling(self):
        """Test doctor break time scheduling"""
        # Create availability with break
        DoctorAvailability.objects.create(
            doctor=self.doctor,
            day_of_week=1,  # Monday
            start_time=time(9, 0),
            end_time=time(12, 0),  # Morning session
            is_available=True
        )
        
        # Lunch break (12:00 - 13:00)
        
        DoctorAvailability.objects.create(
            doctor=self.doctor,
            day_of_week=1,  # Monday
            start_time=time(13, 0),  # Afternoon session
            end_time=time(17, 0),
            is_available=True
        )
        
        morning_slots = DoctorAvailability.objects.filter(
            doctor=self.doctor,
            day_of_week=1,
            start_time__lt=time(12, 0)
        )
        afternoon_slots = DoctorAvailability.objects.filter(
            doctor=self.doctor,
            day_of_week=1,
            start_time__gte=time(13, 0)
        )
        
        self.assertEqual(morning_slots.count(), 1)
        self.assertEqual(afternoon_slots.count(), 1)


class BillingLogicTest(TestCase):
    """Test cases for billing business logic"""

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

    def test_invoice_generation(self):
        """Test automatic invoice generation"""
        invoice = Invoice.objects.create(
            patient=self.patient,
            invoice_number='INV001',
            amount=Decimal('150.00'),
            description='Consultation fee',
            due_date=timezone.now().date() + timedelta(days=30)
        )
        
        self.assertEqual(invoice.status, 'pending')
        self.assertEqual(invoice.amount, Decimal('150.00'))

    def test_invoice_payment_processing(self):
        """Test invoice payment processing"""
        invoice = Invoice.objects.create(
            patient=self.patient,
            invoice_number='INV002',
            amount=Decimal('200.00'),
            description='Follow-up consultation'
        )
        
        # Process payment
        payment = Payment.objects.create(
            invoice=invoice,
            amount=Decimal('200.00'),
            payment_method='credit_card',
            transaction_id='TXN123456'
        )
        
        # Update invoice status
        invoice.status = 'paid'
        invoice.paid_at = timezone.now()
        invoice.save()
        
        self.assertEqual(invoice.status, 'paid')
        self.assertEqual(payment.amount, invoice.amount)
        self.assertIsNotNone(invoice.paid_at)

    def test_partial_payment_handling(self):
        """Test partial payment handling"""
        invoice = Invoice.objects.create(
            patient=self.patient,
            invoice_number='INV003',
            amount=Decimal('300.00'),
            description='Treatment fee'
        )
        
        # Make partial payment
        partial_payment = Payment.objects.create(
            invoice=invoice,
            amount=Decimal('150.00'),
            payment_method='credit_card',
            transaction_id='TXN123457'
        )
        
        # Invoice should remain pending with partial payment
        invoice.status = 'partially_paid'
        invoice.save()
        
        self.assertEqual(invoice.status, 'partially_paid')
        
        # Calculate remaining balance
        total_paid = Payment.objects.filter(invoice=invoice).aggregate(
            total=models.Sum('amount')
        )['total'] or Decimal('0.00')
        remaining_balance = invoice.amount - total_paid
        
        self.assertEqual(remaining_balance, Decimal('150.00'))

    def test_invoice_overdue_calculation(self):
        """Test overdue invoice calculation"""
        # Create overdue invoice
        overdue_invoice = Invoice.objects.create(
            patient=self.patient,
            invoice_number='INV004',
            amount=Decimal('100.00'),
            description='Overdue consultation',
            due_date=timezone.now().date() - timedelta(days=10)
        )
        
        # Check if invoice is overdue
        is_overdue = overdue_invoice.due_date < timezone.now().date()
        self.assertTrue(is_overdue)

    def test_late_fee_calculation(self):
        """Test late fee calculation for overdue invoices"""
        overdue_invoice = Invoice.objects.create(
            patient=self.patient,
            invoice_number='INV005',
            amount=Decimal('200.00'),
            description='Overdue treatment',
            due_date=timezone.now().date() - timedelta(days=15)
        )
        
        # Calculate late fee (e.g., 5% of original amount)
        days_overdue = (timezone.now().date() - overdue_invoice.due_date).days
        late_fee_rate = Decimal('0.05')  # 5%
        late_fee = overdue_invoice.amount * late_fee_rate
        
        self.assertEqual(days_overdue, 15)
        self.assertEqual(late_fee, Decimal('10.00'))


class MedicalRecordLogicTest(TestCase):
    """Test cases for medical record business logic"""

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
            notes='Patient responding well to treatment',
            visit_date=timezone.now().date()
        )
        
        self.assertEqual(record.patient, self.patient)
        self.assertEqual(record.doctor, self.doctor)
        self.assertEqual(record.diagnosis, 'Hypertension')

    def test_medical_record_chronological_ordering(self):
        """Test that medical records are ordered chronologically"""
        # Create records on different dates
        record1 = MedicalRecord.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            diagnosis='Initial consultation',
            visit_date=timezone.now().date() - timedelta(days=10)
        )
        
        record2 = MedicalRecord.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            diagnosis='Follow-up',
            visit_date=timezone.now().date() - timedelta(days=5)
        )
        
        record3 = MedicalRecord.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            diagnosis='Latest visit',
            visit_date=timezone.now().date()
        )
        
        # Get records ordered by date
        records = MedicalRecord.objects.filter(patient=self.patient).order_by('-visit_date')
        
        self.assertEqual(records[0], record3)  # Latest first
        self.assertEqual(records[1], record2)
        self.assertEqual(records[2], record1)  # Oldest last

    def test_medical_record_privacy_access(self):
        """Test medical record privacy and access control"""
        record = MedicalRecord.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            diagnosis='Confidential diagnosis',
            treatment='Confidential treatment',
            is_confidential=True
        )
        
        self.assertTrue(record.is_confidential)
        
        # Only the treating doctor and patient should have access
        # This would be enforced at the API level


class ValidationRulesTest(TestCase):
    """Test cases for business validation rules"""

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

    def test_patient_id_format_validation(self):
        """Test patient ID format validation"""
        # Valid patient ID format
        valid_patient = Patient(
            user=self.patient_user,
            patient_id='P001'
        )
        valid_patient.full_clean()  # Should not raise exception
        
        # Invalid patient ID format
        with self.assertRaises(ValidationError):
            invalid_patient = Patient(
                user=self.patient_user,
                patient_id='INVALID'
            )
            invalid_patient.full_clean()

    def test_phone_number_validation(self):
        """Test phone number format validation"""
        # Valid phone number
        self.patient_user.phone = '+1234567890'
        self.patient_user.full_clean()  # Should not raise exception
        
        # Invalid phone number
        with self.assertRaises(ValidationError):
            self.patient_user.phone = 'invalid-phone'
            self.patient_user.full_clean()

    def test_email_uniqueness_validation(self):
        """Test email uniqueness validation"""
        # Try to create user with duplicate email
        with self.assertRaises(ValidationError):
            duplicate_user = User(
                email=self.patient_user.email,
                password='testpass123'
            )
            duplicate_user.full_clean()

    def test_appointment_date_validation(self):
        """Test appointment date validation rules"""
        doctor_user = User.objects.create_user(
            email='doctor@example.com',
            password='testpass123',
            role='doctor'
        )
        department = Department.objects.create(name='Cardiology')
        doctor = Doctor.objects.create(
            user=doctor_user,
            doctor_id='D001',
            department=department
        )
        
        # Past date should be invalid
        with self.assertRaises(ValidationError):
            past_appointment = Appointment(
                patient=self.patient,
                doctor=doctor,
                appointment_date=timezone.now().date() - timedelta(days=1),
                appointment_time=time(10, 0)
            )
            past_appointment.full_clean()

    def test_consultation_fee_validation(self):
        """Test consultation fee validation"""
        doctor_user = User.objects.create_user(
            email='doctor@example.com',
            password='testpass123',
            role='doctor'
        )
        department = Department.objects.create(name='Cardiology')
        
        # Negative fee should be invalid
        with self.assertRaises(ValidationError):
            invalid_doctor = Doctor(
                user=doctor_user,
                doctor_id='D001',
                department=department,
                consultation_fee=Decimal('-100.00')
            )
            invalid_doctor.full_clean()


# Pytest-based business logic tests
@pytest.mark.django_db
class TestAdvancedBusinessLogic:
    """Advanced business logic tests using pytest"""

    def test_appointment_conflict_resolution(self):
        """Test appointment conflict resolution logic"""
        # This would test complex scheduling conflicts
        pass

    def test_doctor_workload_balancing(self):
        """Test doctor workload balancing algorithm"""
        # This would test workload distribution logic
        pass

    def test_emergency_appointment_prioritization(self):
        """Test emergency appointment prioritization"""
        # This would test emergency scheduling logic
        pass
