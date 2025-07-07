import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { CubeIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { getUser } from '@/utils/auth';
import toast from 'react-hot-toast';

interface Stock {
  id: number;
  producto: string;
  cantidad: number;
  ubicacion: string;
  lote: string;
  fechaVencimiento: string;
}

function Existencias() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const user = getUser();

  useEffect(() => {
    document.title = 'TOMWMSUX - Existencias';
    // Simular carga de datos
    setTimeout(() => {
      setStocks([
        {
          id: 1,
          producto: 'Producto A',
          cantidad: 150,
          ubicacion: 'A-01-01',
          lote: 'LOT001',
          fechaVencimiento: '2024-12-31'
        },
        {
          id: 2,
          producto: 'Producto B',
          cantidad: 75,
          ubicacion: 'B-02-03',
          lote: 'LOT002',
          fechaVencimiento: '2024-11-15'
        },
        {
          id: 3,
          producto: 'Producto C',
          cantidad: 200,
          ubicacion: 'C-01-05',
          lote: 'LOT003',
          fechaVencimiento: '2025-03-20'
        }
      ]);
      setLoading(false);
      toast.success('Datos de existencias cargados correctamente');
    }, 1000);
  }, []);

  const filteredStocks = stocks.filter(stock =>
    stock.producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.ubicacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.lote.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CubeIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Existencias</h1>
              <p className="text-gray-600">Gestión de inventario y stock disponible</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por producto, ubicación o lote..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Welcome message */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-sm p-6 text-white">
          <h2 className="text-xl font-semibold mb-2">¡Bienvenido, {user.username}!</h2>
          <p className="opacity-90">Tienes acceso completo al sistema de gestión de inventarios</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CubeIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Productos</p>
                <p className="text-2xl font-bold text-gray-900">{stocks.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CubeIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Stock Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stocks.reduce((sum, stock) => sum + stock.cantidad, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <CubeIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ubicaciones</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(stocks.map(s => s.ubicacion)).size}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Lista de Existencias ({filteredStocks.length})
            </h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Cargando existencias...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ubicación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lote
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vencimiento
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStocks.map((stock) => (
                    <tr key={stock.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {stock.producto}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          stock.cantidad > 100 
                            ? 'bg-green-100 text-green-800' 
                            : stock.cantidad > 50 
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {stock.cantidad}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stock.ubicacion}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stock.lote}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stock.fechaVencimiento}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Existencias;