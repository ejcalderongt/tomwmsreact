
// src/App.tsx

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "@/pages/Login";
import Ingresos from "@/pages/Ingresos";
import Existencias from "@/pages/Existencias";
import Salidas from "@/pages/Salidas";
import SessionExpired from "@/pages/SessionExpired";
import DetalleDocumentoIngreso from "@/pages/DetalleDocumentoIngreso";
import Index from "@/index";
import PrivateRoute from "@/routes/PrivateRoute";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/session-expired" element={<SessionExpired />} />

        <Route element={<PrivateRoute />}>
          <Route path="/" element={<Index />} />
          <Route path="/existencias" element={<Existencias />} />
          <Route path="/ingresos" element={<Ingresos />} />
          <Route path="/salidas" element={<Salidas />} />
          <Route path="/ingresos/detalle/:IdOrdenCompraEnc" element={<DetalleDocumentoIngreso />} />
        </Route>

        <Route path="*" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
