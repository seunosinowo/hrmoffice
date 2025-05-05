import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface RoleBasedRouteProps {
  allowedRoles: string[];
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({ allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  const hasRequiredRole = user.roles.some(role => allowedRoles.includes(role));

  if (!hasRequiredRole) {
    // Redirect to a default route based on user's highest role
    if (user.roles.includes('hr')) {
      return <Navigate to="/hr/page-description" replace />;
    } else if (user.roles.includes('assessor')) {
      return <Navigate to="/assessor/dashboard" replace />;
    } else {
      return <Navigate to="/page-description" replace />;
    }
  }

  return <Outlet />;
};

export default RoleBasedRoute; 