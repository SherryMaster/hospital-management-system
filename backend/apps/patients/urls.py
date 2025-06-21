from django.urls import path
from .views import (
    PatientListCreateView,
    PatientDetailView,
    PatientMedicalHistoryView,
    MyPatientProfileView,
    MedicalRecordListCreateView,
    MedicalRecordDetailView,
    PatientMedicalRecordsView,
)

app_name = 'patients'

urlpatterns = [
    # Patient endpoints
    path('', PatientListCreateView.as_view(), name='patient_list_create'),
    path('<int:pk>/', PatientDetailView.as_view(), name='patient_detail'),
    path('<int:pk>/history/', PatientMedicalHistoryView.as_view(), name='patient_medical_history'),
    path('<int:patient_id>/records/', PatientMedicalRecordsView.as_view(), name='patient_medical_records'),
    
    # Current user's patient profile
    path('me/', MyPatientProfileView.as_view(), name='my_patient_profile'),
    
    # Medical record endpoints
    path('records/', MedicalRecordListCreateView.as_view(), name='medical_record_list_create'),
    path('records/<int:pk>/', MedicalRecordDetailView.as_view(), name='medical_record_detail'),
]
