
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { movimientosAPI, bodegasAPI } from '@/api/api';
import { getToken, getUser } from '@/utils/auth';
import toast from 'react-hot-toast';
import { ArrowsRightLeftIcon, MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface Movimiento {
  idMovimiento?: number;
  idEmpresa?: number;
  idBodegaOrigen?: number;
  idBodegaDestino?: number;
  idTipoMovimiento?: number;
  fecha?: string;
  observaciones?: string;
  activo?: boolean;
  usuario?: string;
  fechaCreacion?: string;
  fechaAgr?: string;
  lic_plate?: string;
  fecha_vence?: string;
  idProductoEstado?: number;
  peso?: number;
  ticket?: string;
  poliza?: string;
  idUnidadMedida?: number;
  cantidad?: number;
  // Add more properties as needed based on API response
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
    // Only load movements after bodegas are loaded
    if (!loadingBodegas) {
      cargarMovimientos();
    }
  }, [loadingBodegas, bodegaSeleccionada, fechaInicio, fechaFin]);

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
    if (loading || loadingRef.current) return; // Prevent duplicate requests
    
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
    if (!loading) {
      cargarMovimientos();
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    
    // Handle null or empty dates
    const date = new Date(dateString);
    
    // Check if it's a valid date and not the default 1900-01-01
    if (isNaN(date.getTime()) || date.getFullYear() <= 1900) {
      return '-';
    }
    
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const getBodegaNombre = (idBodega: number | undefined): string => {
    if (!idBodega) return '-';
    const bodega = bodegas.find(b => b.idBodega === idBodega);
    return bodega ? bodega.nombre : `Bodega ${idBodega}`;
  };

  const getTipoMovimiento = (idTipo: number | undefined): string => {
    if (!idTipo) return '-';
    // You can expand this mapping based on your business logic
    const tipos: { [key: number]: string } = {
      1: 'Ingreso',
      2: 'Salida',
      3: 'Transferencia',
      4: 'Ajuste',
      5: 'Inventario'
    };
    return tipos[idTipo] || `Tipo ${idTipo}`;
  };

  const getEstadoProducto = (idEstado: number | undefined): string => {
    if (!idEstado) return '-';
    // You can expand this mapping based on your business logic
    const estados: { [key: number]: string } = {
      1: 'Buen Estado',
      2: 'Dañado',
      3: 'Vencido',
      4: 'Cuarentena'
    };
    return estados[idEstado] || `Estado ${idEstado}`;
  };

  // Filter movements based on search term
  const movimientosFiltrados = movimientos.filter(movimiento => {
    if (!busqueda) return true;
    const searchTerm = busqueda.toLowerCase();
    return (
      movimiento.idMovimiento?.toString().includes(searchTerm) ||
      movimiento.observaciones?.toLowerCase().includes(searchTerm) ||
      movimiento.usuario?.toLowerCase().includes(searchTerm) ||
      movimiento.lic_plate?.toLowerCase().includes(searchTerm) ||
      movimiento.ticket?.toLowerCase().includes(searchTerm) ||
      movimiento.poliza?.toLowerCase().includes(searchTerm) ||
      getBodegaNombre(movimiento.idBodegaOrigen).toLowerCase().includes(searchTerm) ||
      getBodegaNombre(movimiento.idBodegaDestino).toLowerCase().includes(searchTerm)
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
                      Bodega Origen
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bodega Destino
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo Movimiento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
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
                      Lic Plate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Vence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ticket
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Agr
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Póliza
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Observaciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {movimientosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={17} className="px-6 py-12 text-center text-gray-500">
                        No se encontraron movimientos para los filtros seleccionados
                      </td>
                    </tr>
                  ) : (
                    movimientosFiltrados.map((movimiento) => (
                      <tr key={movimiento.idMovimiento || Math.random()} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {movimiento.idMovimiento || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(movimiento.fecha || '')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getBodegaNombre(movimiento.idBodegaOrigen)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getBodegaNombre(movimiento.idBodegaDestino)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getTipoMovimiento(movimiento.idTipoMovimiento)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {movimiento.usuario || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatNumber(movimiento.cantidad)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {movimiento.idUnidadMedida || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatNumber(movimiento.peso)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {movimiento.lic_plate || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(movimiento.fecha_vence || '')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getEstadoProducto(movimiento.idProductoEstado)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {movimiento.ticket || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(movimiento.fechaAgr || '')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {movimiento.poliza || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            movimiento.activo 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {formatBoolean(movimiento.activo)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {movimiento.observaciones || '-'}
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
                  {movimientosFiltrados.filter(m => m.activo).length}
                </div>
                <div className="text-sm text-green-600">Movimientos Activos</div>
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
