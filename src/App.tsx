import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "@/pages/Login";
import Ingresos from "@/pages/Ingresos";
import DetalleDocumentoIngreso from "@/pages/DetalleDocumentoIngreso";
import DetalleDocumentoSalida from "@/pages/DetalleDocumentoSalida";
import Existencias from "@/pages/Existencias";
import ResumenExistencias from "@/pages/ResumenExistencias";
import Movimientos from '@/pages/Movimientos';
import Salidas from "@/pages/Salidas";
import SessionExpired from "@/pages/SessionExpired";
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
          <Route path="/ingresos" element={<Ingresos />} />
          <Route path="/ingresos/detalle/:IdOrdenCompraEnc" element={<DetalleDocumentoIngreso />} />
          <Route path="/salidas" element={<Salidas />} />
          <Route path="/salidas/detalle/:IdDocumento" element={<DetalleDocumentoSalida />} />
          <Route path="/existencias" element={<Existencias />} />
          <Route path="/resumen-existencias" element={<ResumenExistencias />} />
          <Route path="/movimientos" element={<Movimientos />} />
        </Route>

        {/* Default route - redirect to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Ruta fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;