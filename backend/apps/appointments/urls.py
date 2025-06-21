from django.urls import path
from .views import (
    AppointmentListCreateView,
    AppointmentDetailView,
    MyAppointmentsView,
    AppointmentStatusUpdateView,
    AppointmentCalendarView,
    TodayAppointmentsView,
)

app_name = 'appointments'

urlpatterns = [
    # Appointment endpoints
    path('', AppointmentListCreateView.as_view(), name='appointment_list_create'),
    path('<int:pk>/', AppointmentDetailView.as_view(), name='appointment_detail'),
    path('<int:pk>/status/', AppointmentStatusUpdateView.as_view(), name='appointment_status_update'),
    
    # Current user's appointments
    path('my/', MyAppointmentsView.as_view(), name='my_appointments'),
    
    # Calendar and special views
    path('calendar/', AppointmentCalendarView.as_view(), name='appointment_calendar'),
    path('today/', TodayAppointmentsView.as_view(), name='today_appointments'),
]
