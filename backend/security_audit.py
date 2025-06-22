#!/usr/bin/env python3
"""
Security Audit Script for Hospital Management System

Performs automated security checks and vulnerability assessments
Run this script regularly to ensure security compliance
"""

import os
import sys
import django
import requests
import json
import time
from datetime import datetime
from urllib.parse import urljoin

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hospital_management.settings')
django.setup()

from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import Client
from django.core.management import execute_from_command_line

User = get_user_model()


class SecurityAuditor:
    """Comprehensive security audit tool"""
    
    def __init__(self, base_url='http://localhost:8000'):
        self.base_url = base_url
        self.client = Client()
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'tests': [],
            'summary': {
                'total': 0,
                'passed': 0,
                'failed': 0,
                'warnings': 0
            }
        }
    
    def run_audit(self):
        """Run complete security audit"""
        print("🔒 Starting Security Audit for Hospital Management System")
        print("=" * 60)
        
        # Authentication Security Tests
        self.test_authentication_security()
        
        # Authorization Tests
        self.test_authorization_controls()
        
        # Input Validation Tests
        self.test_input_validation()
        
        # Session Security Tests
        self.test_session_security()
        
        # Security Headers Tests
        self.test_security_headers()
        
        # Rate Limiting Tests
        self.test_rate_limiting()
        
        # File Upload Security Tests
        self.test_file_upload_security()
        
        # Database Security Tests
        self.test_database_security()
        
        # Configuration Security Tests
        self.test_configuration_security()
        
        # Generate report
        self.generate_report()
    
    def test_authentication_security(self):
        """Test authentication security measures"""
        print("\n🔐 Testing Authentication Security...")
        
        # Test 1: Password strength requirements
        self.test_password_strength()
        
        # Test 2: Brute force protection
        self.test_brute_force_protection()
        
        # Test 3: JWT token security
        self.test_jwt_security()
        
        # Test 4: Account lockout
        self.test_account_lockout()
    
    def test_password_strength(self):
        """Test password strength validation"""
        weak_passwords = [
            'password',
            '123456',
            'abc123',
            'Password',
            'password123'
        ]
        
        for password in weak_passwords:
            response = self.client.post('/api/auth/register/', {
                'username': 'testuser',
                'email': 'test@example.com',
                'password': password,
                'password_confirm': password,
                'first_name': 'Test',
                'last_name': 'User',
                'role': 'patient'
            })
            
            if response.status_code == 201:
                self.add_result(
                    'Password Strength',
                    'FAIL',
                    f'Weak password "{password}" was accepted',
                    'HIGH'
                )
            else:
                self.add_result(
                    'Password Strength',
                    'PASS',
                    f'Weak password "{password}" was rejected'
                )
    
    def test_brute_force_protection(self):
        """Test brute force attack protection"""
        # Attempt multiple failed logins
        failed_attempts = 0
        for i in range(10):
            response = self.client.post('/api/auth/login/', {
                'email': 'nonexistent@example.com',
                'password': 'wrongpassword'
            })
            
            if response.status_code == 429:
                self.add_result(
                    'Brute Force Protection',
                    'PASS',
                    f'Rate limiting activated after {i+1} attempts'
                )
                break
            failed_attempts += 1
        
        if failed_attempts >= 10:
            self.add_result(
                'Brute Force Protection',
                'FAIL',
                'No rate limiting detected after 10 failed attempts',
                'HIGH'
            )
    
    def test_jwt_security(self):
        """Test JWT token security"""
        # Create test user
        user = User.objects.create_user(
            username='securitytest',
            email='security@test.com',
            password='SecurePass123!',
            role='patient'
        )
        
        # Login to get token
        response = self.client.post('/api/auth/login/', {
            'email': 'security@test.com',
            'password': 'SecurePass123!'
        })
        
        if response.status_code == 200:
            token = response.json().get('access')
            
            # Test token format
            if token and len(token.split('.')) == 3:
                self.add_result(
                    'JWT Token Format',
                    'PASS',
                    'JWT token has correct format'
                )
            else:
                self.add_result(
                    'JWT Token Format',
                    'FAIL',
                    'JWT token format is invalid',
                    'MEDIUM'
                )
            
            # Test token expiration
            # This would require mocking time or waiting
            self.add_result(
                'JWT Token Expiration',
                'INFO',
                'Token expiration test requires manual verification'
            )
        
        # Cleanup
        user.delete()
    
    def test_account_lockout(self):
        """Test account lockout mechanism"""
        # This test would require implementing account lockout
        self.add_result(
            'Account Lockout',
            'INFO',
            'Account lockout mechanism should be implemented'
        )
    
    def test_authorization_controls(self):
        """Test authorization and access controls"""
        print("\n🛡️ Testing Authorization Controls...")
        
        # Create test users with different roles
        patient_user = User.objects.create_user(
            username='patient_test',
            email='patient@test.com',
            password='SecurePass123!',
            role='patient'
        )
        
        doctor_user = User.objects.create_user(
            username='doctor_test',
            email='doctor@test.com',
            password='SecurePass123!',
            role='doctor'
        )
        
        admin_user = User.objects.create_user(
            username='admin_test',
            email='admin@test.com',
            password='SecurePass123!',
            role='admin',
            is_staff=True
        )
        
        # Test role-based access
        self.test_role_based_access(patient_user, doctor_user, admin_user)
        
        # Cleanup
        patient_user.delete()
        doctor_user.delete()
        admin_user.delete()
    
    def test_role_based_access(self, patient_user, doctor_user, admin_user):
        """Test role-based access control"""
        # Test patient access
        self.client.force_login(patient_user)
        response = self.client.get('/api/admin/users/')
        
        if response.status_code == 403:
            self.add_result(
                'RBAC - Patient Access',
                'PASS',
                'Patient correctly denied admin access'
            )
        else:
            self.add_result(
                'RBAC - Patient Access',
                'FAIL',
                'Patient can access admin endpoints',
                'HIGH'
            )
        
        # Test admin access
        self.client.force_login(admin_user)
        response = self.client.get('/api/admin/users/')
        
        if response.status_code == 200:
            self.add_result(
                'RBAC - Admin Access',
                'PASS',
                'Admin can access admin endpoints'
            )
        else:
            self.add_result(
                'RBAC - Admin Access',
                'FAIL',
                'Admin cannot access admin endpoints',
                'MEDIUM'
            )
        
        self.client.logout()
    
    def test_input_validation(self):
        """Test input validation and injection prevention"""
        print("\n🔍 Testing Input Validation...")
        
        # SQL injection tests
        self.test_sql_injection()
        
        # XSS tests
        self.test_xss_prevention()
        
        # Command injection tests
        self.test_command_injection()
    
    def test_sql_injection(self):
        """Test SQL injection prevention"""
        sql_payloads = [
            "'; DROP TABLE auth_user; --",
            "1' OR '1'='1",
            "admin'--",
            "1; DELETE FROM auth_user; --"
        ]
        
        for payload in sql_payloads:
            response = self.client.get(f'/api/appointments/?search={payload}')
            
            # Check if server error or unauthorized data access
            if response.status_code == 500:
                self.add_result(
                    'SQL Injection Prevention',
                    'FAIL',
                    f'SQL injection payload caused server error: {payload}',
                    'CRITICAL'
                )
            else:
                self.add_result(
                    'SQL Injection Prevention',
                    'PASS',
                    f'SQL injection payload handled safely: {payload}'
                )
    
    def test_xss_prevention(self):
        """Test XSS prevention"""
        xss_payloads = [
            '<script>alert("XSS")</script>',
            '<img src=x onerror=alert("XSS")>',
            'javascript:alert("XSS")',
            '<svg onload=alert("XSS")>'
        ]
        
        # Create test user
        user = User.objects.create_user(
            username='xsstest',
            email='xss@test.com',
            password='SecurePass123!',
            role='patient'
        )
        
        self.client.force_login(user)
        
        for payload in xss_payloads:
            response = self.client.patch('/api/auth/profile/', {
                'first_name': payload
            })
            
            if response.status_code == 200:
                # Check if payload was sanitized
                user.refresh_from_db()
                if '<script>' in user.first_name or 'javascript:' in user.first_name:
                    self.add_result(
                        'XSS Prevention',
                        'FAIL',
                        f'XSS payload not sanitized: {payload}',
                        'HIGH'
                    )
                else:
                    self.add_result(
                        'XSS Prevention',
                        'PASS',
                        f'XSS payload sanitized: {payload}'
                    )
        
        self.client.logout()
        user.delete()
    
    def test_command_injection(self):
        """Test command injection prevention"""
        command_payloads = [
            '; ls -la',
            '| cat /etc/passwd',
            '&& rm -rf /',
            '`whoami`'
        ]
        
        for payload in command_payloads:
            # Test in file export functionality if it exists
            response = self.client.post('/api/export/', {
                'format': payload,
                'filename': f'export{payload}'
            })
            
            # Should not execute system commands
            if response.status_code not in [400, 403, 404]:
                self.add_result(
                    'Command Injection Prevention',
                    'WARNING',
                    f'Unexpected response to command injection: {payload}'
                )
    
    def test_session_security(self):
        """Test session security measures"""
        print("\n🔐 Testing Session Security...")
        
        # Test session timeout
        self.add_result(
            'Session Timeout',
            'INFO',
            'Session timeout should be configured to 30 minutes or less'
        )
        
        # Test secure cookie flags
        response = self.client.get('/')
        if 'sessionid' in response.cookies:
            cookie = response.cookies['sessionid']
            
            if cookie.get('secure'):
                self.add_result(
                    'Secure Cookie Flag',
                    'PASS',
                    'Session cookie has secure flag'
                )
            else:
                self.add_result(
                    'Secure Cookie Flag',
                    'FAIL',
                    'Session cookie missing secure flag',
                    'MEDIUM'
                )
            
            if cookie.get('httponly'):
                self.add_result(
                    'HttpOnly Cookie Flag',
                    'PASS',
                    'Session cookie has HttpOnly flag'
                )
            else:
                self.add_result(
                    'HttpOnly Cookie Flag',
                    'FAIL',
                    'Session cookie missing HttpOnly flag',
                    'MEDIUM'
                )
    
    def test_security_headers(self):
        """Test security headers"""
        print("\n🛡️ Testing Security Headers...")
        
        response = self.client.get('/')
        headers = response.headers
        
        required_headers = {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': None,  # Should exist
            'Content-Security-Policy': None,    # Should exist
        }
        
        for header, expected_value in required_headers.items():
            if header in headers:
                if expected_value and headers[header] != expected_value:
                    self.add_result(
                        f'Security Header - {header}',
                        'WARNING',
                        f'Header value: {headers[header]}, expected: {expected_value}'
                    )
                else:
                    self.add_result(
                        f'Security Header - {header}',
                        'PASS',
                        f'Header present: {headers[header]}'
                    )
            else:
                self.add_result(
                    f'Security Header - {header}',
                    'FAIL',
                    f'Required security header missing',
                    'MEDIUM'
                )
    
    def test_rate_limiting(self):
        """Test rate limiting"""
        print("\n⏱️ Testing Rate Limiting...")
        
        # This would require actual rate limiting implementation
        self.add_result(
            'Rate Limiting',
            'INFO',
            'Rate limiting should be implemented for API endpoints'
        )
    
    def test_file_upload_security(self):
        """Test file upload security"""
        print("\n📁 Testing File Upload Security...")
        
        # This would test file upload restrictions
        self.add_result(
            'File Upload Security',
            'INFO',
            'File upload security should restrict file types and scan for malware'
        )
    
    def test_database_security(self):
        """Test database security configuration"""
        print("\n🗄️ Testing Database Security...")
        
        # Check database configuration
        db_config = settings.DATABASES['default']
        
        if 'sslmode' in db_config.get('OPTIONS', {}):
            self.add_result(
                'Database SSL',
                'PASS',
                'Database connection uses SSL'
            )
        else:
            self.add_result(
                'Database SSL',
                'FAIL',
                'Database connection does not use SSL',
                'HIGH'
            )
    
    def test_configuration_security(self):
        """Test security configuration"""
        print("\n⚙️ Testing Configuration Security...")
        
        # Check DEBUG setting
        if settings.DEBUG:
            self.add_result(
                'Debug Mode',
                'FAIL',
                'DEBUG mode is enabled in production',
                'HIGH'
            )
        else:
            self.add_result(
                'Debug Mode',
                'PASS',
                'DEBUG mode is disabled'
            )
        
        # Check SECRET_KEY
        if settings.SECRET_KEY == 'your-secret-key-here':
            self.add_result(
                'Secret Key',
                'FAIL',
                'Default secret key is being used',
                'CRITICAL'
            )
        else:
            self.add_result(
                'Secret Key',
                'PASS',
                'Custom secret key is configured'
            )
    
    def add_result(self, test_name, status, message, severity='INFO'):
        """Add test result"""
        result = {
            'test': test_name,
            'status': status,
            'message': message,
            'severity': severity,
            'timestamp': datetime.now().isoformat()
        }
        
        self.results['tests'].append(result)
        self.results['summary']['total'] += 1
        
        if status == 'PASS':
            self.results['summary']['passed'] += 1
            print(f"  ✅ {test_name}: {message}")
        elif status == 'FAIL':
            self.results['summary']['failed'] += 1
            print(f"  ❌ {test_name}: {message} [{severity}]")
        elif status == 'WARNING':
            self.results['summary']['warnings'] += 1
            print(f"  ⚠️ {test_name}: {message}")
        else:
            print(f"  ℹ️ {test_name}: {message}")
    
    def generate_report(self):
        """Generate security audit report"""
        print("\n" + "=" * 60)
        print("🔒 Security Audit Report")
        print("=" * 60)
        
        summary = self.results['summary']
        print(f"Total Tests: {summary['total']}")
        print(f"Passed: {summary['passed']}")
        print(f"Failed: {summary['failed']}")
        print(f"Warnings: {summary['warnings']}")
        
        # Calculate security score
        if summary['total'] > 0:
            score = (summary['passed'] / summary['total']) * 100
            print(f"Security Score: {score:.1f}%")
        
        # Save detailed report
        report_file = f"security_audit_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        print(f"\nDetailed report saved to: {report_file}")
        
        # Print critical issues
        critical_issues = [
            test for test in self.results['tests']
            if test['status'] == 'FAIL' and test['severity'] in ['CRITICAL', 'HIGH']
        ]
        
        if critical_issues:
            print("\n🚨 Critical Security Issues:")
            for issue in critical_issues:
                print(f"  - {issue['test']}: {issue['message']}")


if __name__ == '__main__':
    auditor = SecurityAuditor()
    auditor.run_audit()
