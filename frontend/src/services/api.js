/**
 * Hospital Management System - API Service Configuration
 * 
 * Axios configuration for API communication with the Django backend.
 * Includes authentication, error handling, and request/response interceptors.
 */

import axios from 'axios';

// Get environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT || 10000;
const JWT_STORAGE_KEY = import.meta.env.VITE_JWT_STORAGE_KEY || 'hospital_auth_token';
const REFRESH_TOKEN_KEY = import.meta.env.VITE_REFRESH_TOKEN_KEY || 'hospital_refresh_token';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management utilities
export const tokenManager = {
  getToken: () => localStorage.getItem(JWT_STORAGE_KEY),
  setToken: (token) => localStorage.setItem(JWT_STORAGE_KEY, token),
  removeToken: () => localStorage.removeItem(JWT_STORAGE_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setRefreshToken: (token) => localStorage.setItem(REFRESH_TOKEN_KEY, token),
  removeRefreshToken: () => localStorage.removeItem(REFRESH_TOKEN_KEY),
  clearAll: () => {
    localStorage.removeItem(JWT_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = tokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = tokenManager.getRefreshToken();
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          tokenManager.setToken(access);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          tokenManager.clearAll();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, redirect to login
        tokenManager.clearAll();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const endpoints = {
  // Authentication
  auth: {
    login: '/auth/login/',
    logout: '/auth/logout/',
    refresh: '/auth/refresh/',
    register: '/auth/register/',
  },
  // Users
  users: '/users/',
  // Patients
  patients: '/patients/',
  // Doctors
  doctors: '/doctors/',
  // Appointments
  appointments: '/appointments/',
  // Billing
  billing: '/billing/',
};

// API methods
export const apiMethods = {
  // Generic CRUD operations
  get: (url, config = {}) => api.get(url, config),
  post: (url, data = {}, config = {}) => api.post(url, data, config),
  put: (url, data = {}, config = {}) => api.put(url, data, config),
  patch: (url, data = {}, config = {}) => api.patch(url, data, config),
  delete: (url, config = {}) => api.delete(url, config),

  // Authentication methods
  login: (credentials) => api.post(endpoints.auth.login, credentials),
  logout: () => api.post(endpoints.auth.logout),
  refreshToken: (refreshToken) => api.post(endpoints.auth.refresh, { refresh: refreshToken }),
  register: (userData) => api.post(endpoints.auth.register, userData),

  // Health check
  healthCheck: () => axios.get(`${API_BASE_URL.replace('/api', '')}/health/`),
};

// Error handling utility
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;

    // Handle different error formats
    let message = 'An error occurred';
    let fieldErrors = {};

    if (data) {
      // Handle field-specific errors (like email, password)
      if (typeof data === 'object' && !data.detail && !data.message) {
        // Field-specific errors
        fieldErrors = data;

        // Extract first error message for general display
        const firstError = Object.values(data)[0];
        if (Array.isArray(firstError)) {
          message = firstError[0];
        } else if (typeof firstError === 'string') {
          message = firstError;
        }
      } else {
        // General error message
        message = data.detail || data.message || data.non_field_errors?.[0] || message;
      }
    }

    // Handle specific status codes
    switch (status) {
      case 400:
        if (!message || message === 'An error occurred') {
          message = 'Please check your input and try again.';
        }
        break;
      case 401:
        message = 'Authentication failed. Please check your credentials.';
        break;
      case 403:
        message = 'You do not have permission to perform this action.';
        break;
      case 404:
        message = 'The requested resource was not found.';
        break;
      case 500:
        message = 'Server error. Please try again later.';
        break;
      default:
        break;
    }

    return {
      status,
      message,
      fieldErrors,
      errors: fieldErrors, // Keep for backward compatibility
    };
  } else if (error.request) {
    // Request was made but no response received
    return {
      status: 0,
      message: 'Network error. Please check your internet connection and try again.',
      fieldErrors: {},
      errors: {},
    };
  } else {
    // Something else happened
    return {
      status: 0,
      message: error.message || 'An unexpected error occurred. Please try again.',
      fieldErrors: {},
      errors: {},
    };
  }
};

// Specific API Services
export const authService = {
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login/', credentials);
      const { access, refresh, user } = response.data;

      tokenManager.setToken(access);
      tokenManager.setRefreshToken(refresh);

      return { data: { user, access, refresh }, error: null };
    } catch (error) {
      return { data: null, error: handleApiError(error) };
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post('/auth/register/', userData);
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: handleApiError(error) };
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout/');
      tokenManager.clearAll();
      return { data: { message: 'Logged out successfully' }, error: null };
    } catch (error) {
      tokenManager.clearAll(); // Clear tokens even if logout fails
      return { data: { message: 'Logged out successfully' }, error: null };
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/user/');
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: handleApiError(error) };
    }
  },
};

