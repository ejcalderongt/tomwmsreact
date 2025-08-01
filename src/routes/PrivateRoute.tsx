
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAuthenticated } from "@/utils/auth";

const PrivateRoute = () => {
  const authenticated = isAuthenticated();
  const location = useLocation();

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  // If user is authenticated and on root path, redirect to inventario-en-linea
  if (location.pathname === '/') {
    return <Navigate to="/inventario-en-linea" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
