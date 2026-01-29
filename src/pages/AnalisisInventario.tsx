import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import ReportDescription from '@/components/ReportDescription';
import { 
  CubeIcon, 
  CalendarIcon, 
  ArrowPathIcon, 
  ExclamationTriangleIcon,
  ClockIcon,
  BuildingStorefrontIcon,
  ChartPieIcon
} from '@heroicons/react/24/outline';
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
  licencia?: string;
  referencia?: string;
  fecha_ingreso?: string;
  propietario?: string;
}

interface Bodega {
  idBodega: number;
  nombre: string;
}

interface VencimientoResumen {
  vencidos: InventarioItem[];
  proximos30: InventarioItem[];
  proximos90: InventarioItem[];
  ok: InventarioItem[];
  sinVencimiento: InventarioItem[];
}

interface AntiguedadResumen {
  rango0_30: InventarioItem[];
  rango31_60: InventarioItem[];
  rango61_90: InventarioItem[];
  rangoMas90: InventarioItem[];
  sinFechaIngreso: InventarioItem[];
}

interface BodegaResumen {
  nombre: string;
  idBodega: number;
  totalSKUs: number;
  totalUnidades: number;
  valorTotal: number;
}

interface FamiliaResumen {
  nombre: string;
  totalSKUs: number;
  totalUnidades: number;
  porcentaje: number;
}