export const userService = {
  getUsers: async (params = {}) => {
    try {
      const response = await api.get('/users/', { params });
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: handleApiError(error) };
    }
  },

  getUser: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}/`);
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: handleApiError(error) };
    }
  },

  createUser: async (userData) => {
    try {
      const response = await api.post('/users/', userData);
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: handleApiError(error) };
    }
  },

  updateUser: async (userId, userData) => {
    try {
      const response = await api.patch(`/users/${userId}/`, userData);
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: handleApiError(error) };
    }
  },

  deleteUser: async (userId) => {
    try {
      await api.delete(`/users/${userId}/`);
      return { data: { message: 'User deleted successfully' }, error: null };
    } catch (error) {
      return { data: null, error: handleApiError(error) };
    }
  },
};

export const appointmentService = {
  getAppointments: async (params = {}) => {
    try {
      const response = await api.get('/appointments/', { params });
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: handleApiError(error) };
    }
  },

  getAppointment: async (appointmentId) => {
    try {
      const response = await api.get(`/appointments/${appointmentId}/`);
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: handleApiError(error) };
    }
  },

  createAppointment: async (appointmentData) => {
    try {
      const response = await api.post('/appointments/', appointmentData);
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: handleApiError(error) };
    }
  },

  updateAppointment: async (appointmentId, appointmentData) => {
    try {
      const response = await api.patch(`/appointments/${appointmentId}/`, appointmentData);
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: handleApiError(error) };
    }
  },

  cancelAppointment: async (appointmentId, reason) => {
    try {
      const response = await api.patch(`/appointments/${appointmentId}/cancel/`, { reason });
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: handleApiError(error) };
    }
  },

  getAvailableSlots: async (doctorId, date) => {
    try {
      const response = await api.get('/appointments/available-slots/', {
        params: { doctor: doctorId, date },
      });
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: handleApiError(error) };
    }
  },
};

export const patientService = {
  getPatients: async (params = {}) => {
    try {
      const response = await api.get('/patients/', { params });
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: handleApiError(error) };
    }
  },

  getPatient: async (patientId) => {
    try {
      const response = await api.get(`/patients/${patientId}/`);
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: handleApiError(error) };
    }
  },

  updatePatient: async (patientId, patientData) => {
    try {
      const response = await api.patch(`/patients/${patientId}/`, patientData);
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: handleApiError(error) };
    }
  },

  getMedicalRecords: async (patientId) => {
    try {
      const response = await api.get(`/patients/${patientId}/medical-records/`);
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: handleApiError(error) };
    }
  },
};

export const doctorService = {
  getDoctors: async (params = {}) => {
    try {
      const response = await api.get('/doctors/', { params });
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: handleApiError(error) };
    }
  },

  getDoctor: async (doctorId) => {
    try {
      const response = await api.get(`/doctors/${doctorId}/`);
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: handleApiError(error) };
    }
  },

  updateAvailability: async (doctorId, availabilityData) => {
    try {
      const response = await api.patch(`/doctors/${doctorId}/availability/`, availabilityData);
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: handleApiError(error) };
    }
  },
};

export default api;
