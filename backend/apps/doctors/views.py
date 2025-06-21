from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from datetime import date, datetime, timedelta

from .models import Department, Specialization, Doctor
from .serializers import (
    DepartmentSerializer,
    DepartmentListSerializer,
    SpecializationSerializer,
    DoctorSerializer,
    DoctorCreateSerializer,
    DoctorUpdateSerializer,
    DoctorListSerializer,
    DoctorAvailabilitySerializer,
    MyDoctorProfileSerializer,
    DoctorScheduleSerializer
)
from apps.accounts.permissions import (
    IsAdminUser,
    IsOwnerOrAdmin,
    IsDoctorOrAdmin,
    IsStaffOrAdmin,
    ReadOnlyOrAdmin
)


class DepartmentListCreateView(generics.ListCreateAPIView):
    """
    List all departments or create a new department
    """
    queryset = Department.objects.all()
    permission_classes = [ReadOnlyOrAdmin]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return DepartmentSerializer
        return DepartmentListSerializer

    def get_queryset(self):
        queryset = Department.objects.filter(is_active=True)

        # Search functionality
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(location__icontains=search)
            )

        return queryset.order_by('name')

    @extend_schema(
        summary="List departments",
        description="Get list of all hospital departments",
        parameters=[
            OpenApiParameter(name='search', type=OpenApiTypes.STR, description='Search departments'),
        ]
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Create department",
        description="Create a new hospital department (admin only)"
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class DepartmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a department
    """
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [ReadOnlyOrAdmin]

    @extend_schema(
        summary="Get department details",
        description="Retrieve detailed department information"
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Update department",
        description="Update department information (admin only)"
    )
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)

    @extend_schema(
        summary="Partially update department",
        description="Partially update department information (admin only)"
    )
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)

    @extend_schema(
        summary="Delete department",
        description="Soft delete department (admin only)"
    )
    def delete(self, request, *args, **kwargs):
        # Soft delete instead of hard delete
        department = self.get_object()
        department.is_active = False
        department.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SpecializationListCreateView(generics.ListCreateAPIView):
    """
    List all specializations or create a new specialization
    """
    queryset = Specialization.objects.filter(is_active=True)
    serializer_class = SpecializationSerializer
    permission_classes = [ReadOnlyOrAdmin]

    def get_queryset(self):
        queryset = Specialization.objects.filter(is_active=True)

        # Search functionality
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search)
            )

        return queryset.order_by('name')

    @extend_schema(
        summary="List specializations",
        description="Get list of all medical specializations",
        parameters=[
            OpenApiParameter(name='search', type=OpenApiTypes.STR, description='Search specializations'),
        ]
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Create specialization",
        description="Create a new medical specialization (admin only)"
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class SpecializationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a specialization
    """
    queryset = Specialization.objects.all()
    serializer_class = SpecializationSerializer
    permission_classes = [ReadOnlyOrAdmin]

    @extend_schema(
        summary="Get specialization details",
        description="Retrieve detailed specialization information"
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Update specialization",
        description="Update specialization information (admin only)"
    )
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)

    @extend_schema(
        summary="Delete specialization",
        description="Soft delete specialization (admin only)"
    )
    def delete(self, request, *args, **kwargs):
        # Soft delete instead of hard delete
        specialization = self.get_object()
        specialization.is_active = False
        specialization.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class DoctorListCreateView(generics.ListCreateAPIView):
    """
    List all doctors or create a new doctor profile
    """
    queryset = Doctor.objects.select_related('user', 'department')
    permission_classes = [IsStaffOrAdmin]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return DoctorCreateSerializer
        return DoctorListSerializer

    def get_queryset(self):
        queryset = Doctor.objects.select_related('user', 'department').prefetch_related('specializations').filter(is_active=True)

        # Search functionality
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(doctor_id__icontains=search) |
                Q(license_number__icontains=search) |
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(user__email__icontains=search) |
                Q(department__name__icontains=search) |
                Q(specializations__name__icontains=search)
            ).distinct()

        # Filter by department
        department = self.request.query_params.get('department')
        if department:
            queryset = queryset.filter(department_id=department)

        # Filter by specialization
        specialization = self.request.query_params.get('specialization')
        if specialization:
            queryset = queryset.filter(specializations__id=specialization)

        # Filter by employment status
        employment_status = self.request.query_params.get('employment_status')
        if employment_status:
            queryset = queryset.filter(employment_status=employment_status)

        # Filter by accepting patients
        accepting_patients = self.request.query_params.get('accepting_patients')
        if accepting_patients is not None:
            queryset = queryset.filter(is_accepting_patients=accepting_patients.lower() == 'true')

        return queryset.order_by('-created_at')

    @extend_schema(
        summary="List doctors",
        description="Get list of all doctors",
        parameters=[
            OpenApiParameter(name='search', type=OpenApiTypes.STR, description='Search doctors'),
            OpenApiParameter(name='department', type=OpenApiTypes.INT, description='Filter by department ID'),
            OpenApiParameter(name='specialization', type=OpenApiTypes.INT, description='Filter by specialization ID'),
            OpenApiParameter(name='employment_status', type=OpenApiTypes.STR, description='Filter by employment status'),
            OpenApiParameter(name='accepting_patients', type=OpenApiTypes.BOOL, description='Filter by accepting patients'),
        ]
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Create doctor profile",
        description="Create a new doctor profile for an existing user"
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class DoctorDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a doctor profile
    """
    queryset = Doctor.objects.select_related('user', 'department').prefetch_related('specializations')
    permission_classes = [IsOwnerOrAdmin]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return DoctorUpdateSerializer
        return DoctorSerializer

    @extend_schema(
        summary="Get doctor details",
        description="Retrieve detailed doctor information"
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Update doctor profile",
        description="Update doctor profile information"
    )
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)

    @extend_schema(
        summary="Partially update doctor profile",
        description="Partially update doctor profile information"
    )
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)

    @extend_schema(
        summary="Delete doctor profile",
        description="Soft delete doctor profile (admin only)"
    )
    def delete(self, request, *args, **kwargs):
        # Soft delete instead of hard delete
        doctor = self.get_object()
        doctor.is_active = False
        doctor.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MyDoctorProfileView(generics.RetrieveUpdateAPIView):
    """
    Current doctor's own profile view
    """
    serializer_class = MyDoctorProfileSerializer
    permission_classes = [IsDoctorOrAdmin]

    def get_object(self):
        """Get current user's doctor profile"""
        if not hasattr(self.request.user, 'doctor_profile'):
            # Create doctor profile if it doesn't exist
            Doctor.objects.create(user=self.request.user)
        return self.request.user.doctor_profile

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return DoctorUpdateSerializer
        return MyDoctorProfileSerializer

    @extend_schema(
        summary="Get my doctor profile",
        description="Get current user's doctor profile"
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Update my doctor profile",
        description="Update current user's doctor profile"
    )
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)

    @extend_schema(
        summary="Partially update my doctor profile",
        description="Partially update current user's doctor profile"
    )
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)


