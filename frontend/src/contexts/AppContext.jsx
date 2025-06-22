/**
 * AppContext - Global Application State Management
 * 
 * Provides global state management for the entire application using React Context API
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService, userService, appointmentService, patientService, doctorService } from '../services/api';

// Initial state
const initialState = {
  // Loading states
  loading: {
    global: false,
    auth: false,
    users: false,
    appointments: false,
    patients: false,
    doctors: false,
  },
  
  // Error states
  errors: {
    global: null,
    auth: null,
    users: null,
    appointments: null,
    patients: null,
    doctors: null,
  },
  
  // Data states
  users: {
    list: [],
    current: null,
    pagination: null,
  },
  
  appointments: {
    list: [],
    current: null,
    pagination: null,
    availableSlots: [],
  },
  
  patients: {
    list: [],
    current: null,
    pagination: null,
    medicalRecords: [],
  },
  
  doctors: {
    list: [],
    current: null,
    pagination: null,
    availability: null,
  },
  
  // UI states
  ui: {
    sidebarOpen: true,
    theme: 'light',
    notifications: [],
  },
};

// Action types
export const actionTypes = {
  // Loading actions
  SET_LOADING: 'SET_LOADING',
  
  // Error actions
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  
  // User actions
  SET_USERS: 'SET_USERS',
  SET_CURRENT_USER: 'SET_CURRENT_USER',
  ADD_USER: 'ADD_USER',
  UPDATE_USER: 'UPDATE_USER',
  DELETE_USER: 'DELETE_USER',
  
  // Appointment actions
  SET_APPOINTMENTS: 'SET_APPOINTMENTS',
  SET_CURRENT_APPOINTMENT: 'SET_CURRENT_APPOINTMENT',
  ADD_APPOINTMENT: 'ADD_APPOINTMENT',
  UPDATE_APPOINTMENT: 'UPDATE_APPOINTMENT',
  DELETE_APPOINTMENT: 'DELETE_APPOINTMENT',
  SET_AVAILABLE_SLOTS: 'SET_AVAILABLE_SLOTS',
  
  // Patient actions
  SET_PATIENTS: 'SET_PATIENTS',
  SET_CURRENT_PATIENT: 'SET_CURRENT_PATIENT',
  UPDATE_PATIENT: 'UPDATE_PATIENT',
  SET_MEDICAL_RECORDS: 'SET_MEDICAL_RECORDS',
  
  // Doctor actions
  SET_DOCTORS: 'SET_DOCTORS',
  SET_CURRENT_DOCTOR: 'SET_CURRENT_DOCTOR',
  UPDATE_DOCTOR: 'UPDATE_DOCTOR',
  SET_DOCTOR_AVAILABILITY: 'SET_DOCTOR_AVAILABILITY',
  
  // UI actions
  TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
  SET_THEME: 'SET_THEME',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
};

// Reducer function
const appReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_LOADING:
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.value,
        },
      };
      
    case actionTypes.SET_ERROR:
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.key]: action.payload.error,
        },
      };
      
    case actionTypes.CLEAR_ERROR:
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.key]: null,
        },
      };
      
    case actionTypes.SET_USERS:
      return {
        ...state,
        users: {
          ...state.users,
          list: action.payload.users,
          pagination: action.payload.pagination,
        },
      };
      
    case actionTypes.SET_CURRENT_USER:
      return {
        ...state,
        users: {
          ...state.users,
          current: action.payload.user,
        },
      };
      
    case actionTypes.ADD_USER:
      return {
        ...state,
        users: {
          ...state.users,
          list: [...state.users.list, action.payload.user],
        },
      };
      
    case actionTypes.UPDATE_USER:
      return {
        ...state,
        users: {
          ...state.users,
          list: state.users.list.map(user =>
            user.id === action.payload.user.id ? action.payload.user : user
          ),
          current: state.users.current?.id === action.payload.user.id 
            ? action.payload.user 
            : state.users.current,
        },
      };
      
    case actionTypes.DELETE_USER:
      return {
        ...state,
        users: {
          ...state.users,
          list: state.users.list.filter(user => user.id !== action.payload.userId),
          current: state.users.current?.id === action.payload.userId 
            ? null 
            : state.users.current,
        },
      };
      
    case actionTypes.SET_APPOINTMENTS:
      return {
        ...state,
        appointments: {
          ...state.appointments,
          list: action.payload.appointments,
          pagination: action.payload.pagination,
        },
      };
      
    case actionTypes.SET_CURRENT_APPOINTMENT:
      return {
        ...state,
        appointments: {
          ...state.appointments,
          current: action.payload.appointment,
        },
      };
      
    case actionTypes.ADD_APPOINTMENT:
      return {
        ...state,
        appointments: {
          ...state.appointments,
          list: [...state.appointments.list, action.payload.appointment],
        },
      };
      
    case actionTypes.UPDATE_APPOINTMENT:
      return {
        ...state,
        appointments: {
          ...state.appointments,
          list: state.appointments.list.map(appointment =>
            appointment.id === action.payload.appointment.id 
              ? action.payload.appointment 
              : appointment
          ),
          current: state.appointments.current?.id === action.payload.appointment.id 
            ? action.payload.appointment 
            : state.appointments.current,
        },
      };
      
    case actionTypes.SET_AVAILABLE_SLOTS:
      return {
        ...state,
        appointments: {
          ...state.appointments,
          availableSlots: action.payload.slots,
        },
      };
      
    case actionTypes.SET_PATIENTS:
      return {
        ...state,
        patients: {
          ...state.patients,
          list: action.payload.patients,
          pagination: action.payload.pagination,
        },
      };
      
    case actionTypes.SET_CURRENT_PATIENT:
      return {
        ...state,
        patients: {
          ...state.patients,
          current: action.payload.patient,
        },
      };
      
    case actionTypes.UPDATE_PATIENT:
      return {
        ...state,
        patients: {
          ...state.patients,
          list: state.patients.list.map(patient =>
            patient.id === action.payload.patient.id ? action.payload.patient : patient
          ),
          current: state.patients.current?.id === action.payload.patient.id 
            ? action.payload.patient 
            : state.patients.current,
        },
      };
      
    case actionTypes.SET_MEDICAL_RECORDS:
      return {
        ...state,
        patients: {
          ...state.patients,
          medicalRecords: action.payload.records,
        },
      };
      
    case actionTypes.SET_DOCTORS:
      return {
        ...state,
        doctors: {
          ...state.doctors,
          list: action.payload.doctors,
          pagination: action.payload.pagination,
        },
      };
      
    case actionTypes.SET_CURRENT_DOCTOR:
      return {
        ...state,
        doctors: {
          ...state.doctors,
          current: action.payload.doctor,
        },
      };
      
    case actionTypes.UPDATE_DOCTOR:
      return {
        ...state,
        doctors: {
          ...state.doctors,
          list: state.doctors.list.map(doctor =>
            doctor.id === action.payload.doctor.id ? action.payload.doctor : doctor
          ),
          current: state.doctors.current?.id === action.payload.doctor.id 
            ? action.payload.doctor 
            : state.doctors.current,
        },
      };
      
    case actionTypes.SET_DOCTOR_AVAILABILITY:
      return {
        ...state,
        doctors: {
          ...state.doctors,
          availability: action.payload.availability,
        },
      };
      
    case actionTypes.TOGGLE_SIDEBAR:
      return {
        ...state,
        ui: {
          ...state.ui,
          sidebarOpen: !state.ui.sidebarOpen,
        },
      };
      
    case actionTypes.SET_THEME:
      return {
        ...state,
        ui: {
          ...state.ui,
          theme: action.payload.theme,
        },
      };
      
    case actionTypes.ADD_NOTIFICATION:
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: [...state.ui.notifications, action.payload.notification],
        },
      };
      
    case actionTypes.REMOVE_NOTIFICATION:
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: state.ui.notifications.filter(
            notification => notification.id !== action.payload.notificationId
          ),
        },
      };
      
    default:
      return state;
  }
};

// Create context
const AppContext = createContext();

// Context provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Action creators
  const actions = {
    // Loading actions
    setLoading: (key, value) => {
      dispatch({
        type: actionTypes.SET_LOADING,
        payload: { key, value },
      });
    },

    // Error actions
    setError: (key, error) => {
      dispatch({
        type: actionTypes.SET_ERROR,
        payload: { key, error },
      });
    },

    clearError: (key) => {
      dispatch({
        type: actionTypes.CLEAR_ERROR,
        payload: { key },
      });
    },

    // User actions
    fetchUsers: async (params = {}) => {
      actions.setLoading('users', true);
      actions.clearError('users');
      
      const { data, error } = await userService.getUsers(params);
      
      if (error) {
        actions.setError('users', error);
      } else {
        dispatch({
          type: actionTypes.SET_USERS,
          payload: {
            users: data.results || data,
            pagination: data.pagination || null,
          },
        });
      }
      
      actions.setLoading('users', false);
      return { data, error };
    },

    // Appointment actions
    fetchAppointments: async (params = {}) => {
      actions.setLoading('appointments', true);
      actions.clearError('appointments');
      
      const { data, error } = await appointmentService.getAppointments(params);
      
      if (error) {
        actions.setError('appointments', error);
      } else {
        dispatch({
          type: actionTypes.SET_APPOINTMENTS,
          payload: {
            appointments: data.results || data,
            pagination: data.pagination || null,
          },
        });
      }
      
      actions.setLoading('appointments', false);
      return { data, error };
    },

    createAppointment: async (appointmentData) => {
      actions.setLoading('appointments', true);
      actions.clearError('appointments');
      
      const { data, error } = await appointmentService.createAppointment(appointmentData);
      
      if (error) {
        actions.setError('appointments', error);
      } else {
        dispatch({
          type: actionTypes.ADD_APPOINTMENT,
          payload: { appointment: data },
        });
      }
      
      actions.setLoading('appointments', false);
      return { data, error };
    },

    // UI actions
    toggleSidebar: () => {
      dispatch({ type: actionTypes.TOGGLE_SIDEBAR });
    },

    addNotification: (notification) => {
      const id = Date.now().toString();
      dispatch({
        type: actionTypes.ADD_NOTIFICATION,
        payload: {
          notification: { ...notification, id },
        },
      });
      
      // Auto-remove notification after 5 seconds
      setTimeout(() => {
        actions.removeNotification(id);
      }, 5000);
    },

    removeNotification: (notificationId) => {
      dispatch({
        type: actionTypes.REMOVE_NOTIFICATION,
        payload: { notificationId },
      });
    },
  };

  // Load initial data
  useEffect(() => {
    // Load initial data if needed
    // This could include user preferences, cached data, etc.
  }, []);

  const value = {
    state,
    actions,
    dispatch,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the app context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
