/**
 * useApi Hook
 *
 * Custom hook for making API calls with loading states and error handling
 */

import { useState, useCallback, useEffect } from 'react';
import {
  dashboardService,
  userService,
  patientService,
  doctorService,
  appointmentService,
  billingService,
  medicalRecordsService
} from '../services/api';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (apiFunction, options = {}) => {
    const {
      onSuccess,
      onError,
    } = options;

    setLoading(true);
    setError(null);

    try {
      const result = await apiFunction();

      if (result.error) {
        const errorMessage = result.error.message || 'An error occurred';
        setError(errorMessage);

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

      if (onError) {
        onError({ message: errorMessage });
      }

      return { data: null, error: { message: errorMessage } };
    } finally {
      setLoading(false);
    }
  }, []);

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

// Dashboard hook
export const useDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [statsResult, usersResult, healthResult, appointmentsResult] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRecentUsers(5),
        dashboardService.getSystemHealth(),
        dashboardService.getTodayAppointments(),
      ]);

      if (statsResult.data) setStats(statsResult.data);
      if (usersResult.data) setRecentUsers(usersResult.data.results || usersResult.data);
      if (healthResult.data) setSystemHealth(healthResult.data);
      if (appointmentsResult.data) setTodayAppointments(appointmentsResult.data.results || appointmentsResult.data);

    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    stats,
    recentUsers,
    systemHealth,
    todayAppointments,
    loading,
    error,
    refetch: fetchDashboardData,
  };
};

// Users hook
export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    const { data, error: apiError } = await userService.getUsers(params);

    if (apiError) {
      setError(apiError.message);
    } else {
      setUsers(data.results || data);
      setPagination({
        count: data.count,
        next: data.next,
        previous: data.previous,
      });
    }

    setLoading(false);
    return { data, error: apiError };
  }, []);

  const fetchUser = useCallback(async (userId) => {
    setLoading(true);
    setError(null);

    const { data, error: apiError } = await userService.getUser(userId);

    if (apiError) {
      setError(apiError.message);
    } else {
      setCurrentUser(data);
    }

    setLoading(false);
    return { data, error: apiError };
  }, []);

  const createUser = useCallback(async (userData) => {
    setLoading(true);
    setError(null);

    const { data, error: apiError } = await userService.createUser(userData);

    if (apiError) {
      setError(apiError.message);
    } else {
      setUsers(prev => [...prev, data]);
    }

    setLoading(false);
    return { data, error: apiError };
  }, []);

  const updateUser = useCallback(async (userId, userData) => {
    setLoading(true);
    setError(null);

    const { data, error: apiError } = await userService.updateUser(userId, userData);

    if (apiError) {
      setError(apiError.message);
    } else {
      setUsers(prev => prev.map(user => user.id === userId ? data : user));
      if (currentUser?.id === userId) {
        setCurrentUser(data);
      }
    }

    setLoading(false);
    return { data, error: apiError };
  }, [currentUser]);

  const deleteUser = useCallback(async (userId) => {
    setLoading(true);
    setError(null);

    const { data, error: apiError } = await userService.deleteUser(userId);

    if (apiError) {
      setError(apiError.message);
    } else {
      setUsers(prev => prev.filter(user => user.id !== userId));
      if (currentUser?.id === userId) {
        setCurrentUser(null);
      }
    }

    setLoading(false);
    return { data, error: apiError };
  }, [currentUser]);

  return {
    users,
    currentUser,
    pagination,
    loading,
    error,
    fetchUsers,
    fetchUser,
    createUser,
    updateUser,
    deleteUser,
    setCurrentUser,
  };
};

