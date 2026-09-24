
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getUser, isAuthenticated } from "@/utils/auth";
import { canAccessPath } from '@/config/portalPermissions';

const PrivateRoute = () => {
  const authenticated = isAuthenticated();
  const location = useLocation();

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!canAccessPath(location.pathname, getUser())) {
    return <Navigate to="/sin-acceso" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
