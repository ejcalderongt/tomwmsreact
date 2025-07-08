import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  HomeIcon, 
  DocumentTextIcon, 
  CubeIcon, 
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline';
import { logout } from '@/utils/auth';
import toast from 'react-hot-toast';

interface LayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Existencias', href: '/existencias', icon: CubeIcon },
  { name: 'Ingresos', href: '/ingresos', icon: ArrowRightOnRectangleIcon },
  { name: 'Salidas', href: '/salidas', icon: ArrowLeftOnRectangleIcon },
];

function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada correctamente');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">TOMWMSUX</h1>
            <button onClick={() => setSidebarOpen(false)} className="text-gray-500 hover:text-gray-700">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {/* Reportes de Existencias */}
            <div className="space-y-1">
              <div className="px-4 py-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Reportes de Existencias
                </p>
              </div>
              <a
                href="/existencias"
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  location.pathname === '/existencias'
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <CubeIcon className="mr-3 h-6 w-6" />
                Detalle
              </a>
              <a
                href="/resumen-existencias"
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  location.pathname === '/resumen-existencias'
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <CubeIcon className="mr-3 h-6 w-6" />
                Resumen
              </a>
            </div>

            {/* Other Navigation Items - excluding Existencias since it's already in the reports section */}
            {navigation.filter(item => item.name !== 'Existencias').map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                  <item.icon className="mr-3 h-6 w-6" />
                  {item.name}
                </Link>
              );
            })}
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
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white border-r border-gray-200">
          <div className="flex h-16 items-center justify-center border-b border-gray-200 bg-blue-600">
            <h1 className="text-xl font-bold text-white">TOMWMSUX</h1>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {/* Reportes de Existencias */}
            <div className="space-y-1">
              <div className="px-4 py-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Reportes de Existencias
                </p>
              </div>
              <a
                href="/existencias"
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  location.pathname === '/existencias'
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <CubeIcon className="mr-3 h-6 w-6" />
                Detalle
              </a>
              <a
                href="/resumen-existencias"
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  location.pathname === '/resumen-existencias'
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <CubeIcon className="mr-3 h-6 w-6" />
                Resumen
              </a>
            </div>

            {/* Other Navigation Items - excluding Existencias since it's already in the reports section */}
            {navigation.filter(item => item.name !== 'Existencias').map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="mr-3 h-6 w-6" />
                  {item.name}
                </Link>
              );
            })}
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
      <div className="lg:pl-64">
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
                Sistema de Gestión de Inventarios
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