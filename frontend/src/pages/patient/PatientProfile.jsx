/**
 * PatientProfile Component
 * 
 * Comprehensive patient profile management with view and edit capabilities
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Person as PersonIcon,
  ContactPhone as ContactPhoneIcon,
  LocalHospital as HospitalIcon,
  MedicalServices as MedicalIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { MainLayout } from '../../components/layout';
import { useAuth } from '../../contexts/AuthContext';
import { patientService } from '../../services/api';
import {
  PatientPageHeader,
  PatientLoadingState,
  PatientErrorAlert
} from './components';

const PatientProfile = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editDialog, setEditDialog] = useState({ open: false, section: '' });
  
  const [profileData, setProfileData] = useState({
    // Personal Information
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    date_of_birth: '',
    gender: '',
    
    // Address Information
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    
    // Emergency Contact
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    
    // Patient-Specific Information
    blood_type: '',
    marital_status: '',
    occupation: '',
    height: '',
    weight: '',
    
    // Insurance Information
    insurance_provider: '',
    insurance_policy_number: '',
    insurance_group_number: '',
    
    // Medical History
    allergies: '',
    chronic_conditions: '',
    current_medications: '',
    family_medical_history: '',
    surgical_history: '',
  });

  const [originalData, setOriginalData] = useState({});

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: apiError } = await patientService.getMyProfile();
      
      if (apiError) {
        throw new Error(apiError.message || 'Failed to load profile data');
      }

      if (data) {
        const userProfile = data.user || {};
        const patientProfile = {
          // Personal Information from User model
          first_name: userProfile.first_name || '',
          middle_name: userProfile.middle_name || '',
          last_name: userProfile.last_name || '',
          email: userProfile.email || '',
          phone_number: userProfile.phone_number || '',
          date_of_birth: userProfile.date_of_birth || '',
          gender: userProfile.gender || '',
          
          // Address Information from User model
          address_line_1: userProfile.address_line_1 || '',
          address_line_2: userProfile.address_line_2 || '',
          city: userProfile.city || '',
          state: userProfile.state || '',
          postal_code: userProfile.postal_code || '',
          country: userProfile.country || '',
          
          // Emergency Contact from User model
          emergency_contact_name: userProfile.emergency_contact_name || '',
          emergency_contact_phone: userProfile.emergency_contact_phone || '',
          emergency_contact_relationship: userProfile.emergency_contact_relationship || '',
          
          // Patient-Specific Information from Patient model
          blood_type: data.blood_type || '',
          marital_status: data.marital_status || '',
          occupation: data.occupation || '',
          height: data.height || '',
          weight: data.weight || '',
          
          // Insurance Information from Patient model
          insurance_provider: data.insurance_provider || '',
          insurance_policy_number: data.insurance_policy_number || '',
          insurance_group_number: data.insurance_group_number || '',
          
          // Medical History from Patient model
          allergies: data.allergies || '',
          chronic_conditions: data.chronic_conditions || '',
          current_medications: data.current_medications || '',
          family_medical_history: data.family_medical_history || '',
          surgical_history: data.surgical_history || '',
        };

        setProfileData(patientProfile);
        setOriginalData(patientProfile);
      }
    } catch (error) {
      console.error('Failed to load profile data:', error);
      setError(error.message || 'Failed to load profile data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleEditToggle = () => {
    if (editMode) {
      // Cancel edit - restore original data
      setProfileData(originalData);
    }
    setEditMode(!editMode);
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Prepare data for API - separate user and patient fields
      const userData = {
        first_name: profileData.first_name,
        middle_name: profileData.middle_name,
        last_name: profileData.last_name,
        phone_number: profileData.phone_number,
        date_of_birth: profileData.date_of_birth,
        gender: profileData.gender,
        address_line_1: profileData.address_line_1,
        address_line_2: profileData.address_line_2,
        city: profileData.city,
        state: profileData.state,
        postal_code: profileData.postal_code,
        country: profileData.country,
        emergency_contact_name: profileData.emergency_contact_name,
        emergency_contact_phone: profileData.emergency_contact_phone,
        emergency_contact_relationship: profileData.emergency_contact_relationship,
      };

      const patientData = {
        blood_type: profileData.blood_type,
        marital_status: profileData.marital_status,
        occupation: profileData.occupation,
        height: profileData.height ? parseFloat(profileData.height) : null,
        weight: profileData.weight ? parseFloat(profileData.weight) : null,
        insurance_provider: profileData.insurance_provider,
        insurance_policy_number: profileData.insurance_policy_number,
        insurance_group_number: profileData.insurance_group_number,
        allergies: profileData.allergies,
        chronic_conditions: profileData.chronic_conditions,
        current_medications: profileData.current_medications,
        family_medical_history: profileData.family_medical_history,
        surgical_history: profileData.surgical_history,
      };

      // Update profile via API
      const { data, error: apiError } = await patientService.updateMyProfile({
        user: userData,
        patient: patientData
      });

      if (apiError) {
        throw new Error(apiError.message || 'Failed to update profile');
      }

      setOriginalData(profileData);
      setEditMode(false);
      setSuccess('Profile updated successfully!');
      
      // Reload data to get any computed fields
      setTimeout(() => {
        loadProfileData();
      }, 1000);

    } catch (error) {
      console.error('Failed to update profile:', error);
      setError(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );

  if (loading) {
    return (
      <MainLayout user={user} onLogout={logout}>
        <PatientLoadingState
          type="linear"
          title="Patient Profile"
          showTitle={true}
          message="Loading your profile information..."
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout user={user} onLogout={logout}>
      <Box>
        {/* Header */}
        <PatientPageHeader
          title="Patient Profile"
          subtitle="Manage your personal and medical information"
          user={user}
          showAvatar={true}
          patientProfile={profileData}
          actionButton={editMode ? {
            label: saving ? 'Saving...' : 'Save Changes',
            icon: <SaveIcon />,
            onClick: handleSave,
            disabled: saving
          } : {
            label: 'Edit Profile',
            icon: <EditIcon />,
            onClick: handleEditToggle
          }}
          editAction={editMode ? {
            label: 'Cancel',
            onClick: handleEditToggle
          } : null}
        />

        {/* Alerts */}
        <PatientErrorAlert
          error={error}
          onClose={() => setError(null)}
          title="Profile Error"
        />
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Profile Tabs */}
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="profile tabs">
              <Tab
                label="Personal Information"
                icon={<PersonIcon />}
                iconPosition="start"
                id="profile-tab-0"
                aria-controls="profile-tabpanel-0"
              />
              <Tab
                label="Contact & Address"
                icon={<ContactPhoneIcon />}
                iconPosition="start"
                id="profile-tab-1"
                aria-controls="profile-tabpanel-1"
              />
              <Tab
                label="Medical Information"
                icon={<MedicalIcon />}
                iconPosition="start"
                id="profile-tab-2"
                aria-controls="profile-tabpanel-2"
              />
              <Tab
                label="Insurance"
                icon={<HospitalIcon />}
                iconPosition="start"
                id="profile-tab-3"
                aria-controls="profile-tabpanel-3"
              />
            </Tabs>
          </Box>

          {/* Personal Information Tab */}
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={profileData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  disabled={!editMode}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Middle Name"
                  value={profileData.middle_name}
                  onChange={(e) => handleInputChange('middle_name', e.target.value)}
                  disabled={!editMode}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={profileData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  disabled={!editMode}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date of Birth"
                  type="date"
                  value={profileData.date_of_birth}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                  disabled={!editMode}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={!editMode}>
                  <InputLabel>Gender</InputLabel>
                  <Select
                    value={profileData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    label="Gender"
                  >
                    <MenuItem value="M">Male</MenuItem>
                    <MenuItem value="F">Female</MenuItem>
                    <MenuItem value="O">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={!editMode}>
                  <InputLabel>Marital Status</InputLabel>
                  <Select
                    value={profileData.marital_status}
                    onChange={(e) => handleInputChange('marital_status', e.target.value)}
                    label="Marital Status"
                  >
                    <MenuItem value="single">Single</MenuItem>
                    <MenuItem value="married">Married</MenuItem>
                    <MenuItem value="divorced">Divorced</MenuItem>
                    <MenuItem value="widowed">Widowed</MenuItem>
                    <MenuItem value="separated">Separated</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Occupation"
                  value={profileData.occupation}
                  onChange={(e) => handleInputChange('occupation', e.target.value)}
                  disabled={!editMode}
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* Contact & Address Tab */}
          <TabPanel value={activeTab} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Contact Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={profileData.email}
                  disabled={true} // Email typically shouldn't be editable
                  helperText="Contact support to change your email address"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={profileData.phone_number}
                  onChange={(e) => handleInputChange('phone_number', e.target.value)}
                  disabled={!editMode}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Address Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address Line 1"
                  value={profileData.address_line_1}
                  onChange={(e) => handleInputChange('address_line_1', e.target.value)}
                  disabled={!editMode}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address Line 2 (Optional)"
                  value={profileData.address_line_2}
                  onChange={(e) => handleInputChange('address_line_2', e.target.value)}
                  disabled={!editMode}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="City"
                  value={profileData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  disabled={!editMode}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="State/Province"
                  value={profileData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  disabled={!editMode}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Postal Code"
                  value={profileData.postal_code}
                  onChange={(e) => handleInputChange('postal_code', e.target.value)}
                  disabled={!editMode}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Country"
                  value={profileData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  disabled={!editMode}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Emergency Contact
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Emergency Contact Name"
                  value={profileData.emergency_contact_name}
                  onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                  disabled={!editMode}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Emergency Contact Phone"
                  value={profileData.emergency_contact_phone}
                  onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                  disabled={!editMode}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth disabled={!editMode}>
                  <InputLabel>Relationship</InputLabel>
                  <Select
                    value={profileData.emergency_contact_relationship}
                    onChange={(e) => handleInputChange('emergency_contact_relationship', e.target.value)}
                    label="Relationship"
                  >
                    <MenuItem value="spouse">Spouse</MenuItem>
                    <MenuItem value="parent">Parent</MenuItem>
                    <MenuItem value="child">Child</MenuItem>
                    <MenuItem value="sibling">Sibling</MenuItem>
                    <MenuItem value="friend">Friend</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Medical Information Tab */}
          <TabPanel value={activeTab} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Basic Medical Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth disabled={!editMode}>
                  <InputLabel>Blood Type</InputLabel>
                  <Select
                    value={profileData.blood_type}
                    onChange={(e) => handleInputChange('blood_type', e.target.value)}
                    label="Blood Type"
                  >
                    <MenuItem value="A+">A+</MenuItem>
                    <MenuItem value="A-">A-</MenuItem>
                    <MenuItem value="B+">B+</MenuItem>
                    <MenuItem value="B-">B-</MenuItem>
                    <MenuItem value="AB+">AB+</MenuItem>
                    <MenuItem value="AB-">AB-</MenuItem>
                    <MenuItem value="O+">O+</MenuItem>
                    <MenuItem value="O-">O-</MenuItem>
                    <MenuItem value="UNK">Unknown</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Height (cm)"
                  type="number"
                  value={profileData.height}
                  onChange={(e) => handleInputChange('height', e.target.value)}
                  disabled={!editMode}
                  inputProps={{ min: 0, max: 300 }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Weight (kg)"
                  type="number"
                  value={profileData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  disabled={!editMode}
                  inputProps={{ min: 0, max: 500 }}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Medical History
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Allergies"
                  multiline
                  rows={3}
                  value={profileData.allergies}
                  onChange={(e) => handleInputChange('allergies', e.target.value)}
                  disabled={!editMode}
                  placeholder="List any known allergies (medications, foods, environmental, etc.)"
                  helperText="Separate multiple allergies with commas"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Chronic Conditions"
                  multiline
                  rows={3}
                  value={profileData.chronic_conditions}
                  onChange={(e) => handleInputChange('chronic_conditions', e.target.value)}
                  disabled={!editMode}
                  placeholder="List any chronic medical conditions"
                  helperText="Separate multiple conditions with commas"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Current Medications"
                  multiline
                  rows={3}
                  value={profileData.current_medications}
                  onChange={(e) => handleInputChange('current_medications', e.target.value)}
                  disabled={!editMode}
                  placeholder="List current medications with dosages"
                  helperText="Include prescription and over-the-counter medications"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Family Medical History"
                  multiline
                  rows={3}
                  value={profileData.family_medical_history}
                  onChange={(e) => handleInputChange('family_medical_history', e.target.value)}
                  disabled={!editMode}
                  placeholder="Relevant family medical history"
                  helperText="Include major conditions in immediate family members"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Surgical History"
                  multiline
                  rows={3}
                  value={profileData.surgical_history}
                  onChange={(e) => handleInputChange('surgical_history', e.target.value)}
                  disabled={!editMode}
                  placeholder="Previous surgeries and procedures"
                  helperText="Include dates and types of surgeries"
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* Insurance Tab */}
          <TabPanel value={activeTab} index={3}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Insurance Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Insurance Provider"
                  value={profileData.insurance_provider}
                  onChange={(e) => handleInputChange('insurance_provider', e.target.value)}
                  disabled={!editMode}
                  placeholder="Name of your insurance company"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Policy Number"
                  value={profileData.insurance_policy_number}
                  onChange={(e) => handleInputChange('insurance_policy_number', e.target.value)}
                  disabled={!editMode}
                  placeholder="Your insurance policy number"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Group Number"
                  value={profileData.insurance_group_number}
                  onChange={(e) => handleInputChange('insurance_group_number', e.target.value)}
                  disabled={!editMode}
                  placeholder="Insurance group number (if applicable)"
                />
              </Grid>
              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Note:</strong> Insurance information is used for billing purposes.
                    Please ensure all details are accurate and up to date. Contact our billing
                    department if you need assistance with insurance verification.
                  </Typography>
                </Alert>
              </Grid>
            </Grid>
          </TabPanel>
        </Card>
      </Box>
    </MainLayout>
  );
};

export default PatientProfile;
