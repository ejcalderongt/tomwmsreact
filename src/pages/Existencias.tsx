
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { CubeIcon, MagnifyingGlassIcon, FunnelIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { getUser } from '@/utils/auth';
import { existenciasAPI, bodegasAPI } from '@/api/api';
import toast from 'react-hot-toast';

interface Existencia {
  idExistencia: number;
  producto: string;
  cantidad: number;
  ubicacion: string;
  lote: string;
  fechaVencimiento: string;
  bodega: string;
}

interface Bodega {
  idBodega: number;
  nombre: string;
  codigo: string;
}

interface PaginacionInfo {
  paginaActual: number;
  totalPaginas: number;
  totalRegistros: number;
  tamanoPagina: number;
}

function Existencias() {
  const [existencias, setExistencias] = useState<Existencia[]>([]);
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [bodegaSeleccionada, setBodegaSeleccionada] = useState<number>(0); // 0 = todas las bodegas
  const [paginacion, setPaginacion] = useState<PaginacionInfo>({
    paginaActual: 1,
    totalPaginas: 1,
    totalRegistros: 0,
    tamanoPagina: 20
  });
  
  const user = getUser();

  useEffect(() => {
    document.title = 'TOMWMSUX - Existencias';
    cargarBodegas();
  }, []);

  useEffect(() => {
    if (user.idPropietario) {
      cargarExistencias();
    }
  }, [bodegaSeleccionada, paginacion.paginaActual]);

  const cargarBodegas = async () => {
    try {
      const data = await bodegasAPI.listar(user.token);
      console.log('Bodegas cargadas:', data);
      setBodegas(data || []);
    } catch (error) {
      console.error('Error al cargar bodegas:', error);
      toast.error('Error al cargar las bodegas');
    }
  };

  const cargarExistencias = async (pagina: number = paginacion.paginaActual) => {
    if (!user.idPropietario) {
      toast.error('No se encontró el ID del propietario');
      return;
    }

    setLoading(true);

    try {
      const filtro = {
        idPropietario: user.idPropietario,
        pagina,
        tamanoPagina: paginacion.tamanoPagina,
        ...(bodegaSeleccionada > 0 && { idBodega: bodegaSeleccionada })
      };

      const data = await existenciasAPI.listar(filtro, user.token);
      console.log('Existencias cargadas:', data);
      
      if (data) {
        setExistencias(data.datos || []);
        setPaginacion({
          paginaActual: data.paginaActual || 1,
          totalPaginas: data.totalPaginas || 1,
          totalRegistros: data.totalRegistros || 0,
          tamanoPagina: data.tamanoPagina || 20
        });

        if (data.datos && data.datos.length > 0) {
          toast.success(`Se cargaron ${data.datos.length} existencias`);
        } else {
          toast('No se encontraron existencias', {
            icon: 'ℹ️',
            style: {
              background: '#3b82f6',
              color: '#fff'
            }
          });
        }
      }
    } catch (error) {
      console.error('Error al cargar existencias:', error);
      toast.error('Error al cargar las existencias');
      setExistencias([]);
    } finally {
      setLoading(false);
    }
  };

  const cambiarPagina = (nuevaPagina: number) => {
    if (nuevaPagina >= 1 && nuevaPagina <= paginacion.totalPaginas) {
      setPaginacion(prev => ({ ...prev, paginaActual: nuevaPagina }));
    }
  };

  const filteredExistencias = existencias.filter(existencia =>
    existencia.producto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    existencia.ubicacion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    existencia.lote?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    existencia.bodega?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const bodegaActual = bodegas.find(b => b.idBodega === bodegaSeleccionada);

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

          {/* Filtros */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2 mb-4">
              <FunnelIcon className="h-5 w-5 text-gray-500" />
              <h3 className="text-sm font-medium text-gray-700">Filtros</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bodega
                </label>
                <div className="relative">
                  <BuildingOfficeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    value={bodegaSeleccionada}
                    onChange={(e) => setBodegaSeleccionada(parseInt(e.target.value))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0}>Todas las bodegas</option>
                    {bodegas.map((bodega) => (
                      <option key={bodega.idBodega} value={bodega.idBodega}>
                        {bodega.nombre} ({bodega.codigo})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar
                </label>
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

              <div className="flex items-end">
                <button
                  onClick={() => cargarExistencias(1)}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Cargando...' : 'Actualizar'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Welcome message */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-sm p-6 text-white">
          <h2 className="text-xl font-semibold mb-2">¡Bienvenido, {user.username}!</h2>
          <p className="opacity-90">
            Consulta el inventario {bodegaActual ? `de la bodega ${bodegaActual.nombre}` : 'de todas las bodegas'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CubeIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Productos</p>
                <p className="text-2xl font-bold text-gray-900">{filteredExistencias.length}</p>
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
                  {filteredExistencias.reduce((sum, stock) => sum + (stock.cantidad || 0), 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <BuildingOfficeIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Bodegas</p>
                <p className="text-2xl font-bold text-gray-900">{bodegas.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CubeIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Registros</p>
                <p className="text-2xl font-bold text-gray-900">{paginacion.totalRegistros}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              Lista de Existencias ({filteredExistencias.length} de {paginacion.totalRegistros})
            </h3>
            <div className="text-sm text-gray-500">
              Página {paginacion.paginaActual} de {paginacion.totalPaginas}
            </div>
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
                      Bodega
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vencimiento
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredExistencias.map((existencia) => (
                    <tr key={existencia.idExistencia} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {existencia.producto}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          existencia.cantidad > 100 
                            ? 'bg-green-100 text-green-800' 
                            : existencia.cantidad > 50 
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {existencia.cantidad || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {existencia.ubicacion}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {existencia.lote}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {existencia.bodega}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {existencia.fechaVencimiento ? new Date(existencia.fechaVencimiento).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!loading && filteredExistencias.length === 0 && (
                <div className="text-center py-12">
                  <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No hay existencias</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No se encontraron existencias para los filtros seleccionados.
                  </p>
                </div>
              )}

              {/* Paginación */}
              {paginacion.totalPaginas > 1 && (
                <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-700">
                      <span>
                        Mostrando {((paginacion.paginaActual - 1) * paginacion.tamanoPagina) + 1} a{' '}
                        {Math.min(paginacion.paginaActual * paginacion.tamanoPagina, paginacion.totalRegistros)} de{' '}
                        {paginacion.totalRegistros} resultados
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => cambiarPagina(paginacion.paginaActual - 1)}
                        disabled={paginacion.paginaActual <= 1}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>
                      
                      <span className="text-sm text-gray-700">
                        Página {paginacion.paginaActual} de {paginacion.totalPaginas}
                      </span>
                      
                      <button
                        onClick={() => cambiarPagina(paginacion.paginaActual + 1)}
                        disabled={paginacion.paginaActual >= paginacion.totalPaginas}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Existencias;
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { CubeIcon, BuildingStorefrontIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { existenciasAPI, bodegasAPI } from '@/api/api';

interface Existencia {
  idExistencia: number;
  codigo_producto: string;
  nombre_producto: string;
  nombre_unidad_medida: string;
  cantidad: number;
  cantidad_disponible: number;
  cantidad_reservada: number;
  ubicacion: string;
  lote: string;
  fecha_vencimiento: string;
  nombre_bodega: string;
  idBodega: number;
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

function Existencias() {
  const navigate = useNavigate();
  const [existencias, setExistencias] = useState<Existencia[]>([]);
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingBodegas, setLoadingBodegas] = useState(true);
  
  // Filtros
  const [bodegaSeleccionada, setBodegaSeleccionada] = useState<number>(0); // 0 = Todas las bodegas
  
  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const tamanoPagina = 50;

  useEffect(() => {
    document.title = 'TOMWMSUX - Existencias';
    cargarBodegas();
  }, []);

  useEffect(() => {
    if (bodegas.length > 0) {
      cargarExistencias();
    }
  }, [bodegas, bodegaSeleccionada, paginaActual]);

  const cargarBodegas = async () => {
    setLoadingBodegas(true);
    try {
      const token = localStorage.getItem('wms_token') || localStorage.getItem('token') || '';
      
      if (!token) {
        toast.error('No se encontró información de autenticación');
        navigate('/login');
        return;
      }

      console.log('Cargando bodegas...');
      const data = await bodegasAPI.listar(token);
      console.log('Bodegas cargadas:', data);
      
      setBodegas(data || []);
    } catch (error) {
      console.error('Error al cargar bodegas:', error);
      toast.error('Error al cargar las bodegas');
    } finally {
      setLoadingBodegas(false);
    }
  };

  const cargarExistencias = async () => {
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
        idBodega: bodegaSeleccionada === 0 ? undefined : bodegaSeleccionada,
        idPropietario,
        pagina: paginaActual,
        tamanoPagina
      };

      console.log('Cargando existencias con filtro:', filtro);
      const data: ExistenciasResponse = await existenciasAPI.listar(filtro, token);
      console.log('Existencias cargadas:', data);
      
      setExistencias(data.existencias || []);
      setTotalRegistros(data.totalRegistros || 0);
      setTotalPaginas(data.totalPaginas || 1);
      setPaginaActual(data.paginaActual || 1);
      
      if (!data.existencias || data.existencias.length === 0) {
        toast('No se encontraron existencias con los filtros seleccionados', {
          icon: 'ℹ️',
          style: {
            background: '#3b82f6',
            color: '#fff'
          }
        });
      } else {
        toast.success(`Se cargaron ${data.existencias.length} existencias`);
      }
    } catch (error) {
      console.error('Error al cargar existencias:', error);
      toast.error('Error al cargar las existencias');
    } finally {
      setLoading(false);
    }
  };

  const handleBodegaChange = (idBodega: number) => {
    setBodegaSeleccionada(idBodega);
    setPaginaActual(1); // Resetear a la primera página
  };

  const handlePageChange = (nuevaPagina: number) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
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
              ? 'bg-blue-600 text-white'
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
            <div className="p-2 bg-purple-100 rounded-lg">
              <CubeIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Existencias</h1>
              <p className="text-gray-600">Consulta de inventario disponible</p>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100"
              >
                <option value={0}>Todas las bodegas</option>
                {bodegas.map((bodega) => (
                  <option key={bodega.idBodega} value={bodega.idBodega}>
                    {bodega.codigo} - {bodega.nombre}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={() => {
                setPaginaActual(1);
                cargarExistencias();
              }}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
              {loading ? 'Consultando...' : 'Consultar'}
            </button>
          </div>
        </div>

        {/* Información de paginación */}
        {totalRegistros > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>
                Mostrando {existencias.length} de {totalRegistros} existencias
                {bodegaSeleccionada > 0 && (
                  <> en {bodegas.find(b => b.idBodega === bodegaSeleccionada)?.nombre}</>
                )}
              </span>
              <span>Página {paginaActual} de {totalPaginas}</span>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Existencias ({totalRegistros})
            </h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="ml-2 text-gray-600">Cargando existencias...</span>
            </div>
          ) : existencias.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron existencias</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No hay existencias con los filtros seleccionados.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bodega</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UmBas</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Disponible</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reservada</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lote</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimiento</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {existencias.map((existencia, index) => (
                      <tr key={existencia.idExistencia || index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {existencia.codigo_producto}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {existencia.nombre_producto}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {existencia.nombre_bodega}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {existencia.nombre_unidad_medida}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStockStatus(existencia.cantidad)}`}>
                            {formatNumber(existencia.cantidad, 0)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatNumber(existencia.cantidad_disponible, 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatNumber(existencia.cantidad_reservada, 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {existencia.ubicacion}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {existencia.lote}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(existencia.fecha_vencimiento)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Paginación */}
              {totalPaginas > 1 && (
                <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
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

export default Existencias;
