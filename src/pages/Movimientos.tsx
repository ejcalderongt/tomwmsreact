
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { movimientosAPI, bodegasAPI } from '@/api/api';
import { getToken, getUser } from '@/utils/auth';
import toast from 'react-hot-toast';
import { ArrowsRightLeftIcon, MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface Movimiento {
  propietario?: string;
  producto?: string;
  poliza?: string;
  presentacion?: string;
  estadoOrigen?: string;
  estadoDestino?: string;
  umBas?: string;
  cantidad?: number;
  peso?: number;
  lote?: string;
  ubicOrigen?: string;
  ubicDestino?: string;
  tipoTarea?: string;
  fecha?: string;
  idProducto?: number;
  codigo?: string;
  codigoBarra?: string;
  idTipoTarea?: number;
  contabilizar?: boolean;
  fecha_vence?: string;
  idTipoActualizacionCosto?: number;
  idPresentacion?: number;
  idUnidadMedida?: number;
  idEstadoOrigen?: number;
  idProductoBodega?: number;
  idPropietarioBodega?: number;
  idBodega?: number;
  licencia?: string;
  clasificacion?: string;
  familia?: string;
  idBodegaOrigen?: number;
  idBodegaDestino?: number;
  codigo_Bodega_Destino?: string;
  nombre_Bodega_Destino?: string;
  idMovimiento?: number;
  codigo_Bodega_Origen?: string;
  nombre_Bodega_Origen?: string;
  nombreArea?: string;
  factor?: number;
  idTicketTMS?: string;
  operador?: string;
  idUbicacionDestino?: number;
  idUbicacionOrigen?: number;
  idPropietario?: number;
}

interface Bodega {
  idBodega: number;
  nombre: string;
}

function Movimientos() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingBodegas, setLoadingBodegas] = useState(true);
  const [bodegaSeleccionada, setBodegaSeleccionada] = useState<number>(0);
  const loadingRef = useRef(false);
  const [fechaInicio, setFechaInicio] = useState(() => {
    // Default to first day of current month
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return firstDay.toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState(() => {
    // Default to today
    return new Date().toISOString().split('T')[0];
  });
  const [busqueda, setBusqueda] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'TOMWMSUX - Movimientos';
    cargarBodegas();
  }, []);

  useEffect(() => {
    // Only load movements after bodegas are loaded and when user explicitly searches
    // Remove automatic loading to prevent infinite requests
    if (!loadingBodegas && movimientos.length === 0) {
      // Only auto-load on initial mount, not on every filter change
      console.log('Auto-loading movements on initial mount');
      cargarMovimientos();
    }
  }, [loadingBodegas]); // Remove other dependencies to prevent auto-reload

  const cargarBodegas = async () => {
    setLoadingBodegas(true);
    try {
      const token = getToken();
      if (!token) {
        toast.error('No hay sesión activa');
        navigate('/login');
        return;
      }

      console.log('Cargando bodegas...');
      const data = await bodegasAPI.listar(token);
      console.log('Bodegas cargadas:', data);
      setBodegas(data || []);
    } catch (error) {
      console.error('Error cargando bodegas:', error);
      toast.error('Error al cargar las bodegas');
    } finally {
      setLoadingBodegas(false);
    }
  };

  const cargarMovimientos = async () => {
    if (loading || loadingRef.current) {
      console.log('Movimientos request blocked: already loading');
      return; // Prevent duplicate requests
    }
    
    console.log('Starting cargarMovimientos...');
    setLoading(true);
    loadingRef.current = true;
    
    try {
      const token = getToken();
      const userData = getUser();
      
      if (!token || !userData.propietario?.idPropietario) {
        toast.error('No hay sesión activa');
        navigate('/login');
        return;
      }

      const filtro = {
        idBodega: bodegaSeleccionada,
        idPropietario: userData.propietario.idPropietario,
        fechaInicio,
        fechaFin
      };

      console.log('Cargando movimientos con filtros:', filtro);
      const data = await movimientosAPI.listar(filtro, token);
      console.log('Movimientos cargados:', data);
      setMovimientos(data || []);
      
      if (!data || data.length === 0) {
        toast.info('No se encontraron movimientos para los filtros seleccionados');
      } else {
        toast.success(`${data.length} movimientos cargados`);
      }
    } catch (error) {
      console.error('Error cargando movimientos:', error);
      toast.error('Error al cargar los movimientos');
      setMovimientos([]);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const handleBuscar = () => {
    if (!loading && !loadingRef.current) {
      console.log('Manual search triggered');
      cargarMovimientos();
    } else {
      console.log('Search blocked: already loading');
    }
  };

  const formatDate = (dateString: string, includeTime: boolean = false) => {
    if (!dateString) return '-';
    
    // Handle null or empty dates
    const date = new Date(dateString);
    
    // Check if it's a valid date and not the default 1900-01-01
    if (isNaN(date.getTime()) || date.getFullYear() <= 1900) {
      return '-';
    }
    
    if (includeTime) {
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    }
  };

  const formatNumber = (value: number | undefined | null, decimales: number = 2): string => {
    if (value === null || value === undefined || isNaN(Number(value))) {
      return '-';
    }
    return Number(value).toLocaleString('es-ES', {
      minimumFractionDigits: decimales,
      maximumFractionDigits: decimales
    });
  };

  const formatBoolean = (value: boolean | undefined) => {
    if (value === undefined || value === null) return '-';
    return value ? 'Activo' : 'Inactivo';
  };

  const getBodegaNombre = (nombre: string | undefined, codigo: string | undefined): string => {
    if (!nombre && !codigo) return '-';
    if (codigo && nombre) return `${codigo} - ${nombre}`;
    return nombre || codigo || '-';
  };

  const getTipoTarea = (tipoTarea: string | undefined): string => {
    return tipoTarea || '-';
  };

  const getEstadoProducto = (estado: string | undefined): string => {
    return estado || '-';
  };

  // Filter movements based on search term
  const movimientosFiltrados = movimientos.filter(movimiento => {
    if (!busqueda) return true;
    const searchTerm = busqueda.toLowerCase();
    return (
      movimiento.idMovimiento?.toString().includes(searchTerm) ||
      movimiento.producto?.toLowerCase().includes(searchTerm) ||
      movimiento.operador?.toLowerCase().includes(searchTerm) ||
      movimiento.licencia?.toLowerCase().includes(searchTerm) ||
      movimiento.idTicketTMS?.toLowerCase().includes(searchTerm) ||
      movimiento.poliza?.toLowerCase().includes(searchTerm) ||
      movimiento.codigo?.toLowerCase().includes(searchTerm) ||
      movimiento.lote?.toLowerCase().includes(searchTerm) ||
      movimiento.nombre_Bodega_Origen?.toLowerCase().includes(searchTerm) ||
      movimiento.nombre_Bodega_Destino?.toLowerCase().includes(searchTerm)
    );
  });

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ArrowsRightLeftIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reporte de Movimientos</h1>
              <p className="text-gray-600">Consulta y seguimiento de movimientos de inventario</p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros de Búsqueda</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="bodega" className="block text-sm font-medium text-gray-700 mb-2">
                Bodega
              </label>
              <select
                id="bodega"
                value={bodegaSeleccionada}
                onChange={(e) => setBodegaSeleccionada(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loadingBodegas}
              >
                <option value={0}>Todas las bodegas</option>
                {bodegas.map((bodega) => (
                  <option key={bodega.idBodega} value={bodega.idBodega}>
                    {bodega.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="fechaInicio" className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Inicio
              </label>
              <input
                type="date"
                id="fechaInicio"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="fechaFin" className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Fin
              </label>
              <input
                type="date"
                id="fechaFin"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleBuscar}
                disabled={loading}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    <span>Buscando...</span>
                  </>
                ) : (
                  <>
                    <MagnifyingGlassIcon className="h-4 w-4" />
                    <span>Buscar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Búsqueda en tabla */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <h3 className="text-lg font-medium text-gray-900">
              Movimientos ({movimientosFiltrados.length})
            </h3>
            <div className="w-full sm:w-64">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar en resultados..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de movimientos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Cargando movimientos...</span>
            </div>
          ) : movimientos.length === 0 && !loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay movimientos</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Utiliza el botón "Buscar" para cargar movimientos con los filtros seleccionados
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID Movimiento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lote
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bodega Origen
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bodega Destino
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo Tarea
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Operador
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      UM Bas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Peso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Licencia
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Vence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado Origen
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado Destino
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ticket TMS
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Póliza
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ubicación Origen
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ubicación Destino
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {movimientosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={20} className="px-6 py-12 text-center text-gray-500">
                        No se encontraron movimientos que coincidan con la búsqueda
                      </td>
                    </tr>
                  ) : (
                    movimientosFiltrados.map((movimiento) => (
                      <tr key={movimiento.idMovimiento || Math.random()} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {movimiento.idMovimiento || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(movimiento.fecha || '', true)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {movimiento.producto || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {movimiento.codigo || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {movimiento.lote || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getBodegaNombre(movimiento.nombre_Bodega_Origen, movimiento.codigo_Bodega_Origen)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getBodegaNombre(movimiento.nombre_Bodega_Destino, movimiento.codigo_Bodega_Destino)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getTipoTarea(movimiento.tipoTarea)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {movimiento.operador || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatNumber(movimiento.cantidad)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {movimiento.umBas || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatNumber(movimiento.peso)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {movimiento.licencia || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(movimiento.fecha_vence || '', false)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getEstadoProducto(movimiento.estadoOrigen)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getEstadoProducto(movimiento.estadoDestino)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {movimiento.idTicketTMS || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {movimiento.poliza || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {movimiento.ubicOrigen || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {movimiento.ubicDestino || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Resumen */}
        {movimientosFiltrados.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Resumen</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {movimientosFiltrados.length}
                </div>
                <div className="text-sm text-blue-600">Total Movimientos</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">
                  {new Set(movimientosFiltrados.map(m => m.producto).filter(p => p != null)).size}
                </div>
                <div className="text-sm text-green-600">Productos Únicos</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-600">
                  {new Set(movimientosFiltrados.map(m => m.idBodegaOrigen).filter(id => id != null)).size}
                </div>
                <div className="text-sm text-gray-600">Bodegas Origen</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600">
                  {formatNumber(movimientosFiltrados.reduce((sum, m) => sum + (m.cantidad || 0), 0))}
                </div>
                <div className="text-sm text-purple-600">Total Cantidad</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Movimientos;
