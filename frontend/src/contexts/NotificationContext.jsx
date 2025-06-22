/**
 * NotificationContext
 * 
 * Global notification system for displaying success, error, warning, and info messages
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert, AlertTitle } from '@mui/material';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = useCallback((message, severity = 'info', options = {}) => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      message,
      severity,
      title: options.title,
      autoHideDuration: options.autoHideDuration || 6000,
      action: options.action,
      ...options,
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-remove notification after duration
    if (notification.autoHideDuration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.autoHideDuration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenience methods
  const showSuccess = useCallback((message, options = {}) => {
    return showNotification(message, 'success', options);
  }, [showNotification]);

  const showError = useCallback((message, options = {}) => {
    return showNotification(message, 'error', options);
  }, [showNotification]);

  const showWarning = useCallback((message, options = {}) => {
    return showNotification(message, 'warning', options);
  }, [showNotification]);

  const showInfo = useCallback((message, options = {}) => {
    return showNotification(message, 'info', options);
  }, [showNotification]);

  const value = {
    notifications,
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeNotification,
    clearAllNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      
      {/* Render notifications */}
      {notifications.map((notification, index) => (
        <Snackbar
          key={notification.id}
          open={true}
          autoHideDuration={notification.autoHideDuration}
          onClose={() => removeNotification(notification.id)}
          anchorOrigin={{ 
            vertical: 'top', 
            horizontal: 'right' 
          }}
          sx={{
            mt: index * 7, // Stack notifications
          }}
        >
          <Alert
            onClose={() => removeNotification(notification.id)}
            severity={notification.severity}
            variant="filled"
            action={notification.action}
            sx={{ minWidth: 300 }}
          >
            {notification.title && (
              <AlertTitle>{notification.title}</AlertTitle>
            )}
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
