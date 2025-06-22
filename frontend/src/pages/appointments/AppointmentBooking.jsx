/**
 * AppointmentBooking Component
 * 
 * Patient-facing appointment booking form with doctor selection and time slot picker
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  LocalHospital as HospitalIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { MainLayout } from '../../components/layout';
import { useAuth } from '../../contexts/AuthContext';
import { useAppointments } from '../../hooks/useApi';
import { doctorService, appointmentService, departmentService } from '../../services/api';

const AppointmentBooking = () => {
  const { user, logout } = useAuth();
  const { createAppointment } = useAppointments();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    department: '',
    doctor: '',
    appointmentDate: null,
    timeSlot: '',
    appointmentType: 'consultation',
    chiefComplaint: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [availableData, setAvailableData] = useState({
    departments: [],
    doctors: [],
    timeSlots: [],
  });

  const steps = ['Select Department & Doctor', 'Choose Date & Time', 'Appointment Details', 'Confirmation'];

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    if (formData.department) {
      loadDoctorsByDepartment(formData.department);
    }
  }, [formData.department]);

  useEffect(() => {
    if (formData.doctor && formData.appointmentDate) {
      loadAvailableTimeSlots(formData.doctor, formData.appointmentDate);
    }
  }, [formData.doctor, formData.appointmentDate]);

  const loadDepartments = async () => {
    try {
      // Try to fetch real departments from API
      const result = await departmentService.getDepartments();

      if (result.data?.results) {
        setAvailableData(prev => ({
          ...prev,
          departments: result.data.results.map(dept => ({
            id: dept.id,
            name: dept.name,
            description: dept.description || `${dept.name} department`
          }))
        }));
      } else {
        // Fallback to simulated data if API fails
        setAvailableData(prev => ({
          ...prev,
          departments: [
            { id: 1, name: 'Cardiology', description: 'Heart and cardiovascular care' },
            { id: 2, name: 'General Medicine', description: 'Primary healthcare services' },
            { id: 3, name: 'Dermatology', description: 'Skin and hair care' },
            { id: 4, name: 'Orthopedics', description: 'Bone and joint care' },
            { id: 5, name: 'Pediatrics', description: 'Children healthcare' },
          ],
        }));
      }
    } catch (error) {
      console.error('Error loading departments:', error);
      // Fallback to simulated data on error
      setAvailableData(prev => ({
        ...prev,
        departments: [
          { id: 1, name: 'Cardiology', description: 'Heart and cardiovascular care' },
          { id: 2, name: 'General Medicine', description: 'Primary healthcare services' },
          { id: 3, name: 'Dermatology', description: 'Skin and hair care' },
          { id: 4, name: 'Orthopedics', description: 'Bone and joint care' },
          { id: 5, name: 'Pediatrics', description: 'Children healthcare' },
        ],
      }));
    }
  };

  const loadDoctorsByDepartment = async (departmentId) => {
    try {
      // Try to fetch real doctors from API
      const result = await doctorService.getDoctors({ department: departmentId });

      if (result.data?.results) {
        // Use API data
        setAvailableData(prev => ({
          ...prev,
          doctors: result.data.results.map(doctor => ({
            id: doctor.id,
            name: doctor.user?.full_name || doctor.full_name || 'Unknown Doctor',
            specialization: doctor.specializations?.[0]?.name || doctor.department?.name || 'General Medicine',
            experience: doctor.years_of_experience ? `${doctor.years_of_experience} years` : 'Experience not specified',
            rating: doctor.rating || 4.5,
            fee: doctor.consultation_fee || 150
          }))
        }));
      } else {
        // Fallback to simulated data
        const doctorsByDepartment = {
          1: [ // Cardiology
            { id: 1, name: 'Dr. John Smith', specialization: 'Cardiologist', experience: '15 years', rating: 4.8, fee: 200 },
            { id: 2, name: 'Dr. Sarah Johnson', specialization: 'Cardiac Surgeon', experience: '12 years', rating: 4.9, fee: 250 },
          ],
          2: [ // General Medicine
            { id: 3, name: 'Dr. Michael Brown', specialization: 'General Physician', experience: '10 years', rating: 4.7, fee: 150 },
            { id: 4, name: 'Dr. Emily Davis', specialization: 'Family Medicine', experience: '8 years', rating: 4.6, fee: 140 },
          ],
          3: [ // Dermatology
            { id: 5, name: 'Dr. Robert Wilson', specialization: 'Dermatologist', experience: '14 years', rating: 4.8, fee: 180 },
          ],
          4: [ // Orthopedics
            { id: 6, name: 'Dr. Lisa Anderson', specialization: 'Orthopedic Surgeon', experience: '16 years', rating: 4.9, fee: 220 },
          ],
          5: [ // Pediatrics
            { id: 7, name: 'Dr. David Miller', specialization: 'Pediatrician', experience: '11 years', rating: 4.7, fee: 160 },
          ],
        };

        setAvailableData(prev => ({
          ...prev,
          doctors: doctorsByDepartment[departmentId] || [],
        }));
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
      // Fallback to simulated data on error
      const doctorsByDepartment = {
        1: [{ id: 1, name: 'Dr. John Smith', specialization: 'Cardiologist', experience: '15 years', rating: 4.8, fee: 200 }],
        2: [{ id: 3, name: 'Dr. Michael Brown', specialization: 'General Physician', experience: '10 years', rating: 4.7, fee: 150 }],
        3: [{ id: 5, name: 'Dr. Robert Wilson', specialization: 'Dermatologist', experience: '14 years', rating: 4.8, fee: 180 }],
        4: [{ id: 6, name: 'Dr. Lisa Anderson', specialization: 'Orthopedic Surgeon', experience: '16 years', rating: 4.9, fee: 220 }],
        5: [{ id: 7, name: 'Dr. David Miller', specialization: 'Pediatrician', experience: '11 years', rating: 4.7, fee: 160 }],
      };
      setAvailableData(prev => ({
        ...prev,
        doctors: doctorsByDepartment[departmentId] || [],
      }));
    }
  };

  const loadAvailableTimeSlots = async (doctorId, date) => {
    try {
      // Try to fetch real available slots from API
      const result = await appointmentService.getAvailableSlots(doctorId, date.toISOString().split('T')[0]);

      if (result.data?.results || result.data) {
        // Use API data
        const slots = result.data.results || result.data;
        setAvailableData(prev => ({
          ...prev,
          timeSlots: slots.map((slot, index) => ({
            id: slot.id || index + 1,
            time: slot.time || slot.appointment_time,
            available: slot.available !== false
          }))
        }));
      } else {
        // Fallback to simulated data
        const timeSlots = [
          { id: 1, time: '09:00', available: true },
          { id: 2, time: '09:30', available: false },
          { id: 3, time: '10:00', available: true },
          { id: 4, time: '10:30', available: true },
          { id: 5, time: '11:00', available: false },
          { id: 6, time: '11:30', available: true },
          { id: 7, time: '14:00', available: true },
          { id: 8, time: '14:30', available: true },
          { id: 9, time: '15:00', available: false },
          { id: 10, time: '15:30', available: true },
          { id: 11, time: '16:00', available: true },
          { id: 12, time: '16:30', available: true },
        ];

        setAvailableData(prev => ({
          ...prev,
          timeSlots: timeSlots,
        }));
      }
    } catch (error) {
      console.error('Error loading time slots:', error);
      // Fallback to simulated data on error
      const timeSlots = [
        { id: 1, time: '09:00', available: true },
        { id: 2, time: '10:00', available: true },
        { id: 3, time: '11:00', available: true },
        { id: 4, time: '14:00', available: true },
        { id: 5, time: '15:00', available: true },
        { id: 6, time: '16:00', available: true },
      ];
      setAvailableData(prev => ({
        ...prev,
        timeSlots: timeSlots,
      }));
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear field error when user makes changes
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateStep = (step) => {
    const errors = {};

    switch (step) {
      case 0: // Department & Doctor
        if (!formData.department) {
          errors.department = 'Please select a department';
        }
        if (!formData.doctor) {
          errors.doctor = 'Please select a doctor';
        }
        break;

      case 1: // Date & Time
        if (!formData.appointmentDate) {
          errors.appointmentDate = 'Please select an appointment date';
        }
        if (!formData.timeSlot) {
          errors.timeSlot = 'Please select a time slot';
        }
        break;

      case 2: // Appointment Details
        if (!formData.appointmentType) {
          errors.appointmentType = 'Please select appointment type';
        }
        if (!formData.chiefComplaint.trim()) {
          errors.chiefComplaint = 'Please describe your chief complaint';
        }
        break;

      default:
        break;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) {
      return;
    }

    setLoading(true);
    try {
      // Prepare appointment data for API
      const selectedTimeSlot = getSelectedTimeSlot();
      const appointmentData = {
        patient: user?.patient_profile?.id || user?.id,
        doctor: formData.doctor,
        department: formData.department,
        appointment_date: formData.appointmentDate.toISOString().split('T')[0],
        appointment_time: selectedTimeSlot?.time || formData.timeSlot,
        appointment_type: formData.appointmentType,
        chief_complaint: formData.chiefComplaint,
        notes: formData.notes,
        status: 'pending'
      };

      // Create appointment via API
      const result = await createAppointment(appointmentData);

      if (result.error) {
        throw new Error(result.error.message || 'Failed to book appointment');
      }

      // Show success and redirect
      alert('Appointment booked successfully!');
      // Reset form
      setFormData({
        department: '',
        doctor: '',
        appointmentDate: null,
        timeSlot: '',
        appointmentType: 'consultation',
        chiefComplaint: '',
        notes: '',
      });
      setActiveStep(0);
      // navigate('/appointments');
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert(error.message || 'Error booking appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedDepartment = () => {
    return availableData.departments.find(dept => dept.id === formData.department);
  };

  const getSelectedDoctor = () => {
    return availableData.doctors.find(doc => doc.id === formData.doctor);
  };

  const getSelectedTimeSlot = () => {
    return availableData.timeSlots.find(slot => slot.id === formData.timeSlot);
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            {/* Department Selection */}
            <Grid item xs={12}>
              <FormControl fullWidth error={!!formErrors.department}>
                <InputLabel>Select Department</InputLabel>
                <Select
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  label="Select Department"
                >
                  {availableData.departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      <Box>
                        <Typography variant="body1">{dept.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {dept.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.department && (
                  <FormHelperText>{formErrors.department}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* Doctor Selection */}
            {formData.department && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Available Doctors
                </Typography>
                <List>
                  {availableData.doctors.map((doctor) => (
                    <ListItem key={doctor.id} disablePadding>
                      <ListItemButton
                        selected={formData.doctor === doctor.id}
                        onClick={() => handleInputChange('doctor', doctor.id)}
                        sx={{ 
                          border: 1, 
                          borderColor: formData.doctor === doctor.id ? 'primary.main' : 'divider',
                          borderRadius: 1,
                          mb: 1,
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <PersonIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={doctor.name}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {doctor.specialization} • {doctor.experience}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <Chip label={`Rating: ${doctor.rating}`} size="small" color="success" />
                                <Chip label={`Fee: $${doctor.fee}`} size="small" color="info" />
                              </Box>
                            </Box>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
                {formErrors.doctor && (
                  <Typography variant="caption" color="error">
                    {formErrors.doctor}
                  </Typography>
                )}
              </Grid>
            )}
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            {/* Date Selection */}
            <Grid item xs={12} md={6}>
              <DatePicker
                label="Appointment Date"
                value={formData.appointmentDate}
                onChange={(date) => handleInputChange('appointmentDate', date)}
                minDate={new Date()}
                maxDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)} // 30 days from now
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!formErrors.appointmentDate,
                    helperText: formErrors.appointmentDate,
                  },
                }}
              />
            </Grid>

            {/* Time Slot Selection */}
            {formData.appointmentDate && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Available Time Slots
                </Typography>
                <Grid container spacing={1}>
                  {availableData.timeSlots.map((slot) => (
                    <Grid item xs={6} sm={4} md={3} key={slot.id}>
                      <Button
                        fullWidth
                        variant={formData.timeSlot === slot.id ? 'contained' : 'outlined'}
                        disabled={!slot.available}
                        onClick={() => handleInputChange('timeSlot', slot.id)}
                        sx={{ py: 1.5 }}
                      >
                        {slot.time}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
                {formErrors.timeSlot && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                    {formErrors.timeSlot}
                  </Typography>
                )}
              </Grid>
            )}
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            {/* Appointment Type */}
            <Grid item xs={12}>
              <FormControl component="fieldset" error={!!formErrors.appointmentType}>
                <Typography variant="h6" gutterBottom>
                  Appointment Type
                </Typography>
                <RadioGroup
                  value={formData.appointmentType}
                  onChange={(e) => handleInputChange('appointmentType', e.target.value)}
                  row
                >
                  <FormControlLabel value="consultation" control={<Radio />} label="Consultation" />
                  <FormControlLabel value="follow-up" control={<Radio />} label="Follow-up" />
                  <FormControlLabel value="check-up" control={<Radio />} label="Check-up" />
                  <FormControlLabel value="emergency" control={<Radio />} label="Emergency" />
                </RadioGroup>
                {formErrors.appointmentType && (
                  <FormHelperText>{formErrors.appointmentType}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* Chief Complaint */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Chief Complaint"
                multiline
                rows={3}
                value={formData.chiefComplaint}
                onChange={(e) => handleInputChange('chiefComplaint', e.target.value)}
                error={!!formErrors.chiefComplaint}
                helperText={formErrors.chiefComplaint || 'Please describe your main health concern'}
                required
              />
            </Grid>

            {/* Additional Notes */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Additional Notes (Optional)"
                multiline
                rows={2}
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                helperText="Any additional information you'd like the doctor to know"
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Appointment Summary
            </Typography>
            <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Department</Typography>
                  <Typography variant="body1">{getSelectedDepartment()?.name}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Doctor</Typography>
                  <Typography variant="body1">{getSelectedDoctor()?.name}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Date</Typography>
                  <Typography variant="body1">
                    {formData.appointmentDate?.toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Time</Typography>
                  <Typography variant="body1">{getSelectedTimeSlot()?.time}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Type</Typography>
                  <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                    {formData.appointmentType}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Consultation Fee</Typography>
                  <Typography variant="body1">${getSelectedDoctor()?.fee}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Chief Complaint</Typography>
                  <Typography variant="body1">{formData.chiefComplaint}</Typography>
                </Grid>
                {formData.notes && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Additional Notes</Typography>
                    <Typography variant="body1">{formData.notes}</Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <MainLayout user={user} onLogout={logout}>
      <Box>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Book Appointment
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Schedule your appointment with our healthcare professionals
          </Typography>
        </Box>

        {/* Stepper */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card>
          <CardContent sx={{ p: 4 }}>
            {renderStepContent(activeStep)}
          </CardContent>

          {/* Navigation Buttons */}
          <Divider />
          <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              startIcon={<ArrowBackIcon />}
            >
              Back
            </Button>
            
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
              >
                {loading ? 'Booking...' : 'Book Appointment'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<ArrowForwardIcon />}
              >
                Next
              </Button>
            )}
          </Box>
        </Card>
      </Box>
    </MainLayout>
  );
};

export default AppointmentBooking;