// Patients hook
export const usePatients = () => {
  const [patients, setPatients] = useState([]);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPatients = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    const { data, error: apiError } = await patientService.getPatients(params);

    if (apiError) {
      setError(apiError.message);
    } else {
      setPatients(data.results || data);
      setPagination({
        count: data.count,
        next: data.next,
        previous: data.previous,
      });
    }

    setLoading(false);
    return { data, error: apiError };
  }, []);

  const fetchPatient = useCallback(async (patientId) => {
    setLoading(true);
    setError(null);

    const { data, error: apiError } = await patientService.getPatient(patientId);

    if (apiError) {
      setError(apiError.message);
    } else {
      setCurrentPatient(data);
    }

    setLoading(false);
    return { data, error: apiError };
  }, []);

  const createPatient = useCallback(async (patientData) => {
    setLoading(true);
    setError(null);

    const { data, error: apiError } = await patientService.createPatient(patientData);

    if (apiError) {
      setError(apiError.message);
    } else {
      setPatients(prev => [...prev, data]);
    }

    setLoading(false);
    return { data, error: apiError };
  }, []);

  const updatePatient = useCallback(async (patientId, patientData) => {
    setLoading(true);
    setError(null);

    const { data, error: apiError } = await patientService.updatePatient(patientId, patientData);

    if (apiError) {
      setError(apiError.message);
    } else {
      setPatients(prev => prev.map(patient => patient.id === patientId ? data : patient));
      if (currentPatient?.id === patientId) {
        setCurrentPatient(data);
      }
    }

    setLoading(false);
    return { data, error: apiError };
  }, [currentPatient]);

  const fetchMedicalRecords = useCallback(async (patientId) => {
    setLoading(true);
    setError(null);

    const { data, error: apiError } = await patientService.getMedicalRecords(patientId);

    if (apiError) {
      setError(apiError.message);
    } else {
      setMedicalRecords(data.results || data);
    }

    setLoading(false);
    return { data, error: apiError };
  }, []);

  return {
    patients,
    currentPatient,
    medicalRecords,
    pagination,
    loading,
    error,
    fetchPatients,
    fetchPatient,
    createPatient,
    updatePatient,
    fetchMedicalRecords,
    setCurrentPatient,
  };
};

// Doctors hook
export const useDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [currentDoctor, setCurrentDoctor] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [availability, setAvailability] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDoctors = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    const { data, error: apiError } = await doctorService.getDoctors(params);

    if (apiError) {
      setError(apiError.message);
    } else {
      setDoctors(data.results || data);
      setPagination({
        count: data.count,
        next: data.next,
        previous: data.previous,
      });
    }

    setLoading(false);
    return { data, error: apiError };
  }, []);

  const fetchDoctor = useCallback(async (doctorId) => {
    setLoading(true);
    setError(null);

    const { data, error: apiError } = await doctorService.getDoctor(doctorId);

    if (apiError) {
      setError(apiError.message);
    } else {
      setCurrentDoctor(data);
    }

    setLoading(false);
    return { data, error: apiError };
  }, []);

  const fetchDepartments = useCallback(async () => {
    const { data, error: apiError } = await doctorService.getDepartments();

    if (!apiError && data) {
      setDepartments(data.results || data);
    }

    return { data, error: apiError };
  }, []);

  const fetchSpecializations = useCallback(async () => {
    const { data, error: apiError } = await doctorService.getSpecializations();

    if (!apiError && data) {
      setSpecializations(data.results || data);
    }

    return { data, error: apiError };
  }, []);

  const fetchAvailability = useCallback(async (doctorId) => {
    const { data, error: apiError } = await doctorService.getAvailability(doctorId);

    if (!apiError && data) {
      setAvailability(data);
    }

    return { data, error: apiError };
  }, []);

  return {
    doctors,
    currentDoctor,
    departments,
    specializations,
    availability,
    pagination,
    loading,
    error,
    fetchDoctors,
    fetchDoctor,
    fetchDepartments,
    fetchSpecializations,
    fetchAvailability,
    setCurrentDoctor,
  };
};

