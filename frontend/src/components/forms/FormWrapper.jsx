/**
 * FormWrapper Component
 * 
 * Wrapper component for forms with loading states and error handling
 */

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Divider,
  CircularProgress,
} from '@mui/material';
import { Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { ErrorAlert } from '../common';

const FormWrapper = ({
  title,
  subtitle,
  children,
  onSubmit,
  onCancel,
  loading = false,
  error = null,
  submitText = 'Save',
  cancelText = 'Cancel',
  showCancel = true,
  disabled = false,
  elevation = 1,
  sx = {},
}) => {
  const handleSubmit = (event) => {
    event.preventDefault();
    if (onSubmit && !loading && !disabled) {
      onSubmit(event);
    }
  };

  const handleCancel = () => {
    if (onCancel && !loading) {
      onCancel();
    }
  };

  return (
    <Paper elevation={elevation} sx={{ p: 3, ...sx }}>
      {/* Header */}
      {(title || subtitle) && (
        <Box mb={3}>
          {title && (
            <Typography variant="h5" component="h2" gutterBottom>
              {title}
            </Typography>
          )}
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
          <Divider sx={{ mt: 2 }} />
        </Box>
      )}

      {/* Error Alert */}
      {error && (
        <Box mb={3}>
          <ErrorAlert error={error} />
        </Box>
      )}

      {/* Form */}
      <Box component="form" onSubmit={handleSubmit} noValidate>
        {/* Form Fields */}
        <Stack spacing={3} mb={4}>
          {children}
        </Stack>

        {/* Actions */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 2,
            pt: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          {showCancel && (
            <Button
              variant="outlined"
              onClick={handleCancel}
              disabled={loading}
              startIcon={<CancelIcon />}
            >
              {cancelText}
            </Button>
          )}
          <Button
            type="submit"
            variant="contained"
            disabled={loading || disabled}
            startIcon={
              loading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <SaveIcon />
              )
            }
          >
            {loading ? 'Saving...' : submitText}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default FormWrapper;
