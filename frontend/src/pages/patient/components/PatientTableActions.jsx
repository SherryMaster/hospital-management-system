/**
 * PatientTableActions Component
 * 
 * Standardized action buttons for table rows
 */

import React from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Button,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';

const PatientTableActions = ({
  actions = [],
  size = 'small',
  variant = 'icon', // 'icon' or 'button'
  spacing = 0.5,
}) => {
  if (!actions || actions.length === 0) return null;

  const getActionIcon = (actionType) => {
    const iconMap = {
      view: <ViewIcon fontSize="small" />,
      edit: <EditIcon fontSize="small" />,
      cancel: <CancelIcon fontSize="small" />,
      delete: <DeleteIcon fontSize="small" />,
      download: <DownloadIcon fontSize="small" />,
      payment: <PaymentIcon fontSize="small" />,
    };
    return iconMap[actionType] || null;
  };

  const getActionColor = (actionType) => {
    const colorMap = {
      view: 'primary',
      edit: 'primary',
      cancel: 'error',
      delete: 'error',
      download: 'info',
      payment: 'success',
    };
    return colorMap[actionType] || 'default';
  };

  const renderIconAction = (action, index) => (
    <Tooltip key={action.id || index} title={action.tooltip || action.label}>
      <span>
        <IconButton
          size={size}
          color={action.color || getActionColor(action.type)}
          onClick={action.onClick}
          disabled={action.disabled}
          sx={action.sx}
        >
          {action.icon || getActionIcon(action.type)}
        </IconButton>
      </span>
    </Tooltip>
  );

  const renderButtonAction = (action, index) => (
    <Button
      key={action.id || index}
      size={size}
      variant={action.variant || 'outlined'}
      color={action.color || getActionColor(action.type)}
      startIcon={action.icon || getActionIcon(action.type)}
      onClick={action.onClick}
      disabled={action.disabled}
      sx={{ 
        minWidth: 'auto',
        textTransform: 'none',
        ...action.sx 
      }}
    >
      {action.label}
    </Button>
  );

  return (
    <Box sx={{ display: 'flex', gap: spacing, alignItems: 'center' }}>
      {actions.map((action, index) => {
        if (!action.visible && action.visible !== undefined) return null;
        
        return variant === 'button' 
          ? renderButtonAction(action, index)
          : renderIconAction(action, index);
      })}
    </Box>
  );
};

export default PatientTableActions;
