// src/pages/SessionExpired.tsx

import { useEffect } from "react";
import { BrowserRouter as Router, useNavigate } from "react-router-dom";

function SessionExpiredContent() {
  const navigate = useNavigate();

  useEffect(() => {
    const timeout = setTimeout(() => {
      navigate("/login", { replace: true });
    }, 8000);
    return () => clearTimeout(timeout);
  }, [navigate]);

  const handleClick = () => {
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-red-100">
      <div className="bg-white p-8 rounded-xl shadow-md text-center max-w-md">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Sesión expirada</h2>
        <p className="text-gray-700 mb-2">Tu sesión ha expirado por inactividad.</p>
        <p className="text-gray-700 mb-6">Serás redirigido automáticamente al login o puedes hacerlo manualmente.</p>
        <button
          onClick={handleClick}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
        >
          Iniciar sesión nuevamente
        </button>
      </div>
    </div>
  );
}

function SessionExpired() {
  return (
    <Router>
      <SessionExpiredContent />
    </Router>
  );
}

export default SessionExpired;