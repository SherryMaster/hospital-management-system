import React from 'react';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  Alert,
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  Home,
  ContactEmergency,
  MedicalServices,
  Badge,
  School,
} from '@mui/icons-material';

const ReviewStep = ({ formData, errors = {} }) => {
  const formatDate = (date) => {
    if (!date) return 'Not provided';
    return new Date(date).toLocaleDateString();
  };

  const formatList = (items) => {
    if (!items || items.length === 0) return 'None specified';
    return Array.isArray(items) ? items.join(', ') : items;
  };

  const InfoSection = ({ title, icon, children }) => (
    <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {icon}
        <Typography variant="h6" sx={{ ml: 1 }}>
          {title}
        </Typography>
      </Box>
      <Divider sx={{ mb: 2 }} />
      {children}
    </Paper>
  );

  const InfoItem = ({ label, value, fullWidth = false }) => (
    <Grid item xs={12} sm={fullWidth ? 12 : 6}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 500 }}>
        {value || 'Not provided'}
      </Typography>
    </Grid>
  );

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review & Confirm
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Please review all the information below before creating the user account. Make sure all details are correct.
      </Typography>

      {/* Personal Information */}
      <InfoSection title="Personal Information" icon={<Person color="primary" />}>
        <Grid container spacing={2}>
          <InfoItem label="Full Name" value={`${formData.first_name || ''} ${formData.last_name || ''}`.trim()} />
          <InfoItem label="Username" value={formData.username} />
          <InfoItem label="Email" value={formData.email} />
          <InfoItem label="Date of Birth" value={formatDate(formData.date_of_birth)} />
          <InfoItem label="Gender" value={formData.gender} />
          <InfoItem label="Role" value={formData.role} />
        </Grid>
      </InfoSection>

      {/* Contact Information */}
      <InfoSection title="Contact Information" icon={<Phone color="primary" />}>
        <Grid container spacing={2}>
          <InfoItem label="Phone Number" value={formData.phone_number} />
          <InfoItem label="Address" value={formData.address} fullWidth />
          <InfoItem label="City" value={formData.city} />
          <InfoItem label="State/Province" value={formData.state} />
          <InfoItem label="Postal Code" value={formData.postal_code} />
          <InfoItem label="Country" value={formData.country} />
        </Grid>
      </InfoSection>

      {/* Emergency Contact */}
      {(formData.emergency_contact_name || formData.emergency_contact_phone) && (
        <InfoSection title="Emergency Contact" icon={<ContactEmergency color="primary" />}>
          <Grid container spacing={2}>
            <InfoItem label="Name" value={formData.emergency_contact_name} />
            <InfoItem label="Phone" value={formData.emergency_contact_phone} />
            <InfoItem label="Relationship" value={formData.emergency_contact_relationship} />
          </Grid>
        </InfoSection>
      )}

      {/* Medical Information (for patients) */}
      {formData.role === 'patient' && (
        <InfoSection title="Medical Information" icon={<MedicalServices color="primary" />}>
          <Grid container spacing={2}>
            <InfoItem label="Blood Type" value={formData.blood_type} />
            <InfoItem label="Height" value={formData.height ? `${formData.height} m` : null} />
            <InfoItem label="Weight" value={formData.weight ? `${formData.weight} kg` : null} />
            <InfoItem label="Marital Status" value={formData.marital_status} />
            <InfoItem label="Allergies" value={formData.allergies} fullWidth />
            <InfoItem label="Chronic Conditions" value={formData.chronic_conditions} fullWidth />
            <InfoItem label="Current Medications" value={formData.current_medications} fullWidth />
            <InfoItem label="Family Medical History" value={formData.family_medical_history} fullWidth />
            <InfoItem label="Surgical History" value={formData.surgical_history} fullWidth />
          </Grid>
        </InfoSection>
      )}

      {/* Doctor Credentials */}
      {formData.role === 'doctor' && (
        <InfoSection title="Medical Credentials" icon={<Badge color="primary" />}>
          <Grid container spacing={2}>
            <InfoItem label="License Number" value={formData.license_number} />
            <InfoItem label="Medical School" value={formData.medical_school} />
            <InfoItem label="Graduation Year" value={formData.graduation_year} />
            <InfoItem label="Years of Experience" value={formData.years_of_experience} />
            <InfoItem label="Department" value={formData.department_name} />
            <InfoItem label="Employment Status" value={formData.employment_status} />
            <InfoItem label="Consultation Fee" value={formData.consultation_fee ? `$${formData.consultation_fee}` : null} />
            
            {formData.specializations && formData.specializations.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Specializations
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {formData.specializations.map((spec, index) => (
                    <Chip key={index} label={spec} variant="outlined" size="small" />
                  ))}
                </Box>
              </Grid>
            )}
            
            <InfoItem label="Residency Program" value={formData.residency_program} fullWidth />
            <InfoItem label="Fellowship Program" value={formData.fellowship_program} fullWidth />
            <InfoItem label="Certifications" value={formData.certifications} fullWidth />
          </Grid>
        </InfoSection>
      )}

      {/* Nurse Credentials */}
      {formData.role === 'nurse' && (
        <InfoSection title="Nursing Credentials" icon={<Badge color="primary" />}>
          <Grid container spacing={2}>
            <InfoItem label="License Number" value={formData.license_number} />
            <InfoItem label="Nursing Level" value={formData.nursing_level} />
            <InfoItem label="Department" value={formData.department} />
            <InfoItem label="Unit" value={formData.unit} />
            <InfoItem label="Nursing School" value={formData.nursing_school} />
            <InfoItem label="Graduation Year" value={formData.graduation_year} />
            <InfoItem label="Years of Experience" value={formData.years_of_experience} />
            <InfoItem label="Shift Preference" value={formData.shift_preference} />
            <InfoItem label="Employment Status" value={formData.employment_status} />
          </Grid>
        </InfoSection>
      )}

      {/* Administrator Details */}
      {formData.role === 'admin' && (
        <InfoSection title="Administrator Details" icon={<Badge color="primary" />}>
          <Grid container spacing={2}>
            <InfoItem label="Access Level" value={formData.access_level} />
            <InfoItem label="Office Location" value={formData.office_location} />
          </Grid>
        </InfoSection>
      )}

      {/* Receptionist Details */}
      {formData.role === 'receptionist' && (
        <InfoSection title="Receptionist Details" icon={<Badge color="primary" />}>
          <Grid container spacing={2}>
            <InfoItem label="Reception Area" value={formData.reception_area} />
            <InfoItem label="Languages Spoken" value={formatList(formData.languages_spoken)} />
          </Grid>
        </InfoSection>
      )}

      {/* Pharmacist Details */}
      {formData.role === 'pharmacist' && (
        <InfoSection title="Pharmacist Details" icon={<Badge color="primary" />}>
          <Grid container spacing={2}>
            <InfoItem label="Pharmacy License Number" value={formData.pharmacy_license_number} />
            <InfoItem label="Pharmacy School" value={formData.pharmacy_school} />
            <InfoItem label="Can Dispense Controlled Substances" value={formData.can_dispense_controlled_substances ? 'Yes' : 'No'} />
          </Grid>
        </InfoSection>
      )}

      {/* Validation Errors */}
      {Object.keys(errors).length > 0 && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
            Please fix the following errors before proceeding:
          </Typography>
          <List dense>
            {Object.entries(errors).map(([field, error]) => (
              <ListItem key={field} sx={{ py: 0 }}>
                <ListItemText primary={`${field}: ${error}`} />
              </ListItem>
            ))}
          </List>
        </Alert>
      )}
    </Box>
  );
};

export default ReviewStep;
