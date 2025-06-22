from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from .models import Patient, MedicalRecord
from .serializers import (
    PatientSerializer,
    PatientCreateSerializer,
    PatientUpdateSerializer,
    PatientListSerializer,
    PatientMedicalHistorySerializer,
    MedicalRecordSerializer,
    MedicalRecordCreateSerializer,
    MedicalRecordListSerializer,
    VitalSignsSerializer
)
from apps.accounts.permissions import (
    IsAdminUser,
    IsOwnerOrAdmin,
    CanViewMedicalRecords,
    CanEditMedicalRecords,
    IsStaffOrAdmin
)


class PatientListCreateView(generics.ListCreateAPIView):
    """
    List all patients or create a new patient profile
    """
    queryset = Patient.objects.all()
    permission_classes = [IsStaffOrAdmin]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PatientCreateSerializer
        return PatientListSerializer

    def get_queryset(self):
        queryset = Patient.objects.select_related('user').filter(is_active=True)

        # Search functionality
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(patient_id__icontains=search) |
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(user__email__icontains=search) |
                Q(user__phone_number__icontains=search)
            )

        # Filter by blood type
        blood_type = self.request.query_params.get('blood_type')
        if blood_type:
            queryset = queryset.filter(blood_type=blood_type)

        return queryset.order_by('-registration_date')

    @extend_schema(
        summary="List patients",
        description="Get list of all patients",
        parameters=[
            OpenApiParameter(name='search', type=OpenApiTypes.STR, description='Search patients'),
            OpenApiParameter(name='blood_type', type=OpenApiTypes.STR, description='Filter by blood type'),
        ]
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Create patient profile",
        description="Create a new patient profile for an existing user"
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class PatientDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a patient profile
    """
    queryset = Patient.objects.select_related('user')
    permission_classes = [IsOwnerOrAdmin]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return PatientUpdateSerializer
        return PatientSerializer

    @extend_schema(
        summary="Get patient details",
        description="Retrieve detailed patient information"
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Update patient profile",
        description="Update patient profile information"
    )
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)

    @extend_schema(
        summary="Partially update patient profile",
        description="Partially update patient profile information"
    )
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)

    @extend_schema(
        summary="Delete patient profile",
        description="Soft delete patient profile (admin only)"
    )
    def delete(self, request, *args, **kwargs):
        # Soft delete instead of hard delete
        patient = self.get_object()
        patient.is_active = False
        patient.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PatientMedicalHistoryView(generics.RetrieveAPIView):
    """
    Get complete medical history for a patient
    """
    queryset = Patient.objects.prefetch_related('medical_records')
    serializer_class = PatientMedicalHistorySerializer
    permission_classes = [CanViewMedicalRecords]

    @extend_schema(
        summary="Get patient medical history",
        description="Retrieve complete medical history for a patient"
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class MyPatientProfileView(generics.RetrieveUpdateAPIView):
    """
    Current patient's own profile view
    """
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        """Get current user's patient profile"""
        if not hasattr(self.request.user, 'patient_profile'):
            # Create patient profile if it doesn't exist with proper defaults
            Patient.objects.create(
                user=self.request.user,
                blood_type=Patient.BloodType.UNKNOWN,
                marital_status=Patient.MaritalStatus.SINGLE,
            )
        return self.request.user.patient_profile

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return PatientUpdateSerializer
        return PatientSerializer

    @extend_schema(
        summary="Get my patient profile",
        description="Get current user's patient profile"
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Update my patient profile",
        description="Update current user's patient profile"
    )
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)

    @extend_schema(
        summary="Partially update my patient profile",
        description="Partially update current user's patient profile"
    )
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)


class MedicalRecordListCreateView(generics.ListCreateAPIView):
    """
    List medical records or create a new medical record
    """
    queryset = MedicalRecord.objects.select_related('patient', 'doctor')
    permission_classes = [CanEditMedicalRecords]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MedicalRecordCreateSerializer
        return MedicalRecordListSerializer

    def get_queryset(self):
        queryset = MedicalRecord.objects.select_related('patient__user', 'doctor')

        # Filter by patient
        patient_id = self.request.query_params.get('patient_id')
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)

        # Filter by doctor
        doctor_id = self.request.query_params.get('doctor_id')
        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)

        # Filter by record type
        record_type = self.request.query_params.get('record_type')
        if record_type:
            queryset = queryset.filter(record_type=record_type)

        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(visit_date__gte=date_from)
        if date_to:
            queryset = queryset.filter(visit_date__lte=date_to)

        # Hide confidential records for non-doctors
        if self.request.user.role not in ['doctor', 'admin']:
            queryset = queryset.filter(is_confidential=False)

        return queryset.order_by('-visit_date')

    @extend_schema(
        summary="List medical records",
        description="Get list of medical records",
        parameters=[
            OpenApiParameter(name='patient_id', type=OpenApiTypes.INT, description='Filter by patient ID'),
            OpenApiParameter(name='doctor_id', type=OpenApiTypes.INT, description='Filter by doctor ID'),
            OpenApiParameter(name='record_type', type=OpenApiTypes.STR, description='Filter by record type'),
            OpenApiParameter(name='date_from', type=OpenApiTypes.DATE, description='Filter from date'),
            OpenApiParameter(name='date_to', type=OpenApiTypes.DATE, description='Filter to date'),
        ]
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Create medical record",
        description="Create a new medical record"
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class MedicalRecordDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a medical record
    """
    queryset = MedicalRecord.objects.select_related('patient', 'doctor')
    serializer_class = MedicalRecordSerializer
    permission_classes = [CanViewMedicalRecords]

    def get_permissions(self):
        """Different permissions for different actions"""
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            permission_classes = [CanEditMedicalRecords]
        else:
            permission_classes = [CanViewMedicalRecords]
        return [permission() for permission in permission_classes]

    @extend_schema(
        summary="Get medical record details",
        description="Retrieve detailed medical record information"
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Update medical record",
        description="Update medical record information"
    )
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)

    @extend_schema(
        summary="Partially update medical record",
        description="Partially update medical record information"
    )
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)

    @extend_schema(
        summary="Delete medical record",
        description="Delete medical record (admin/doctor only)"
    )
    def delete(self, request, *args, **kwargs):
        return super().delete(request, *args, **kwargs)


class PatientMedicalRecordsView(generics.ListAPIView):
    """
    Get all medical records for a specific patient
    """
    serializer_class = MedicalRecordListSerializer
    permission_classes = [CanViewMedicalRecords]

    def get_queryset(self):
        patient_id = self.kwargs['patient_id']
        queryset = MedicalRecord.objects.filter(
            patient_id=patient_id
        ).select_related('patient', 'doctor')

        # Hide confidential records for non-doctors
        if self.request.user.role not in ['doctor', 'admin']:
            queryset = queryset.filter(is_confidential=False)

        return queryset.order_by('-visit_date')

    @extend_schema(
        summary="Get patient's medical records",
        description="Get all medical records for a specific patient"
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
