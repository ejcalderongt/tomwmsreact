// src/routes/PrivateRoute.tsx

import { Navigate, Outlet } from "react-router-dom";
import { getToken } from "@/utils/auth";

const PrivateRoute = () => {
  const token = getToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
