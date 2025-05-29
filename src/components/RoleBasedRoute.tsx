import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
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
  const location = useLocation();

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

  // If still loading, show nothing
  if (isLoading) {
    return null;
  }

  if (!user) {
    console.log('RoleBasedRoute - No user, redirecting to login');
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
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

  // Define role hierarchy and their default routes
  const roleHierarchy: { [key: string]: { routes: string[], defaultRoute: string } } = {
    'hr': {
      routes: ['hr', 'assessor', 'employee'],
      defaultRoute: '/hr/page-description'
    },
    'assessor': {
      routes: ['assessor', 'employee'],
      defaultRoute: '/assessor/page-description'
    },
    'employee': {
      routes: ['employee'],
      defaultRoute: '/page-description'
    }
  };

  // If user is on root path or home, redirect to their default route
  if (location.pathname === '/' || location.pathname === '/home') {
    const defaultRoute = roleHierarchy[primaryRole]?.defaultRoute || '/page-description';
    return <Navigate to={defaultRoute} replace />;
  }

  // Check if user has access to the current route
  const hasAllowedRole = roles.some(userRole => {
    if (!userRole) return false;
    const accessibleRoles = roleHierarchy[userRole]?.routes || [userRole];
    return allowedRoles.some(allowedRole => accessibleRoles.includes(allowedRole));
  });

  if (!hasAllowedRole) {
    console.warn('Access denied: user roles =', roles, 'allowed roles =', allowedRoles);
    // Redirect to unauthorized page
    return <Navigate to="/unauthorized" replace />;
  }

  // If user has access, render the route
  return <Outlet />;
};