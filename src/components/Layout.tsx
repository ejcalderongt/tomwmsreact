import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  CubeIcon, 
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowLeftOnRectangleIcon,
  ChartBarIcon,
  WifiIcon,
  ClipboardDocumentCheckIcon,
  TruckIcon,
  PaperAirplaneIcon,
  ChartBarSquareIcon,
  PresentationChartBarIcon,
  ClockIcon,
  UsersIcon,
  CubeTransparentIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChartPieIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { logout } from '@/utils/auth';
import toast from 'react-hot-toast';

interface LayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
}

const indicadoresRoutes = [
  '/kpi-picking', '/kpi-verificacion', '/kpi-recepcion', '/kpi-despacho', '/kpi-tendencias',
  '/dashboard-ejecutivo', '/analisis-ciclo', '/productividad-operadores', '/abc-productos', '/analisis-merma',
  '/analisis-inventario', '/analisis-ubicaciones'
];

function Layout({ children, pageTitle }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [indicadoresOpen, setIndicadoresOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const isIndicadorActive = indicadoresRoutes.includes(location.pathname);

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada correctamente');
    navigate('/login');
  };

  const IndicadoresSubmenu = () => (
    <div className="ml-4 space-y-1">
      {/* KPIs Operativos */}
      <p className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase">KPIs Operativos</p>
      
      <Link
        to="/kpi-picking"
        className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
          location.pathname === '/kpi-picking'
            ? 'bg-blue-100 text-blue-900'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <ChartBarIcon className="mr-3 h-5 w-5" />
        KPI Picking
      </Link>

      <Link
        to="/kpi-verificacion"
        className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
          location.pathname === '/kpi-verificacion'
            ? 'bg-green-100 text-green-900'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <ClipboardDocumentCheckIcon className="mr-3 h-5 w-5" />
        KPI Verificación
      </Link>

      <Link
        to="/kpi-recepcion"
        className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
          location.pathname === '/kpi-recepcion'
            ? 'bg-cyan-100 text-cyan-900'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <TruckIcon className="mr-3 h-5 w-5" />
        KPI Recepción
      </Link>

      <Link
        to="/kpi-despacho"
        className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
          location.pathname === '/kpi-despacho'
            ? 'bg-purple-100 text-purple-900'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <PaperAirplaneIcon className="mr-3 h-5 w-5" />
        KPI Despacho
      </Link>

      <Link
        to="/kpi-tendencias"
        className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
          location.pathname === '/kpi-tendencias'
            ? 'bg-indigo-100 text-indigo-900'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <ChartBarSquareIcon className="mr-3 h-5 w-5" />
        KPI Tendencias
      </Link>

      {/* Análisis Avanzado */}
      <p className="px-4 py-1 mt-3 text-xs font-semibold text-gray-400 uppercase">Análisis Avanzado</p>

      <Link
        to="/dashboard-ejecutivo"
        className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
          location.pathname === '/dashboard-ejecutivo'
            ? 'bg-purple-100 text-purple-900'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <PresentationChartBarIcon className="mr-3 h-5 w-5" />
        Dashboard Ejecutivo
      </Link>

      <Link
        to="/analisis-ciclo"
        className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
          location.pathname === '/analisis-ciclo'
            ? 'bg-amber-100 text-amber-900'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <ClockIcon className="mr-3 h-5 w-5" />
        Análisis de Ciclo
      </Link>

      <Link
        to="/productividad-operadores"
        className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
          location.pathname === '/productividad-operadores'
            ? 'bg-teal-100 text-teal-900'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <UsersIcon className="mr-3 h-5 w-5" />
        Productividad Operadores
      </Link>

      <Link
        to="/abc-productos"
        className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
          location.pathname === '/abc-productos'
            ? 'bg-emerald-100 text-emerald-900'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <CubeTransparentIcon className="mr-3 h-5 w-5" />
        ABC Productos
      </Link>

      <Link
        to="/analisis-merma"
        className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
          location.pathname === '/analisis-merma'
            ? 'bg-rose-100 text-rose-900'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <ExclamationTriangleIcon className="mr-3 h-5 w-5" />
        Análisis de Merma
      </Link>

      <Link
        to="/analisis-inventario"
        className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
          location.pathname === '/analisis-inventario'
            ? 'bg-cyan-100 text-cyan-900'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <CubeIcon className="mr-3 h-5 w-5" />
        Análisis de Inventario
      </Link>

      <Link
        to="/analisis-ubicaciones"
        className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
          location.pathname === '/analisis-ubicaciones'
            ? 'bg-violet-100 text-violet-900'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <MapPinIcon className="mr-3 h-5 w-5" />
        Análisis de Ubicaciones
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-white shadow-xl overflow-y-auto">
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
            <Link to="/" className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer">
              TOMWMSUX
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="text-gray-500 hover:text-gray-700">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {/* Inventario en Línea */}
            <Link
              to="/inventario-en-linea"
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                location.pathname === '/inventario-en-linea'
                  ? 'bg-blue-100 text-blue-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <WifiIcon className="mr-3 h-6 w-6" />
              Inventario en Línea
            </Link>

            {/* Ingresos */}
            <Link
              to="/ingresos"
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                location.pathname === '/ingresos'
                  ? 'bg-blue-100 text-blue-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-6 w-6" />
              Ingresos
            </Link>

            {/* Salidas */}
            <Link
              to="/salidas"
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                location.pathname === '/salidas'
                  ? 'bg-blue-100 text-blue-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <ArrowLeftOnRectangleIcon className="mr-3 h-6 w-6" />
              Salidas
            </Link>

            {/* Indicadores - Menú colapsable */}
            <div className="pt-2">
              <button
                onClick={() => setIndicadoresOpen(!indicadoresOpen)}
                className={`w-full flex items-center justify-between px-4 py-2 text-sm font-medium rounded-md ${
                  isIndicadorActive
                    ? 'bg-indigo-100 text-indigo-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center">
                  <ChartPieIcon className="mr-3 h-6 w-6" />
                  Indicadores
                </div>
                {indicadoresOpen ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )}
              </button>
              
              {indicadoresOpen && <IndicadoresSubmenu />}
            </div>
          </nav>
          <div className="border-t border-gray-200 p-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-2 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md"
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-6 w-6" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white border-r border-gray-200 overflow-y-auto">
          <Link to="/" className="flex h-16 items-center justify-center border-b border-gray-200 bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer">
            <h1 className="text-xl font-bold text-white">TOMWMSUX</h1>
          </Link>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {/* Inventario en Línea */}
            <Link
              to="/inventario-en-linea"
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                location.pathname === '/inventario-en-linea'
                  ? 'bg-blue-100 text-blue-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <WifiIcon className="mr-3 h-6 w-6" />
              Inventario en Línea
            </Link>

            {/* Ingresos */}
            <Link
              to="/ingresos"
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                location.pathname === '/ingresos'
                  ? 'bg-blue-100 text-blue-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-6 w-6" />
              Ingresos
            </Link>

            {/* Salidas */}
            <Link
              to="/salidas"
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                location.pathname === '/salidas'
                  ? 'bg-blue-100 text-blue-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <ArrowLeftOnRectangleIcon className="mr-3 h-6 w-6" />
              Salidas
            </Link>

            {/* Indicadores - Menú colapsable */}
            <div className="pt-2">
              <button
                onClick={() => setIndicadoresOpen(!indicadoresOpen)}
                className={`w-full flex items-center justify-between px-4 py-2 text-sm font-medium rounded-md ${
                  isIndicadorActive
                    ? 'bg-indigo-100 text-indigo-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center">
                  <ChartPieIcon className="mr-3 h-6 w-6" />
                  Indicadores
                </div>
                {indicadoresOpen ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )}
              </button>
              
              {indicadoresOpen && <IndicadoresSubmenu />}
            </div>
          </nav>
          <div className="border-t border-gray-200 p-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-2 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md"
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-6 w-6" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Sistema de Gestión de Inventarios{pageTitle ? ` - ${pageTitle}` : ''}
              </h2>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;
