import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "@/pages/Login";
import Ingresos from "@/pages/Ingresos";
import DetalleDocumentoIngreso from "@/pages/DetalleDocumentoIngreso";
import DetalleDocumentoSalida from "@/pages/DetalleDocumentoSalida";
import Existencias from "@/pages/Existencias";
import Salidas from "@/pages/Salidas";
import SessionExpired from "@/pages/SessionExpired";
import Index from "@/index";
import PrivateRoute from "@/routes/PrivateRoute";
import ToastProvider from "@/components/ToastProvider";

function App() {
  return (
    <Router>
      {/* Global toast notifications */}
      <ToastProvider />

      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/session-expired" element={<SessionExpired />} />

        {/* Rutas protegidas */}
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<Index />} />
          <Route path="/ingresos" element={<Ingresos />} />
          <Route path="/ingresos/detalle/:IdOrdenCompraEnc" element={<PrivateRoute><DetalleDocumentoIngreso /></PrivateRoute>} />
          <Route path="/salidas" element={<PrivateRoute><Salidas /></PrivateRoute>} />
          <Route path="/salidas/detalle/:IdDocumento" element={<PrivateRoute><DetalleDocumentoSalida /></PrivateRoute>} />
          <Route path="/existencias" element={<PrivateRoute><Existencias /></PrivateRoute>} />
        </Route>

        {/* Ruta fallback */}
        <Route path="*" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;