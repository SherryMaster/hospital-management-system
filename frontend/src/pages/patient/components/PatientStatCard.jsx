/**
 * PatientStatCard Component
 * 
 * Standardized statistics card component for patient pages
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';

const PatientStatCard = ({
  title,
  value,
  icon,
  color = 'primary',
  action = null,
  trend = null,
  subtitle = null,
  onClick = null,
  loading = false,
  error = false,
}) => {
  const getColorValue = (colorName) => {
    const colorMap = {
      primary: 'primary.main',
      secondary: 'secondary.main',
      success: 'success.main',
      warning: 'warning.main',
      error: 'error.main',
      info: 'info.main',
    };
    return colorMap[colorName] || colorName;
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    
    switch (trend.direction) {
      case 'up':
        return <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />;
      case 'down':
        return <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />;
      default:
        return <RemoveIcon sx={{ fontSize: 16, color: 'text.secondary' }} />;
    }
  };

  const cardContent = (
    <Card 
      sx={{ 
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease-in-out',
        '&:hover': onClick ? {
          transform: 'translateY(-2px)',
          boxShadow: 2,
        } : {},
        opacity: error ? 0.6 : 1,
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography color="textSecondary" gutterBottom variant="body2">
            {title}
          </Typography>
          {icon && (
            <Box sx={{ color: getColorValue(color), opacity: 0.8 }}>
              {icon}
            </Box>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
          <Typography variant="h4" component="div" color={error ? 'error.main' : 'text.primary'}>
            {loading ? '...' : (error ? 'Error' : value)}
          </Typography>
          {trend && (
            <Tooltip title={trend.tooltip || `${trend.direction} ${trend.value || ''}`}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {getTrendIcon()}
                {trend.value && (
                  <Typography variant="caption" color="text.secondary">
                    {trend.value}
                  </Typography>
                )}
              </Box>
            </Tooltip>
          )}
        </Box>
        
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
      
      {action && (
        <CardActions sx={{ pt: 0 }}>
          <Button 
            size="small" 
            color={color}
            onClick={(e) => {
              e.stopPropagation();
              action.onClick();
            }}
            disabled={action.disabled || loading || error}
          >
            {action.label}
          </Button>
        </CardActions>
      )}
    </Card>
  );

  return cardContent;
};

export default PatientStatCard;
