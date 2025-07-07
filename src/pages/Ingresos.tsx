
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { ArrowRightOnRectangleIcon, MagnifyingGlassIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { ingresosAPI, DocumentoIngresoFiltro } from '@/api/api';
import { useNavigate } from 'react-router-dom';

interface DocumentoIngreso {
  codigo: string;
  bodega: string;
  propietario: string;
  proveedor: string;
  tipoIngreso: string;
  estado: string;
  noDocumento: string;
  referencia: string;
  procedencia: string;
  fecha: string;
  es_devolucion: boolean;
  enviado_A_ERP: boolean;
  noPoliza: string;
  noOrden: string;
  no_Documento_Recepcion_ERP: string;
  no_Documento_Devolucion: string;
  no_Documento_Ubicacion_ERP: string;
  no_Ticket_TMS: string;
  no_Marchamo: string;
  activo: boolean;
}

function Ingresos() {
  const [documentos, setDocumentos] = useState<DocumentoIngreso[]>([]);
  const [loading, setLoading] = useState(false);
  const [fechaInicio, setFechaInicio] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'TOMWMSUX - Ingresos';
    // Cargar datos iniciales
    cargarDocumentosIngreso();
  }, []);

  const cargarDocumentosIngreso = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      if (!token || !user) {
        toast.error('No hay sesión activa');
        return;
      }

      const userData = JSON.parse(user);
      const idPropietario = userData.propietario?.idPropietario || 1;

      const filtro: DocumentoIngresoFiltro = {
        fechaInicio,
        fechaFin,
        idBodega: 0,
        idPropietario
      };

      const data = await ingresosAPI.listarDocumentos(filtro, token);
      setDocumentos(data || []);
      toast.success(`${data?.length || 0} documentos cargados correctamente`);
    } catch (error) {
      console.error('Error al cargar documentos:', error);
      toast.error('Error al cargar los documentos de ingreso');
      setDocumentos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltrar = () => {
    if (!fechaInicio || !fechaFin) {
      toast.error('Por favor seleccione las fechas de inicio y fin');
      return;
    }
    
    if (new Date(fechaInicio) > new Date(fechaFin)) {
      toast.error('La fecha de inicio debe ser menor o igual a la fecha fin');
      return;
    }

    cargarDocumentosIngreso();
  };

  const handleRowClick = (documento: DocumentoIngreso) => {
    if (documento.codigo) {
      navigate(`/documentos-ingreso/detalle/${documento.codigo}`);
    } else {
      toast.error('ID no disponible');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const formatBoolean = (value: boolean) => {
    return value ? 'Sí' : 'No';
  };

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
              <h1 className="text-2xl font-bold text-gray-900">Documentos de Ingreso</h1>
              <p className="text-gray-600">Gestión de documentos de ingreso</p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-48">
              <label htmlFor="fechaInicio" className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Inicio
              </label>
              <input
                type="date"
                id="fechaInicio"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            
            <div className="flex-1 min-w-48">
              <label htmlFor="fechaFin" className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Fin
              </label>
              <input
                type="date"
                id="fechaFin"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            
            <div>
              <button
                onClick={handleFiltrar}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                {loading ? 'Filtrando...' : 'Filtrar'}
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              Documentos de Ingreso ({documentos.length})
            </h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <span className="ml-2 text-gray-600">Cargando documentos...</span>
            </div>
          ) : documentos.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <DocumentArrowDownIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron documentos</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No hay documentos de ingreso en el rango de fechas seleccionado.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bodega</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo Ingreso</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No. Documento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No. Orden</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enviado ERP</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activo</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documentos.map((documento, index) => (
                    <tr 
                      key={documento.codigo || index} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleRowClick(documento)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {documento.codigo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {documento.bodega}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {documento.proveedor}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {documento.tipoIngreso}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          documento.estado === 'Completado' 
                            ? 'bg-green-100 text-green-800' 
                            : documento.estado === 'Pendiente'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {documento.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {documento.noDocumento}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(documento.fecha)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {documento.noOrden}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          documento.enviado_A_ERP 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {formatBoolean(documento.enviado_A_ERP)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          documento.activo 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {formatBoolean(documento.activo)}
                        </span>
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
