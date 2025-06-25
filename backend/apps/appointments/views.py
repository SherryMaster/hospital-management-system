from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import datetime, date, timedelta
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from .models import Appointment
from .serializers import (
    AppointmentSerializer,
    AppointmentCreateSerializer,
    AppointmentUpdateSerializer,
    AppointmentListSerializer,
    AppointmentCalendarSerializer,
    MyAppointmentSerializer,
    AppointmentStatusUpdateSerializer
)
from apps.accounts.permissions import (
    IsAdminUser,
    IsOwnerOrAdmin,
    CanManageAppointments,
    IsStaffOrAdmin
)


class AppointmentListCreateView(generics.ListCreateAPIView):
    """
    List all appointments or create a new appointment
    """
    queryset = Appointment.objects.select_related('patient__user', 'doctor', 'department')
    permission_classes = [CanManageAppointments]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AppointmentCreateSerializer
        return AppointmentListSerializer

    def get_queryset(self):
        queryset = Appointment.objects.select_related('patient__user', 'doctor', 'department')

        # Filter by patient (for patients, only show their own appointments)
        if self.request.user.role == 'patient':
            if hasattr(self.request.user, 'patient_profile'):
                queryset = queryset.filter(patient=self.request.user.patient_profile)
            else:
                queryset = queryset.none()

        # Filter by doctor (for doctors, only show their appointments)
        elif self.request.user.role == 'doctor':
            queryset = queryset.filter(doctor=self.request.user)

        # Apply query parameters
        patient_id = self.request.query_params.get('patient_id')
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)

        doctor_id = self.request.query_params.get('doctor_id')
        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)

        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        appointment_type = self.request.query_params.get('appointment_type')
        if appointment_type:
            queryset = queryset.filter(appointment_type=appointment_type)

        # Date filters
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(appointment_date__gte=date_from)
        if date_to:
            queryset = queryset.filter(appointment_date__lte=date_to)

        # Today's appointments
        today = self.request.query_params.get('today')
        if today and today.lower() == 'true':
            queryset = queryset.filter(appointment_date=date.today())

        # Upcoming appointments
        upcoming = self.request.query_params.get('upcoming')
        if upcoming and upcoming.lower() == 'true':
            queryset = queryset.filter(appointment_date__gte=date.today())

        # Search functionality
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(appointment_id__icontains=search) |
                Q(patient__user__first_name__icontains=search) |
                Q(patient__user__last_name__icontains=search) |
                Q(doctor__first_name__icontains=search) |
                Q(doctor__last_name__icontains=search) |
                Q(chief_complaint__icontains=search)
            )

        return queryset.order_by('appointment_date', 'appointment_time')

    @extend_schema(
        summary="List appointments",
        description="Get list of appointments with filtering options",
        parameters=[
            OpenApiParameter(name='patient_id', type=OpenApiTypes.INT, description='Filter by patient ID'),
            OpenApiParameter(name='doctor_id', type=OpenApiTypes.INT, description='Filter by doctor ID'),
            OpenApiParameter(name='status', type=OpenApiTypes.STR, description='Filter by appointment status'),
            OpenApiParameter(name='appointment_type', type=OpenApiTypes.STR, description='Filter by appointment type'),
            OpenApiParameter(name='date_from', type=OpenApiTypes.DATE, description='Filter from date'),
            OpenApiParameter(name='date_to', type=OpenApiTypes.DATE, description='Filter to date'),
            OpenApiParameter(name='today', type=OpenApiTypes.BOOL, description='Show only today\'s appointments'),
            OpenApiParameter(name='upcoming', type=OpenApiTypes.BOOL, description='Show only upcoming appointments'),
            OpenApiParameter(name='search', type=OpenApiTypes.STR, description='Search appointments'),
        ]
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Create appointment",
        description="Create a new appointment"
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class AppointmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete an appointment
    """
    queryset = Appointment.objects.select_related('patient__user', 'doctor', 'department')
    permission_classes = [CanManageAppointments]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return AppointmentUpdateSerializer
        return AppointmentSerializer

    @extend_schema(
        summary="Get appointment details",
        description="Retrieve detailed appointment information"
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Update appointment",
        description="Update appointment information"
    )
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)

    @extend_schema(
        summary="Partially update appointment",
        description="Partially update appointment information"
    )
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)

    @extend_schema(
        summary="Delete appointment",
        description="Cancel/delete appointment"
    )
    def delete(self, request, *args, **kwargs):
        appointment = self.get_object()
        appointment.status = 'cancelled'
        appointment.cancelled_at = timezone.now()
        appointment.cancelled_by = request.user
        appointment.cancellation_reason = 'Deleted by user'
        appointment.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MyAppointmentsView(generics.ListCreateAPIView):
    """
    Current user's appointments (patient view)
    """
    serializer_class = MyAppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Get current user's appointments"""
        if self.request.user.role == 'patient':
            if hasattr(self.request.user, 'patient_profile'):
                return Appointment.objects.filter(
                    patient=self.request.user.patient_profile
                ).select_related('doctor', 'department').order_by('-appointment_date', '-appointment_time')
        elif self.request.user.role == 'doctor':
            return Appointment.objects.filter(
                doctor=self.request.user
            ).select_related('patient__user', 'department').order_by('-appointment_date', '-appointment_time')

        return Appointment.objects.none()

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AppointmentCreateSerializer
        return MyAppointmentSerializer

    @extend_schema(
        summary="Get my appointments",
        description="Get current user's appointments"
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Book appointment",
        description="Book a new appointment (patient only)"
    )
    def post(self, request, *args, **kwargs):
        if request.user.role != 'patient':
            return Response(
                {'error': 'Only patients can book appointments through this endpoint'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Automatically set patient to current user's patient profile
        if hasattr(request.user, 'patient_profile'):
            request.data['patient'] = request.user.patient_profile.id
        else:
            return Response(
                {'error': 'Patient profile not found'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return super().post(request, *args, **kwargs)


class AppointmentStatusUpdateView(generics.UpdateAPIView):
    """
    Update appointment status only
    """
    queryset = Appointment.objects.all()
    serializer_class = AppointmentStatusUpdateSerializer
    permission_classes = [CanManageAppointments]

    @extend_schema(
        summary="Update appointment status",
        description="Update appointment status (confirm, cancel, complete, etc.)"
    )
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)


class AppointmentCalendarView(generics.ListAPIView):
    """
    Calendar view of appointments
    """
    serializer_class = AppointmentCalendarSerializer
    permission_classes = [IsStaffOrAdmin]

    def get_queryset(self):
        queryset = Appointment.objects.select_related('patient__user', 'doctor', 'department')

        # Filter by date range (default to current month)
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')

        if not date_from:
            # Default to start of current month
            today = date.today()
            date_from = today.replace(day=1)
        else:
            date_from = datetime.strptime(date_from, '%Y-%m-%d').date()

        if not date_to:
            # Default to end of current month
            if date_from.month == 12:
                date_to = date_from.replace(year=date_from.year + 1, month=1, day=1) - timedelta(days=1)
            else:
                date_to = date_from.replace(month=date_from.month + 1, day=1) - timedelta(days=1)
        else:
            date_to = datetime.strptime(date_to, '%Y-%m-%d').date()

        queryset = queryset.filter(
            appointment_date__gte=date_from,
            appointment_date__lte=date_to
        )

        # Filter by doctor
        doctor_id = self.request.query_params.get('doctor_id')
        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)

        # Filter by department
        department_id = self.request.query_params.get('department_id')
        if department_id:
            queryset = queryset.filter(department_id=department_id)

        return queryset.order_by('appointment_date', 'appointment_time')

    @extend_schema(
        summary="Get appointment calendar",
        description="Get appointments in calendar format",
        parameters=[
            OpenApiParameter(name='date_from', type=OpenApiTypes.DATE, description='Start date (default: start of current month)'),
            OpenApiParameter(name='date_to', type=OpenApiTypes.DATE, description='End date (default: end of current month)'),
            OpenApiParameter(name='doctor_id', type=OpenApiTypes.INT, description='Filter by doctor ID'),
            OpenApiParameter(name='department_id', type=OpenApiTypes.INT, description='Filter by department ID'),
        ]
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class AppointmentCancelView(APIView):
    """
    Cancel an appointment with reason
    """
    permission_classes = [CanManageAppointments]

    @extend_schema(
        summary="Cancel appointment",
        description="Cancel an appointment with a reason",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'reason': {
                        'type': 'string',
                        'description': 'Reason for cancellation'
                    }
                },
                'required': ['reason']
            }
        }
    )
    def patch(self, request, pk):
        try:
            appointment = get_object_or_404(Appointment, pk=pk)

            # Check if appointment can be cancelled
            if appointment.status in ['cancelled', 'completed']:
                return Response(
                    {'error': f'Cannot cancel appointment with status: {appointment.status}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            reason = request.data.get('reason', 'Cancelled by staff')

            # Update appointment status
            appointment.status = 'cancelled'
            appointment.cancelled_at = timezone.now()
            appointment.cancelled_by = request.user
            appointment.cancellation_reason = reason
            appointment.save()

            # Return updated appointment data
            serializer = AppointmentSerializer(appointment)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def debug_appointments(request):
    """Debug endpoint to check appointments data"""
    try:
        appointments = Appointment.objects.all()
        data = []
        for apt in appointments:
            data.append({
                'id': apt.id,
                'patient_name': str(apt.patient) if apt.patient else 'No Patient',
                'doctor_name': str(apt.doctor) if apt.doctor else 'No Doctor',
                'date': str(apt.appointment_date),
                'time': str(apt.appointment_time),
                'status': apt.status,
                'type': apt.appointment_type,
            })

        return Response({
            'user': {
                'email': request.user.email,
                'role': request.user.role,
                'is_authenticated': request.user.is_authenticated,
            },
            'appointments_count': appointments.count(),
            'appointments': data
        })
    except Exception as e:
        return Response({'error': str(e)}, status=500)


class TodayAppointmentsView(generics.ListAPIView):
    """
    Today's appointments view
    """
    serializer_class = AppointmentListSerializer
    permission_classes = [IsStaffOrAdmin]

    def get_queryset(self):
        queryset = Appointment.objects.filter(
            appointment_date=date.today()
        ).select_related('patient__user', 'doctor', 'department')

        # Filter by doctor for doctor users
        if self.request.user.role == 'doctor':
            queryset = queryset.filter(doctor=self.request.user)

        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset.order_by('appointment_time')

    @extend_schema(
        summary="Get today's appointments",
        description="Get all appointments scheduled for today",
        parameters=[
            OpenApiParameter(name='status', type=OpenApiTypes.STR, description='Filter by appointment status'),
        ]
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
