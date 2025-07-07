import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Salida {
  id: number;
  documento: string;
  fecha: string;
  cliente: string;
  estado: string;
  total: number;
}

function Salidas() {
  const [salidas, setSalidas] = useState<Salida[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'TOMWMSUX - Salidas';
    // Simular carga de datos
    setTimeout(() => {
      setSalidas([
        {
          id: 1,
          documento: 'SAL-001',
          fecha: '2024-01-15',
          cliente: 'Cliente A',
          estado: 'Despachado',
          total: 12000
        },
        {
          id: 2,
          documento: 'SAL-002',
          fecha: '2024-01-16',
          cliente: 'Cliente B',
          estado: 'Preparando',
          total: 7500
        }
      ]);
      setLoading(false);
      toast.success('Datos de salidas cargados correctamente');
    }, 1000);
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <ArrowLeftOnRectangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Salidas</h1>
              <p className="text-gray-600">Gestión de documentos de salida</p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Documentos de Salida ({salidas.length})
            </h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              <span className="ml-2 text-gray-600">Cargando salidas...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Documento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {salidas.map((salida) => (
                    <tr key={salida.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {salida.documento}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {salida.fecha}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {salida.cliente}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          salida.estado === 'Despachado' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {salida.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${salida.total.toLocaleString()}
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

export default Salidas;