import React, { useState, useCallback } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import RoleSelectionDialog from './RoleSelectionDialog';
import MultiStepForm from './MultiStepForm';
import { USER_FORM_CONFIGS, validateStep } from '../../config/userFormConfigs';
import { userService } from '../../services/api';

const AdminUserCreateDialog = ({
  open = false,
  onClose,
  onUserCreated,
}) => {
  const { showNotification } = useNotification();
  const [currentStep, setCurrentStep] = useState('role-selection'); // 'role-selection' or 'form'
  const [selectedRole, setSelectedRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle role selection
  const handleRoleSelect = useCallback((role) => {
    setSelectedRole(role);
    setCurrentStep('form');
  }, []);

  // Handle going back to role selection
  const handleBackToRoleSelection = useCallback(() => {
    setSelectedRole('');
    setCurrentStep('role-selection');
  }, []);

  // Handle form submission
  const handleFormSubmit = useCallback(async (formData) => {
    setIsSubmitting(true);
    
    try {
      // Add the selected role to form data
      const submitData = {
        ...formData,
        role: selectedRole,
      };

      // Submit to the admin user creation endpoint
      const result = await userService.createAdminUser(submitData);
      
      if (result.data) {
        showNotification(result.data.message || 'User created successfully', 'success');
        
        // Reset state
        setSelectedRole('');
        setCurrentStep('role-selection');
        
        // Notify parent component
        if (onUserCreated) {
          onUserCreated(result.data.user);
        }
        
        // Close dialog
        if (onClose) {
          onClose();
        }
      } else if (result.error) {
        throw new Error(result.error.message || 'Failed to create user');
      }
    } catch (error) {
      console.error('User creation error:', error);
      showNotification(
        error.message || 'Failed to create user. Please try again.',
        'error'
      );
      throw error; // Re-throw to let MultiStepForm handle it
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedRole, showNotification, onUserCreated, onClose]);

  // Handle dialog close
  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      setSelectedRole('');
      setCurrentStep('role-selection');
      if (onClose) {
        onClose();
      }
    }
  }, [isSubmitting, onClose]);

  // Handle step validation
  const handleStepValidation = useCallback((stepIndex, formData) => {
    return validateStep(stepIndex, formData, selectedRole);
  }, [selectedRole]);

  // Get form configuration for selected role
  const formConfig = selectedRole ? USER_FORM_CONFIGS[selectedRole] : null;

  // Render role selection dialog
  if (currentStep === 'role-selection') {
    return (
      <RoleSelectionDialog
        open={open}
        onClose={handleClose}
        onRoleSelect={handleRoleSelect}
        title="Create New User Account"
      />
    );
  }

  // Render multi-step form
  if (currentStep === 'form' && formConfig) {
    return (
      <MultiStepForm
        open={open}
        title={formConfig.title}
        steps={formConfig.steps}
        initialData={{ role: selectedRole }}
        onSubmit={handleFormSubmit}
        onCancel={handleBackToRoleSelection}
        maxWidth="lg"
        isSubmitting={isSubmitting}
        submitButtonText={formConfig.submitButtonText}
        validateStep={handleStepValidation}
      />
    );
  }

  // Fallback - should not reach here
  return null;
};

export default AdminUserCreateDialog;
