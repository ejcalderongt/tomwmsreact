
import { Navigate, Outlet } from "react-router-dom";
import { isAuthenticated } from "@/utils/auth";

const PrivateRoute = () => {
  const authenticated = isAuthenticated();

  if (!authenticated) {
    console.log('User not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
