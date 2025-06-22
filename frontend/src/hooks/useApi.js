/**
 * useApi Hook
 * 
 * Custom hook for making API calls with loading states and error handling
 */

import { useState, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';

export const useApi = () => {
  const { actions } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (apiFunction, options = {}) => {
    const {
      showGlobalLoading = false,
      showGlobalError = false,
      onSuccess,
      onError,
    } = options;

    setLoading(true);
    setError(null);

    if (showGlobalLoading) {
      actions.setLoading('global', true);
    }

    try {
      const result = await apiFunction();
      
      if (result.error) {
        const errorMessage = result.error.message || 'An error occurred';
        setError(errorMessage);
        
        if (showGlobalError) {
          actions.setError('global', result.error);
        }
        
        if (onError) {
          onError(result.error);
        }
        
        return { data: null, error: result.error };
      }

      if (onSuccess) {
        onSuccess(result.data);
      }

      return { data: result.data, error: null };
    } catch (err) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      
      if (showGlobalError) {
        actions.setError('global', { message: errorMessage });
      }
      
      if (onError) {
        onError({ message: errorMessage });
      }
      
      return { data: null, error: { message: errorMessage } };
    } finally {
      setLoading(false);
      
      if (showGlobalLoading) {
        actions.setLoading('global', false);
      }
    }
  }, [actions]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    execute,
    clearError,
  };
};

// Specific API hooks
export const useUsers = () => {
  const { state, actions } = useApp();
  const { execute } = useApi();

  const fetchUsers = useCallback(async (params = {}) => {
    return await execute(() => actions.fetchUsers(params), {
      showGlobalLoading: true,
      showGlobalError: true,
    });
  }, [execute, actions]);

  return {
    users: state.users.list,
    currentUser: state.users.current,
    pagination: state.users.pagination,
    loading: state.loading.users,
    error: state.errors.users,
    fetchUsers,
  };
};

export const useAppointments = () => {
  const { state, actions } = useApp();
  const { execute } = useApi();

  const fetchAppointments = useCallback(async (params = {}) => {
    return await execute(() => actions.fetchAppointments(params), {
      showGlobalLoading: true,
      showGlobalError: true,
    });
  }, [execute, actions]);

  const createAppointment = useCallback(async (appointmentData) => {
    return await execute(() => actions.createAppointment(appointmentData), {
      showGlobalLoading: true,
      showGlobalError: true,
      onSuccess: () => {
        actions.addNotification({
          type: 'success',
          message: 'Appointment created successfully!',
        });
      },
    });
  }, [execute, actions]);

  return {
    appointments: state.appointments.list,
    currentAppointment: state.appointments.current,
    availableSlots: state.appointments.availableSlots,
    pagination: state.appointments.pagination,
    loading: state.loading.appointments,
    error: state.errors.appointments,
    fetchAppointments,
    createAppointment,
  };
};

export const usePatients = () => {
  const { state } = useApp();

  return {
    patients: state.patients.list,
    currentPatient: state.patients.current,
    medicalRecords: state.patients.medicalRecords,
    pagination: state.patients.pagination,
    loading: state.loading.patients,
    error: state.errors.patients,
  };
};

export const useDoctors = () => {
  const { state } = useApp();

  return {
    doctors: state.doctors.list,
    currentDoctor: state.doctors.current,
    availability: state.doctors.availability,
    pagination: state.doctors.pagination,
    loading: state.loading.doctors,
    error: state.errors.doctors,
  };
};

// Generic CRUD hooks
export const useCrud = (entityName, service) => {
  const [items, setItems] = useState([]);
  const [currentItem, setCurrentItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchItems = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    const { data, error: apiError } = await service.getItems(params);
    
    if (apiError) {
      setError(apiError.message);
    } else {
      setItems(data.results || data);
    }
    
    setLoading(false);
    return { data, error: apiError };
  }, [service]);

  const fetchItem = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    const { data, error: apiError } = await service.getItem(id);
    
    if (apiError) {
      setError(apiError.message);
    } else {
      setCurrentItem(data);
    }
    
    setLoading(false);
    return { data, error: apiError };
  }, [service]);

  const createItem = useCallback(async (itemData) => {
    setLoading(true);
    setError(null);

    const { data, error: apiError } = await service.createItem(itemData);
    
    if (apiError) {
      setError(apiError.message);
    } else {
      setItems(prev => [...prev, data]);
    }
    
    setLoading(false);
    return { data, error: apiError };
  }, [service]);

  const updateItem = useCallback(async (id, itemData) => {
    setLoading(true);
    setError(null);

    const { data, error: apiError } = await service.updateItem(id, itemData);
    
    if (apiError) {
      setError(apiError.message);
    } else {
      setItems(prev => prev.map(item => item.id === id ? data : item));
      if (currentItem?.id === id) {
        setCurrentItem(data);
      }
    }
    
    setLoading(false);
    return { data, error: apiError };
  }, [service, currentItem]);

  const deleteItem = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    const { data, error: apiError } = await service.deleteItem(id);
    
    if (apiError) {
      setError(apiError.message);
    } else {
      setItems(prev => prev.filter(item => item.id !== id));
      if (currentItem?.id === id) {
        setCurrentItem(null);
      }
    }
    
    setLoading(false);
    return { data, error: apiError };
  }, [service, currentItem]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    items,
    currentItem,
    loading,
    error,
    fetchItems,
    fetchItem,
    createItem,
    updateItem,
    deleteItem,
    clearError,
    setCurrentItem,
  };
};

// Error boundary hook
export const useErrorHandler = () => {
  const { actions } = useApp();

  const handleError = useCallback((error, context = 'global') => {
    console.error(`Error in ${context}:`, error);
    
    const errorMessage = error.message || 'An unexpected error occurred';
    
    actions.setError(context, { message: errorMessage });
    actions.addNotification({
      type: 'error',
      message: errorMessage,
    });
  }, [actions]);

  const clearError = useCallback((context = 'global') => {
    actions.clearError(context);
  }, [actions]);

  return {
    handleError,
    clearError,
  };
};

export default useApi;
