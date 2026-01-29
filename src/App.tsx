import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Existencias from '@/pages/Existencias';
import ResumenExistencias from '@/pages/ResumenExistencias';
import Ingresos from '@/pages/Ingresos';
import Salidas from '@/pages/Salidas';
import DetalleDocumentoIngreso from '@/pages/DetalleDocumentoIngreso';
import DetalleDocumentoSalida from '@/pages/DetalleDocumentoSalida';
import Movimientos from '@/pages/Movimientos';
import InventarioEnLinea from '@/pages/InventarioEnLinea';
import KPIPicking from '@/pages/KPIPicking';
import KPIVerificacion from '@/pages/KPIVerificacion';
import KPIRecepcion from '@/pages/KPIRecepcion';
import KPIDespacho from '@/pages/KPIDespacho';
import SessionExpired from '@/pages/SessionExpired';
import CambiarPassword from '@/pages/CambiarPassword';
import NewPassword from '@/pages/NewPassword';
import PrivateRoute from '@/components/PrivateRoute';
import AuthWatcher from '@/components/AuthWatcher';
import ToastProvider from '@/components/ToastProvider';

function App() {
  return (
    <Router>
      <ToastProvider />
      <AuthWatcher />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/session-expired" element={<SessionExpired />} />
        <Route path="/cambiar-password" element={<CambiarPassword />} />
        <Route path="/new-password" element={<NewPassword />} />
        <Route path="/dashboard" element={<PrivateRoute />}>
          <Route index element={<Dashboard />} />
        </Route>
        <Route path="/existencias" element={<PrivateRoute />}>
          <Route index element={<Existencias />} />
        </Route>
        <Route path="/resumen-existencias" element={<PrivateRoute />}>
          <Route index element={<ResumenExistencias />} />
        </Route>
        <Route path="/ingresos" element={<PrivateRoute />}>
          <Route index element={<Ingresos />} />
        </Route>
        <Route path="/salidas" element={<PrivateRoute />}>
          <Route index element={<Salidas />} />
        </Route>
        <Route path="/detalle-ingreso/:id" element={<PrivateRoute />}>
          <Route index element={<DetalleDocumentoIngreso />} />
        </Route>
        <Route path="/detalle-salida/:id" element={<PrivateRoute />}>
          <Route index element={<DetalleDocumentoSalida />} />
        </Route>
        <Route path="/movimientos" element={<PrivateRoute />}>
          <Route index element={<Movimientos />} />
        </Route>
        <Route path="/inventario-en-linea" element={<PrivateRoute />}>
          <Route index element={<InventarioEnLinea />} />
        </Route>
        <Route path="/kpi-picking" element={<PrivateRoute />}>
          <Route index element={<KPIPicking />} />
        </Route>
        <Route path="/kpi-verificacion" element={<PrivateRoute />}>
          <Route index element={<KPIVerificacion />} />
        </Route>
        <Route path="/kpi-recepcion" element={<PrivateRoute />}>
          <Route index element={<KPIRecepcion />} />
        </Route>
        <Route path="/kpi-despacho" element={<PrivateRoute />}>
          <Route index element={<KPIDespacho />} />
        </Route>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;