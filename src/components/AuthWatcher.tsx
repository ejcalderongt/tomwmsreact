// src/components/AuthWatcher.tsx

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getToken, logout } from "@/utils/auth";

const AuthWatcher = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkToken = () => {
      const token = getToken();
      if (!token) {
        logout();
        alert("Tu sesión ha expirado. Por favor inicia sesión nuevamente.");
        navigate("/login", { replace: true });
      }
    };

    const interval = setInterval(checkToken, 10000); // cada 10 segundos
    return () => clearInterval(interval);
  }, [navigate]);

  return null;
};

export default AuthWatcher;
