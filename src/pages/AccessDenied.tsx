import { Link } from 'react-router-dom';
import { firstAllowedRoute } from '@/config/portalPermissions';
import { getUser } from '@/utils/auth';

export default function AccessDenied() {
  return <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div className="rounded-lg bg-white p-8 shadow text-center">
      <h1 className="text-xl font-semibold">Sin acceso a esta opción</h1>
      <p className="mt-2 text-gray-600">Solicita el permiso al administrador de tu propietario.</p>
      <Link className="mt-5 inline-block text-blue-600" to={firstAllowedRoute(getUser())}>Volver al portal</Link>
    </div>
  </div>;
}
