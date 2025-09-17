import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from '@/pages/Login';
import Existencias from '@/pages/Existencias';
import ResumenExistencias from '@/pages/ResumenExistencias';
import Ingresos from '@/pages/Ingresos';
import Salidas from '@/pages/Salidas';
import DetalleDocumentoIngreso from '@/pages/DetalleDocumentoIngreso';
import DetalleDocumentoSalida from '@/pages/DetalleDocumentoSalida';
import Movimientos from '@/pages/Movimientos';
import InventarioEnLinea from '@/pages/InventarioEnLinea';
import SessionExpired from '@/pages/SessionExpired';
import CambiarPassword from '@/pages/CambiarPassword';
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
        <Route path="/existencias" element={<PrivateRoute><Existencias /></PrivateRoute>} />
        <Route path="/resumen-existencias" element={<PrivateRoute><ResumenExistencias /></PrivateRoute>} />
        <Route path="/ingresos" element={<PrivateRoute><Ingresos /></PrivateRoute>} />
        <Route path="/salidas" element={<PrivateRoute><Salidas /></PrivateRoute>} />
        <Route path="/detalle-ingreso/:id" element={<PrivateRoute><DetalleDocumentoIngreso /></PrivateRoute>} />
        <Route path="/detalle-salida/:id" element={<PrivateRoute><DetalleDocumentoSalida /></PrivateRoute>} />
        <Route path="/movimientos" element={<PrivateRoute><Movimientos /></PrivateRoute>} />
        <Route path="/inventario-en-linea" element={<PrivateRoute><InventarioEnLinea /></PrivateRoute>} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;