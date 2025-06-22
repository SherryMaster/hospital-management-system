"""
Locust Performance Testing for Hospital Management System API

This file defines load testing scenarios for the backend API endpoints.
"""

import json
import random
from locust import HttpUser, task, between
from locust.exception import RescheduleTask


class HospitalManagementUser(HttpUser):
    """
    Simulates a user interacting with the Hospital Management System API.
    """
    
    wait_time = between(1, 3)  # Wait 1-3 seconds between requests
    
    def on_start(self):
        """Called when a user starts. Performs login and setup."""
        self.login()
        self.get_user_data()
    
    def login(self):
        """Authenticate user and get JWT token."""
        login_data = {
            "username": f"testuser{random.randint(1, 100)}@example.com",
            "password": "testpassword123"
        }
        
        # Create user if doesn't exist
        self.client.post("/api/auth/register/", json={
            "username": login_data["username"],
            "email": login_data["username"],
            "password": login_data["password"],
            "password_confirm": login_data["password"],
            "first_name": "Test",
            "last_name": "User",
            "role": "patient"
        })
        
        # Login
        response = self.client.post("/api/auth/login/", json=login_data)
        
        if response.status_code == 200:
            data = response.json()
            self.token = data.get("access")
            self.refresh_token = data.get("refresh")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            raise RescheduleTask("Login failed")
    
    def get_user_data(self):
        """Get current user data."""
        response = self.client.get("/api/auth/user/", headers=self.headers)
        if response.status_code == 200:
            self.user_data = response.json()
            self.user_id = self.user_data.get("id")
        else:
            self.user_data = {}
            self.user_id = None
    
    @task(3)
    def view_dashboard(self):
        """Simulate viewing the dashboard."""
        self.client.get("/api/dashboard/", headers=self.headers, name="Dashboard")
    
    @task(5)
    def list_appointments(self):
        """Simulate listing appointments."""
        params = {
            "page": random.randint(1, 3),
            "page_size": 20
        }
        self.client.get("/api/appointments/", headers=self.headers, params=params, name="List Appointments")
    
    @task(2)
    def view_appointment_detail(self):
        """Simulate viewing appointment details."""
        # Get a random appointment ID (simulate existing data)
        appointment_id = random.randint(1, 100)
        self.client.get(f"/api/appointments/{appointment_id}/", headers=self.headers, name="Appointment Detail")
    
    @task(1)
    def create_appointment(self):
        """Simulate creating a new appointment."""
        appointment_data = {
            "doctor": random.randint(1, 10),
            "appointment_date": "2025-07-01",
            "appointment_time": f"{random.randint(9, 16):02d}:00:00",
            "reason": "Regular checkup",
            "notes": "Patient feeling well"
        }
        
        response = self.client.post("/api/appointments/", 
                                  json=appointment_data, 
                                  headers=self.headers, 
                                  name="Create Appointment")
        
        if response.status_code == 201:
            # Store created appointment for potential updates
            self.created_appointment = response.json()
    
    @task(1)
    def update_appointment(self):
        """Simulate updating an appointment."""
        if hasattr(self, 'created_appointment'):
            appointment_id = self.created_appointment.get('id')
            update_data = {
                "notes": f"Updated notes at {random.randint(1000, 9999)}"
            }
            
            self.client.patch(f"/api/appointments/{appointment_id}/", 
                            json=update_data, 
                            headers=self.headers, 
                            name="Update Appointment")
    
    @task(4)
    def list_patients(self):
        """Simulate listing patients (for doctors/staff)."""
        params = {
            "page": random.randint(1, 5),
            "page_size": 20,
            "search": random.choice(["", "john", "smith", ""])
        }
        self.client.get("/api/patients/", headers=self.headers, params=params, name="List Patients")
    
    @task(2)
    def view_patient_detail(self):
        """Simulate viewing patient details."""
        patient_id = random.randint(1, 50)
        self.client.get(f"/api/patients/{patient_id}/", headers=self.headers, name="Patient Detail")
    
    @task(3)
    def list_doctors(self):
        """Simulate listing doctors."""
        params = {
            "page": 1,
            "page_size": 20,
            "specialization": random.choice(["", "cardiology", "neurology", ""])
        }
        self.client.get("/api/doctors/", headers=self.headers, params=params, name="List Doctors")
    
    @task(2)
    def view_doctor_detail(self):
        """Simulate viewing doctor details."""
        doctor_id = random.randint(1, 10)
        self.client.get(f"/api/doctors/{doctor_id}/", headers=self.headers, name="Doctor Detail")
    
    @task(1)
    def view_medical_records(self):
        """Simulate viewing medical records."""
        if self.user_id:
            self.client.get(f"/api/medical-records/?patient={self.user_id}", 
                          headers=self.headers, 
                          name="Medical Records")
    
    @task(2)
    def search_appointments(self):
        """Simulate searching appointments."""
        search_params = {
            "search": random.choice(["checkup", "consultation", "follow-up"]),
            "date_from": "2025-06-01",
            "date_to": "2025-12-31"
        }
        self.client.get("/api/appointments/search/", 
                       headers=self.headers, 
                       params=search_params, 
                       name="Search Appointments")
    
    @task(1)
    def view_billing(self):
        """Simulate viewing billing information."""
        params = {"page": 1, "page_size": 10}
        self.client.get("/api/billing/", headers=self.headers, params=params, name="Billing")
    
    @task(1)
    def view_notifications(self):
        """Simulate viewing notifications."""
        self.client.get("/api/notifications/", headers=self.headers, name="Notifications")
    
    @task(1)
    def update_profile(self):
        """Simulate updating user profile."""
        profile_data = {
            "first_name": f"Updated{random.randint(1, 1000)}",
            "phone": f"+1555{random.randint(1000000, 9999999)}"
        }
        self.client.patch("/api/auth/user/", 
                         json=profile_data, 
                         headers=self.headers, 
                         name="Update Profile")
    
    def on_stop(self):
        """Called when user stops. Perform cleanup."""
        if hasattr(self, 'headers'):
            # Logout
            self.client.post("/api/auth/logout/", headers=self.headers)


