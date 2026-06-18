import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import ReportDescription from '@/components/ReportDescription';
import { TruckIcon, CalendarIcon, ArrowPathIcon, ClockIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { kpiAPI, KpiRecepcionItem } from '@/api/api';
import { getToken, logout } from '@/utils/auth';

interface KPIMetrics {
  totalRecepciones: number;
  totalLineas: number;
  totalSolicitado: number;
  totalRecibido: number;
  porcentajeCumplimiento: number;
  totalDevoluciones: number;
  recepcionesPorOperador: { [key: string]: number };
  recepcionesPorProveedor: { [key: string]: number };
  recepcionesPorTipo: { [key: string]: number };
  recepcionesPorEstado: { [key: string]: number };
  promedioLineasPorRecepcion: number;
}

interface ProductividadMetrics {
  tiempoPromedioMinutos: number;
  lineasPorHora: number;
  productividadPorOperador: { operador: string; lineas: number; tiempoMinutos: number; lineasPorHora: number }[];
  distribucionPorHora: { hora: number; lineas: number }[];
  tiempoTotalHoras: number;
}

function KPIRecepcion() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<KpiRecepcionItem[]>([]);
  const [metrics, setMetrics] = useState<KPIMetrics | null>(null);
  const [productividad, setProductividad] = useState<ProductividadMetrics | null>(null);

  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  const [fechaDesde, setFechaDesde] = useState<string>(thirtyDaysAgo.toISOString().split('T')[0]);
  const [fechaHasta, setFechaHasta] = useState<string>(today.toISOString().split('T')[0]);

  useEffect(() => {
    document.title = 'TOMWMSUX - KPI Recepción';
  }, []);

  const calcularMetricas = (items: KpiRecepcionItem[]): KPIMetrics => {
    const recepcionesUnicas = new Set(items.map(i => i.id_Recepcion));
    const totalSolicitado = items.reduce((sum, i) => sum + (i.cantidad_Solicita_OC || 0), 0);
    const totalRecibido = items.reduce((sum, i) => sum + (i.cantidad_Recibida || 0), 0);
    const totalDevoluciones = items.reduce((sum, i) => sum + (i.cantidad_Devolucion_OC || 0), 0);
    
    const recepcionesPorOperador: { [key: string]: number } = {};
    const recepcionesPorProveedor: { [key: string]: number } = {};
    const recepcionesPorTipo: { [key: string]: number } = {};
    const recepcionesPorEstado: { [key: string]: number } = {};
    
    items.forEach(item => {
      const operador = item.descripción_Operador?.trim() || 'Sin asignar';
      const proveedor = item.descripción_Proveedor?.trim() || 'Sin proveedor';
      const tipo = item.tipo_Local_Importación || 'Sin tipo';
      const estado = item.nombre_Producto_Estado || 'Sin estado';
      
      recepcionesPorOperador[operador] = (recepcionesPorOperador[operador] || 0) + 1;
      recepcionesPorProveedor[proveedor] = (recepcionesPorProveedor[proveedor] || 0) + 1;
      recepcionesPorTipo[tipo] = (recepcionesPorTipo[tipo] || 0) + 1;
      recepcionesPorEstado[estado] = (recepcionesPorEstado[estado] || 0) + 1;
    });

    return {
      totalRecepciones: recepcionesUnicas.size,
      totalLineas: items.length,
      totalSolicitado,
      totalRecibido,
      porcentajeCumplimiento: totalSolicitado > 0 ? (totalRecibido / totalSolicitado) * 100 : 0,
      totalDevoluciones,
      recepcionesPorOperador,
      recepcionesPorProveedor,
      recepcionesPorTipo,
      recepcionesPorEstado,
      promedioLineasPorRecepcion: recepcionesUnicas.size > 0 ? items.length / recepcionesUnicas.size : 0
    };
  };

  const calcularProductividad = (items: KpiRecepcionItem[]): ProductividadMetrics => {
    const operadorData: { [key: string]: { lineas: number; tiempoMs: number } } = {};
    const distribucionHora: { [key: number]: number } = {};
    
    let tiempoTotalMs = 0;
    let recepcionesConTiempo = 0;
    const recepcionesProcesadas = new Set<number>();
    
    items.forEach(item => {
      const operador = item.descripción_Operador?.trim() || 'Sin asignar';
      
      if (!operadorData[operador]) {
        operadorData[operador] = { lineas: 0, tiempoMs: 0 };
      }
      operadorData[operador].lineas += 1;
      
      if (item.fecha_Hora_Inicio && item.fecha_Hora_Fin) {
        const inicio = new Date(item.fecha_Hora_Inicio);
        const fin = new Date(item.fecha_Hora_Fin);
        
        if (!isNaN(inicio.getTime()) && !isNaN(fin.getTime()) && fin > inicio) {
          if (!recepcionesProcesadas.has(item.id_Recepcion)) {
            const diffMs = fin.getTime() - inicio.getTime();
            tiempoTotalMs += diffMs;
            recepcionesConTiempo++;
            recepcionesProcesadas.add(item.id_Recepcion);
            
            operadorData[operador].tiempoMs += diffMs;
          }
          
          const hora = inicio.getHours();
          distribucionHora[hora] = (distribucionHora[hora] || 0) + 1;
        }
      }
    });
    
    const tiempoPromedioMinutos = recepcionesConTiempo > 0 ? (tiempoTotalMs / recepcionesConTiempo) / 60000 : 0;
    const tiempoTotalHoras = tiempoTotalMs / 3600000;
    const lineasPorHora = tiempoTotalHoras > 0 ? items.length / tiempoTotalHoras : 0;
    
    const productividadPorOperador = Object.entries(operadorData)
      .map(([operador, data]) => {
        const tiempoHoras = data.tiempoMs / 3600000;
        return {
          operador,
          lineas: data.lineas,
          tiempoMinutos: data.tiempoMs / 60000,
          lineasPorHora: tiempoHoras > 0 ? data.lineas / tiempoHoras : 0
        };
      })
      .filter(o => o.tiempoMinutos > 0)
      .sort((a, b) => b.lineasPorHora - a.lineasPorHora);
    
    const distribucionPorHora = Array.from({ length: 24 }, (_, i) => ({
      hora: i,
      lineas: distribucionHora[i] || 0
    })).filter(h => h.lineas > 0);
    
    return {
      tiempoPromedioMinutos,
      lineasPorHora,
      productividadPorOperador,
      distribucionPorHora,
      tiempoTotalHoras
    };
  };

  const consultarKPI = async () => {
    const token = getToken();
    if (!token) {
      logout();
      navigate('/login', { replace: true });
      return;
    }

    const diffDays = Math.ceil((new Date(fechaHasta).getTime() - new Date(fechaDesde).getTime()) / 86400000);
    if (diffDays > 31) {
      toast.error(`Rango máximo permitido: 31 días. El período seleccionado tiene ${diffDays} días. Reduzca el rango para evitar timeout.`, { duration: 6000 });
      return;
    }

    setLoading(true);
    try {
      const resultado = await kpiAPI.getRecepcion(fechaDesde, fechaHasta);
      setData(resultado);
      
      if (resultado.length === 0) {
        toast('No se encontraron datos para el rango de fechas seleccionado', {
          icon: 'ℹ️',
          style: { background: '#3b82f6', color: '#fff' }
        });
        setMetrics(null);
        setProductividad(null);
      } else {
        const metricas = calcularMetricas(resultado);
        const prod = calcularProductividad(resultado);
        setMetrics(metricas);
        setProductividad(prod);
        toast.success(`Se procesaron ${resultado.length} registros de recepción`);
      }
    } catch (error) {
      console.error('Error al consultar KPI:', error);
      const msg = error instanceof Error ? error.message : '';
      toast.error(msg.startsWith('TIMEOUT') ? msg : 'Error al consultar los indicadores. Intente con un rango de fechas menor.', { duration: 6000 });
      setMetrics(null);
      setProductividad(null);
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

  const formatTiempo = (minutos: number) => {
    if (minutos < 60) {
      return `${minutos.toFixed(1)} min`;
    }
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins.toFixed(0)}m`;
  };

  return (
    <Layout pageTitle="KPI Recepción">
      <div className="space-y-6">
        <ReportDescription
          title="Indicador de Recepción"
          description="Evalúa la eficiencia del proceso de ingreso de mercadería al almacén. Compara las cantidades recibidas contra las solicitadas en órdenes de compra, identificando discrepancias con proveedores y tiempos de procesamiento."
          metrics={[
            "% Cumplimiento: unidades recibidas vs solicitadas",
            "Recepciones y líneas procesadas por período",
            "Devoluciones a proveedores",
            "Productividad por operador de recepción"
          ]}
          interpretation="Cumplimiento ideal ≥95%. Devoluciones frecuentes pueden indicar problemas con proveedores específicos. Analice la distribución por hora para optimizar la programación de entregas y asignación de personal."
          color="cyan"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>

            <button
              onClick={consultarKPI}
              disabled={loading}
              className="flex items-center px-6 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Consultando...' : 'Consultar KPI'}
            </button>
          </div>
        </div>

        {/* Indicadores principales */}
        {metrics && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Recepciones */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
                      <TruckIcon className="h-6 w-6 text-cyan-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Recepciones</p>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.totalRecepciones)}</p>
                  </div>
                </div>
              </div>

              {/* Total Líneas */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Líneas</p>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.totalLineas)}</p>
                  </div>
                </div>
              </div>

              {/* Cumplimiento */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      metrics.porcentajeCumplimiento >= 95 ? 'bg-green-100' :
                      metrics.porcentajeCumplimiento >= 80 ? 'bg-yellow-100' : 'bg-red-100'
                    }`}>
                      <svg className={`h-6 w-6 ${
                        metrics.porcentajeCumplimiento >= 95 ? 'text-green-600' :
                        metrics.porcentajeCumplimiento >= 80 ? 'text-yellow-600' : 'text-red-600'
                      }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Cumplimiento</p>
                    <p className={`text-2xl font-bold ${
                      metrics.porcentajeCumplimiento >= 95 ? 'text-green-600' :
                      metrics.porcentajeCumplimiento >= 80 ? 'text-yellow-600' : 'text-red-600'
                    }`}>{formatPercent(metrics.porcentajeCumplimiento)}</p>
                  </div>
                </div>
              </div>

              {/* Devoluciones */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      metrics.totalDevoluciones === 0 ? 'bg-green-100' : 'bg-orange-100'
                    }`}>
                      <svg className={`h-6 w-6 ${
                        metrics.totalDevoluciones === 0 ? 'text-green-600' : 'text-orange-600'
                      }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Devoluciones OC</p>
                    <p className={`text-2xl font-bold ${
                      metrics.totalDevoluciones === 0 ? 'text-green-600' : 'text-orange-600'
                    }`}>{formatNumber(metrics.totalDevoluciones)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Segunda fila de métricas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Unidades Solicitadas */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500 mb-2">Unidades Solicitadas (OC)</p>
                  <p className="text-3xl font-bold text-gray-900">{formatNumber(metrics.totalSolicitado)}</p>
                </div>
              </div>

              {/* Unidades Recibidas */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500 mb-2">Unidades Recibidas</p>
                  <p className="text-3xl font-bold text-green-600">{formatNumber(metrics.totalRecibido)}</p>
                </div>
              </div>

              {/* Promedio Líneas por Recepción */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500 mb-2">Promedio Líneas/Recepción</p>
                  <p className="text-3xl font-bold text-cyan-600">{formatNumber(metrics.promedioLineasPorRecepcion, 1)}</p>
                </div>
              </div>
            </div>

            {/* Distribución por Estado, Tipo, Operador y Proveedor */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Por Estado del Producto */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Por Estado del Producto</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {Object.entries(metrics.recepcionesPorEstado)
                    .sort((a, b) => b[1] - a[1])
                    .map(([estado, cantidad]) => {
                      const porcentaje = (cantidad / metrics.totalLineas) * 100;
                      const esBuenEstado = estado.toLowerCase().includes('buen');
                      return (
                        <div key={estado}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700 truncate" title={estado}>{estado}</span>
                            <span className="text-gray-900 font-medium">{formatNumber(cantidad)} ({formatPercent(porcentaje)})</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${esBuenEstado ? 'bg-green-600' : 'bg-orange-600'}`}
                              style={{ width: `${porcentaje}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Por Tipo (Local/Importación) */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Por Tipo de Carga</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {Object.entries(metrics.recepcionesPorTipo)
                    .sort((a, b) => b[1] - a[1])
                    .map(([tipo, cantidad]) => {
                      const porcentaje = (cantidad / metrics.totalLineas) * 100;
                      return (
                        <div key={tipo}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700 truncate" title={tipo}>{tipo}</span>
                            <span className="text-gray-900 font-medium">{formatNumber(cantidad)} ({formatPercent(porcentaje)})</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-cyan-600 h-2 rounded-full" 
                              style={{ width: `${porcentaje}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Por Operador */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Líneas por Operador</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {Object.entries(metrics.recepcionesPorOperador)
                    .sort((a, b) => b[1] - a[1])
                    .map(([operador, cantidad]) => {
                      const porcentaje = (cantidad / metrics.totalLineas) * 100;
                      return (
                        <div key={operador}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700 truncate" title={operador}>{operador}</span>
                            <span className="text-gray-900 font-medium">{formatNumber(cantidad)} ({formatPercent(porcentaje)})</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${porcentaje}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Por Proveedor */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Líneas por Proveedor (Top 10)</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {Object.entries(metrics.recepcionesPorProveedor)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10)
                    .map(([proveedor, cantidad]) => {
                      const porcentaje = (cantidad / metrics.totalLineas) * 100;
                      return (
                        <div key={proveedor}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700 truncate" title={proveedor}>{proveedor}</span>
                            <span className="text-gray-900 font-medium">{formatNumber(cantidad)} ({formatPercent(porcentaje)})</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-600 h-2 rounded-full" 
                              style={{ width: `${porcentaje}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Análisis de Tiempos y Productividad */}
            {productividad && (
              <>
                <div className="border-t-4 border-amber-500 pt-6">
                  <div className="flex items-center mb-6">
                    <ClockIcon className="h-8 w-8 text-amber-600 mr-3" />
                    <h2 className="text-xl font-bold text-gray-900">Análisis de Tiempos y Productividad</h2>
                  </div>

                  {/* Indicadores de tiempo */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* Tiempo Promedio */}
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg shadow-sm border border-amber-200 p-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-amber-700 mb-2">Tiempo Promedio/Recepción</p>
                        <p className="text-2xl font-bold text-amber-900">{formatTiempo(productividad.tiempoPromedioMinutos)}</p>
                      </div>
                    </div>

                    {/* Líneas por Hora */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-sm border border-green-200 p-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-green-700 mb-2">Productividad Global</p>
                        <p className="text-2xl font-bold text-green-900">{formatNumber(productividad.lineasPorHora, 1)} <span className="text-sm font-normal">líneas/hora</span></p>
                      </div>
                    </div>

                    {/* Tiempo Total */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-sm border border-blue-200 p-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-blue-700 mb-2">Tiempo Total Operativo</p>
                        <p className="text-2xl font-bold text-blue-900">{formatNumber(productividad.tiempoTotalHoras, 1)} <span className="text-sm font-normal">horas</span></p>
                      </div>
                    </div>

                    {/* Operadores activos */}
                    <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg shadow-sm border border-cyan-200 p-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-cyan-700 mb-2">Operadores con Registro</p>
                        <p className="text-2xl font-bold text-cyan-900">{productividad.productividadPorOperador.length}</p>
                      </div>
                    </div>
                  </div>

                  {/* Productividad por Operador y Distribución por Hora */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Ranking de Productividad */}
                    {productividad.productividadPorOperador.length > 0 && (
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Ranking de Productividad por Operador</h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Operador</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Líneas</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Tiempo</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Líneas/Hora</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {productividad.productividadPorOperador.slice(0, 10).map((item, idx) => (
                                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  <td className="px-3 py-2 text-sm">
                                    {idx === 0 && <span className="text-yellow-500 font-bold">🥇</span>}
                                    {idx === 1 && <span className="text-gray-400 font-bold">🥈</span>}
                                    {idx === 2 && <span className="text-amber-600 font-bold">🥉</span>}
                                    {idx > 2 && <span className="text-gray-500">{idx + 1}</span>}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-900 truncate max-w-32" title={item.operador}>{item.operador}</td>
                                  <td className="px-3 py-2 text-sm text-gray-600 text-right">{formatNumber(item.lineas)}</td>
                                  <td className="px-3 py-2 text-sm text-gray-600 text-right">{formatTiempo(item.tiempoMinutos)}</td>
                                  <td className="px-3 py-2 text-sm font-medium text-right">
                                    <span className={`${
                                      item.lineasPorHora >= productividad.lineasPorHora ? 'text-green-600' : 'text-orange-600'
                                    }`}>
                                      {formatNumber(item.lineasPorHora, 1)}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Distribución por Hora del Día */}
                    {productividad.distribucionPorHora.length > 0 && (
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Actividad por Hora del Día</h3>
                        <div className="space-y-2">
                          {productividad.distribucionPorHora.map(({ hora, lineas }) => {
                            const maxLineas = Math.max(...productividad.distribucionPorHora.map(h => h.lineas));
                            const porcentaje = maxLineas > 0 ? (lineas / maxLineas) * 100 : 0;
                            return (
                              <div key={hora} className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 w-12">{hora.toString().padStart(2, '0')}:00</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-4">
                                  <div 
                                    className="bg-gradient-to-r from-cyan-400 to-cyan-600 h-4 rounded-full flex items-center justify-end pr-2"
                                    style={{ width: `${Math.max(porcentaje, 5)}%` }}
                                  >
                                    {porcentaje > 20 && (
                                      <span className="text-xs text-white font-medium">{formatNumber(lineas)}</span>
                                    )}
                                  </div>
                                </div>
                                {porcentaje <= 20 && (
                                  <span className="text-xs text-gray-600 w-12 text-right">{formatNumber(lineas)}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* Estado inicial */}
        {!metrics && !loading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Sin datos</h3>
              <p className="mt-1 text-sm text-gray-500">
                Selecciona un rango de fechas y presiona "Consultar KPI" para ver los indicadores.
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default KPIRecepcion;