class DoctorAvailabilityView(APIView):
    """
    Get doctor availability information
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Get doctor availability",
        description="Get doctor availability and appointment slots",
        parameters=[
            OpenApiParameter(name='date', type=OpenApiTypes.DATE, description='Date to check availability (default: today)'),
        ]
    )
    def get(self, request, pk):
        doctor = get_object_or_404(Doctor, pk=pk, is_active=True)

        # Get date from query params or use today
        date_str = request.query_params.get('date')
        if date_str:
            try:
                check_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'error': 'Invalid date format. Use YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            check_date = date.today()

        # Get appointments for the date
        from apps.appointments.models import Appointment
        appointments = Appointment.objects.filter(
            doctor=doctor.user,
            appointment_date=check_date,
            status__in=['scheduled', 'confirmed', 'in_progress']
        ).order_by('appointment_time')

        # Generate available time slots (9 AM to 5 PM, 30-minute slots)
        available_slots = []
        start_time = datetime.combine(check_date, datetime.min.time().replace(hour=9))
        end_time = datetime.combine(check_date, datetime.min.time().replace(hour=17))

        current_time = start_time
        while current_time < end_time:
            slot_time = current_time.time()

            # Check if slot is available
            is_available = not appointments.filter(appointment_time=slot_time).exists()

            if is_available:
                available_slots.append(slot_time.strftime('%H:%M'))

            current_time += timedelta(minutes=30)

        data = {
            'doctor_id': doctor.doctor_id,
            'full_name': doctor.get_full_name(),
            'department': doctor.department.name if doctor.department else None,
            'specializations': doctor.get_specializations_list(),
            'consultation_fee': doctor.consultation_fee,
            'is_accepting_patients': doctor.is_accepting_patients,
            'max_patients_per_day': doctor.max_patients_per_day,
            'current_patient_count': doctor.get_current_patient_count(),
            'can_accept_more_patients': doctor.can_accept_more_patients_today(),
            'available_slots': available_slots
        }

        serializer = DoctorAvailabilitySerializer(data)
        return Response(serializer.data)


class DoctorScheduleView(APIView):
    """
    Get doctor's schedule for a specific date
    """
    permission_classes = [IsDoctorOrAdmin]

    @extend_schema(
        summary="Get doctor schedule",
        description="Get doctor's appointment schedule for a specific date",
        parameters=[
            OpenApiParameter(name='date', type=OpenApiTypes.DATE, description='Date to get schedule (default: today)'),
        ]
    )
    def get(self, request, pk):
        doctor = get_object_or_404(Doctor, pk=pk, is_active=True)

        # Check permissions - doctors can only view their own schedule
        if request.user.role == 'doctor' and doctor.user != request.user:
            return Response(
                {'error': 'You can only view your own schedule'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get date from query params or use today
        date_str = request.query_params.get('date')
        if date_str:
            try:
                check_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'error': 'Invalid date format. Use YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            check_date = date.today()

        # Get appointments for the date
        from apps.appointments.models import Appointment
        appointments = Appointment.objects.filter(
            doctor=doctor.user,
            appointment_date=check_date
        ).select_related('patient__user').order_by('appointment_time')

        # Format appointment data
        appointment_data = []
        for appointment in appointments:
            appointment_data.append({
                'id': appointment.id,
                'appointment_id': appointment.appointment_id,
                'patient_name': appointment.patient.get_full_name(),
                'appointment_time': appointment.appointment_time.strftime('%H:%M'),
                'duration': appointment.duration,
                'appointment_type': appointment.appointment_type,
                'status': appointment.status,
                'chief_complaint': appointment.chief_complaint
            })

        # Generate available time slots
        available_slots = []
        start_time = datetime.combine(check_date, datetime.min.time().replace(hour=9))
        end_time = datetime.combine(check_date, datetime.min.time().replace(hour=17))

        current_time = start_time
        while current_time < end_time:
            slot_time = current_time.time()

            # Check if slot is available
            is_available = not appointments.filter(
                appointment_time=slot_time,
                status__in=['scheduled', 'confirmed', 'in_progress']
            ).exists()

            if is_available:
                available_slots.append(slot_time.strftime('%H:%M'))

            current_time += timedelta(minutes=30)

        data = {
            'date': check_date,
            'appointments': appointment_data,
            'total_appointments': len(appointment_data),
            'available_slots': available_slots,
            'is_available': doctor.is_accepting_patients and len(appointment_data) < doctor.max_patients_per_day
        }

        serializer = DoctorScheduleSerializer(data)
        return Response(serializer.data)