class DoctorUser(HttpUser):
    """
    Simulates a doctor user with different access patterns.
    """
    
    wait_time = between(2, 5)
    weight = 2  # Doctors are less frequent than patients
    
    def on_start(self):
        """Login as doctor."""
        self.login_as_doctor()
    
    def login_as_doctor(self):
        """Login with doctor credentials."""
        login_data = {
            "username": f"doctor{random.randint(1, 10)}@hospital.com",
            "password": "doctorpassword123"
        }
        
        response = self.client.post("/api/auth/login/", json=login_data)
        if response.status_code == 200:
            data = response.json()
            self.token = data.get("access")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            raise RescheduleTask("Doctor login failed")
    
    @task(5)
    def view_doctor_dashboard(self):
        """View doctor-specific dashboard."""
        self.client.get("/api/dashboard/doctor/", headers=self.headers, name="Doctor Dashboard")
    
    @task(4)
    def view_today_appointments(self):
        """View today's appointments."""
        params = {"date": "2025-06-22"}
        self.client.get("/api/appointments/today/", 
                       headers=self.headers, 
                       params=params, 
                       name="Today's Appointments")
    
    @task(3)
    def view_patient_list(self):
        """View assigned patients."""
        self.client.get("/api/patients/assigned/", headers=self.headers, name="Assigned Patients")
    
    @task(2)
    def update_appointment_status(self):
        """Update appointment status."""
        appointment_id = random.randint(1, 100)
        status_data = {
            "status": random.choice(["completed", "in_progress", "cancelled"])
        }
        self.client.patch(f"/api/appointments/{appointment_id}/status/", 
                         json=status_data, 
                         headers=self.headers, 
                         name="Update Appointment Status")
    
    @task(2)
    def add_medical_record(self):
        """Add medical record entry."""
        record_data = {
            "patient": random.randint(1, 50),
            "diagnosis": "Regular checkup completed",
            "treatment": "No treatment required",
            "notes": f"Patient examined on {random.randint(1, 28)}/06/2025"
        }
        self.client.post("/api/medical-records/", 
                        json=record_data, 
                        headers=self.headers, 
                        name="Add Medical Record")


class AdminUser(HttpUser):
    """
    Simulates an admin user with system management tasks.
    """
    
    wait_time = between(5, 10)
    weight = 1  # Admins are least frequent
    
    def on_start(self):
        """Login as admin."""
        self.login_as_admin()
    
    def login_as_admin(self):
        """Login with admin credentials."""
        login_data = {
            "username": "admin@hospital.com",
            "password": "adminpassword123"
        }
        
        response = self.client.post("/api/auth/login/", json=login_data)
        if response.status_code == 200:
            data = response.json()
            self.token = data.get("access")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            raise RescheduleTask("Admin login failed")
    
    @task(3)
    def view_admin_dashboard(self):
        """View admin dashboard with system stats."""
        self.client.get("/api/dashboard/admin/", headers=self.headers, name="Admin Dashboard")
    
    @task(2)
    def view_system_reports(self):
        """View system reports."""
        self.client.get("/api/reports/system/", headers=self.headers, name="System Reports")
    
    @task(2)
    def view_user_management(self):
        """View user management interface."""
        params = {"page": 1, "page_size": 50}
        self.client.get("/api/users/", headers=self.headers, params=params, name="User Management")
    
    @task(1)
    def view_audit_logs(self):
        """View audit logs."""
        params = {"page": 1, "page_size": 100}
        self.client.get("/api/audit/", headers=self.headers, params=params, name="Audit Logs")
    
    @task(1)
    def generate_report(self):
        """Generate system report."""
        report_data = {
            "type": "monthly",
            "date_from": "2025-06-01",
            "date_to": "2025-06-30"
        }
        self.client.post("/api/reports/generate/", 
                        json=report_data, 
                        headers=self.headers, 
                        name="Generate Report")