// Appointments hook
export const useAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [currentAppointment, setCurrentAppointment] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAppointments = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    const { data, error: apiError } = await appointmentService.getAppointments(params);

    if (apiError) {
      console.error('Fetch appointments error:', apiError);
      setError(apiError.message);
    } else {
      console.log('Fetched appointments data:', data);
      const appointmentsList = data.results || data;
      console.log('Setting appointments:', appointmentsList);
      setAppointments(appointmentsList);
      setPagination({
        count: data.count,
        next: data.next,
        previous: data.previous,
      });
    }

    setLoading(false);
    return { data, error: apiError };
  }, []);

  const fetchAppointment = useCallback(async (appointmentId) => {
    setLoading(true);
    setError(null);

    const { data, error: apiError } = await appointmentService.getAppointment(appointmentId);

    if (apiError) {
      setError(apiError.message);
    } else {
      setCurrentAppointment(data);
    }

    setLoading(false);
    return { data, error: apiError };
  }, []);

  const createAppointment = useCallback(async (appointmentData) => {
    setLoading(true);
    setError(null);

    const { data, error: apiError } = await appointmentService.createAppointment(appointmentData);

    if (apiError) {
      setError(apiError.message);
    } else {
      setAppointments(prev => [...prev, data]);
    }

    setLoading(false);
    return { data, error: apiError };
  }, []);

  const updateAppointment = useCallback(async (appointmentId, appointmentData) => {
    setLoading(true);
    setError(null);

    const { data, error: apiError } = await appointmentService.updateAppointment(appointmentId, appointmentData);

    if (apiError) {
      setError(apiError.message);
    } else {
      setAppointments(prev => prev.map(apt => apt.id === appointmentId ? data : apt));
      if (currentAppointment?.id === appointmentId) {
        setCurrentAppointment(data);
      }
    }

    setLoading(false);
    return { data, error: apiError };
  }, [currentAppointment]);

  const cancelAppointment = useCallback(async (appointmentId, reason) => {
    setLoading(true);
    setError(null);

    const { data, error: apiError } = await appointmentService.cancelAppointment(appointmentId, reason);

    if (apiError) {
      setError(apiError.message);
    } else {
      setAppointments(prev => prev.map(apt => apt.id === appointmentId ? data : apt));
      if (currentAppointment?.id === appointmentId) {
        setCurrentAppointment(data);
      }
    }

    setLoading(false);
    return { data, error: apiError };
  }, [currentAppointment]);

  const fetchAvailableSlots = useCallback(async (doctorId, date) => {
    setLoading(true);
    setError(null);

    const { data, error: apiError } = await appointmentService.getAvailableSlots(doctorId, date);

    if (apiError) {
      setError(apiError.message);
    } else {
      setAvailableSlots(data.results || data);
    }

    setLoading(false);
    return { data, error: apiError };
  }, []);

  return {
    appointments,
    currentAppointment,
    availableSlots,
    pagination,
    loading,
    error,
    fetchAppointments,
    fetchAppointment,
    createAppointment,
    updateAppointment,
    cancelAppointment,
    fetchAvailableSlots,
    setCurrentAppointment,
  };
};

// Billing hook
export const useBilling = () => {
  const [invoices, setInvoices] = useState([]);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInvoices = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    const { data, error: apiError } = await billingService.getInvoices(params);

    if (apiError) {
      setError(apiError.message);
    } else {
      setInvoices(data.results || data);
      setPagination({
        count: data.count,
        next: data.next,
        previous: data.previous,
      });
    }

    setLoading(false);
    return { data, error: apiError };
  }, []);

  const fetchInvoice = useCallback(async (invoiceId) => {
    setLoading(true);
    setError(null);

    const { data, error: apiError } = await billingService.getInvoice(invoiceId);

    if (apiError) {
      setError(apiError.message);
    } else {
      setCurrentInvoice(data);
    }

    setLoading(false);
    return { data, error: apiError };
  }, []);

  const createInvoice = useCallback(async (invoiceData) => {
    setLoading(true);
    setError(null);

    const { data, error: apiError } = await billingService.createInvoice(invoiceData);

    if (apiError) {
      setError(apiError.message);
    } else {
      setInvoices(prev => [...prev, data]);
    }

    setLoading(false);
    return { data, error: apiError };
  }, []);

  const payInvoice = useCallback(async (invoiceId, paymentData) => {
    setLoading(true);
    setError(null);

    const { data, error: apiError } = await billingService.payInvoice(invoiceId, paymentData);

    if (apiError) {
      setError(apiError.message);
    } else {
      setInvoices(prev => prev.map(inv => inv.id === invoiceId ? data : inv));
      if (currentInvoice?.id === invoiceId) {
        setCurrentInvoice(data);
      }
    }

    setLoading(false);
    return { data, error: apiError };
  }, [currentInvoice]);

  return {
    invoices,
    currentInvoice,
    pagination,
    loading,
    error,
    fetchInvoices,
    fetchInvoice,
    createInvoice,
    payInvoice,
    setCurrentInvoice,
  };
};

export default useApi;
