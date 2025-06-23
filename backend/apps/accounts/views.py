from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.db.models import Q
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from .serializers import (
    CustomTokenObtainPairSerializer,
    PatientRegistrationSerializer,
    UserProfileSerializer,
    UserUpdateSerializer,
    PasswordChangeSerializer,
    UserListSerializer,
    DoctorCreateSerializer,
    NurseCreateSerializer,
    UserCreateSerializer
)
from .permissions import IsOwnerOrAdmin, IsAdminUser

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom JWT token obtain view with user information
    """
    serializer_class = CustomTokenObtainPairSerializer


class PatientRegistrationView(generics.CreateAPIView):
    """
    Patient registration endpoint - public registration for patients only
    """
    queryset = User.objects.all()
    serializer_class = PatientRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        summary="Register new patient",
        description="Create a new patient account with comprehensive medical information. Only patients can register publicly.",
        responses={201: UserProfileSerializer}
    )
    def post(self, request, *args, **kwargs):
        # Explicitly prevent non-patient registration through this endpoint
        if 'role' in request.data and request.data['role'] != User.UserRole.PATIENT:
            return Response({
                'error': 'Public registration is only available for patients. Other user types must be created by administrators.',
                'detail': 'If you are a healthcare professional, please contact your system administrator to create your account.'
            }, status=status.HTTP_403_FORBIDDEN)

        # Ensure role is set to patient
        request.data['role'] = User.UserRole.PATIENT

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate tokens for the new user
        refresh = RefreshToken.for_user(user)

        return Response({
            'user': UserProfileSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'message': 'Patient registered successfully'
        }, status=status.HTTP_201_CREATED)


# Keep the old view name for backward compatibility
class UserRegistrationView(PatientRegistrationView):
    """
    Legacy user registration endpoint - now redirects to patient registration
    """
    pass


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    User profile view and update
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method == 'PUT' or self.request.method == 'PATCH':
            return UserUpdateSerializer
        return UserProfileSerializer

    @extend_schema(
        summary="Get user profile",
        description="Retrieve current user's profile information"
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Update user profile",
        description="Update current user's profile information"
    )
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)

    @extend_schema(
        summary="Partially update user profile",
        description="Partially update current user's profile information"
    )
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)


class PasswordChangeView(APIView):
    """
    Password change endpoint
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Change password",
        description="Change current user's password",
        request=PasswordChangeSerializer,
        responses={200: {"description": "Password changed successfully"}}
    )
    def post(self, request):
        serializer = PasswordChangeSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response({
            'message': 'Password changed successfully'
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """
    Logout endpoint that blacklists the refresh token
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Logout user",
        description="Logout user and blacklist refresh token",
        request={"refresh_token": "string"},
        responses={200: {"description": "Logged out successfully"}}
    )
    def post(self, request):
        try:
            refresh_token = request.data.get("refresh_token")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()

            return Response({
                'message': 'Logged out successfully'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': 'Invalid token'
            }, status=status.HTTP_400_BAD_REQUEST)


class UserListView(generics.ListCreateAPIView):
    """
    User list and creation (admin only)
    """
    queryset = User.objects.all()
    permission_classes = [IsAdminUser]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserCreateSerializer
        return UserListSerializer

    def get_queryset(self):
        queryset = User.objects.all()

        # Filter by role
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)

        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        # Search functionality
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search) |
                Q(username__icontains=search)
            )

        return queryset.order_by('-created_at')

    @extend_schema(
        summary="List users",
        description="Get list of all users (admin only)",
        parameters=[
            OpenApiParameter(name='role', type=OpenApiTypes.STR, description='Filter by user role'),
            OpenApiParameter(name='is_active', type=OpenApiTypes.BOOL, description='Filter by active status'),
            OpenApiParameter(name='search', type=OpenApiTypes.STR, description='Search users by name, email, or username'),
        ]
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Create user",
        description="Create a new user (admin only)"
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class DoctorCreateView(generics.CreateAPIView):
    """
    Create new doctor user with complete profile (admin only)
    """
    queryset = User.objects.all()
    serializer_class = DoctorCreateSerializer
    permission_classes = [IsAdminUser]

    @extend_schema(
        summary="Create new doctor",
        description="Create a new doctor account with complete medical credentials (admin only)",
        request=DoctorCreateSerializer,
        responses={201: UserProfileSerializer}
    )
    def post(self, request, *args, **kwargs):
        # Ensure only admins can create doctors
        if not request.user.is_authenticated or not request.user.is_admin:
            return Response({
                'error': 'Only administrators can create doctor accounts.',
                'detail': 'You must be logged in as an administrator to perform this action.'
            }, status=status.HTTP_403_FORBIDDEN)

        # Ensure role is set to doctor
        request.data['role'] = User.UserRole.DOCTOR

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response({
            'user': UserProfileSerializer(user).data,
            'message': f'Doctor {user.get_full_name()} created successfully'
        }, status=status.HTTP_201_CREATED)


class NurseCreateView(generics.CreateAPIView):
    """
    Create new nurse user with complete profile (admin only)
    """
    queryset = User.objects.all()
    serializer_class = NurseCreateSerializer
    permission_classes = [IsAdminUser]

    @extend_schema(
        summary="Create new nurse",
        description="Create a new nurse account with complete nursing credentials (admin only)",
        request=NurseCreateSerializer,
        responses={201: UserProfileSerializer}
    )
    def post(self, request, *args, **kwargs):
        # Ensure only admins can create nurses
        if not request.user.is_authenticated or not request.user.is_admin:
            return Response({
                'error': 'Only administrators can create nurse accounts.',
                'detail': 'You must be logged in as an administrator to perform this action.'
            }, status=status.HTTP_403_FORBIDDEN)

        # Ensure role is set to nurse
        request.data['role'] = 'nurse'

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response({
            'user': UserProfileSerializer(user).data,
            'message': f'Nurse {user.get_full_name()} created successfully'
        }, status=status.HTTP_201_CREATED)
