
// src/components/AuthWatcher.tsx

import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { isAuthenticated, logout } from "@/utils/auth";

const AuthWatcher = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isCheckingRef = useRef(false);

  useEffect(() => {
    const checkToken = () => {
      // Prevent multiple simultaneous checks
      if (isCheckingRef.current) return;
      
      // Don't check if we're already on login page
      if (location.pathname === '/login') return;
      
      isCheckingRef.current = true;
      
      try {
        const authenticated = isAuthenticated();
        if (!authenticated) {
          logout();
          console.log("Session expired, redirecting to login");
          navigate("/login", { replace: true });
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
      } finally {
        isCheckingRef.current = false;
      }
    };

    const interval = setInterval(checkToken, 30000); // Check every 30 seconds instead of 10
    return () => clearInterval(interval);
  }, [navigate, location.pathname]);

  return null;
};

export default AuthWatcher;
