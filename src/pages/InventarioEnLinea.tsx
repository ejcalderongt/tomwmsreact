
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { CubeIcon, BuildingStorefrontIcon, MagnifyingGlassIcon, WifiIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { existenciasAPI, bodegasAPI } from '@/api/api';
import { getToken, logout } from '@/utils/auth';

interface InventarioItem {
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

interface Bodega {
  idBodega: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}

interface InventarioResponse {
  existencias: InventarioItem[];
  totalRegistros: number;
  paginaActual: number;
  totalPaginas: number;
}

function InventarioEnLinea() {
  const navigate = useNavigate();
  const [inventario, setInventario] = useState<InventarioItem[]>([]);
  const [allInventario, setAllInventario] = useState<InventarioItem[]>([]);
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingBodegas, setLoadingBodegas] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Filtros
  const [bodegaSeleccionada, setBodegaSeleccionada] = useState<number>(() => {
    const saved = localStorage.getItem('inventario_online_bodegaSeleccionada');
    return saved ? parseInt(saved, 10) : 0;
  });
  
  const [searchTerm, setSearchTerm] = useState<string>(() => {
    const saved = localStorage.getItem('inventario_online_searchTerm');
    return saved || '';
  });

  // Paginación
  const [paginaActual, setPaginaActual] = useState(() => {
    const saved = localStorage.getItem('inventario_online_paginaActual');
    return saved ? parseInt(saved, 10) : 1;
  });
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const tamanoPagina = 50;

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    document.title = 'TOMWMSUX - Inventario en Línea';
    cargarBodegas();
  }, []);

  useEffect(() => {
    if (bodegas.length > 0) {
      // Try to restore previous results from localStorage first
      const savedInventario = localStorage.getItem('inventario_online_data');
      const savedTotalRegistros = localStorage.getItem('inventario_online_totalRegistros');
      const savedTotalPaginas = localStorage.getItem('inventario_online_totalPaginas');
      
      if (savedInventario && savedTotalRegistros && savedTotalPaginas && isOnline) {
        try {
          const parsedInventario = JSON.parse(savedInventario);
          setAllInventario(parsedInventario);
          setInventario(parsedInventario);
          setTotalRegistros(parseInt(savedTotalRegistros, 10));
          setTotalPaginas(parseInt(savedTotalPaginas, 10));
        } catch (error) {
          console.error('Error parsing saved inventario:', error);
          cargarInventario();
        }
      } else {
        cargarInventario();
      }
    }
  }, [bodegas, isOnline]);

  const cargarBodegas = async () => {
    if (!isOnline) {
      // Try to load from cache when offline
      const savedBodegas = localStorage.getItem('inventario_online_bodegas');
      if (savedBodegas) {
        try {
          setBodegas(JSON.parse(savedBodegas));
          setLoadingBodegas(false);
          return;
        } catch (error) {
          console.error('Error parsing cached bodegas:', error);
        }
      }
      toast.error('Sin conexión a internet. No se pueden cargar las bodegas.');
      setLoadingBodegas(false);
      return;
    }

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
      
      // Cache bodegas for offline use
      localStorage.setItem('inventario_online_bodegas', JSON.stringify(data || []));
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

  const cargarInventario = async () => {
    if (!isOnline) {
      toast.error('Sin conexión a internet. Mostrando datos en caché.');
      return;
    }

    setLoading(true);
    
    try {
      const token = getToken();
      const idPropietario = parseInt(localStorage.getItem('wms_idPropietario') || '0');

      if (!token || !idPropietario) {
        logout();
        navigate('/login', { replace: true });
        return;
      }

      const filtro = {
        idBodega: bodegaSeleccionada,
        idPropietario,
        pagina: paginaActual,
        tamanoPagina
      };

      const data: InventarioResponse = await existenciasAPI.listar(filtro, token);

      const inventarioData = data.existencias || [];
      setAllInventario(inventarioData);
      setInventario(inventarioData);
      setTotalRegistros(data.totalRegistros || 0);
      setTotalPaginas(data.totalPaginas || 1);
      setPaginaActual(data.paginaActual || 1);

      // Save data and filter state to localStorage
      localStorage.setItem('inventario_online_bodegaSeleccionada', bodegaSeleccionada.toString());
      localStorage.setItem('inventario_online_paginaActual', (data.paginaActual || 1).toString());
      localStorage.setItem('inventario_online_data', JSON.stringify(data.existencias || []));
      localStorage.setItem('inventario_online_totalRegistros', (data.totalRegistros || 0).toString());
      localStorage.setItem('inventario_online_totalPaginas', (data.totalPaginas || 1).toString());
      localStorage.setItem('inventario_online_searchTerm', searchTerm);

      if (!data.existencias || data.existencias.length === 0) {
        toast('No se encontraron items de inventario con los filtros seleccionados', {
          icon: 'ℹ️',
          style: {
            background: '#3b82f6',
            color: '#fff'
          }
        });
      } else {
        toast.success(`Se cargaron ${data.existencias.length} items de inventario`);
      }
    } catch (error) {
      console.error('Error al cargar inventario:', error);
      
      if (error instanceof Error && (error.message.includes('401') || error.message.includes('403') || error.message.includes('Authentication failed'))) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar el inventario';
      toast.error(`Error: ${errorMessage}`);
      setAllInventario([]);
      setInventario([]);
      setTotalRegistros(0);
      setTotalPaginas(1);
    } finally {
      setLoading(false);
    }
  };

  // Search filter function
  const filterInventario = (inventarioToFilter: InventarioItem[], term: string) => {
    if (!term.trim()) {
      return inventarioToFilter;
    }
    
    const searchLower = term.toLowerCase().trim();
    return inventarioToFilter.filter(item => 
      item.codigo?.toLowerCase().includes(searchLower) ||
      item.nombre?.toLowerCase().includes(searchLower) ||
      item.lote?.toLowerCase().includes(searchLower) ||
      item.nombre_Completo?.toLowerCase().includes(searchLower)
    );
  };

  // Apply search filter whenever searchTerm or allInventario changes
  useEffect(() => {
    const filtered = filterInventario(allInventario, searchTerm);
    setInventario(filtered);
  }, [searchTerm, allInventario]);

  const handleBodegaChange = (idBodega: number) => {
    setBodegaSeleccionada(idBodega);
    setPaginaActual(1);
    setTimeout(() => cargarInventario(), 0);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    localStorage.setItem('inventario_online_searchTerm', value);
  };

  const clearSearch = () => {
    setSearchTerm('');
    localStorage.removeItem('inventario_online_searchTerm');
  };

  const handlePageChange = (nuevaPagina: number) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
      setTimeout(() => cargarInventario(), 0);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-ES');
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

  const renderPaginacion = () => {
    const botones = [];
    const maxBotones = 5;

    let inicio = Math.max(1, paginaActual - Math.floor(maxBotones / 2));
    let fin = Math.min(totalPaginas, inicio + maxBotones - 1);

    if (fin - inicio < maxBotones - 1) {
      inicio = Math.max(1, fin - maxBotones + 1);
    }

    // Botón anterior
    botones.push(
      <button
        key="prev"
        onClick={() => handlePageChange(paginaActual - 1)}
        disabled={paginaActual === 1}
        className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed"
      >
        Anterior
      </button>
    );

    // Botones de páginas
    for (let i = inicio; i <= fin; i++) {
      botones.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-2 text-sm ${
            i === paginaActual
              ? 'bg-green-600 text-white'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {i}
        </button>
      );
    }

    // Botón siguiente
    botones.push(
      <button
        key="next"
        onClick={() => handlePageChange(paginaActual + 1)}
        disabled={paginaActual === totalPaginas}
        className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed"
      >
        Siguiente
      </button>
    );

    return botones;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <WifiIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">Inventario en Línea</h1>
              <p className="text-gray-600">Consulta de inventario en tiempo real</p>
            </div>
            <div className="flex items-center">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                isOnline 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  isOnline ? 'bg-green-600' : 'bg-red-600'
                }`}></div>
                {isOnline ? 'En línea' : 'Sin conexión'}
              </div>
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
                disabled={loadingBodegas || !isOnline}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
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
                  placeholder="Código, nombre, lote o ubicación..."
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
              onClick={() => {
                setPaginaActual(1);
                cargarInventario();
              }}
              disabled={loading || !isOnline}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
              {loading ? 'Consultando...' : 'Consultar'}
            </button>
          </div>
        </div>

        {/* Información de conexión y paginación */}
        {!isOnline && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <WifiIcon className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Sin conexión a internet. Mostrando datos guardados localmente.
                </p>
              </div>
            </div>
          </div>
        )}

        {totalRegistros > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>
                Mostrando {inventario.length} de {totalRegistros} items
                {bodegaSeleccionada > 0 && (
                  <> en {bodegas.find(b => b.idBodega === bodegaSeleccionada)?.nombre}</>
                )}
                {searchTerm && (
                  <> (filtrados por: "{searchTerm}")</>
                )}
              </span>
              <span>Página {paginaActual} de {totalPaginas}</span>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 420px)' }}>
          <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
            <h3 className="text-lg font-medium text-gray-900">
              Inventario en Línea ({totalRegistros})
            </h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center flex-1">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <span className="ml-2 text-gray-600">Cargando inventario...</span>
            </div>
          ) : inventario.length === 0 ? (
            <div className="flex items-center justify-center flex-1">
              <div className="text-center">
                <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron items</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 
                    `No hay items que coincidan con "${searchTerm}".` :
                    "No hay items con los filtros seleccionados."
                  }
                </p>
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="mt-2 text-sm text-green-600 hover:text-green-700"
                  >
                    Limpiar búsqueda
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-auto">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marca</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bodega</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UmBas</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cant. UMBas</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Disponible</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reservada</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Presentación</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cant. Pres.</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lote</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimiento</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Costo</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {inventario.map((item, index) => (
                        <tr key={item.idStock || index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.codigo}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {item.nombre}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.marca}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.bodega}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.unidadMedida}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStockStatus(item.cantidad_UMBas)}`}>
                              {formatNumber(item.cantidad_UMBas, 2)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatNumber(item.disponible_UMBas, 2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatNumber(item.cantidadReservadaUmBas, 2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.presentacion}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatNumber(item.cantidad_Presentacion, 2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.nombre_Completo}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.lote}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(item.fecha_vence)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${item.nomEstado === 'Buen Estado' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {item.nomEstado}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatNumber(item.costo, 2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Paginación */}
              {totalPaginas > 1 && (
                <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6 flex-shrink-0">
                  <div className="flex justify-center">
                    <div className="flex space-x-1">
                      {renderPaginacion()}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default InventarioEnLinea;
