from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView,
    UserRegistrationView,
    UserProfileView,
    PasswordChangeView,
    LogoutView,
    UserListView,
    DoctorCreateView,
    NurseCreateView,
    AdminUserCreateView,
)

app_name = 'accounts'

urlpatterns = [
    # Authentication endpoints
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('register/', UserRegistrationView.as_view(), name='register'),

    # User profile endpoints
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    path('profile/change-password/', PasswordChangeView.as_view(), name='change_password'),

    # User management endpoints (admin only)
    path('users/', UserListView.as_view(), name='user_list'),
    path('users/create/', AdminUserCreateView.as_view(), name='admin_create_user'),
    path('users/create-doctor/', DoctorCreateView.as_view(), name='create_doctor'),
    path('users/create-nurse/', NurseCreateView.as_view(), name='create_nurse'),
]
