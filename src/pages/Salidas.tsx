
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { CalendarDaysIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { salidasAPI } from '@/api/api';
import { formatDateToDisplay, formatDateFromInput } from '@/utils/auth';

interface DocumentoSalida {
  correlativo: number;
  bodega: string;
  propietario: string;
  cliente: string;
  tipoDocumento: string;
  estado: string;
  noDocumento: number;
  referencia: string;
  fecha: string;
  fechaPedido: string;
  noDocumentoExterno: string;
  activo: boolean;
  enviadoAErp: boolean;
  idDespachoEnc: number;
  idPickingEnc: number;
  anulado: boolean;
}

function Salidas() {
  const navigate = useNavigate();
  const [documentos, setDocumentos] = useState<DocumentoSalida[]>([]);
  const [loading, setLoading] = useState(false);
  const [fechaInicio, setFechaInicio] = useState(() => {
    // Try to restore from localStorage first
    const saved = localStorage.getItem('salidas_fechaInicio');
    if (saved) return saved;
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return firstDay.toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState(() => {
    // Try to restore from localStorage first
    const saved = localStorage.getItem('salidas_fechaFin');
    if (saved) return saved;
    return new Date().toISOString().split('T')[0];
  });
  
  // Estados para mostrar las fechas en formato dd/MM/YYYY
  const [fechaInicioDisplay, setFechaInicioDisplay] = useState(() => {
    const saved = localStorage.getItem('salidas_fechaInicio');
    if (saved) return formatDateFromInput(saved);
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return formatDateToDisplay(firstDay.toISOString().split('T')[0]);
  });
  const [fechaFinDisplay, setFechaFinDisplay] = useState(() => {
    const saved = localStorage.getItem('salidas_fechaFin');
    if (saved) return formatDateFromInput(saved);
    return formatDateToDisplay(new Date().toISOString().split('T')[0]);
  });

  // Paginación básica
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 50;
  
  // Calcular índices para paginación
  const indexInicio = (paginaActual - 1) * itemsPorPagina;
  const indexFin = indexInicio + itemsPorPagina;
  const totalPaginas = Math.ceil(documentos.length / itemsPorPagina);
  const documentosPaginados = documentos.slice(indexInicio, indexFin);

  useEffect(() => {
    document.title = 'TOMWMSUX - Salidas';
    // Try to restore previous results from localStorage
    const savedDocumentos = localStorage.getItem('salidas_documentos');
    if (savedDocumentos) {
      try {
        const parsedDocumentos = JSON.parse(savedDocumentos);
        setDocumentos(parsedDocumentos);
      } catch (error) {
        console.error('Error parsing saved documentos:', error);
        cargarDocumentos();
      }
    } else {
      cargarDocumentos();
    }
  }, []);

  const cargarDocumentos = async () => {
    setPaginaActual(1); // Resetear a la primera página
    setLoading(true);
    try {
      const token = localStorage.getItem('wms_token') || localStorage.getItem('token') || '';
      const idPropietario = parseInt(localStorage.getItem('wms_idPropietario') || '0');
      
      if (!token || !idPropietario) {
        toast.error('No se encontró información de autenticación');
        navigate('/login');
        return;
      }

      const filtro = {
        fechaInicio,
        fechaFin,
        idBodega: 0, // 0 para todas las bodegas
        idPropietario
      };

      console.log('Cargando documentos de salida con filtro:', filtro);
      const data = await salidasAPI.listarDocumentos(filtro, token);
      console.log('Documentos de salida cargados:', data);
      
      setDocumentos(data || []);
      
      // Save filter state and results to localStorage
      localStorage.setItem('salidas_fechaInicio', fechaInicio);
      localStorage.setItem('salidas_fechaFin', fechaFin);
      localStorage.setItem('salidas_documentos', JSON.stringify(data || []));
      
      if (!data || data.length === 0) {
        toast('No se encontraron documentos en el rango de fechas seleccionado', {
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
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (documento: DocumentoSalida) => {
    // Usar idDespachoEnc como identificador principal
    const id = documento.idDespachoEnc;
    if (id) {
      navigate(`/salidas/detalle/${id}`);
    } else {
      toast.error('No se pudo obtener el ID del documento');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatBoolean = (value: boolean) => {
    return value ? 'Sí' : 'No';
  };

  return (
    <Layout pageTitle="Documentos de Salida">
      <div className="space-y-6">
        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Inicio (DD/MM/YYYY)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fechaInicioDisplay}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFechaInicioDisplay(value);
                    const parts = value.split('/');
                    if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
                      const isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                      if (!isNaN(new Date(isoDate).getTime())) {
                        setFechaInicio(isoDate);
                      }
                    }
                  }}
                  placeholder="DD/MM/YYYY"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                <button
                  type="button"
                  onClick={() => (document.getElementById('fechaInicioHidden') as HTMLInputElement)?.showPicker?.()}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                <input
                  type="date"
                  id="fechaInicioHidden"
                  value={fechaInicio}
                  onChange={(e) => {
                    setFechaInicio(e.target.value);
                    setFechaInicioDisplay(formatDateFromInput(e.target.value));
                  }}
                  className="absolute opacity-0 w-0 h-0 pointer-events-none"
                />
              </div>
            </div>

            <div className="flex-1 min-w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Fin (DD/MM/YYYY)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fechaFinDisplay}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFechaFinDisplay(value);
                    const parts = value.split('/');
                    if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
                      const isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                      if (!isNaN(new Date(isoDate).getTime())) {
                        setFechaFin(isoDate);
                      }
                    }
                  }}
                  placeholder="DD/MM/YYYY"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                <button
                  type="button"
                  onClick={() => (document.getElementById('fechaFinHidden') as HTMLInputElement)?.showPicker?.()}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                <input
                  type="date"
                  id="fechaFinHidden"
                  value={fechaFin}
                  onChange={(e) => {
                    setFechaFin(e.target.value);
                    setFechaFinDisplay(formatDateFromInput(e.target.value));
                  }}
                  className="absolute opacity-0 w-0 h-0 pointer-events-none"
                />
              </div>
            </div>

            <div>
              <button
                onClick={cargarDocumentos}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CalendarDaysIcon className="h-4 w-4 mr-2" />
                {loading ? 'Cargando...' : 'Consultar'}
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 280px)' }}>
          <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
            <h3 className="text-lg font-medium text-gray-900">
              Documentos de Salida ({documentos.length})
            </h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              <span className="ml-2 text-gray-600">Cargando documentos...</span>
            </div>
          ) : documentos.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <DocumentArrowDownIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron documentos</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No hay documentos de salida en el rango de fechas seleccionado.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto overflow-x-auto" style={{ overflowX: 'auto', overflowY: 'auto' }}>
              <table className="min-w-full divide-y divide-gray-200" style={{ minWidth: '1200px' }}>
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correlativo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bodega</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo Documento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No. Documento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referencia</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enviado ERP</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activo</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documentosPaginados.map((documento, index) => (
                    <tr 
                      key={documento.correlativo || index} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleRowClick(documento)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {documento.correlativo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {documento.bodega}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {documento.cliente}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {documento.tipoDocumento}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          documento.estado === 'Despachado' 
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
                        {documento.referencia}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          documento.enviadoAErp 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {formatBoolean(documento.enviadoAErp)}
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

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Mostrando {indexInicio + 1} a {Math.min(indexFin, documentos.length)} de {documentos.length} documentos
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                    disabled={paginaActual === 1}
                    className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-2 text-sm text-gray-700">
                    Página {paginaActual} de {totalPaginas}
                  </span>
                  <button
                    onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                    disabled={paginaActual === totalPaginas}
                    className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Salidas;
