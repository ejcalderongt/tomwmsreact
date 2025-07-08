
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAuthenticated } from "@/utils/auth";

const PrivateRoute = () => {
  const authenticated = isAuthenticated();
  const location = useLocation();

  if (!authenticated) {
    console.log('User not authenticated, redirecting to login from:', location.pathname);
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
