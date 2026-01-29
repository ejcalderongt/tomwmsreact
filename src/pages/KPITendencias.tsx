import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import ReportDescription from '@/components/ReportDescription';
import { ChartBarSquareIcon, CalendarIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { kpiAPI, KpiTendenciaDespachoItem, KpiHeatmapItem } from '@/api/api';
import { getToken, logout } from '@/utils/auth';

interface TendenciaMetrics {
  totalDespachado: number;
  totalPeriodos: number;
  promedioPorPeriodo: number;
  tendenciaPorPeriodo: { periodo: string; cantidad: number }[];
  topFamilias: { familia: string; cantidad: number; porcentaje: number }[];
  topProductos: { codigo: string; nombre: string; familia: string; cantidad: number; porcentaje: number }[];
  crecimientoMensual: number;
}

interface HeatmapMetrics {
  totalDespachos: number;
  totalLineas: number;
  totalCantidad: number;
  heatmapData: { dia: number; diaNombre: string; hora: number; despachos: number; lineas: number; cantidad: number }[];
  horaPico: { hora: number; lineas: number };
  diaPico: { dia: string; lineas: number };
  maxValue: number;
}

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DIAS_ORDEN = [1, 2, 3, 4, 5, 6, 0];

function KPITendencias() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tendencias, setTendencias] = useState<TendenciaMetrics | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapMetrics | null>(null);
  const [vistaActiva, setVistaActiva] = useState<'tendencias' | 'heatmap'>('tendencias');

  const today = new Date();
  const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1);
  
  const [fechaDesde, setFechaDesde] = useState<string>(threeMonthsAgo.toISOString().split('T')[0]);
  const [fechaHasta, setFechaHasta] = useState<string>(today.toISOString().split('T')[0]);

  useEffect(() => {
    document.title = 'TOMWMSUX - KPI Tendencias';
  }, []);

  const procesarTendencias = (data: KpiTendenciaDespachoItem[]): TendenciaMetrics => {
    const familias = data.filter(d => d.nivel === 'FAMILIA');
    const productos = data.filter(d => d.nivel === 'PRODUCTO');
    
    const tendenciaPorPeriodo: { [key: string]: number } = {};
    familias.forEach(item => {
      const periodo = item.periodo.split('T')[0];
      tendenciaPorPeriodo[periodo] = (tendenciaPorPeriodo[periodo] || 0) + item.cantidad_Despachada;
    });
    
    const tendenciaOrdenada = Object.entries(tendenciaPorPeriodo)
      .map(([periodo, cantidad]) => ({ periodo, cantidad }))
      .sort((a, b) => a.periodo.localeCompare(b.periodo));
    
    const totalDespachado = Object.values(tendenciaPorPeriodo).reduce((sum, val) => sum + val, 0);
    const totalPeriodos = Object.keys(tendenciaPorPeriodo).length;
    
    const familiasAgrupadas: { [key: string]: number } = {};
    familias.forEach(item => {
      familiasAgrupadas[item.familia] = (familiasAgrupadas[item.familia] || 0) + item.cantidad_Despachada;
    });
    
    const topFamilias = Object.entries(familiasAgrupadas)
      .map(([familia, cantidad]) => ({
        familia,
        cantidad,
        porcentaje: totalDespachado > 0 ? (cantidad / totalDespachado) * 100 : 0
      }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10);
    
    const productosAgrupados: { [key: string]: { nombre: string; familia: string; cantidad: number } } = {};
    productos.forEach(item => {
      const codigo = item.codigo_Producto || '';
      if (!productosAgrupados[codigo]) {
        productosAgrupados[codigo] = { 
          nombre: item.nombre_Producto || '', 
          familia: item.familia, 
          cantidad: 0 
        };
      }
      productosAgrupados[codigo].cantidad += item.cantidad_Despachada;
    });
    
    const topProductos = Object.entries(productosAgrupados)
      .map(([codigo, data]) => ({
        codigo,
        nombre: data.nombre,
        familia: data.familia,
        cantidad: data.cantidad,
        porcentaje: totalDespachado > 0 ? (data.cantidad / totalDespachado) * 100 : 0
      }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 15);
    
    let crecimientoMensual = 0;
    if (tendenciaOrdenada.length >= 2) {
      const ultimo = tendenciaOrdenada[tendenciaOrdenada.length - 1].cantidad;
      const primero = tendenciaOrdenada[0].cantidad;
      if (primero > 0) {
        crecimientoMensual = ((ultimo - primero) / primero) * 100;
      }
    }
    
    return {
      totalDespachado,
      totalPeriodos,
      promedioPorPeriodo: totalPeriodos > 0 ? totalDespachado / totalPeriodos : 0,
      tendenciaPorPeriodo: tendenciaOrdenada,
      topFamilias,
      topProductos,
      crecimientoMensual
    };
  };

  const procesarHeatmap = (data: KpiHeatmapItem[]): HeatmapMetrics => {
    const totalDespachos = data.reduce((sum, d) => sum + d.despachos, 0);
    const totalLineas = data.reduce((sum, d) => sum + d.lineas, 0);
    const totalCantidad = data.reduce((sum, d) => sum + d.cantidad, 0);
    
    const heatmapData = data.map(d => ({
      dia: d.diaSemana,
      diaNombre: DIAS_SEMANA[d.diaSemana] || d.diaNombre,
      hora: d.hora,
      despachos: d.despachos,
      lineas: d.lineas,
      cantidad: d.cantidad
    }));
    
    const maxValue = Math.max(...data.map(d => d.lineas), 1);
    
    const porHora: { [key: number]: number } = {};
    const porDia: { [key: string]: number } = {};
    
    data.forEach(d => {
      porHora[d.hora] = (porHora[d.hora] || 0) + d.lineas;
      const diaNombre = DIAS_SEMANA[d.diaSemana] || d.diaNombre;
      porDia[diaNombre] = (porDia[diaNombre] || 0) + d.lineas;
    });
    
    const horaPico = Object.entries(porHora)
      .map(([hora, lineas]) => ({ hora: parseInt(hora), lineas }))
      .sort((a, b) => b.lineas - a.lineas)[0] || { hora: 0, lineas: 0 };
    
    const diaPico = Object.entries(porDia)
      .map(([dia, lineas]) => ({ dia, lineas }))
      .sort((a, b) => b.lineas - a.lineas)[0] || { dia: '-', lineas: 0 };
    
    return {
      totalDespachos,
      totalLineas,
      totalCantidad,
      heatmapData,
      horaPico,
      diaPico,
      maxValue
    };
  };

  const consultarKPI = async () => {
    const token = getToken();
    if (!token) {
      logout();
      navigate('/login', { replace: true });
      return;
    }

    setLoading(true);
    try {
      const [tendenciasData, heatmapData] = await Promise.all([
        kpiAPI.getTendenciasDespacho(fechaDesde, fechaHasta),
        kpiAPI.getHeatmapDiaHora(fechaDesde, fechaHasta)
      ]);
      
      if (tendenciasData.length === 0 && heatmapData.length === 0) {
        toast('No se encontraron datos para el rango de fechas seleccionado', {
          icon: 'ℹ️',
          style: { background: '#3b82f6', color: '#fff' }
        });
        setTendencias(null);
        setHeatmap(null);
      } else {
        if (tendenciasData.length > 0) {
          setTendencias(procesarTendencias(tendenciasData));
        }
        if (heatmapData.length > 0) {
          setHeatmap(procesarHeatmap(heatmapData));
        }
        toast.success(`Tendencias: ${tendenciasData.length} registros | Heatmap: ${heatmapData.length} registros`);
      }
    } catch (error) {
      console.error('Error al consultar KPI:', error);
      toast.error('Error al consultar los indicadores');
      setTendencias(null);
      setHeatmap(null);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value: number, decimals: number = 0) => {
    return value.toLocaleString('es-ES', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
  };

  const formatPercent = (value: number) => {
    return value.toFixed(1) + '%';
  };

  const formatFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  const getHeatmapColor = (value: number, max: number) => {
    if (value === 0) return 'bg-gray-100';
    const intensity = Math.min(value / max, 1);
    if (intensity < 0.2) return 'bg-blue-100';
    if (intensity < 0.4) return 'bg-blue-200';
    if (intensity < 0.6) return 'bg-blue-400';
    if (intensity < 0.8) return 'bg-blue-500';
    return 'bg-blue-700';
  };

  const getHeatmapTextColor = (value: number, max: number) => {
    if (value === 0) return 'text-gray-400';
    const intensity = Math.min(value / max, 1);
    return intensity >= 0.6 ? 'text-white' : 'text-gray-900';
  };

  return (
    <Layout pageTitle="KPI Tendencias">
      <div className="space-y-6">
        <ReportDescription
          title="Análisis de Tendencias"
          description="Visualiza patrones históricos de despacho y actividad operativa. Incluye análisis de tendencias por período y un mapa de calor día/hora para identificar picos de demanda y optimizar la planificación de recursos."
          metrics={[
            "Tendencia de despachos en el tiempo",
            "Crecimiento % entre períodos",
            "Top familias y productos más despachados",
            "Heatmap: actividad por día y hora"
          ]}
          interpretation="Use las tendencias para detectar estacionalidad y planificar inventario. El heatmap muestra las horas y días de mayor actividad para optimizar turnos de personal. Los productos top ayudan a priorizar ubicaciones de picking."
          color="indigo"
        />
        
        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                Fecha Desde
              </label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="flex-1 min-w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                Fecha Hasta
              </label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <button
              onClick={consultarKPI}
              disabled={loading}
              className="flex items-center px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Consultando...' : 'Consultar Tendencias'}
            </button>
          </div>

          {/* Tabs */}
          {(tendencias || heatmap) && (
            <div className="mt-4 border-t pt-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setVistaActiva('tendencias')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    vistaActiva === 'tendencias'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Tendencias de Despacho
                </button>
                <button
                  onClick={() => setVistaActiva('heatmap')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    vistaActiva === 'heatmap'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Heatmap Día/Hora
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Vista Tendencias */}
        {vistaActiva === 'tendencias' && tendencias && (
          <>
            {/* Indicadores principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500 mb-2">Total Despachado</p>
                  <p className="text-3xl font-bold text-indigo-600">{formatNumber(tendencias.totalDespachado)}</p>
                  <p className="text-xs text-gray-400 mt-1">unidades</p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500 mb-2">Períodos Analizados</p>
                  <p className="text-3xl font-bold text-blue-600">{formatNumber(tendencias.totalPeriodos)}</p>
                  <p className="text-xs text-gray-400 mt-1">días con datos</p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500 mb-2">Promedio por Período</p>
                  <p className="text-3xl font-bold text-green-600">{formatNumber(tendencias.promedioPorPeriodo, 1)}</p>
                  <p className="text-xs text-gray-400 mt-1">unidades/día</p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500 mb-2">Crecimiento</p>
                  <p className={`text-3xl font-bold ${tendencias.crecimientoMensual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {tendencias.crecimientoMensual >= 0 ? '+' : ''}{formatPercent(tendencias.crecimientoMensual)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">vs inicio período</p>
                </div>
              </div>
            </div>

            {/* Gráfico de tendencia */}
            {tendencias.tendenciaPorPeriodo.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Tendencia de Despachos por Día</h3>
                <div className="h-64 overflow-x-auto">
                  <div className="flex items-end gap-1 h-full min-w-max pb-8">
                    {tendencias.tendenciaPorPeriodo.map((item, idx) => {
                      const maxCantidad = Math.max(...tendencias.tendenciaPorPeriodo.map(t => t.cantidad));
                      const heightPercent = maxCantidad > 0 ? (item.cantidad / maxCantidad) * 100 : 0;
                      return (
                        <div key={idx} className="flex flex-col items-center" style={{ minWidth: '40px' }}>
                          <div 
                            className="w-6 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t hover:from-indigo-700 hover:to-indigo-500 transition-all cursor-pointer group relative"
                            style={{ height: `${Math.max(heightPercent * 2, 4)}px` }}
                            title={`${formatFecha(item.periodo)}: ${formatNumber(item.cantidad)} unidades`}
                          >
                            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                              {formatNumber(item.cantidad)}
                            </div>
                          </div>
                          <span className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top-left">
                            {formatFecha(item.periodo)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Top Familias y Productos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Familias */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Top 10 Familias</h3>
                <div className="space-y-3">
                  {tendencias.topFamilias.map((item, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 truncate flex items-center">
                          <span className="w-6 text-center font-bold text-gray-400">{idx + 1}</span>
                          <span className="ml-2" title={item.familia}>{item.familia}</span>
                        </span>
                        <span className="text-gray-900 font-medium">{formatNumber(item.cantidad)} ({formatPercent(item.porcentaje)})</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 ml-8">
                        <div 
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full" 
                          style={{ width: `${item.porcentaje}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Productos */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Top 15 Productos</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {tendencias.topProductos.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                      <span className="w-6 text-center font-bold text-gray-400 text-sm">{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate" title={item.nombre}>{item.nombre}</p>
                        <p className="text-xs text-gray-500">{item.codigo} | {item.familia}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-indigo-600">{formatNumber(item.cantidad)}</p>
                        <p className="text-xs text-gray-400">{formatPercent(item.porcentaje)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Vista Heatmap */}
        {vistaActiva === 'heatmap' && heatmap && (
          <>
            {/* Indicadores principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500 mb-2">Total Despachos</p>
                  <p className="text-3xl font-bold text-indigo-600">{formatNumber(heatmap.totalDespachos)}</p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500 mb-2">Total Líneas</p>
                  <p className="text-3xl font-bold text-blue-600">{formatNumber(heatmap.totalLineas)}</p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500 mb-2">Hora Pico</p>
                  <p className="text-3xl font-bold text-amber-600">{heatmap.horaPico.hora.toString().padStart(2, '0')}:00</p>
                  <p className="text-xs text-gray-400 mt-1">{formatNumber(heatmap.horaPico.lineas)} líneas</p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500 mb-2">Día Pico</p>
                  <p className="text-3xl font-bold text-green-600">{heatmap.diaPico.dia}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatNumber(heatmap.diaPico.lineas)} líneas</p>
                </div>
              </div>
            </div>

            {/* Heatmap Grid */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Mapa de Calor: Actividad por Día y Hora</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Día / Hora</th>
                      {Array.from({ length: 24 }, (_, i) => (
                        <th key={i} className="px-1 py-2 text-center text-xs font-medium text-gray-500 w-10">
                          {i.toString().padStart(2, '0')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DIAS_ORDEN.map((diaNum) => {
                      const diaNombre = DIAS_SEMANA[diaNum];
                      return (
                        <tr key={diaNum}>
                          <td className="px-2 py-1 text-sm font-medium text-gray-700 whitespace-nowrap">
                            {diaNombre}
                          </td>
                          {Array.from({ length: 24 }, (_, hora) => {
                            const celda = heatmap.heatmapData.find(d => d.dia === diaNum && d.hora === hora);
                            const valor = celda?.lineas || 0;
                            return (
                              <td 
                                key={hora} 
                                className={`px-1 py-1 text-center text-xs ${getHeatmapColor(valor, heatmap.maxValue)} ${getHeatmapTextColor(valor, heatmap.maxValue)} cursor-pointer hover:ring-2 hover:ring-indigo-500`}
                                title={`${diaNombre} ${hora}:00 - Líneas: ${formatNumber(valor)}`}
                              >
                                {valor > 0 ? formatNumber(valor) : ''}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Leyenda */}
              <div className="flex items-center justify-end gap-2 mt-4">
                <span className="text-xs text-gray-500">Menos</span>
                <div className="w-4 h-4 bg-gray-100 rounded"></div>
                <div className="w-4 h-4 bg-blue-100 rounded"></div>
                <div className="w-4 h-4 bg-blue-200 rounded"></div>
                <div className="w-4 h-4 bg-blue-400 rounded"></div>
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <div className="w-4 h-4 bg-blue-700 rounded"></div>
                <span className="text-xs text-gray-500">Más</span>
              </div>
            </div>

            {/* Resumen por hora y día */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Por Hora */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Distribución por Hora del Día</h3>
                <div className="space-y-2">
                  {Array.from({ length: 24 }, (_, hora) => {
                    const totalHora = heatmap.heatmapData
                      .filter(d => d.hora === hora)
                      .reduce((sum, d) => sum + d.lineas, 0);
                    const maxHora = Math.max(...Array.from({ length: 24 }, (_, h) => 
                      heatmap.heatmapData.filter(d => d.hora === h).reduce((sum, d) => sum + d.lineas, 0)
                    ));
                    if (totalHora === 0) return null;
                    const porcentaje = maxHora > 0 ? (totalHora / maxHora) * 100 : 0;
                    return (
                      <div key={hora} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-12">{hora.toString().padStart(2, '0')}:00</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full"
                            style={{ width: `${porcentaje}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600 w-12 text-right">{formatNumber(totalHora)}</span>
                      </div>
                    );
                  }).filter(Boolean)}
                </div>
              </div>

              {/* Por Día */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Distribución por Día de la Semana</h3>
                <div className="space-y-3">
                  {DIAS_ORDEN.map((diaNum) => {
                    const diaNombre = DIAS_SEMANA[diaNum];
                    const totalDia = heatmap.heatmapData
                      .filter(d => d.dia === diaNum)
                      .reduce((sum, d) => sum + d.lineas, 0);
                    const maxDia = Math.max(...DIAS_ORDEN.map(d => 
                      heatmap.heatmapData.filter(h => h.dia === d).reduce((sum, h) => sum + h.lineas, 0)
                    ));
                    const porcentaje = maxDia > 0 ? (totalDia / maxDia) * 100 : 0;
                    return (
                      <div key={diaNum}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700">{diaNombre}</span>
                          <span className="text-gray-900 font-medium">{formatNumber(totalDia)} líneas</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full" 
                            style={{ width: `${porcentaje}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Estado inicial */}
        {!tendencias && !heatmap && !loading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <ChartBarSquareIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Sin datos</h3>
              <p className="mt-1 text-sm text-gray-500">
                Selecciona un rango de fechas y presiona "Consultar Tendencias" para ver el análisis.
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default KPITendencias;
