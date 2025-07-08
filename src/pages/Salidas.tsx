
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { ArrowLeftOnRectangleIcon, CalendarIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { getUser } from '@/utils/auth';
import { salidasAPI } from '@/api/api';
import toast from 'react-hot-toast';

interface DocumentoSalida {
  idOrdenCompraEnc: number;
  numeroOC: string;
  fechaOC: string;
  proveedor: string;
  estado: string;
  total: number;
}

function Salidas() {
  const [salidas, setSalidas] = useState<DocumentoSalida[]>([]);
  const [loading, setLoading] = useState(false);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [aplicandoFiltros, setAplicandoFiltros] = useState(false);
  
  const user = getUser();

  useEffect(() => {
    document.title = 'TOMWMSUX - Salidas';
    
    // Establecer fechas por defecto (último mes)
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30);
    
    setFechaInicio(hace30Dias.toISOString().split('T')[0]);
    setFechaFin(hoy.toISOString().split('T')[0]);
  }, []);

  // Cargar documentos automáticamente cuando se establecen las fechas
  useEffect(() => {
    if (fechaInicio && fechaFin && user.idPropietario) {
      cargarDocumentos();
    }
  }, [fechaInicio, fechaFin]);

  const cargarDocumentos = async () => {
    if (!fechaInicio || !fechaFin) {
      toast.error('Por favor selecciona ambas fechas');
      return;
    }

    if (!user.idPropietario) {
      toast.error('No se encontró el ID del propietario');
      return;
    }

    setLoading(true);
    setAplicandoFiltros(true);

    try {
      const filtro = {
        fechaInicio,
        fechaFin,
        idBodega: 0, // 0 para todas las bodegas
        idPropietario: user.idPropietario
      };

      const data = await salidasAPI.listarDocumentos(filtro, user.token);
      console.log('Respuesta salidas:', data);
      
      setSalidas(data || []);
      
      if (!data || data.length === 0) {
        toast('No se encontraron documentos de salida en el rango de fechas seleccionado', {
          icon: 'ℹ️',
          style: {
            background: '#3b82f6',
            color: '#fff'
          }
        });
      } else {
        toast.success(`Se cargaron ${data.length} documentos de salida`);
      }
    } catch (error) {
      console.error('Error al cargar documentos:', error);
      toast.error('Error al cargar los documentos de salida');
      setSalidas([]);
    } finally {
      setLoading(false);
      setAplicandoFiltros(false);
    }
  };

  const limpiarFiltros = () => {
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30);
    
    setFechaInicio(hace30Dias.toISOString().split('T')[0]);
    setFechaFin(hoy.toISOString().split('T')[0]);
    setSalidas([]);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <ArrowLeftOnRectangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Salidas</h1>
              <p className="text-gray-600">Gestión de documentos de salida</p>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-4">
              <FunnelIcon className="h-5 w-5 text-gray-500" />
              <h3 className="text-sm font-medium text-gray-700">Filtros de búsqueda</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Inicio
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Fin
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="flex items-end space-x-2">
                <button
                  onClick={cargarDocumentos}
                  disabled={aplicandoFiltros || !fechaInicio || !fechaFin}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {aplicandoFiltros ? 'Cargando...' : 'Buscar'}
                </button>
                
                <button
                  onClick={limpiarFiltros}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Limpiar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Welcome message */}
        <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-lg shadow-sm p-6 text-white">
          <h2 className="text-xl font-semibold mb-2">¡Bienvenido, {user.username}!</h2>
          <p className="opacity-90">Consulta tus documentos de salida y gestiona las entregas</p>
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
                  {salidas.map((salida) => (
                    <tr key={salida.idOrdenCompraEnc} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
                        {salida.numeroOC}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(salida.fechaOC).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {salida.proveedor}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          salida.estado === 'Despachado' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {salida.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${salida.total?.toLocaleString() || '0'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!loading && salidas.length === 0 && (
                <div className="text-center py-12">
                  <ArrowLeftOnRectangleIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No hay documentos</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {fechaInicio && fechaFin 
                      ? 'No se encontraron documentos de salida en el rango de fechas seleccionado.'
                      : 'Selecciona un rango de fechas para buscar documentos.'
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Salidas;
