
// src/routes/PrivateRoute.tsx

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAuthenticated } from "@/utils/auth";

const PrivateRoute = () => {
  const location = useLocation();
  const authenticated = isAuthenticated();

  // Prevent infinite redirects by checking current location
  if (!authenticated && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  // If we're authenticated or already on login page, render normally
  return <Outlet />;
};

export default PrivateRoute;
