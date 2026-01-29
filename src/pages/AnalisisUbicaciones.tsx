import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import ReportDescription from '@/components/ReportDescription';
import { 
  MapPinIcon, 
  ArrowPathIcon, 
  MagnifyingGlassIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  CubeIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
  Squares2X2Icon,
  TruckIcon,
  ArchiveBoxIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { kpiAPI } from '@/api/api';
import { getToken, logout } from '@/utils/auth';
import ExcelJS from 'exceljs';

interface InventarioItem {
  idbodega: string;
  bodega: string;
  codigo: string;
  nombre: string;
  lote: string;
  licencia: string;
  disponible_UMBas: number;
  ubicacion: string;
  area: string;
  fecha_ingreso: string;
  fecha_vence: string;
  familia: string;
  propietario: string;
  estado: string;
  clasificacion: string;
}

const UBICACIONES_OPERATIVAS = ['RECEPCIÓN', 'MERMA', 'PICKING'];

const getTipoUbicacion = (ubicacion: string): 'operativa' | 'rack' => {
  return UBICACIONES_OPERATIVAS.includes(ubicacion.toUpperCase()) ? 'operativa' : 'rack';
};

interface Bodega {
  idBodega: string;
  bodega: string;
}

interface UbicacionResumen {
  ubicacion: string;
  area: string;
  totalSKUs: number;
  totalUnidades: number;
  productos: InventarioItem[];
}

interface AreaResumen {
  area: string;
  totalUbicaciones: number;
  totalSKUs: number;
  totalUnidades: number;
}

type SortField = 'ubicacion' | 'area' | 'totalSKUs' | 'totalUnidades';
type SortDirection = 'asc' | 'desc';

export default function AnalisisUbicaciones() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [inventario, setInventario] = useState<InventarioItem[]>([]);
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  
  const [selectedBodega, setSelectedBodega] = useState<string>('');
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  
  const [sortField, setSortField] = useState<SortField>('totalUnidades');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  
  const [expandedUbicacion, setExpandedUbicacion] = useState<string | null>(null);
  
  const [vistaActiva, setVistaActiva] = useState<'resumen' | 'detalle' | 'heatmap'>('resumen');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate('/login');
      return;
    }
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [stockData, bodegasDataRaw] = await Promise.all([
        kpiAPI.getStock(),
        kpiAPI.getBodegas()
      ]);
      
      const bodegasData: Bodega[] = bodegasDataRaw.map((b: any) => ({
        idBodega: String(b.idBodega || b.idbodega || ''),
        bodega: b.bodega || b.nombre || ''
      }));
      
      const items: InventarioItem[] = stockData.map((item: any) => ({
        idbodega: item.idbodega || '',
        bodega: item.bodega || '',
        codigo: item.codigo || '',
        nombre: item.nombre || '',
        lote: item.lote || '',
        licencia: item.licencia || '',
        disponible_UMBas: item.disponible_UMBas || 0,
        ubicacion: item.ubicacion || 'Sin Ubicación',
        area: item.area || 'Sin Área',
        fecha_ingreso: item.fecha_ingreso || '',
        fecha_vence: item.fecha_vence || '',
        familia: item.familia || '',
        propietario: item.propietario || '',
        estado: item.estado || 'Sin Estado',
        clasificacion: item.clasificacion || ''
      }));
      
      setInventario(items);
      setBodegas(bodegasData);
      toast.success(`${items.length} registros cargados`);
    } catch (error: any) {
      console.error('Error:', error);
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        logout();
        navigate('/session-expired');
      } else {
        toast.error('Error al cargar datos');
      }
    } finally {
      setLoading(false);
    }
  };

  const inventarioFiltrado = useMemo(() => {
    return inventario.filter(item => {
      if (selectedBodega && item.idbodega !== selectedBodega) return false;
      if (selectedArea && item.area !== selectedArea) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          item.ubicacion.toLowerCase().includes(term) ||
          item.codigo.toLowerCase().includes(term) ||
          item.nombre.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [inventario, selectedBodega, selectedArea, searchTerm]);

  const areasDisponibles = useMemo(() => {
    const areas = new Set<string>();
    inventario
      .filter(item => !selectedBodega || item.idbodega === selectedBodega)
      .forEach(item => areas.add(item.area));
    return Array.from(areas).sort();
  }, [inventario, selectedBodega]);

  const ubicacionesResumen = useMemo(() => {
    const map = new Map<string, UbicacionResumen>();
    
    inventarioFiltrado.forEach(item => {
      const key = item.ubicacion;
      if (!map.has(key)) {
        map.set(key, {
          ubicacion: item.ubicacion,
          area: item.area,
          totalSKUs: 0,
          totalUnidades: 0,
          productos: []
        });
      }
      const ubi = map.get(key)!;
      ubi.totalSKUs++;
      ubi.totalUnidades += item.disponible_UMBas;
      ubi.productos.push(item);
    });
    
    let result = Array.from(map.values());
    
    result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      return sortDirection === 'asc' 
        ? (aVal as number) - (bVal as number) 
        : (bVal as number) - (aVal as number);
    });
    
    return result;
  }, [inventarioFiltrado, sortField, sortDirection]);

  const areasResumen = useMemo(() => {
    const map = new Map<string, AreaResumen>();
    
    ubicacionesResumen.forEach(ubi => {
      const area = ubi.area;
      if (!map.has(area)) {
        map.set(area, {
          area,
          totalUbicaciones: 0,
          totalSKUs: 0,
          totalUnidades: 0
        });
      }
      const areaData = map.get(area)!;
      areaData.totalUbicaciones++;
      areaData.totalSKUs += ubi.totalSKUs;
      areaData.totalUnidades += ubi.totalUnidades;
    });
    
    return Array.from(map.values()).sort((a, b) => b.totalUnidades - a.totalUnidades);
  }, [ubicacionesResumen]);

  const totalPages = Math.ceil(ubicacionesResumen.length / itemsPerPage);
  const paginatedData = ubicacionesResumen.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totales = useMemo(() => ({
    ubicaciones: ubicacionesResumen.length,
    skus: ubicacionesResumen.reduce((sum, u) => sum + u.totalSKUs, 0),
    unidades: ubicacionesResumen.reduce((sum, u) => sum + u.totalUnidades, 0)
  }), [ubicacionesResumen]);

  const tipoUbicacionResumen = useMemo(() => {
    const operativas = ubicacionesResumen.filter(u => getTipoUbicacion(u.ubicacion) === 'operativa');
    const racks = ubicacionesResumen.filter(u => getTipoUbicacion(u.ubicacion) === 'rack');
    
    return {
      operativas: {
        count: operativas.length,
        skus: operativas.reduce((sum, u) => sum + u.totalSKUs, 0),
        unidades: operativas.reduce((sum, u) => sum + u.totalUnidades, 0),
        ubicaciones: operativas
      },
      racks: {
        count: racks.length,
        skus: racks.reduce((sum, u) => sum + u.totalSKUs, 0),
        unidades: racks.reduce((sum, u) => sum + u.totalUnidades, 0),
        ubicaciones: racks
      }
    };
  }, [ubicacionesResumen]);

  const estadoResumen = useMemo(() => {
    const estados = new Map<string, { count: number; unidades: number }>();
    inventarioFiltrado.forEach(item => {
      const estado = item.estado || 'Sin Estado';
      if (!estados.has(estado)) {
        estados.set(estado, { count: 0, unidades: 0 });
      }
      const e = estados.get(estado)!;
      e.count++;
      e.unidades += item.disponible_UMBas;
    });
    return Array.from(estados.entries())
      .map(([estado, data]) => ({ estado, ...data }))
      .sort((a, b) => b.unidades - a.unidades);
  }, [inventarioFiltrado]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const handleBodegaChange = (bodegaId: string) => {
    setSelectedBodega(bodegaId);
    setSelectedArea('');
    setCurrentPage(1);
  };

  const limpiarFiltros = () => {
    setSelectedBodega('');
    setSelectedArea('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const formatNumber = (value: number) => value.toLocaleString('es-ES');

  const exportarExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Análisis Ubicaciones');

      sheet.columns = [
        { header: 'Ubicación', key: 'ubicacion', width: 30 },
        { header: 'Área', key: 'area', width: 20 },
        { header: 'SKUs', key: 'skus', width: 12 },
        { header: 'Unidades', key: 'unidades', width: 15 }
      ];

      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }
      };

      ubicacionesResumen.forEach(ubi => {
        sheet.addRow({
          ubicacion: ubi.ubicacion,
          area: ubi.area,
          skus: ubi.totalSKUs,
          unidades: ubi.totalUnidades
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const fecha = new Date().toLocaleDateString('es-GT').replace(/\//g, '');
      a.href = url;
      a.download = `AnalisisUbicaciones_${fecha}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Excel exportado');
    } catch (error) {
      toast.error('Error al exportar');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' 
      ? <ChevronUpIcon className="h-4 w-4 inline ml-1" />
      : <ChevronDownIcon className="h-4 w-4 inline ml-1" />;
  };

  return (
    <Layout pageTitle="Análisis de Ubicaciones">
      <div className="space-y-4">
        <ReportDescription
          title="Análisis de Ubicaciones"
          description="Visualización completa del stock distribuido por ubicaciones físicas del almacén. Permite identificar la ocupación, densidad de productos y distribución espacial del inventario."
          metrics={[
            `${formatNumber(totales.ubicaciones)} Ubicaciones`,
            `${formatNumber(totales.skus)} SKUs Totales`,
            `${formatNumber(totales.unidades)} Unidades`
          ]}
          interpretation="Utilice los filtros para segmentar por bodega o área. Haga clic en una ubicación para ver el detalle de productos almacenados."
          color="purple"
        />

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              <FunnelIcon className="h-4 w-4" />
              {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </button>
            
            <button
              onClick={cargarDatos}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-600 text-white hover:bg-purple-700 rounded-lg disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>

            <button
              onClick={exportarExcel}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Exportar Excel
            </button>

            <div className="flex-1" />

            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setVistaActiva('resumen')}
                className={`px-3 py-1.5 text-sm rounded ${vistaActiva === 'resumen' ? 'bg-white shadow text-purple-700' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <ChartBarIcon className="h-4 w-4 inline mr-1" />
                Resumen
              </button>
              <button
                onClick={() => setVistaActiva('detalle')}
                className={`px-3 py-1.5 text-sm rounded ${vistaActiva === 'detalle' ? 'bg-white shadow text-purple-700' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <Squares2X2Icon className="h-4 w-4 inline mr-1" />
                Detalle
              </button>
              <button
                onClick={() => setVistaActiva('heatmap')}
                className={`px-3 py-1.5 text-sm rounded ${vistaActiva === 'heatmap' ? 'bg-white shadow text-purple-700' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <MapPinIcon className="h-4 w-4 inline mr-1" />
                Mapa
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Bodega</label>
                <select
                  value={selectedBodega}
                  onChange={(e) => handleBodegaChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Todas las bodegas</option>
                  {bodegas.map(b => (
                    <option key={b.idBodega} value={b.idBodega}>{b.bodega}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Área</label>
                <select
                  value={selectedArea}
                  onChange={(e) => { setSelectedArea(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Todas las áreas</option>
                  {areasDisponibles.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Buscar</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    placeholder="Ubicación, código, producto..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="flex items-end">
                <button
                  onClick={limpiarFiltros}
                  className="w-full px-3 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <ArrowPathIcon className="h-8 w-8 text-purple-600 animate-spin" />
              <span className="ml-3 text-gray-600">Cargando datos...</span>
            </div>
          ) : (
            <>
              {vistaActiva === 'resumen' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <MapPinIcon className="h-10 w-10 text-purple-600" />
                        <div>
                          <div className="text-2xl font-bold text-purple-700">{formatNumber(totales.ubicaciones)}</div>
                          <div className="text-sm text-purple-600">Ubicaciones</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <CubeIcon className="h-10 w-10 text-indigo-600" />
                        <div>
                          <div className="text-2xl font-bold text-indigo-700">{formatNumber(totales.skus)}</div>
                          <div className="text-sm text-indigo-600">SKUs Totales</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <BuildingStorefrontIcon className="h-10 w-10 text-violet-600" />
                        <div>
                          <div className="text-2xl font-bold text-violet-700">{formatNumber(totales.unidades)}</div>
                          <div className="text-sm text-violet-600">Unidades Totales</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <TruckIcon className="h-5 w-5 text-amber-500" />
                        Ubicaciones Operativas
                      </h3>
                      <div className="space-y-2">
                        {tipoUbicacionResumen.operativas.ubicaciones.map((ubi, idx) => {
                          const pct = totales.unidades > 0 ? (ubi.totalUnidades / totales.unidades) * 100 : 0;
                          const colorMap: Record<string, string> = {
                            'RECEPCIÓN': 'bg-blue-500',
                            'PICKING': 'bg-green-500',
                            'MERMA': 'bg-red-500'
                          };
                          const bgColor = colorMap[ubi.ubicacion.toUpperCase()] || 'bg-amber-500';
                          return (
                            <div key={idx}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium">{ubi.ubicacion}</span>
                                <div className="flex gap-3 text-gray-500">
                                  <span>{ubi.totalSKUs} SKUs</span>
                                  <span className="font-medium text-gray-900">{formatNumber(ubi.totalUnidades)} uni. ({pct.toFixed(1)}%)</span>
                                </div>
                              </div>
                              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${bgColor} rounded-full`}
                                  style={{ width: `${Math.min(pct * 2, 100)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                        <div className="pt-2 mt-2 border-t text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>Total Operativo:</span>
                            <span className="font-medium">{formatNumber(tipoUbicacionResumen.operativas.unidades)} unidades ({totales.unidades > 0 ? ((tipoUbicacionResumen.operativas.unidades / totales.unidades) * 100).toFixed(1) : 0}%)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <ArchiveBoxIcon className="h-5 w-5 text-indigo-500" />
                        Ubicaciones de Almacenaje (Racks)
                      </h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {tipoUbicacionResumen.racks.ubicaciones.map((ubi, idx) => {
                          const maxUni = Math.max(...tipoUbicacionResumen.racks.ubicaciones.map(u => u.totalUnidades), 1);
                          const pct = (ubi.totalUnidades / maxUni) * 100;
                          return (
                            <div key={idx}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium">{ubi.ubicacion}</span>
                                <span className="text-gray-900">{formatNumber(ubi.totalUnidades)}</span>
                              </div>
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-indigo-500 rounded-full"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="pt-2 mt-2 border-t text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Total Racks:</span>
                          <span className="font-medium">{formatNumber(tipoUbicacionResumen.racks.unidades)} unidades ({totales.unidades > 0 ? ((tipoUbicacionResumen.racks.unidades / totales.unidades) * 100).toFixed(1) : 0}%)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      Estado del Inventario
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {estadoResumen.map((e, idx) => {
                        const pct = totales.unidades > 0 ? (e.unidades / totales.unidades) * 100 : 0;
                        const isBueno = e.estado.toLowerCase().includes('buen');
                        const isMalo = e.estado.toLowerCase().includes('mal');
                        const bgColor = isBueno ? 'bg-green-50 border-green-200' : isMalo ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200';
                        const textColor = isBueno ? 'text-green-700' : isMalo ? 'text-red-700' : 'text-gray-700';
                        const Icon = isBueno ? CheckCircleIcon : isMalo ? ExclamationCircleIcon : CubeIcon;
                        const iconColor = isBueno ? 'text-green-500' : isMalo ? 'text-red-500' : 'text-gray-500';
                        
                        return (
                          <div key={idx} className={`${bgColor} border rounded-lg p-3`}>
                            <div className="flex items-center gap-2 mb-1">
                              <Icon className={`h-5 w-5 ${iconColor}`} />
                              <span className={`font-medium ${textColor}`}>{e.estado}</span>
                            </div>
                            <div className={`text-xl font-bold ${textColor}`}>{formatNumber(e.unidades)}</div>
                            <div className="text-sm text-gray-500">{pct.toFixed(1)}% del total</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <ChartBarIcon className="h-5 w-5 text-purple-500" />
                        Distribución por Área
                      </h3>
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {areasResumen.map((area, idx) => {
                          const maxUni = Math.max(...areasResumen.map(a => a.totalUnidades), 1);
                          const pct = (area.totalUnidades / maxUni) * 100;
                          return (
                            <div key={idx} className="group">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium truncate">{area.area}</span>
                                <div className="flex gap-4 text-gray-500">
                                  <span>{area.totalUbicaciones} ubic.</span>
                                  <span className="font-medium text-gray-900">{formatNumber(area.totalUnidades)} uni.</span>
                                </div>
                              </div>
                              <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <MapPinIcon className="h-5 w-5 text-indigo-500" />
                        Top 15 Ubicaciones (por unidades)
                      </h3>
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {ubicacionesResumen.slice(0, 15).map((ubi, idx) => {
                          const maxUni = Math.max(...ubicacionesResumen.slice(0, 15).map(u => u.totalUnidades), 1);
                          const pct = (ubi.totalUnidades / maxUni) * 100;
                          return (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-xs text-gray-400 w-5">{idx + 1}</span>
                              <div className="flex-1">
                                <div className="flex justify-between text-xs mb-0.5">
                                  <span className="truncate font-medium">{ubi.ubicacion}</span>
                                  <span>{formatNumber(ubi.totalUnidades)}</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-indigo-500 rounded-full"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {vistaActiva === 'detalle' && (
                <div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="text-left px-4 py-3 font-medium">#</th>
                          <th 
                            className="text-left px-4 py-3 font-medium cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('ubicacion')}
                          >
                            Ubicación <SortIcon field="ubicacion" />
                          </th>
                          <th 
                            className="text-left px-4 py-3 font-medium cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('area')}
                          >
                            Área <SortIcon field="area" />
                          </th>
                          <th 
                            className="text-right px-4 py-3 font-medium cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('totalSKUs')}
                          >
                            SKUs <SortIcon field="totalSKUs" />
                          </th>
                          <th 
                            className="text-right px-4 py-3 font-medium cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('totalUnidades')}
                          >
                            Unidades <SortIcon field="totalUnidades" />
                          </th>
                          <th className="text-left px-4 py-3 font-medium">Ocupación</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedData.map((ubi, idx) => {
                          const globalIdx = (currentPage - 1) * itemsPerPage + idx;
                          const maxUni = Math.max(...ubicacionesResumen.map(u => u.totalUnidades), 1);
                          const pct = (ubi.totalUnidades / maxUni) * 100;
                          const isExpanded = expandedUbicacion === ubi.ubicacion;
                          
                          return (
                            <>
                              <tr 
                                key={ubi.ubicacion}
                                className={`border-t hover:bg-purple-50 cursor-pointer transition-colors ${isExpanded ? 'bg-purple-50' : ''}`}
                                onClick={() => setExpandedUbicacion(isExpanded ? null : ubi.ubicacion)}
                              >
                                <td className="px-4 py-3 text-gray-500">{globalIdx + 1}</td>
                                <td className="px-4 py-3 font-medium flex items-center gap-2">
                                  {isExpanded ? <ChevronDownIcon className="h-4 w-4 text-purple-600" /> : <ChevronUpIcon className="h-4 w-4 text-gray-400 rotate-180" />}
                                  {ubi.ubicacion}
                                </td>
                                <td className="px-4 py-3">{ubi.area}</td>
                                <td className="px-4 py-3 text-right">{formatNumber(ubi.totalSKUs)}</td>
                                <td className="px-4 py-3 text-right font-medium">{formatNumber(ubi.totalUnidades)}</td>
                                <td className="px-4 py-3">
                                  <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-purple-500 rounded-full"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr key={`${ubi.ubicacion}-detail`}>
                                  <td colSpan={6} className="bg-gray-50 px-4 py-3">
                                    <div className="text-xs font-medium text-gray-600 mb-2">
                                      Productos en {ubi.ubicacion}:
                                    </div>
                                    <div className="max-h-48 overflow-y-auto">
                                      <table className="w-full text-xs">
                                        <thead className="bg-gray-100">
                                          <tr>
                                            <th className="text-left px-2 py-1">Código</th>
                                            <th className="text-left px-2 py-1">Producto</th>
                                            <th className="text-left px-2 py-1">Lote</th>
                                            <th className="text-right px-2 py-1">Cantidad</th>
                                            <th className="text-center px-2 py-1">F. Vence</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {ubi.productos.map((prod, pIdx) => (
                                            <tr key={pIdx} className="border-t border-gray-200">
                                              <td className="px-2 py-1 font-mono">{prod.codigo}</td>
                                              <td className="px-2 py-1">{prod.nombre}</td>
                                              <td className="px-2 py-1">{prod.lote || '-'}</td>
                                              <td className="px-2 py-1 text-right font-medium">{formatNumber(prod.disponible_UMBas)}</td>
                                              <td className="px-2 py-1 text-center">{prod.fecha_vence ? new Date(prod.fecha_vence).toLocaleDateString('es-GT') : '-'}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t pt-4 mt-4">
                      <div className="text-sm text-gray-600">
                        Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, ubicacionesResumen.length)} de {ubicacionesResumen.length}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                          className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
                        >
                          «
                        </button>
                        <button
                          onClick={() => setCurrentPage(p => p - 1)}
                          disabled={currentPage === 1}
                          className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
                        >
                          ‹
                        </button>
                        <span className="px-4 py-1 text-sm">
                          Página {currentPage} de {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(p => p + 1)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
                        >
                          ›
                        </button>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
                        >
                          »
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {vistaActiva === 'heatmap' && (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900">Mapa de Ocupación por Ubicación</h3>
                      <div className="flex items-center gap-2 text-xs">
                        <span>Menor ocupación</span>
                        <div className="flex gap-0.5">
                          <div className="w-4 h-4 bg-purple-100 rounded" />
                          <div className="w-4 h-4 bg-purple-200 rounded" />
                          <div className="w-4 h-4 bg-purple-300 rounded" />
                          <div className="w-4 h-4 bg-purple-400 rounded" />
                          <div className="w-4 h-4 bg-purple-500 rounded" />
                          <div className="w-4 h-4 bg-purple-600 rounded" />
                        </div>
                        <span>Mayor ocupación</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5">
                      {ubicacionesResumen.slice(0, 100).map((ubi, idx) => {
                        const maxUni = Math.max(...ubicacionesResumen.map(u => u.totalUnidades), 1);
                        const intensity = ubi.totalUnidades / maxUni;
                        
                        let bgColor = 'bg-purple-100';
                        if (intensity > 0.8) bgColor = 'bg-purple-600';
                        else if (intensity > 0.6) bgColor = 'bg-purple-500';
                        else if (intensity > 0.4) bgColor = 'bg-purple-400';
                        else if (intensity > 0.2) bgColor = 'bg-purple-300';
                        else if (intensity > 0.1) bgColor = 'bg-purple-200';
                        
                        const textColor = intensity > 0.4 ? 'text-white' : 'text-purple-900';
                        
                        return (
                          <div
                            key={idx}
                            className={`${bgColor} ${textColor} rounded px-2 py-1.5 text-xs font-medium cursor-pointer hover:ring-2 hover:ring-purple-400 transition-all`}
                            title={`${ubi.ubicacion}\n${formatNumber(ubi.totalUnidades)} unidades\n${ubi.totalSKUs} SKUs`}
                            onClick={() => {
                              setExpandedUbicacion(ubi.ubicacion);
                              setVistaActiva('detalle');
                            }}
                          >
                            {ubi.ubicacion.length > 15 ? ubi.ubicacion.substring(0, 15) + '...' : ubi.ubicacion}
                          </div>
                        );
                      })}
                    </div>
                    
                    {ubicacionesResumen.length > 100 && (
                      <div className="mt-3 text-center text-sm text-gray-500">
                        Mostrando 100 de {ubicacionesResumen.length} ubicaciones. Use los filtros para ver más.
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3">Estadísticas de Ocupación</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Ubicación con más stock:</span>
                          <span className="font-medium">{ubicacionesResumen[0]?.ubicacion || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Unidades en ubicación top:</span>
                          <span className="font-medium">{formatNumber(ubicacionesResumen[0]?.totalUnidades || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Promedio unidades/ubicación:</span>
                          <span className="font-medium">{formatNumber(Math.round(totales.unidades / (totales.ubicaciones || 1)))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Promedio SKUs/ubicación:</span>
                          <span className="font-medium">{(totales.skus / (totales.ubicaciones || 1)).toFixed(1)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3">Distribución de Densidad</h3>
                      <div className="space-y-2">
                        {(() => {
                          const ranges = [
                            { label: 'Alta (>1000 uni)', min: 1000, color: 'bg-purple-600' },
                            { label: 'Media (500-1000 uni)', min: 500, max: 1000, color: 'bg-purple-400' },
                            { label: 'Baja (100-500 uni)', min: 100, max: 500, color: 'bg-purple-300' },
                            { label: 'Mínima (<100 uni)', min: 0, max: 100, color: 'bg-purple-100' }
                          ];
                          
                          return ranges.map((range, idx) => {
                            const count = ubicacionesResumen.filter(u => 
                              u.totalUnidades >= range.min && 
                              (range.max === undefined || u.totalUnidades < range.max)
                            ).length;
                            const pct = totales.ubicaciones > 0 ? (count / totales.ubicaciones) * 100 : 0;
                            
                            return (
                              <div key={idx}>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="flex items-center gap-2">
                                    <div className={`w-3 h-3 ${range.color} rounded`} />
                                    {range.label}
                                  </span>
                                  <span>{count} ({pct.toFixed(1)}%)</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${range.color} rounded-full`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
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
