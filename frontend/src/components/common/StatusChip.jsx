/**
 * StatusChip Component
 * 
 * Reusable status chip component with predefined colors for different statuses
 */

import React from 'react';
import { Chip } from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

const StatusChip = ({ status, variant = 'filled', size = 'small', sx = {} }) => {
  const getStatusConfig = (status) => {
    const statusLower = status?.toLowerCase();
    
    switch (statusLower) {
      // Appointment statuses
      case 'scheduled':
        return {
          color: 'info',
          icon: <ScheduleIcon />,
          label: 'Scheduled',
        };
      case 'confirmed':
        return {
          color: 'primary',
          icon: <CheckCircleIcon />,
          label: 'Confirmed',
        };
      case 'completed':
        return {
          color: 'success',
          icon: <CheckCircleIcon />,
          label: 'Completed',
        };
      case 'cancelled':
        return {
          color: 'error',
          icon: <CancelIcon />,
          label: 'Cancelled',
        };
      case 'no_show':
        return {
          color: 'warning',
          icon: <WarningIcon />,
          label: 'No Show',
        };
      
      // Invoice statuses
      case 'draft':
        return {
          color: 'default',
          icon: <InfoIcon />,
          label: 'Draft',
        };
      case 'sent':
        return {
          color: 'info',
          icon: <InfoIcon />,
          label: 'Sent',
        };
      case 'paid':
        return {
          color: 'success',
          icon: <CheckCircleIcon />,
          label: 'Paid',
        };
      case 'partially_paid':
        return {
          color: 'warning',
          icon: <WarningIcon />,
          label: 'Partially Paid',
        };
      case 'overdue':
        return {
          color: 'error',
          icon: <ErrorIcon />,
          label: 'Overdue',
        };
      case 'refunded':
        return {
          color: 'secondary',
          icon: <InfoIcon />,
          label: 'Refunded',
        };
      
      // Payment statuses
      case 'pending':
        return {
          color: 'warning',
          icon: <ScheduleIcon />,
          label: 'Pending',
        };
      case 'processing':
        return {
          color: 'info',
          icon: <ScheduleIcon />,
          label: 'Processing',
        };
      case 'failed':
        return {
          color: 'error',
          icon: <ErrorIcon />,
          label: 'Failed',
        };
      
      // User statuses
      case 'active':
        return {
          color: 'success',
          icon: <CheckCircleIcon />,
          label: 'Active',
        };
      case 'inactive':
        return {
          color: 'default',
          icon: <CancelIcon />,
          label: 'Inactive',
        };
      case 'suspended':
        return {
          color: 'error',
          icon: <ErrorIcon />,
          label: 'Suspended',
        };
      
      // Doctor availability
      case 'available':
        return {
          color: 'success',
          icon: <CheckCircleIcon />,
          label: 'Available',
        };
      case 'busy':
        return {
          color: 'warning',
          icon: <WarningIcon />,
          label: 'Busy',
        };
      case 'unavailable':
        return {
          color: 'error',
          icon: <CancelIcon />,
          label: 'Unavailable',
        };
      
      // Priority levels
      case 'low':
        return {
          color: 'success',
          icon: <InfoIcon />,
          label: 'Low',
        };
      case 'medium':
        return {
          color: 'warning',
          icon: <WarningIcon />,
          label: 'Medium',
        };
      case 'high':
        return {
          color: 'error',
          icon: <ErrorIcon />,
          label: 'High',
        };
      case 'urgent':
        return {
          color: 'error',
          icon: <ErrorIcon />,
          label: 'Urgent',
        };
      
      // Boolean statuses
      case 'true':
      case 'yes':
      case 'enabled':
        return {
          color: 'success',
          icon: <CheckCircleIcon />,
          label: 'Yes',
        };
      case 'false':
      case 'no':
      case 'disabled':
        return {
          color: 'default',
          icon: <CancelIcon />,
          label: 'No',
        };
      
      default:
        return {
          color: 'default',
          icon: <InfoIcon />,
          label: status || 'Unknown',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Chip
      label={config.label}
      color={config.color}
      variant={variant}
      size={size}
      icon={config.icon}
      sx={{
        fontWeight: 500,
        ...sx,
      }}
    />
  );
};

export default StatusChip;
