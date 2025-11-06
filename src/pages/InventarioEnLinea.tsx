
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { CubeIcon, BuildingStorefrontIcon, MagnifyingGlassIcon, WifiIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { existenciasAPI, bodegasAPI } from '@/api/api';
import { getToken, logout, getUser } from '@/utils/auth';
import * as XLSX from 'xlsx';

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
  licencia?: string;
  referencia?: string;
  fecha_ingreso?: string;
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
    if (nuevaPagina >= 1 && nuevaPagina <= Math.max(totalPaginas, paginaActual)) {
      setPaginaActual(nuevaPagina);
      // Llamar cargarInventario con la nueva página específicamente
      cargarInventarioConPagina(nuevaPagina);
    }
  };

  const cargarInventarioConPagina = async (pagina: number) => {
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
        pagina: pagina, // Usar la página específica pasada como parámetro
        tamanoPagina
      };

      const data: InventarioResponse = await existenciasAPI.listar(filtro, token);

      const inventarioData = data.existencias || [];
      setAllInventario(inventarioData);
      setInventario(inventarioData);
      setTotalRegistros(data.totalRegistros || 0);
      setTotalPaginas(data.totalPaginas || 1);
      setPaginaActual(data.paginaActual || pagina);

      // Save data and filter state to localStorage
      localStorage.setItem('inventario_online_bodegaSeleccionada', bodegaSeleccionada.toString());
      localStorage.setItem('inventario_online_paginaActual', (data.paginaActual || pagina).toString());
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
        toast.success(`Se cargaron ${data.existencias.length} items de inventario (Página ${pagina})`);
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

  const descargarExcel = async () => {
    if (!isOnline) {
      toast.error('Sin conexión a internet');
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

      // Mostrar toast de carga con cronómetro
      const startTime = Date.now();
      const loadingToast = toast.loading('🔄 Obteniendo todos los datos de inventario...', {
        duration: Infinity
      });

      // Llamada para obtener TODOS los datos sin paginación
      const filtro = {
        idBodega: bodegaSeleccionada,
        idPropietario,
        pagina: 1,
        tamanoPagina: 999999 // Número muy grande para obtener todos los registros
      };

      const data = await existenciasAPI.listar(filtro, token);
      const todosLosDatos = data.existencias || [];

      // Actualizar el toast con el tiempo transcurrido
      const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
      toast.dismiss(loadingToast);
      
      if (todosLosDatos.length === 0) {
        toast.error('No hay datos para descargar');
        return;
      }

      // Mostrar toast de procesamiento
      const processToast = toast.loading('📊 Generando archivo Excel...', {
        duration: Infinity
      });

      // Generar fecha y hora para el archivo y encabezado
      const fechaHoy = new Date();
      const dia = fechaHoy.getDate().toString().padStart(2, '0');
      const mes = (fechaHoy.getMonth() + 1).toString().padStart(2, '0');
      const año = fechaHoy.getFullYear().toString();
      const horas = fechaHoy.getHours().toString().padStart(2, '0');
      const minutos = fechaHoy.getMinutes().toString().padStart(2, '0');
      const segundos = fechaHoy.getSeconds().toString().padStart(2, '0');

      // Obtener información del usuario y propietario
      const user = getUser();
      const propietario = user.propietario?.nombre || 'Propietario';
      const usuario = user.username || '';
      
      // Formatear fecha y hora de generación
      const fechaGeneracion = `${dia}/${mes}/${año}`;
      const horaGeneracion = `${horas}:${minutos}:${segundos}`;

      // Crear encabezado del Excel
      const encabezado = [
        ['EMPRESA', propietario, '', '', '', ''],
        ['FECHA DE GENERACIÓN:', fechaGeneracion, '', 'TIPO DE CARGA:', '', ''],
        ['HORA DE GENERACIÓN:', horaGeneracion, '', 'TOTAL DE INVENTARIO:', '', ''],
        ['USUARIO:', usuario, '', '', '', ''],
        ['', '', '', '', '', ''], // Fila vacía
        ['Código', 'Producto', 'Disponible U.M. Bas', 'Lote', 'Licencia', 'Referencia', 'Fecha Vence', 'Fecha Ingreso']
      ];

      // Preparar los datos para el Excel (solo campos solicitados)
      const datosExcel = todosLosDatos.map((item: InventarioItem) => [
        item.codigo || '',
        item.nombre || '',
        item.disponible_UMBas || 0,
        item.lote || '',
        item.licencia || '',
        item.referencia || '',
        item.fecha_vence ? formatDate(item.fecha_vence) : '',
        item.fecha_ingreso ? formatDate(item.fecha_ingreso) : ''
      ]);

      // Combinar encabezado con datos
      const datosCompletos = [...encabezado, ...datosExcel];

      // Crear el libro de trabajo
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(datosCompletos);

      XLSX.utils.book_append_sheet(wb, ws, 'Inventario Completo');
      const fechaFormateada = `${dia}${mes}${año}`;
      const horaFormateada = `${horas}${minutos}${segundos}`;

      const bodegaCodigo = bodegaSeleccionada === 0 
        ? 'TodasBodegas' 
        : bodegas.find(b => b.idBodega === bodegaSeleccionada)?.codigo?.replace(/\s+/g, '') || 'Bodega';

      const nombreArchivo = `InventarioCompleto_${bodegaCodigo}_${fechaFormateada}_${horaFormateada}.xlsx`;
      
      // Descargar archivo
      XLSX.writeFile(wb, nombreArchivo);
      
      toast.dismiss(processToast);
      toast.success(`✅ Descarga completada en ${elapsedTime}s\n📁 ${nombreArchivo}\n📊 ${todosLosDatos.length} registros`, {
        duration: 5000
      });

    } catch (error) {
      console.error('Error al descargar inventario completo:', error);
      
      if (error instanceof Error && (error.message.includes('401') || error.message.includes('403') || error.message.includes('Authentication failed'))) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      
      toast.error('❌ Error al descargar el inventario completo');
    } finally {
      setLoading(false);
    }
  };

  const renderPaginacion = () => {
    const botones = [];
    const maxBotones = 5;
    const maxPaginas = Math.max(totalPaginas, paginaActual);

    let inicio = Math.max(1, paginaActual - Math.floor(maxBotones / 2));
    let fin = Math.min(maxPaginas, inicio + maxBotones - 1);

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

    // Siempre mostrar botón página 1 si no está en el rango visible
    if (inicio > 1) {
      botones.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
        >
          1
        </button>
      );
      if (inicio > 2) {
        botones.push(
          <span key="ellipsis-start" className="px-3 py-2 text-sm text-gray-400">
            ...
          </span>
        );
      }
    }

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

    // Botón siguiente - siempre habilitado si no estamos en página 1 o si hay más páginas disponibles
    const puedeAvanzar = totalPaginas === 0 || paginaActual < maxPaginas;
    botones.push(
      <button
        key="next"
        onClick={() => handlePageChange(paginaActual + 1)}
        disabled={!puedeAvanzar}
        className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed"
      >
        Siguiente
      </button>
    );

    return botones;
  };

  return (
    <Layout pageTitle="Inventario en Línea">
      <div className="space-y-6">
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

            <button
              onClick={descargarExcel}
              disabled={loading || !isOnline}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Descargar inventario completo"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              {loading ? 'Descargando...' : 'Descargar Inventario'}
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 350px)' }}>
          <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Total: {totalRegistros} items
            </h3>
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
              <div className="flex-1 overflow-y-auto overflow-x-auto" style={{ overflowX: 'auto', overflowY: 'auto' }}>
                <table className="min-w-full divide-y divide-gray-200" style={{ minWidth: '1200px' }}>
                    <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marca</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Regimen(Bodega)</th>
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

              {/* Paginación */}
              {(totalPaginas > 1 || paginaActual > 1) && (
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
