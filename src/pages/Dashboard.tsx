
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { 
  CubeIcon, 
  DocumentTextIcon, 
  ArrowRightStartOnRectangleIcon,
  ArrowLeftStartOnRectangleIcon,
  ArrowsRightLeftIcon,
  ClipboardDocumentListIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';

interface MenuItem {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  route: string;
  color: string;
}

function Dashboard() {
  const navigate = useNavigate();

  const menuItems: MenuItem[] = [
    {
      title: 'Existencias',
      description: 'Consultar inventario y existencias por bodega',
      icon: CubeIcon,
      route: '/existencias',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'Inventario en Línea',
      description: 'Consulta de inventario en tiempo real',
      icon: BuildingStorefrontIcon,
      route: '/inventario-en-linea',
      color: 'bg-green-100 text-green-600'
    },
    {
      title: 'Resumen de Existencias',
      description: 'Vista consolidada de inventarios',
      icon: ClipboardDocumentListIcon,
      route: '/resumen-existencias',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      title: 'Ingresos',
      description: 'Documentos de ingreso a bodega',
      icon: ArrowRightStartOnRectangleIcon,
      route: '/ingresos',
      color: 'bg-emerald-100 text-emerald-600'
    },
    {
      title: 'Salidas',
      description: 'Documentos de salida de bodega',
      icon: ArrowLeftStartOnRectangleIcon,
      route: '/salidas',
      color: 'bg-red-100 text-red-600'
    },
    {
      title: 'Movimientos',
      description: 'Reporte de movimientos de inventario',
      icon: ArrowsRightLeftIcon,
      route: '/movimientos',
      color: 'bg-orange-100 text-orange-600'
    }
  ];

  const handleMenuClick = (route: string) => {
    navigate(route);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <img 
              src="/tom_wms.png" 
              alt="TOM WMS Logo" 
              className="w-20 h-20 object-contain mx-auto mb-4"
            />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">TOMWMSUX</h1>
            <p className="text-gray-600">Sistema de Administración de Bodegas</p>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-sm p-6 text-white">
          <h2 className="text-2xl font-semibold mb-2">¡Bienvenido al Sistema!</h2>
          <p className="text-blue-100">Selecciona una opción del menú para comenzar a trabajar</p>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item, index) => (
            <div
              key={index}
              onClick={() => handleMenuClick(item.route)}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer group hover:border-blue-300"
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${item.color} group-hover:scale-110 transition-transform`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Accesos Rápidos</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleMenuClick('/existencias')}
              className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left"
            >
              <div className="text-sm text-blue-600 font-medium">Consulta Rápida</div>
              <div className="text-lg font-semibold text-blue-900">Existencias</div>
            </button>
            <button
              onClick={() => handleMenuClick('/inventario-en-linea')}
              className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left"
            >
              <div className="text-sm text-green-600 font-medium">Tiempo Real</div>
              <div className="text-lg font-semibold text-green-900">Inventario</div>
            </button>
            <button
              onClick={() => handleMenuClick('/movimientos')}
              className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left"
            >
              <div className="text-sm text-purple-600 font-medium">Últimos</div>
              <div className="text-lg font-semibold text-purple-900">Movimientos</div>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;