function AnalisisInventario() {
  const navigate = useNavigate();
  const [inventario, setInventario] = useState<InventarioItem[]>([]);
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [loading, setLoading] = useState(false);
  const [bodegaSeleccionada, setBodegaSeleccionada] = useState<number>(0);
  
  const [vencimientos, setVencimientos] = useState<VencimientoResumen>({
    vencidos: [], proximos30: [], proximos90: [], ok: [], sinVencimiento: []
  });
  const [antiguedad, setAntiguedad] = useState<AntiguedadResumen>({
    rango0_30: [], rango31_60: [], rango61_90: [], rangoMas90: [], sinFechaIngreso: []
  });
  const [bodegaResumen, setBodegaResumen] = useState<BodegaResumen[]>([]);
  const [familiaResumen, setFamiliaResumen] = useState<FamiliaResumen[]>([]);

  const [seccionActiva, setSeccionActiva] = useState<'vencimientos' | 'antiguedad' | 'bodegas' | 'composicion'>('vencimientos');

  useEffect(() => {
    document.title = 'TOMWMSUX - Análisis de Inventario';
    cargarBodegas();
  }, []);

  const cargarBodegas = async () => {
    try {
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }
      const data = await bodegasAPI.listar(token);
      console.log('Bodegas cargadas:', data);
      if (Array.isArray(data)) {
        setBodegas(data);
      } else {
        console.error('Formato de bodegas inesperado:', data);
        setBodegas([]);
      }
    } catch (error) {
      console.error('Error al cargar bodegas:', error);
      toast.error('Error al cargar bodegas');
    }
  };

  const cargarInventario = async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        logout();
        navigate('/login');
        return;
      }

      let allData: InventarioItem[] = [];
      let pagina = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await existenciasAPI.listar({
          idBodega: bodegaSeleccionada,
          idPropietario: 0,
          pagina: pagina,
          tamanoPagina: 500
        }, token);

        if (response.existencias && response.existencias.length > 0) {
          allData = [...allData, ...response.existencias];
          pagina++;
          hasMore = response.existencias.length === 500;
        } else {
          hasMore = false;
        }

        if (pagina > 20) hasMore = false;
      }

      setInventario(allData);
      procesarAnalisis(allData);
      toast.success(`${allData.length} productos cargados`);
    } catch (error) {
      console.error('Error al cargar inventario:', error);
      toast.error('Error al cargar inventario');
    } finally {
      setLoading(false);
    }
  };

  const procesarAnalisis = (data: InventarioItem[]) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const venc: VencimientoResumen = {
      vencidos: [], proximos30: [], proximos90: [], ok: [], sinVencimiento: []
    };

    const antig: AntiguedadResumen = {
      rango0_30: [], rango31_60: [], rango61_90: [], rangoMas90: [], sinFechaIngreso: []
    };

    const bodegaMap = new Map<number, BodegaResumen>();
    const familiaMap = new Map<string, { totalSKUs: number; totalUnidades: number }>();

    data.forEach(item => {
      if (item.fecha_vence && item.fecha_vence !== '0001-01-01T00:00:00') {
        const fechaVence = new Date(item.fecha_vence);
        const diasParaVencer = Math.floor((fechaVence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

        if (diasParaVencer < 0) {
          venc.vencidos.push(item);
        } else if (diasParaVencer <= 30) {
          venc.proximos30.push(item);
        } else if (diasParaVencer <= 90) {
          venc.proximos90.push(item);
        } else {
          venc.ok.push(item);
        }
      } else {
        venc.sinVencimiento.push(item);
      }

      if (item.fecha_ingreso && item.fecha_ingreso !== '0001-01-01T00:00:00') {
        const fechaIngreso = new Date(item.fecha_ingreso);
        const diasEnInventario = Math.floor((hoy.getTime() - fechaIngreso.getTime()) / (1000 * 60 * 60 * 24));

        if (diasEnInventario <= 30) {
          antig.rango0_30.push(item);
        } else if (diasEnInventario <= 60) {
          antig.rango31_60.push(item);
        } else if (diasEnInventario <= 90) {
          antig.rango61_90.push(item);
        } else {
          antig.rangoMas90.push(item);
        }
      } else {
        antig.sinFechaIngreso.push(item);
      }

      if (!bodegaMap.has(item.idBodega)) {
        bodegaMap.set(item.idBodega, {
          nombre: item.bodega,
          idBodega: item.idBodega,
          totalSKUs: 0,
          totalUnidades: 0,
          valorTotal: 0
        });
      }
      const bodegaData = bodegaMap.get(item.idBodega)!;
      bodegaData.totalSKUs++;
      bodegaData.totalUnidades += item.disponible_UMBas || 0;
      bodegaData.valorTotal += item.valor_total || 0;

      const familia = item.familia || 'Sin Familia';
      if (!familiaMap.has(familia)) {
        familiaMap.set(familia, { totalSKUs: 0, totalUnidades: 0 });
      }
      const familiaData = familiaMap.get(familia)!;
      familiaData.totalSKUs++;
      familiaData.totalUnidades += item.disponible_UMBas || 0;
    });

    setVencimientos(venc);
    setAntiguedad(antig);
    setBodegaResumen(Array.from(bodegaMap.values()).sort((a, b) => b.totalUnidades - a.totalUnidades));

    const totalUnidades = data.reduce((sum, item) => sum + (item.disponible_UMBas || 0), 0);
    const familias: FamiliaResumen[] = Array.from(familiaMap.entries())
      .map(([nombre, data]) => ({
        nombre,
        totalSKUs: data.totalSKUs,
        totalUnidades: data.totalUnidades,
        porcentaje: totalUnidades > 0 ? (data.totalUnidades / totalUnidades) * 100 : 0
      }))
      .sort((a, b) => b.totalUnidades - a.totalUnidades);
    setFamiliaResumen(familias);
  };

  const formatNumber = (value: number) => value.toLocaleString('es-ES');
  const formatCurrency = (value: number) => `Q${value.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;
  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === '0001-01-01T00:00:00') return '-';
    return new Date(dateStr).toLocaleDateString('es-ES');
  };

  const getDiasParaVencer = (fechaVence: string): number => {
    if (!fechaVence || fechaVence === '0001-01-01T00:00:00') return 999;
    const hoy = new Date();
    const fecha = new Date(fechaVence);
    return Math.floor((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getDiasEnInventario = (fechaIngreso: string): number => {
    if (!fechaIngreso || fechaIngreso === '0001-01-01T00:00:00') return 0;
    const hoy = new Date();
    const fecha = new Date(fechaIngreso);
    return Math.floor((hoy.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getMaxBodegaUnidades = () => Math.max(...bodegaResumen.map(b => b.totalUnidades), 1);

  return (
    <Layout pageTitle="Análisis de Inventario">
      <div className="space-y-6">
        <ReportDescription
          title="Análisis de Inventario"
          description="Vista integral del inventario con análisis de vencimientos, antigüedad de stock, distribución por bodega y composición por familias. Permite identificar productos críticos, stock estancado y optimizar la gestión del almacén."
          metrics={[
            "Productos vencidos y próximos a vencer",
            "Antigüedad del stock (días en inventario)",
            "Distribución por bodega (SKUs y valor)",
            "Composición por familia de productos"
          ]}
          interpretation="Los productos vencidos requieren acción inmediata. Stock >90 días indica baja rotación. Use la distribución por bodega para balancear capacidad. Las familias con mayor % dominan el inventario."
          color="cyan"
        />

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <BuildingStorefrontIcon className="h-4 w-4 inline mr-1" />
                Bodega
              </label>
              <select
                value={bodegaSeleccionada}
                onChange={(e) => setBodegaSeleccionada(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>Todas las Bodegas</option>
                {bodegas.map((bodega) => (
                  <option key={bodega.idBodega} value={bodega.idBodega}>
                    {bodega.nombre}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={cargarInventario}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
            >
              <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Cargando...' : 'Analizar Inventario'}
            </button>
          </div>
        </div>

        {inventario.length > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => setSeccionActiva('vencimientos')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  seccionActiva === 'vencimientos' 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-gray-200 bg-white hover:border-red-300'
                }`}
              >
                <ExclamationTriangleIcon className="h-8 w-8 mx-auto text-red-500 mb-2" />
                <div className="text-sm font-medium">Vencimientos</div>
                <div className="text-xs text-gray-500">
                  {vencimientos.vencidos.length + vencimientos.proximos30.length} críticos
                </div>
              </button>

              <button
                onClick={() => setSeccionActiva('antiguedad')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  seccionActiva === 'antiguedad' 
                    ? 'border-amber-500 bg-amber-50' 
                    : 'border-gray-200 bg-white hover:border-amber-300'
                }`}
              >
                <ClockIcon className="h-8 w-8 mx-auto text-amber-500 mb-2" />
                <div className="text-sm font-medium">Antigüedad</div>
                <div className="text-xs text-gray-500">
                  {antiguedad.rangoMas90.length} productos {'>'}90 días
                </div>
              </button>

              <button
                onClick={() => setSeccionActiva('bodegas')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  seccionActiva === 'bodegas' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                <BuildingStorefrontIcon className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                <div className="text-sm font-medium">Por Bodega</div>
                <div className="text-xs text-gray-500">
                  {bodegaResumen.length} bodegas
                </div>
              </button>

              <button
                onClick={() => setSeccionActiva('composicion')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  seccionActiva === 'composicion' 
                    ? 'border-emerald-500 bg-emerald-50' 
                    : 'border-gray-200 bg-white hover:border-emerald-300'
                }`}
              >
                <ChartPieIcon className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
                <div className="text-sm font-medium">Composición</div>
                <div className="text-xs text-gray-500">
                  {familiaResumen.length} familias
                </div>
              </button>
            </div>

            {seccionActiva === 'vencimientos' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-red-100 border border-red-300 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-red-700">{vencimientos.vencidos.length}</div>
                    <div className="text-sm text-red-600">Vencidos</div>
                  </div>
                  <div className="bg-orange-100 border border-orange-300 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-orange-700">{vencimientos.proximos30.length}</div>
                    <div className="text-sm text-orange-600">Próx. 30 días</div>
                  </div>
                  <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-yellow-700">{vencimientos.proximos90.length}</div>
                    <div className="text-sm text-yellow-600">Próx. 90 días</div>
                  </div>
                  <div className="bg-green-100 border border-green-300 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-green-700">{vencimientos.ok.length}</div>
                    <div className="text-sm text-green-600">OK (+90 días)</div>
                  </div>
                  <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-gray-700">{vencimientos.sinVencimiento.length}</div>
                    <div className="text-sm text-gray-600">Sin Vencimiento</div>
                  </div>
                </div>

                {(vencimientos.vencidos.length > 0 || vencimientos.proximos30.length > 0) && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-red-600 text-white px-4 py-3 font-medium flex items-center gap-2">
                      <ExclamationTriangleIcon className="h-5 w-5" />
                      Productos Críticos (Vencidos y Próximos 30 días)
                    </div>
                    <div className="overflow-x-auto max-h-80 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="text-left px-4 py-2 font-medium">Código</th>
                            <th className="text-left px-4 py-2 font-medium">Producto</th>
                            <th className="text-left px-4 py-2 font-medium">Lote</th>
                            <th className="text-right px-4 py-2 font-medium">Disponible</th>
                            <th className="text-center px-4 py-2 font-medium">Fecha Vence</th>
                            <th className="text-center px-4 py-2 font-medium">Días</th>
                            <th className="text-left px-4 py-2 font-medium">Bodega</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...vencimientos.vencidos, ...vencimientos.proximos30]
                            .sort((a, b) => getDiasParaVencer(a.fecha_vence) - getDiasParaVencer(b.fecha_vence))
                            .slice(0, 50)
                            .map((item, idx) => {
                              const dias = getDiasParaVencer(item.fecha_vence);
                              return (
                                <tr key={idx} className={`border-t ${dias < 0 ? 'bg-red-50' : 'bg-orange-50'}`}>
                                  <td className="px-4 py-2 font-mono text-xs">{item.codigo}</td>
                                  <td className="px-4 py-2">{item.nombre}</td>
                                  <td className="px-4 py-2">{item.lote || '-'}</td>
                                  <td className="px-4 py-2 text-right">{formatNumber(item.disponible_UMBas)}</td>
                                  <td className="px-4 py-2 text-center">{formatDate(item.fecha_vence)}</td>
                                  <td className="px-4 py-2 text-center">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                      dias < 0 ? 'bg-red-600 text-white' : 'bg-orange-500 text-white'
                                    }`}>
                                      {dias < 0 ? `${Math.abs(dias)}d vencido` : `${dias}d`}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2">{item.bodega}</td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Distribución de Vencimientos</h3>
                  <div className="flex items-end gap-2 h-32">
                    {[
                      { label: 'Vencidos', count: vencimientos.vencidos.length, color: 'bg-red-500' },
                      { label: '0-30d', count: vencimientos.proximos30.length, color: 'bg-orange-500' },
                      { label: '31-90d', count: vencimientos.proximos90.length, color: 'bg-yellow-500' },
                      { label: '+90d', count: vencimientos.ok.length, color: 'bg-green-500' },
                      { label: 'N/A', count: vencimientos.sinVencimiento.length, color: 'bg-gray-400' },
                    ].map((bar, idx) => {
                      const maxCount = Math.max(
                        vencimientos.vencidos.length,
                        vencimientos.proximos30.length,
                        vencimientos.proximos90.length,
                        vencimientos.ok.length,
                        vencimientos.sinVencimiento.length,
                        1
                      );
                      const height = (bar.count / maxCount) * 100;
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center">
                          <div className="text-xs font-medium mb-1">{bar.count}</div>
                          <div 
                            className={`w-full ${bar.color} rounded-t`}
                            style={{ height: `${Math.max(height, 5)}%` }}
                          />
                          <div className="text-xs text-gray-600 mt-1">{bar.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {seccionActiva === 'antiguedad' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-green-100 border border-green-300 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-green-700">{antiguedad.rango0_30.length}</div>
                    <div className="text-sm text-green-600">0-30 días</div>
                    <div className="text-xs text-green-500">Stock fresco</div>
                  </div>
                  <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-blue-700">{antiguedad.rango31_60.length}</div>
                    <div className="text-sm text-blue-600">31-60 días</div>
                    <div className="text-xs text-blue-500">Normal</div>
                  </div>
                  <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-yellow-700">{antiguedad.rango61_90.length}</div>
                    <div className="text-sm text-yellow-600">61-90 días</div>
                    <div className="text-xs text-yellow-500">Atención</div>
                  </div>
                  <div className="bg-red-100 border border-red-300 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-red-700">{antiguedad.rangoMas90.length}</div>
                    <div className="text-sm text-red-600">+90 días</div>
                    <div className="text-xs text-red-500">Estancado</div>
                  </div>
                  <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-gray-700">{antiguedad.sinFechaIngreso.length}</div>
                    <div className="text-sm text-gray-600">Sin Fecha</div>
                  </div>
                </div>

                {antiguedad.rangoMas90.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-amber-600 text-white px-4 py-3 font-medium flex items-center gap-2">
                      <ClockIcon className="h-5 w-5" />
                      Stock Estancado (+90 días en inventario)
                    </div>
                    <div className="overflow-x-auto max-h-80 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="text-left px-4 py-2 font-medium">Código</th>
                            <th className="text-left px-4 py-2 font-medium">Producto</th>
                            <th className="text-right px-4 py-2 font-medium">Disponible</th>
                            <th className="text-right px-4 py-2 font-medium">Valor</th>
                            <th className="text-center px-4 py-2 font-medium">Fecha Ingreso</th>
                            <th className="text-center px-4 py-2 font-medium">Días</th>
                            <th className="text-left px-4 py-2 font-medium">Bodega</th>
                          </tr>
                        </thead>
                        <tbody>
                          {antiguedad.rangoMas90
                            .sort((a, b) => getDiasEnInventario(b.fecha_ingreso || '') - getDiasEnInventario(a.fecha_ingreso || ''))
                            .slice(0, 50)
                            .map((item, idx) => {
                              const dias = getDiasEnInventario(item.fecha_ingreso || '');
                              return (
                                <tr key={idx} className="border-t hover:bg-gray-50">
                                  <td className="px-4 py-2 font-mono text-xs">{item.codigo}</td>
                                  <td className="px-4 py-2">{item.nombre}</td>
                                  <td className="px-4 py-2 text-right">{formatNumber(item.disponible_UMBas)}</td>
                                  <td className="px-4 py-2 text-right">{formatCurrency(item.valor_total)}</td>
                                  <td className="px-4 py-2 text-center">{formatDate(item.fecha_ingreso || '')}</td>
                                  <td className="px-4 py-2 text-center">
                                    <span className="px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-700">
                                      {dias} días
                                    </span>
                                  </td>
                                  <td className="px-4 py-2">{item.bodega}</td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Distribución por Antigüedad</h3>
                  <div className="space-y-3">
                    {[
                      { label: '0-30 días (Fresco)', count: antiguedad.rango0_30.length, color: 'bg-green-500' },
                      { label: '31-60 días (Normal)', count: antiguedad.rango31_60.length, color: 'bg-blue-500' },
                      { label: '61-90 días (Atención)', count: antiguedad.rango61_90.length, color: 'bg-yellow-500' },
                      { label: '+90 días (Estancado)', count: antiguedad.rangoMas90.length, color: 'bg-red-500' },
                    ].map((bar, idx) => {
                      const total = antiguedad.rango0_30.length + antiguedad.rango31_60.length + 
                                    antiguedad.rango61_90.length + antiguedad.rangoMas90.length;
                      const pct = total > 0 ? (bar.count / total) * 100 : 0;
                      return (
                        <div key={idx}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{bar.label}</span>
                            <span className="font-medium">{bar.count} ({pct.toFixed(1)}%)</span>
                          </div>
                          <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${bar.color} rounded-full`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {seccionActiva === 'bodegas' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <CubeIcon className="h-5 w-5 text-blue-500" />
                      Unidades por Bodega
                    </h3>
                    <div className="space-y-3">
                      {bodegaResumen.slice(0, 10).map((bodega, idx) => {
                        const pct = (bodega.totalUnidades / getMaxBodegaUnidades()) * 100;
                        return (
                          <div key={idx}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="truncate">{bodega.nombre}</span>
                              <span className="font-medium">{formatNumber(bodega.totalUnidades)}</span>
                            </div>
                            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <ChartPieIcon className="h-5 w-5 text-emerald-500" />
                      SKUs por Bodega
                    </h3>
                    <div className="space-y-3">
                      {bodegaResumen.slice(0, 10).map((bodega, idx) => {
                        const maxSKUs = Math.max(...bodegaResumen.map(b => b.totalSKUs), 1);
                        const pct = (bodega.totalSKUs / maxSKUs) * 100;
                        return (
                          <div key={idx}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="truncate">{bodega.nombre}</span>
                              <span className="font-medium">{bodega.totalSKUs} SKUs</span>
                            </div>
                            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-blue-600 text-white px-4 py-3 font-medium">
                    Resumen por Bodega
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-4 py-3 font-medium">Bodega</th>
                          <th className="text-right px-4 py-3 font-medium">SKUs</th>
                          <th className="text-right px-4 py-3 font-medium">Unidades</th>
                          <th className="text-right px-4 py-3 font-medium">Valor Total</th>
                          <th className="text-right px-4 py-3 font-medium">% Inventario</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bodegaResumen.map((bodega, idx) => {
                          const totalUnidades = bodegaResumen.reduce((sum, b) => sum + b.totalUnidades, 0);
                          const pct = totalUnidades > 0 ? (bodega.totalUnidades / totalUnidades) * 100 : 0;
                          return (
                            <tr key={idx} className="border-t hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium">{bodega.nombre}</td>
                              <td className="px-4 py-3 text-right">{formatNumber(bodega.totalSKUs)}</td>
                              <td className="px-4 py-3 text-right">{formatNumber(bodega.totalUnidades)}</td>
                              <td className="px-4 py-3 text-right">{formatCurrency(bodega.valorTotal)}</td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-blue-500 rounded-full"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <span className="text-xs">{pct.toFixed(1)}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {seccionActiva === 'composicion' && (
              <div className="space-y-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <ChartPieIcon className="h-5 w-5 text-emerald-500" />
                    Treemap de Familias (por volumen)
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {familiaResumen.slice(0, 20).map((familia, idx) => {
                      const colors = [
                        'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500',
                        'bg-cyan-500', 'bg-rose-500', 'bg-indigo-500', 'bg-teal-500',
                        'bg-orange-500', 'bg-pink-500', 'bg-lime-500', 'bg-sky-500'
                      ];
                      const minSize = 60;
                      const maxSize = 200;
                      const size = Math.max(minSize, Math.min(maxSize, familia.porcentaje * 10));
                      
                      return (
                        <div
                          key={idx}
                          className={`${colors[idx % colors.length]} text-white rounded-lg p-2 flex flex-col justify-center items-center`}
                          style={{ 
                            width: `${size}px`, 
                            height: `${size}px`,
                            flexGrow: familia.porcentaje > 5 ? familia.porcentaje / 10 : 0
                          }}
                          title={`${familia.nombre}: ${formatNumber(familia.totalUnidades)} unidades (${familia.porcentaje.toFixed(1)}%)`}
                        >
                          <div className="text-xs font-bold text-center truncate w-full">
                            {familia.nombre.length > 15 ? familia.nombre.substring(0, 15) + '...' : familia.nombre}
                          </div>
                          <div className="text-xs opacity-80">{familia.porcentaje.toFixed(1)}%</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-emerald-600 text-white px-4 py-3 font-medium">
                    Composición por Familia
                  </div>
                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="text-left px-4 py-3 font-medium">#</th>
                          <th className="text-left px-4 py-3 font-medium">Familia</th>
                          <th className="text-right px-4 py-3 font-medium">SKUs</th>
                          <th className="text-right px-4 py-3 font-medium">Unidades</th>
                          <th className="text-right px-4 py-3 font-medium">% del Total</th>
                          <th className="text-left px-4 py-3 font-medium">Distribución</th>
                        </tr>
                      </thead>
                      <tbody>
                        {familiaResumen.map((familia, idx) => (
                          <tr key={idx} className="border-t hover:bg-gray-50">
                            <td className="px-4 py-2 text-gray-500">{idx + 1}</td>
                            <td className="px-4 py-2 font-medium">{familia.nombre}</td>
                            <td className="px-4 py-2 text-right">{formatNumber(familia.totalSKUs)}</td>
                            <td className="px-4 py-2 text-right">{formatNumber(familia.totalUnidades)}</td>
                            <td className="px-4 py-2 text-right font-medium">{familia.porcentaje.toFixed(1)}%</td>
                            <td className="px-4 py-2">
                              <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: `${familia.porcentaje}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-sm text-blue-600 mb-1">Total SKUs</div>
                    <div className="text-2xl font-bold text-blue-700">
                      {formatNumber(familiaResumen.reduce((sum, f) => sum + f.totalSKUs, 0))}
                    </div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <div className="text-sm text-emerald-600 mb-1">Total Unidades</div>
                    <div className="text-2xl font-bold text-emerald-700">
                      {formatNumber(familiaResumen.reduce((sum, f) => sum + f.totalUnidades, 0))}
                    </div>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="text-sm text-purple-600 mb-1">Total Familias</div>
                    <div className="text-2xl font-bold text-purple-700">
                      {familiaResumen.length}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {inventario.length === 0 && !loading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <CubeIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sin datos de inventario</h3>
            <p className="text-gray-500">
              Seleccione una bodega y haga clic en "Analizar Inventario" para cargar los datos
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default AnalisisInventario;
