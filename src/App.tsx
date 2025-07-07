import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "@/pages/Login";
import Ingresos from "@/pages/Ingresos";
import DetalleDocumentoIngreso from "@/pages/DetalleDocumentoIngreso";
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
          <Route path="/documentos-ingreso/detalle/:IdOrdenCompraEnc" element={<DetalleDocumentoIngreso />} />
          <Route path="/salidas" element={<Salidas />} />
          <Route path="/existencias" element={<Existencias />} />
        </Route>

        {/* Ruta fallback */}
        <Route path="*" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;