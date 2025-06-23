import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Box,
  Avatar,
  Chip,
  Alert,
} from '@mui/material';
import {
  PersonAdd,
  LocalHospital,
  MedicalServices,
  AdminPanelSettings,
  Business,
  LocalPharmacy,
  Close,
  ArrowForward,
} from '@mui/icons-material';

const RoleSelectionDialog = ({
  open = false,
  onClose,
  onRoleSelect,
  title = 'Select User Type',
}) => {
  const [selectedRole, setSelectedRole] = useState('');

  const handleRoleClick = (role) => {
    setSelectedRole(role);
  };

  const handleContinue = () => {
    if (selectedRole && onRoleSelect) {
      onRoleSelect(selectedRole);
    }
  };

  const handleCancel = () => {
    setSelectedRole('');
    if (onClose) {
      onClose();
    }
  };

  const userTypes = [
    {
      role: 'patient',
      title: 'Patient',
      description: 'Create a patient account with medical history and personal information',
      icon: <PersonAdd />,
      color: '#4caf50',
      features: ['Medical History', 'Emergency Contacts', 'Personal Information', 'Health Records'],
      steps: 5,
    },
    {
      role: 'doctor',
      title: 'Doctor',
      description: 'Create a doctor account with medical credentials and specializations',
      icon: <MedicalServices />,
      color: '#2196f3',
      features: ['Medical License', 'Specializations', 'Department Assignment', 'Credentials'],
      steps: 5,
    },
    {
      role: 'nurse',
      title: 'Nurse',
      description: 'Create a nurse account with nursing credentials and department assignment',
      icon: <LocalHospital />,
      color: '#ff9800',
      features: ['Nursing License', 'Education Background', 'Department & Unit', 'Shift Preferences'],
      steps: 5,
    },
    {
      role: 'admin',
      title: 'Administrator',
      description: 'Create an administrator account with system access permissions',
      icon: <AdminPanelSettings />,
      color: '#f44336',
      features: ['Access Level', 'System Permissions', 'Office Location', 'Administrative Rights'],
      steps: 4,
    },
    {
      role: 'receptionist',
      title: 'Receptionist',
      description: 'Create a receptionist account for front desk operations',
      icon: <Business />,
      color: '#9c27b0',
      features: ['Reception Area', 'Language Skills', 'Customer Service', 'Front Desk Operations'],
      steps: 4,
    },
    {
      role: 'pharmacist',
      title: 'Pharmacist',
      description: 'Create a pharmacist account with pharmacy credentials',
      icon: <LocalPharmacy />,
      color: '#607d8b',
      features: ['Pharmacy License', 'Education Background', 'Controlled Substances', 'Medication Management'],
      steps: 4,
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle>
        <Typography variant="h5" component="div">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Select the type of user account you want to create. Each user type has specific information requirements.
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Note:</strong> Each user type requires different information and has a multi-step registration process.
            Make sure you have all the necessary information before proceeding.
          </Typography>
        </Alert>

        <Grid container spacing={3}>
          {userTypes.map((userType) => (
            <Grid item xs={12} sm={6} md={4} key={userType.role}>
              <Card
                sx={{
                  height: '100%',
                  border: selectedRole === userType.role ? 2 : 1,
                  borderColor: selectedRole === userType.role ? userType.color : 'divider',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3,
                  },
                }}
              >
                <CardActionArea
                  onClick={() => handleRoleClick(userType.role)}
                  sx={{ height: '100%', p: 0 }}
                >
                  <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: userType.color,
                          mr: 2,
                          width: 48,
                          height: 48,
                        }}
                      >
                        {userType.icon}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" component="div">
                          {userType.title}
                        </Typography>
                        <Chip
                          label={`${userType.steps} Steps`}
                          size="small"
                          variant="outlined"
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    </Box>

                    {/* Description */}
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                      {userType.description}
                    </Typography>

                    {/* Features */}
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                        Includes:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {userType.features.map((feature, index) => (
                          <Chip
                            key={index}
                            label={feature}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        ))}
                      </Box>
                    </Box>

                    {/* Selection Indicator */}
                    {selectedRole === userType.role && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: userType.color,
                          color: 'white',
                          borderRadius: '50%',
                          width: 24,
                          height: 24,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        ✓
                      </Box>
                    )}
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>

        {selectedRole && (
          <Alert severity="success" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>{userTypes.find(type => type.role === selectedRole)?.title}</strong> selected.
              Click "Continue" to proceed with the registration form.
            </Typography>
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button
          onClick={handleCancel}
          startIcon={<Close />}
        >
          Cancel
        </Button>

        <Box sx={{ flex: 1 }} />

        <Button
          onClick={handleContinue}
          variant="contained"
          endIcon={<ArrowForward />}
          disabled={!selectedRole}
        >
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RoleSelectionDialog;
