from rest_framework import permissions


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Permission that allows access to owners of an object or admin users
    """
    
    def has_object_permission(self, request, view, obj):
        # Admin users have full access
        if request.user.is_staff or request.user.role == 'admin':
            return True
        
        # Check if the user is the owner of the object
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        # For User objects, check if it's the same user
        if hasattr(obj, 'id') and hasattr(request.user, 'id'):
            return obj.id == request.user.id
        
        return False


class IsAdminUser(permissions.BasePermission):
    """
    Permission that only allows access to admin users
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            (request.user.is_staff or request.user.role == 'admin')
        )


class IsDoctorOrAdmin(permissions.BasePermission):
    """
    Permission that allows access to doctors or admin users
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['doctor', 'admin']
        )


class IsPatientOrDoctorOrAdmin(permissions.BasePermission):
    """
    Permission that allows access to patients, doctors, or admin users
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['patient', 'doctor', 'admin']
        )


class IsStaffOrAdmin(permissions.BasePermission):
    """
    Permission that allows access to staff members or admin users
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            (request.user.is_staff or request.user.role in ['admin', 'nurse', 'receptionist', 'pharmacist'])
        )


class CanViewMedicalRecords(permissions.BasePermission):
    """
    Permission for viewing medical records
    Only doctors, the patient themselves, or admin can view medical records
    """
    
    def has_object_permission(self, request, view, obj):
        # Admin users have full access
        if request.user.role == 'admin':
            return True
        
        # Doctors can view medical records
        if request.user.role == 'doctor':
            return True
        
        # Patients can only view their own medical records
        if request.user.role == 'patient':
            if hasattr(obj, 'patient'):
                return obj.patient.user == request.user
            elif hasattr(obj, 'user'):
                return obj.user == request.user
        
        return False


class CanEditMedicalRecords(permissions.BasePermission):
    """
    Permission for editing medical records
    Only doctors or admin can edit medical records
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['doctor', 'admin']
        )
    
    def has_object_permission(self, request, view, obj):
        # Admin users have full access
        if request.user.role == 'admin':
            return True
        
        # Doctors can edit medical records they created or are assigned to
        if request.user.role == 'doctor':
            if hasattr(obj, 'doctor'):
                return obj.doctor == request.user
        
        return False


class CanManageAppointments(permissions.BasePermission):
    """
    Permission for managing appointments
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['patient', 'doctor', 'admin', 'receptionist']
        )
    
    def has_object_permission(self, request, view, obj):
        # Admin and receptionist have full access
        if request.user.role in ['admin', 'receptionist']:
            return True
        
        # Patients can manage their own appointments
        if request.user.role == 'patient':
            if hasattr(obj, 'patient'):
                return obj.patient.user == request.user
        
        # Doctors can manage appointments assigned to them
        if request.user.role == 'doctor':
            if hasattr(obj, 'doctor'):
                return obj.doctor == request.user
        
        return False


class CanViewBilling(permissions.BasePermission):
    """
    Permission for viewing billing information
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['patient', 'admin', 'receptionist']
        )
    
    def has_object_permission(self, request, view, obj):
        # Admin and receptionist have full access
        if request.user.role in ['admin', 'receptionist']:
            return True
        
        # Patients can view their own billing information
        if request.user.role == 'patient':
            if hasattr(obj, 'patient'):
                return obj.patient.user == request.user
        
        return False


class CanManageBilling(permissions.BasePermission):
    """
    Permission for managing billing information
    Only admin and receptionist can manage billing
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['admin', 'receptionist']
        )


class IsVerifiedUser(permissions.BasePermission):
    """
    Permission that requires user to be verified
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.is_verified
        )


class ReadOnlyOrAdmin(permissions.BasePermission):
    """
    Permission that allows read-only access to authenticated users
    and full access to admin users
    """
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'admin'
        )
