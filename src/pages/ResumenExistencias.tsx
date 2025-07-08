
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { CubeIcon, BuildingStorefrontIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { existenciasAPI, bodegasAPI } from '@/api/api';
import { getToken, logout } from '@/utils/auth';

interface Existencia {
  idStock: number;
  codigo: string;
  nombre: string;
  unidadMedida: string;
  cantidad_UMBas: number;
  disponible_UMBas: number;
  cantidadReservadaUmBas: number;
  nombre_Completo: string;
  lote: string;
  fecha_vence: string;
  bodega: string;
  idBodega: number;
  presentacion: string;
  cantidad_Presentacion: number;
  disponible_Presentacion: number;
  cantidad_Reservada_Pres: number;
  costo: number;
  valor_total: number;
  nomEstado: string;
  marca: string;
  familia: string;
}

interface ResumenProducto {
  codigo: string;
  nombre: string;
  marca: string;
  familia: string;
  unidadMedida: string;
  presentacion: string;
  cantidad_UMBas_Total: number;
  disponible_UMBas_Total: number;
  cantidadReservadaUmBas_Total: number;
  cantidad_Presentacion_Total: number;
  disponible_Presentacion_Total: number;
  cantidad_Reservada_Pres_Total: number;
  costo_Promedio: number;
  valor_total_Total: number;
  bodegas: string[];
  ubicaciones: number;
  lotes: number;
}

interface Bodega {
  idBodega: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}

interface ExistenciasResponse {
  existencias: Existencia[];
  totalRegistros: number;
  paginaActual: number;
  totalPaginas: number;
}

function ResumenExistencias() {
  const navigate = useNavigate();
  const [existenciasDetalle, setExistenciasDetalle] = useState<Existencia[]>([]);
  const [resumenProductos, setResumenProductos] = useState<ResumenProducto[]>([]);
  const [filteredResumen, setFilteredResumen] = useState<ResumenProducto[]>([]);
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingBodegas, setLoadingBodegas] = useState(true);

  // Filtros
  const [bodegaSeleccionada, setBodegaSeleccionada] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    document.title = 'TOMWMSUX - Resumen de Existencias';
    cargarBodegas();
  }, []);

  useEffect(() => {
    if (bodegas.length > 0) {
      cargarExistencias();
    }
  }, [bodegas]);

  const cargarBodegas = async () => {
    setLoadingBodegas(true);
    try {
      const token = getToken();

      if (!token) {
        logout();
        navigate('/login', { replace: true });
        return;
      }

      const data = await bodegasAPI.listar(token);
      setBodegas(data || []);
    } catch (error) {
      console.error('Error al cargar bodegas:', error);
      
      if (error instanceof Error && (error.message.includes('401') || error.message.includes('403') || error.message.includes('Authentication failed'))) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      
      toast.error('Error al cargar las bodegas');
      setBodegas([]);
    } finally {
      setLoadingBodegas(false);
    }
  };

  const cargarExistencias = async () => {
    setLoading(true);
    
    try {
      const token = getToken();
      const idPropietario = parseInt(localStorage.getItem('wms_idPropietario') || '0');

      if (!token || !idPropietario) {
        logout();
        navigate('/login', { replace: true });
        return;
      }

      console.log('Cargando existencias con filtros:', { idBodega: bodegaSeleccionada, idPropietario });

      // Load all pages to get complete data for summary
      let todasExistencias: Existencia[] = [];
      let paginaActual = 1;
      let totalPaginas = 1;

      do {
        const filtro = {
          idBodega: bodegaSeleccionada,
          idPropietario,
          pagina: paginaActual,
          tamanoPagina: 100 // Use larger page size for efficiency
        };

        console.log(`Cargando página ${paginaActual} con filtro:`, filtro);
        const data: ExistenciasResponse = await existenciasAPI.listar(filtro, token);
        console.log(`Datos recibidos página ${paginaActual}:`, data);
        
        if (data && data.existencias && Array.isArray(data.existencias)) {
          todasExistencias = [...todasExistencias, ...data.existencias];
          totalPaginas = data.totalPaginas || 1;
        } else {
          console.warn('No se recibieron existencias válidas:', data);
          break;
        }
        
        paginaActual++;
        
      } while (paginaActual <= totalPaginas);

      console.log('Total existencias cargadas:', todasExistencias.length);
      setExistenciasDetalle(todasExistencias);
      
      if (todasExistencias.length > 0) {
        generarResumen(todasExistencias);
        toast.success(`Se procesaron ${todasExistencias.length} existencias para el resumen`);
      } else {
        setResumenProductos([]);
        setFilteredResumen([]);
        toast.info('No se encontraron existencias con los filtros seleccionados');
      }
    } catch (error) {
      console.error('Error al cargar existencias:', error);
      
      if (error instanceof Error && (error.message.includes('401') || error.message.includes('403') || error.message.includes('Authentication failed'))) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar las existencias';
      toast.error(`Error: ${errorMessage}`);
      setExistenciasDetalle([]);
      setResumenProductos([]);
      setFilteredResumen([]);
    } finally {
      setLoading(false);
    }
  };

  const generarResumen = (existencias: Existencia[]) => {
    const productosMap = new Map<string, ResumenProducto>();

    existencias.forEach(existencia => {
      const key = `${existencia.codigo}-${existencia.nombre}`;
      
      if (productosMap.has(key)) {
        const producto = productosMap.get(key)!;
        
        // Sum quantities
        producto.cantidad_UMBas_Total += existencia.cantidad_UMBas || 0;
        producto.disponible_UMBas_Total += existencia.disponible_UMBas || 0;
        producto.cantidadReservadaUmBas_Total += existencia.cantidadReservadaUmBas || 0;
        producto.cantidad_Presentacion_Total += existencia.cantidad_Presentacion || 0;
        producto.disponible_Presentacion_Total += existencia.disponible_Presentacion || 0;
        producto.cantidad_Reservada_Pres_Total += existencia.cantidad_Reservada_Pres || 0;
        producto.valor_total_Total += existencia.valor_total || 0;
        
        // Collect unique values
        if (existencia.bodega && !producto.bodegas.includes(existencia.bodega)) {
          producto.bodegas.push(existencia.bodega);
        }
        
        // Count unique locations and lots (simplified approach)
        producto.ubicaciones += 1;
        producto.lotes += 1;
        
      } else {
        // Create new product summary
        const nuevoProducto: ResumenProducto = {
          codigo: existencia.codigo || '',
          nombre: existencia.nombre || '',
          marca: existencia.marca || '',
          familia: existencia.familia || '',
          unidadMedida: existencia.unidadMedida || '',
          presentacion: existencia.presentacion || '',
          cantidad_UMBas_Total: existencia.cantidad_UMBas || 0,
          disponible_UMBas_Total: existencia.disponible_UMBas || 0,
          cantidadReservadaUmBas_Total: existencia.cantidadReservadaUmBas || 0,
          cantidad_Presentacion_Total: existencia.cantidad_Presentacion || 0,
          disponible_Presentacion_Total: existencia.disponible_Presentacion || 0,
          cantidad_Reservada_Pres_Total: existencia.cantidad_Reservada_Pres || 0,
          costo_Promedio: existencia.costo || 0,
          valor_total_Total: existencia.valor_total || 0,
          bodegas: existencia.bodega ? [existencia.bodega] : [],
          ubicaciones: 1,
          lotes: 1,
        };
        
        productosMap.set(key, nuevoProducto);
      }
    });

    // Calculate average cost
    productosMap.forEach(producto => {
      const existenciasProducto = existencias.filter(e => 
        e.codigo === producto.codigo && e.nombre === producto.nombre
      );
      
      const totalCosto = existenciasProducto.reduce((sum, e) => sum + (e.costo || 0), 0);
      producto.costo_Promedio = existenciasProducto.length > 0 ? totalCosto / existenciasProducto.length : 0;
    });

    const resumen = Array.from(productosMap.values());
    setResumenProductos(resumen);
    setFilteredResumen(resumen);
  };

  // Search filter function
  const filterResumen = (resumen: ResumenProducto[], term: string) => {
    if (!term.trim()) {
      return resumen;
    }
    
    const searchLower = term.toLowerCase().trim();
    return resumen.filter(producto => 
      producto.codigo?.toLowerCase().includes(searchLower) ||
      producto.nombre?.toLowerCase().includes(searchLower) ||
      producto.marca?.toLowerCase().includes(searchLower) ||
      producto.familia?.toLowerCase().includes(searchLower)
    );
  };

  // Apply search filter whenever searchTerm or resumenProductos changes
  useEffect(() => {
    const filtered = filterResumen(resumenProductos, searchTerm);
    setFilteredResumen(filtered);
  }, [searchTerm, resumenProductos]);

  const handleBodegaChange = (idBodega: number) => {
    setBodegaSeleccionada(idBodega);
    setTimeout(() => cargarExistencias(), 0);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const formatNumber = (value: number, precision: number = 2) => {
    if (value === null || value === undefined) return '';
    return value.toLocaleString('es-ES', { 
      minimumFractionDigits: precision, 
      maximumFractionDigits: precision 
    });
  };

  const getStockStatus = (cantidad: number) => {
    if (cantidad > 100) return 'bg-green-100 text-green-800';
    if (cantidad > 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CubeIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Resumen de Existencias</h1>
              <p className="text-gray-600">Consolidado de inventario por producto</p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-64">
              <label htmlFor="bodega" className="block text-sm font-medium text-gray-700 mb-2">
                <BuildingStorefrontIcon className="h-4 w-4 inline mr-1" />
                Bodega
              </label>
              <select
                id="bodega"
                value={bodegaSeleccionada}
                onChange={(e) => handleBodegaChange(parseInt(e.target.value))}
                disabled={loadingBodegas}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value={0}>Todas las bodegas</option>
                {bodegas.map((bodega) => (
                  <option key={bodega.idBodega} value={bodega.idBodega}>
                    {bodega.codigo} - {bodega.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-64">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                <MagnifyingGlassIcon className="h-4 w-4 inline mr-1" />
                Buscar Producto
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Código, nombre, marca o familia..."
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={cargarExistencias}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
              {loading ? 'Generando...' : 'Generar Resumen'}
            </button>
          </div>
        </div>

        {/* Information */}
        {filteredResumen.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>
                Mostrando {filteredResumen.length} productos consolidados
                {bodegaSeleccionada > 0 && (
                  <> en {bodegas.find(b => b.idBodega === bodegaSeleccionada)?.nombre}</>
                )}
                {searchTerm && (
                  <> (filtrados por: "{searchTerm}")</>
                )}
              </span>
              <span>Total registros detalle: {existenciasDetalle.length}</span>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Resumen de Productos ({filteredResumen.length})
            </h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Generando resumen...</span>
            </div>
          ) : filteredResumen.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron productos</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 
                    `No hay productos que coincidan con "${searchTerm}".` :
                    "No hay productos con los filtros seleccionados."
                  }
                </p>
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                  >
                    Limpiar búsqueda
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marca</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Familia</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UM</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total UMBas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Disp. UMBas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reservada</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Presentación</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Pres.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bodegas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicaciones</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lotes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Costo Prom.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredResumen.map((producto, index) => (
                    <tr key={`${producto.codigo}-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {producto.codigo}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {producto.nombre}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {producto.marca}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {producto.familia}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {producto.unidadMedida}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStockStatus(producto.cantidad_UMBas_Total)}`}>
                          {formatNumber(producto.cantidad_UMBas_Total, 2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(producto.disponible_UMBas_Total, 2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(producto.cantidadReservadaUmBas_Total, 2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {producto.presentacion}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(producto.cantidad_Presentacion_Total, 2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-32 truncate" title={producto.bodegas.join(', ')}>
                          {producto.bodegas.join(', ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {producto.ubicaciones}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {producto.lotes}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(producto.costo_Promedio, 2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(producto.valor_total_Total, 2)}
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

export default ResumenExistencias;
