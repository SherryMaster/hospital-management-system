import React, { useState, useCallback } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { ArrowBack, ArrowForward, Save, Close } from '@mui/icons-material';

const MultiStepForm = ({
  title = 'Multi-Step Form',
  steps = [],
  initialData = {},
  onSubmit,
  onCancel,
  open = true,
  maxWidth = 'md',
  fullWidth = true,
  isSubmitting = false,
  submitButtonText = 'Create',
  showCancelButton = true,
  validateStep = null,
  onStepChange = null,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState(initialData);
  const [stepErrors, setStepErrors] = useState({});
  const [globalError, setGlobalError] = useState('');

  // Handle form data changes
  const handleFormChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear field-specific errors when user starts typing
    if (stepErrors[activeStep]?.[field]) {
      setStepErrors(prev => ({
        ...prev,
        [activeStep]: {
          ...prev[activeStep],
          [field]: undefined
        }
      }));
    }
  }, [activeStep, stepErrors]);

  // Validate current step
  const validateCurrentStep = useCallback(() => {
    if (validateStep) {
      const errors = validateStep(activeStep, formData);
      if (errors && Object.keys(errors).length > 0) {
        setStepErrors(prev => ({
          ...prev,
          [activeStep]: errors
        }));
        return false;
      }
    }
    
    // Clear errors for current step if validation passes
    setStepErrors(prev => ({
      ...prev,
      [activeStep]: {}
    }));
    return true;
  }, [activeStep, formData, validateStep]);

  // Handle next step
  const handleNext = useCallback(() => {
    if (validateCurrentStep()) {
      const nextStep = activeStep + 1;
      setActiveStep(nextStep);
      
      if (onStepChange) {
        onStepChange(nextStep, formData);
      }
    }
  }, [activeStep, validateCurrentStep, onStepChange, formData]);

  // Handle previous step
  const handleBack = useCallback(() => {
    const prevStep = activeStep - 1;
    setActiveStep(prevStep);
    
    if (onStepChange) {
      onStepChange(prevStep, formData);
    }
  }, [activeStep, onStepChange, formData]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!validateCurrentStep()) {
      return;
    }

    setGlobalError('');
    
    try {
      await onSubmit(formData);
    } catch (error) {
      setGlobalError(error.message || 'An error occurred while submitting the form');
    }
  }, [formData, onSubmit, validateCurrentStep]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  // Get current step configuration
  const currentStepConfig = steps[activeStep] || {};
  const isLastStep = activeStep === steps.length - 1;
  const isFirstStep = activeStep === 0;

  // Render step content
  const renderStepContent = () => {
    if (!currentStepConfig.component) {
      return (
        <Typography color="error">
          No component defined for step {activeStep + 1}
        </Typography>
      );
    }

    const StepComponent = currentStepConfig.component;
    return (
      <StepComponent
        formData={formData}
        onChange={handleFormChange}
        errors={stepErrors[activeStep] || {}}
        {...(currentStepConfig.props || {})}
      />
    );
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle>
        <Typography variant="h5" component="div">
          {title}
        </Typography>
        {currentStepConfig.subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {currentStepConfig.subtitle}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent>
        {/* Global Error Alert */}
        {globalError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {globalError}
          </Alert>
        )}

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((step, index) => (
            <Step key={index}>
              <StepLabel>{step.label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step Content */}
        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
          {renderStepContent()}
        </Paper>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        {/* Cancel Button */}
        {showCancelButton && (
          <Button
            onClick={handleCancel}
            startIcon={<Close />}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}

        <Box sx={{ flex: 1 }} />

        {/* Back Button */}
        {!isFirstStep && (
          <Button
            onClick={handleBack}
            startIcon={<ArrowBack />}
            disabled={isSubmitting}
            sx={{ mr: 1 }}
          >
            Back
          </Button>
        )}

        {/* Next/Submit Button */}
        {isLastStep ? (
          <Button
            onClick={handleSubmit}
            variant="contained"
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <Save />}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : submitButtonText}
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            variant="contained"
            endIcon={<ArrowForward />}
            disabled={isSubmitting}
          >
            Next
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default MultiStepForm;
