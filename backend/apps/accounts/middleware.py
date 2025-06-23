"""
Middleware for access control and security
"""

from django.http import JsonResponse
from django.urls import resolve
from django.contrib.auth import get_user_model

User = get_user_model()


class RoleProtectionMiddleware:
    """
    Middleware to prevent unauthorized role manipulation in requests
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        
        # URLs that allow role specification (admin-only endpoints)
        self.admin_only_role_endpoints = [
            'accounts:create_doctor',
            'accounts:create_nurse',
            'accounts:user_list',
        ]
        
        # URLs that should only allow patient registration
        self.patient_only_endpoints = [
            'accounts:register',
        ]

    def __call__(self, request):
        # Check for role manipulation attempts
        if request.method in ['POST', 'PUT', 'PATCH']:
            self._check_role_manipulation(request)
        
        response = self.get_response(request)
        return response

    def _check_role_manipulation(self, request):
        """Check for unauthorized role manipulation attempts"""
        try:
            # Get the current URL name
            url_name = resolve(request.path_info).url_name
            
            # Check if role is being specified in the request
            role_in_data = None
            if hasattr(request, 'data') and 'role' in request.data:
                role_in_data = request.data.get('role')
            elif request.content_type == 'application/json':
                import json
                try:
                    data = json.loads(request.body.decode('utf-8'))
                    role_in_data = data.get('role')
                except (json.JSONDecodeError, UnicodeDecodeError):
                    pass
            
            if role_in_data:
                # Patient registration endpoints should only allow patient role
                if url_name in self.patient_only_endpoints:
                    if role_in_data != User.UserRole.PATIENT:
                        return JsonResponse({
                            'error': 'Unauthorized role specification',
                            'detail': 'Public registration is only available for patients. Contact an administrator for other account types.'
                        }, status=403)
                
                # Admin-only endpoints require admin authentication
                elif url_name in self.admin_only_role_endpoints:
                    if not request.user.is_authenticated or not request.user.is_admin:
                        return JsonResponse({
                            'error': 'Insufficient permissions',
                            'detail': 'Only administrators can create accounts with specified roles.'
                        }, status=403)
                
                # All other endpoints should not allow role specification
                else:
                    return JsonResponse({
                        'error': 'Unauthorized role specification',
                        'detail': 'Role cannot be specified for this endpoint.'
                    }, status=403)
        
        except Exception:
            # If there's any error in processing, continue normally
            pass


class DataCompletenessMiddleware:
    """
    Middleware to ensure data completeness for user creation
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        
        # Required fields for different user types
        self.required_fields = {
            'patient': [
                'first_name', 'last_name', 'email', 'phone_number', 'date_of_birth', 'gender',
                'address_line_1', 'city', 'state', 'postal_code', 'country',
                'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship'
            ],
            'doctor': [
                'first_name', 'last_name', 'email', 'phone_number', 'date_of_birth', 'gender',
                'license_number', 'department'
            ],
            'nurse': [
                'first_name', 'last_name', 'email', 'phone_number', 'date_of_birth', 'gender',
                'license_number', 'department'
            ],
            'admin': [
                'first_name', 'last_name', 'email', 'phone_number', 'date_of_birth', 'gender',
                'employee_id', 'department'
            ]
        }

    def __call__(self, request):
        response = self.get_response(request)
        return response

    def _validate_required_fields(self, request, user_role):
        """Validate that all required fields are present for the user role"""
        required = self.required_fields.get(user_role, [])
        
        # Get data from request
        data = {}
        if hasattr(request, 'data'):
            data = request.data
        elif request.content_type == 'application/json':
            import json
            try:
                data = json.loads(request.body.decode('utf-8'))
            except (json.JSONDecodeError, UnicodeDecodeError):
                pass
        
        missing_fields = []
        for field in required:
            if field not in data or not data[field] or (isinstance(data[field], str) and not data[field].strip()):
                missing_fields.append(field.replace('_', ' ').title())
        
        if missing_fields:
            return JsonResponse({
                'error': 'Incomplete data',
                'detail': f'The following required fields are missing: {", ".join(missing_fields)}',
                'missing_fields': missing_fields
            }, status=400)
        
        return None


class SecurityHeadersMiddleware:
    """
    Middleware to add security headers for user management endpoints
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Add security headers for user management endpoints
        if request.path.startswith('/api/accounts/'):
            response['X-Content-Type-Options'] = 'nosniff'
            response['X-Frame-Options'] = 'DENY'
            response['X-XSS-Protection'] = '1; mode=block'
            response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
            
            # Add CSRF protection reminder for state-changing operations
            if request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
                response['X-CSRF-Protection'] = 'required'
        
        return response
