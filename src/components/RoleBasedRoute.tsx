import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  const [isLoading, setIsLoading] = useState(true);
  const [cachedRoles, setCachedRoles] = useState<string[]>([]);

  // On component mount, check for cached roles
  useEffect(() => {
    const checkCachedRoles = () => {
      try {
        const cachedUserData = localStorage.getItem('hrmoffice_user_data');
        if (cachedUserData) {
          const parsedData = JSON.parse(cachedUserData);
          if (parsedData && parsedData.roles && Array.isArray(parsedData.roles)) {
            console.log('RoleBasedRoute - Found cached roles:', parsedData.roles);
            setCachedRoles(parsedData.roles);
          }
        }
      } catch (e) {
        console.error('RoleBasedRoute - Error parsing cached user data:', e);
      } finally {
        setIsLoading(false);
      }
    };

    checkCachedRoles();
  }, []);

  console.log('RoleBasedRoute - User:', user);
  console.log('RoleBasedRoute - Allowed roles:', allowedRoles);
  console.log('RoleBasedRoute - Cached roles:', cachedRoles);

  // If still loading, show nothing (or could add a loading spinner)
  if (isLoading) {
    return null;
  }

  if (!user) {
    console.log('RoleBasedRoute - No user, redirecting to login');
    return <Navigate to="/auth/login" />;
  }

  // Access roles directly from the user object, fallback to cached roles if available
  let userRoles = user.roles && user.roles.length > 0 ? user.roles :
              cachedRoles.length > 0 ? cachedRoles : ['employee'];

  // Ensure user has only one role based on hierarchy (HR > Assessor > Employee)
  let primaryRole = 'employee';
  if (userRoles.includes('hr')) {
    primaryRole = 'hr';
  } else if (userRoles.includes('assessor')) {
    primaryRole = 'assessor';
  }

  // Use only the primary role
  let roles = [primaryRole];

  console.log('RoleBasedRoute - All roles:', userRoles);
  console.log('RoleBasedRoute - Using primary role:', primaryRole);

  // Define role hierarchy - higher roles can access routes requiring lower roles
  const roleHierarchy: { [key: string]: string[] } = {
    'hr': ['hr', 'assessor', 'employee'], // HR can access HR, assessor, and employee routes
    'assessor': ['assessor', 'employee'],  // Assessors can access assessor and employee routes
    'employee': ['employee']               // Employees can only access employee routes
  };

  // Log the role hierarchy for debugging
  console.log('RoleBasedRoute - Role hierarchy:', roleHierarchy);

  // Special case: if the user has no roles but we're checking for employee access, grant it
  if (roles.length === 0 && allowedRoles.includes('employee')) {
    console.log('RoleBasedRoute - No roles but employee access requested, granting access');
    return <Outlet />;
  }

  // Special case: if the user has the 'hr' role, grant access to everything
  if (roles.includes('hr')) {
    console.log('RoleBasedRoute - User has HR role, granting access to all routes');
    return <Outlet />;
  }

  // Special case: if the user has the 'assessor' role and is trying to access assessor routes
  if (roles.includes('assessor') && (allowedRoles.includes('assessor') || allowedRoles.includes('employee'))) {
    console.log('RoleBasedRoute - User has Assessor role, granting access to assessor/employee routes');
    return <Outlet />;
  }

  // Special case: if the user has the 'employee' role and is trying to access employee routes
  if (roles.includes('employee') && allowedRoles.includes('employee')) {
    console.log('RoleBasedRoute - User has Employee role, granting access to employee routes');
    return <Outlet />;
  }

  // Check if user has any role that grants access to the required roles
  const hasAllowedRole = roles.some(userRole => {
    // Skip empty roles
    if (!userRole) {
      console.log('RoleBasedRoute - Empty role found, skipping');
      return false;
    }

    // Get all roles this user role has access to
    const accessibleRoles = roleHierarchy[userRole] || [userRole];
    console.log(`RoleBasedRoute - User role: ${userRole}, Accessible roles:`, accessibleRoles);

    // Check if any of the allowed roles are in the accessible roles
    const hasAccess = allowedRoles.some(allowedRole => accessibleRoles.includes(allowedRole));
    console.log(`RoleBasedRoute - Has access to ${allowedRoles.join(', ')}: ${hasAccess}`);

    return hasAccess;
  });

  if (!hasAllowedRole) {
    console.warn('Access denied: user roles =', roles, 'allowed roles =', allowedRoles);

    // Store the current URL in session storage so we can redirect back after login
    sessionStorage.setItem('redirectAfterLogin', window.location.pathname);

    return <Navigate to="/unauthorized" />;
  }

  console.log('RoleBasedRoute - Access granted');
  return <Outlet />;
};