/**
 * RoleBasedRoute Component
 * 
 * Route component that renders different content based on user role
 */

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ProtectedRoute from './ProtectedRoute';

const RoleBasedRoute = ({ 
  roleComponents = {}, 
  defaultComponent = null,
  fallbackComponent = null,
  requiredRoles = []
}) => {
  const { user } = useAuth();

  const renderContent = () => {
    if (!user) {
      return fallbackComponent || null;
    }

    const userRole = user.role?.toLowerCase();
    
    // Check if user has required role
    if (requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some(role => 
        role.toLowerCase() === userRole
      );
      
      if (!hasRequiredRole) {
        return fallbackComponent || null;
      }
    }

    // Render role-specific component
    const RoleComponent = roleComponents[userRole];
    if (RoleComponent) {
      return <RoleComponent />;
    }

    // Render default component if no role-specific component found
    if (defaultComponent) {
      return React.createElement(defaultComponent);
    }

    return fallbackComponent || null;
  };

  return (
    <ProtectedRoute requiredRoles={requiredRoles}>
      {renderContent()}
    </ProtectedRoute>
  );
};

export default RoleBasedRoute;
