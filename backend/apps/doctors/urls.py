from django.urls import path
from .views import (
    DepartmentListCreateView,
    DepartmentDetailView,
    SpecializationListCreateView,
    SpecializationDetailView,
    DoctorListCreateView,
    DoctorDetailView,
    MyDoctorProfileView,
    DoctorAvailabilityView,
    DoctorScheduleView,
)

app_name = 'doctors'

urlpatterns = [
    # Department endpoints
    path('departments/', DepartmentListCreateView.as_view(), name='department_list_create'),
    path('departments/<int:pk>/', DepartmentDetailView.as_view(), name='department_detail'),
    
    # Specialization endpoints
    path('specializations/', SpecializationListCreateView.as_view(), name='specialization_list_create'),
    path('specializations/<int:pk>/', SpecializationDetailView.as_view(), name='specialization_detail'),
    
    # Doctor endpoints
    path('', DoctorListCreateView.as_view(), name='doctor_list_create'),
    path('<int:pk>/', DoctorDetailView.as_view(), name='doctor_detail'),
    path('<int:pk>/availability/', DoctorAvailabilityView.as_view(), name='doctor_availability'),
    path('<int:pk>/schedule/', DoctorScheduleView.as_view(), name='doctor_schedule'),
    
    # Current user's doctor profile
    path('me/', MyDoctorProfileView.as_view(), name='my_doctor_profile'),
]
