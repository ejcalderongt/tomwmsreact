import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { ArrowRightOnRectangleIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Ingreso {
  id: number;
  documento: string;
  fecha: string;
  proveedor: string;
  estado: string;
  total: number;
}

function Ingresos() {
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'TOMWMSUX - Ingresos';
    // Simular carga de datos
    setTimeout(() => {
      setIngresos([
        {
          id: 1,
          documento: 'ING-001',
          fecha: '2024-01-15',
          proveedor: 'Proveedor A',
          estado: 'Completado',
          total: 15000
        },
        {
          id: 2,
          documento: 'ING-002',
          fecha: '2024-01-16',
          proveedor: 'Proveedor B',
          estado: 'Pendiente',
          total: 8500
        }
      ]);
      setLoading(false);
      toast.success('Datos de ingresos cargados correctamente');
    }, 1000);
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <ArrowRightOnRectangleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ingresos</h1>
              <p className="text-gray-600">Gestión de documentos de ingreso</p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Documentos de Ingreso ({ingresos.length})
            </h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <span className="ml-2 text-gray-600">Cargando ingresos...</span>
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
                      Proveedor
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
                  {ingresos.map((ingreso) => (
                    <tr key={ingreso.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {ingreso.documento}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ingreso.fecha}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ingreso.proveedor}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          ingreso.estado === 'Completado' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {ingreso.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${ingreso.total.toLocaleString()}
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

export default Ingresos;