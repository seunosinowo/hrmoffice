import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type Role = 'employee' | 'assessor' | 'hr' | null;

interface RoleContextType {
  role: Role;
  setRole: (role: Role) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role>(null);

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = (): RoleContextType => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

interface RoleBasedRouteProps {
  allowedRoles: string[];
}

export const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({ allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth/login" />;
  }

  // Access roles directly from the user object
  const roles = user.roles || [];

  // Define role hierarchy - higher roles can access routes requiring lower roles
  const roleHierarchy: { [key: string]: string[] } = {
    'hr': ['hr', 'assessor', 'employee'], // HR can access HR, assessor, and employee routes
    'assessor': ['assessor', 'employee'],  // Assessors can access assessor and employee routes
    'employee': ['employee']               // Employees can only access employee routes
  };

  // Check if user has any role that grants access to the required roles
  const hasAllowedRole = roles.some(userRole => {
    // Get all roles this user role has access to
    const accessibleRoles = roleHierarchy[userRole] || [userRole];
    // Check if any of the allowed roles are in the accessible roles
    return allowedRoles.some(allowedRole => accessibleRoles.includes(allowedRole));
  });

  if (!hasAllowedRole) {
    console.warn('Access denied: user roles =', roles, 'allowed roles =', allowedRoles);
    return <Navigate to="/unauthorized" />;
  }

  return <Outlet />;
};