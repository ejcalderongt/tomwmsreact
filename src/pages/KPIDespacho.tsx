import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import ReportDescription from '@/components/ReportDescription';
import { PaperAirplaneIcon, CalendarIcon, ArrowPathIcon, ClockIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { kpiAPI, KpiDespachoItem, KpiPickingItem, KpiVerificacionItem } from '@/api/api';
import { getToken, logout } from '@/utils/auth';

interface KPIMetrics {
  totalDespachos: number;
  totalLineas: number;
  totalSolicitado: number;
  totalDespachado: number;
  porcentajeCumplimiento: number;
  totalMerma: number;
  totalDañadoPicking: number;
  totalDañadoVerificacion: number;
  totalNoEncontrado: number;
  despachosPorUsuario: { [key: string]: number };
  despachosPorProveedor: { [key: string]: number };
  despachosPorTipoDocumento: { [key: string]: number };
  promedioLineasPorDespacho: number;
}

interface ProductividadMetrics {
  tiempoPromedioMinutos: number;
  lineasPorHora: number;
  productividadPorOperador: { operador: string; lineas: number; tiempoMinutos: number; lineasPorHora: number }[];
  distribucionPorHora: { hora: number; lineas: number }[];
  tiempoTotalHoras: number;
}

interface AnalisisCruzado {
  pickingsEncontrados: number;
  pickingsTotales: number;
  verificacionesEncontradas: number;
  tiempoPickingPromedio: number;
  tiempoVerificacionPromedio: number;
  tiempoDespachoPromedio: number;
  tiempoTotalPromedio: number;
  tiemposPorEtapa: { etapa: string; tiempoMinutos: number; porcentaje: number }[];
  flujoCompleto: { picking: number; verificacion: number; despacho: number; total: number; documentos: number }[];
}

function KPIDespacho() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingCruzado, setLoadingCruzado] = useState(false);
  const [data, setData] = useState<KpiDespachoItem[]>([]);
  const [metrics, setMetrics] = useState<KPIMetrics | null>(null);
  const [productividad, setProductividad] = useState<ProductividadMetrics | null>(null);
  const [analisisCruzado, setAnalisisCruzado] = useState<AnalisisCruzado | null>(null);
  const [mostrarAnalisisCruzado, setMostrarAnalisisCruzado] = useState(false);

  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  const [fechaDesde, setFechaDesde] = useState<string>(thirtyDaysAgo.toISOString().split('T')[0]);
  const [fechaHasta, setFechaHasta] = useState<string>(today.toISOString().split('T')[0]);

  useEffect(() => {
    document.title = 'TOMWMSUX - KPI Despacho';
  }, []);

  const calcularMetricas = (items: KpiDespachoItem[]): KPIMetrics => {
    const despachosUnicos = new Set(items.map(i => i.id_Despacho));
    const totalSolicitado = items.reduce((sum, i) => sum + (i.cantidad_Solicitada_Despacho || 0), 0);
    const totalDespachado = items.reduce((sum, i) => sum + (i.cantidad_Despachada || 0), 0);
    const totalMerma = items.reduce((sum, i) => sum + (i.cantidad_Merma_Despacho || 0), 0);
    const totalDañadoPicking = items.reduce((sum, i) => sum + (i.cantidad_Dañada_Picking || 0), 0);
    const totalDañadoVerificacion = items.reduce((sum, i) => sum + (i.cantidad_Dañada_Verificacion || 0), 0);
    const totalNoEncontrado = items.reduce((sum, i) => sum + (i.cantidad_No_Encontrada || 0), 0);
    
    const despachosPorUsuario: { [key: string]: number } = {};
    const despachosPorProveedor: { [key: string]: number } = {};
    const despachosPorTipoDocumento: { [key: string]: number } = {};
    
    items.forEach(item => {
      const usuario = item.descripción_Usuario?.trim() || 'Sin asignar';
      const proveedor = item.descripción_Proveedor?.trim() || 'Sin proveedor';
      const tipoDoc = item.tipo_Documento_Pedido || 'Sin tipo';
      
      despachosPorUsuario[usuario] = (despachosPorUsuario[usuario] || 0) + 1;
      despachosPorProveedor[proveedor] = (despachosPorProveedor[proveedor] || 0) + 1;
      despachosPorTipoDocumento[tipoDoc] = (despachosPorTipoDocumento[tipoDoc] || 0) + 1;
    });

    return {
      totalDespachos: despachosUnicos.size,
      totalLineas: items.length,
      totalSolicitado,
      totalDespachado,
      porcentajeCumplimiento: totalSolicitado > 0 ? (totalDespachado / totalSolicitado) * 100 : 0,
      totalMerma,
      totalDañadoPicking,
      totalDañadoVerificacion,
      totalNoEncontrado,
      despachosPorUsuario,
      despachosPorProveedor,
      despachosPorTipoDocumento,
      promedioLineasPorDespacho: despachosUnicos.size > 0 ? items.length / despachosUnicos.size : 0
    };
  };

  const calcularProductividad = (items: KpiDespachoItem[]): ProductividadMetrics => {
    const operadorData: { [key: string]: { lineas: number; tiempoMs: number } } = {};
    const distribucionHora: { [key: number]: number } = {};
    
    let tiempoTotalMs = 0;
    let despachosConTiempo = 0;
    const despachosProcesados = new Set<number>();
    
    items.forEach(item => {
      const operador = item.descripción_Usuario?.trim() || 'Sin asignar';
      
      if (!operadorData[operador]) {
        operadorData[operador] = { lineas: 0, tiempoMs: 0 };
      }
      operadorData[operador].lineas += 1;
      
      if (item.fecha_Hora_Inicio && item.fecha_Hora_Fin) {
        const inicio = new Date(item.fecha_Hora_Inicio);
        const fin = new Date(item.fecha_Hora_Fin);
        
        if (!isNaN(inicio.getTime()) && !isNaN(fin.getTime()) && fin > inicio) {
          if (!despachosProcesados.has(item.id_Despacho)) {
            const diffMs = fin.getTime() - inicio.getTime();
            tiempoTotalMs += diffMs;
            despachosConTiempo++;
            despachosProcesados.add(item.id_Despacho);
            
            operadorData[operador].tiempoMs += diffMs;
          }
          
          const hora = inicio.getHours();
          distribucionHora[hora] = (distribucionHora[hora] || 0) + 1;
        }
      }
    });
    
    const tiempoPromedioMinutos = despachosConTiempo > 0 ? (tiempoTotalMs / despachosConTiempo) / 60000 : 0;
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
    setAnalisisCruzado(null);
    setMostrarAnalisisCruzado(false);
    
    try {
      const resultado = await kpiAPI.getDespacho(fechaDesde, fechaHasta);
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
        toast.success(`Se procesaron ${resultado.length} registros de despacho`);
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

  const realizarAnalisisCruzado = async () => {
    const token = getToken();
    if (!token) {
      logout();
      navigate('/login', { replace: true });
      return;
    }

    setLoadingCruzado(true);
    try {
      const [pickingData, verificacionData] = await Promise.all([
        kpiAPI.getPicking(fechaDesde, fechaHasta),
        kpiAPI.getVerificacion(fechaDesde, fechaHasta)
      ]);

      const pickingPorNumero: { [key: string]: KpiPickingItem[] } = {};
      pickingData.forEach(p => {
        const key = p.número_Picking?.toString() || '';
        if (!pickingPorNumero[key]) pickingPorNumero[key] = [];
        pickingPorNumero[key].push(p);
      });

      const verificacionPorPicking: { [key: string]: KpiVerificacionItem[] } = {};
      verificacionData.forEach(v => {
        const key = v.id_Picking?.toString() || '';
        if (!verificacionPorPicking[key]) verificacionPorPicking[key] = [];
        verificacionPorPicking[key].push(v);
      });

      let tiempoPickingTotal = 0;
      let tiempoVerificacionTotal = 0;
      let tiempoDespachoTotal = 0;
      let countPicking = 0;
      let countVerificacion = 0;
      let countDespacho = 0;
      let pickingsEncontrados = 0;
      let verificacionesEncontradas = 0;

      const flujoCompleto: { picking: number; verificacion: number; despacho: number; total: number; documentos: number }[] = [];

      const pickingsUnicos = new Set(pickingData.map(p => p.número_Picking?.toString()));
      pickingsUnicos.forEach(numPicking => {
        const pickings = pickingPorNumero[numPicking] || [];
        const verificaciones = verificacionPorPicking[numPicking] || [];
        
        if (pickings.length > 0) {
          pickingsEncontrados++;
          
          const pickingInicio = pickings.map(p => new Date(p.fecha_Hora_Inicio).getTime()).filter(t => !isNaN(t));
          const pickingFin = pickings.map(p => new Date(p.fecha_Hora_Fin).getTime()).filter(t => !isNaN(t));
          
          if (pickingInicio.length > 0 && pickingFin.length > 0) {
            const minInicio = Math.min(...pickingInicio);
            const maxFin = Math.max(...pickingFin);
            if (maxFin > minInicio) {
              const tiempoPicking = (maxFin - minInicio) / 60000;
              tiempoPickingTotal += tiempoPicking;
              countPicking++;

              let tiempoVerif = 0;
              if (verificaciones.length > 0) {
                verificacionesEncontradas++;
                const verifInicio = verificaciones.map(v => new Date(v.fecha_Hora_Inicio).getTime()).filter(t => !isNaN(t));
                const verifFin = verificaciones.map(v => new Date(v.fecha_Hora_Fin).getTime()).filter(t => !isNaN(t));
                
                if (verifInicio.length > 0 && verifFin.length > 0) {
                  const minVerifInicio = Math.min(...verifInicio);
                  const maxVerifFin = Math.max(...verifFin);
                  if (maxVerifFin > minVerifInicio) {
                    tiempoVerif = (maxVerifFin - minVerifInicio) / 60000;
                    tiempoVerificacionTotal += tiempoVerif;
                    countVerificacion++;
                  }
                }
              }

              flujoCompleto.push({
                picking: tiempoPicking,
                verificacion: tiempoVerif,
                despacho: 0,
                total: tiempoPicking + tiempoVerif,
                documentos: 1
              });
            }
          }
        }
      });

      const despachosProcesados = new Set<number>();
      data.forEach(d => {
        if (!despachosProcesados.has(d.id_Despacho) && d.fecha_Hora_Inicio && d.fecha_Hora_Fin) {
          const inicio = new Date(d.fecha_Hora_Inicio);
          const fin = new Date(d.fecha_Hora_Fin);
          if (!isNaN(inicio.getTime()) && !isNaN(fin.getTime()) && fin > inicio) {
            const tiempoDespacho = (fin.getTime() - inicio.getTime()) / 60000;
            tiempoDespachoTotal += tiempoDespacho;
            countDespacho++;
            despachosProcesados.add(d.id_Despacho);
          }
        }
      });

      const tiempoPickingPromedio = countPicking > 0 ? tiempoPickingTotal / countPicking : 0;
      const tiempoVerificacionPromedio = countVerificacion > 0 ? tiempoVerificacionTotal / countVerificacion : 0;
      const tiempoDespachoPromedio = countDespacho > 0 ? tiempoDespachoTotal / countDespacho : 0;
      const tiempoTotalPromedio = tiempoPickingPromedio + tiempoVerificacionPromedio + tiempoDespachoPromedio;

      const tiemposPorEtapa = [
        { 
          etapa: 'Picking', 
          tiempoMinutos: tiempoPickingPromedio, 
          porcentaje: tiempoTotalPromedio > 0 ? (tiempoPickingPromedio / tiempoTotalPromedio) * 100 : 0 
        },
        { 
          etapa: 'Verificación', 
          tiempoMinutos: tiempoVerificacionPromedio, 
          porcentaje: tiempoTotalPromedio > 0 ? (tiempoVerificacionPromedio / tiempoTotalPromedio) * 100 : 0 
        },
        { 
          etapa: 'Despacho', 
          tiempoMinutos: tiempoDespachoPromedio, 
          porcentaje: tiempoTotalPromedio > 0 ? (tiempoDespachoPromedio / tiempoTotalPromedio) * 100 : 0 
        }
      ];

      setAnalisisCruzado({
        pickingsEncontrados,
        pickingsTotales: pickingsUnicos.size,
        verificacionesEncontradas,
        tiempoPickingPromedio,
        tiempoVerificacionPromedio,
        tiempoDespachoPromedio,
        tiempoTotalPromedio,
        tiemposPorEtapa,
        flujoCompleto
      });

      setMostrarAnalisisCruzado(true);
      toast.success('Análisis cruzado completado');
    } catch (error) {
      console.error('Error en análisis cruzado:', error);
      toast.error('Error al realizar el análisis cruzado');
    } finally {
      setLoadingCruzado(false);
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

  const getColorForEtapa = (etapa: string) => {
    switch (etapa) {
      case 'Picking': return 'bg-blue-500';
      case 'Verificación': return 'bg-green-500';
      case 'Despacho': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Layout pageTitle="KPI Despacho">
      <div className="space-y-6">
        <ReportDescription
          title="Indicador de Despacho"
          description="Mide la eficiencia final del ciclo de pedidos, desde la preparación hasta la entrega al cliente. Rastrea la trazabilidad completa incluyendo picking, verificación y despacho, identificando pérdidas en cada etapa."
          metrics={[
            "% Cumplimiento: unidades despachadas vs solicitadas",
            "Merma total y por etapa (picking, verificación)",
            "Productos dañados y no encontrados",
            "Análisis cruzado con flujo completo"
          ]}
          interpretation="El cumplimiento de despacho es el indicador más importante para el cliente. La merma acumulada muestra pérdidas en toda la cadena. Use el análisis cruzado para identificar en qué etapa ocurren los problemas."
          color="purple"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <button
              onClick={consultarKPI}
              disabled={loading}
              className="flex items-center px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Consultando...' : 'Consultar KPI'}
            </button>

            {metrics && (
              <button
                onClick={realizarAnalisisCruzado}
                disabled={loadingCruzado}
                className="flex items-center px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowsRightLeftIcon className={`h-4 w-4 mr-2 ${loadingCruzado ? 'animate-spin' : ''}`} />
                {loadingCruzado ? 'Analizando...' : 'Análisis Cruzado (Picking → Verificación → Despacho)'}
              </button>
            )}
          </div>
        </div>

        {/* Indicadores principales */}
        {metrics && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Despachos */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <PaperAirplaneIcon className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Despachos</p>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.totalDespachos)}</p>
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

              {/* Merma */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      metrics.totalMerma === 0 ? 'bg-green-100' : 'bg-orange-100'
                    }`}>
                      <svg className={`h-6 w-6 ${
                        metrics.totalMerma === 0 ? 'text-green-600' : 'text-orange-600'
                      }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Merma Total</p>
                    <p className={`text-2xl font-bold ${
                      metrics.totalMerma === 0 ? 'text-green-600' : 'text-orange-600'
                    }`}>{formatNumber(metrics.totalMerma)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Segunda fila de métricas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Unidades Solicitadas */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500 mb-2">Unidades Solicitadas</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.totalSolicitado)}</p>
                </div>
              </div>

              {/* Unidades Despachadas */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500 mb-2">Unidades Despachadas</p>
                  <p className="text-2xl font-bold text-green-600">{formatNumber(metrics.totalDespachado)}</p>
                </div>
              </div>

              {/* Dañado en Picking */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500 mb-2">Dañado en Picking</p>
                  <p className={`text-2xl font-bold ${metrics.totalDañadoPicking > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatNumber(metrics.totalDañadoPicking)}
                  </p>
                </div>
              </div>

              {/* Dañado en Verificación */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500 mb-2">Dañado en Verificación</p>
                  <p className={`text-2xl font-bold ${metrics.totalDañadoVerificacion > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatNumber(metrics.totalDañadoVerificacion)}
                  </p>
                </div>
              </div>

              {/* No Encontrado */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500 mb-2">No Encontrado</p>
                  <p className={`text-2xl font-bold ${metrics.totalNoEncontrado > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatNumber(metrics.totalNoEncontrado)}
                  </p>
                </div>
              </div>
            </div>

            {/* Análisis Cruzado - Tiempos por Etapa */}
            {mostrarAnalisisCruzado && analisisCruzado && (
              <div className="border-t-4 border-indigo-500 pt-6">
                <div className="flex items-center mb-6">
                  <ArrowsRightLeftIcon className="h-8 w-8 text-indigo-600 mr-3" />
                  <h2 className="text-xl font-bold text-gray-900">Análisis Cruzado: Flujo Completo del Proceso</h2>
                </div>

                {/* Resumen de tiempos por etapa */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-sm border border-blue-200 p-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-blue-700 mb-2">Tiempo Promedio Picking</p>
                      <p className="text-2xl font-bold text-blue-900">{formatTiempo(analisisCruzado.tiempoPickingPromedio)}</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-sm border border-green-200 p-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-green-700 mb-2">Tiempo Promedio Verificación</p>
                      <p className="text-2xl font-bold text-green-900">{formatTiempo(analisisCruzado.tiempoVerificacionPromedio)}</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-sm border border-purple-200 p-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-purple-700 mb-2">Tiempo Promedio Despacho</p>
                      <p className="text-2xl font-bold text-purple-900">{formatTiempo(analisisCruzado.tiempoDespachoPromedio)}</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg shadow-sm border border-indigo-200 p-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-indigo-700 mb-2">Tiempo Total Promedio</p>
                      <p className="text-2xl font-bold text-indigo-900">{formatTiempo(analisisCruzado.tiempoTotalPromedio)}</p>
                    </div>
                  </div>
                </div>

                {/* Distribución de tiempos */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Distribución del Tiempo por Etapa</h3>
                  
                  {/* Barra de progreso horizontal */}
                  <div className="mb-4">
                    <div className="flex h-8 rounded-lg overflow-hidden">
                      {analisisCruzado.tiemposPorEtapa.map((etapa) => (
                        etapa.porcentaje > 0 && (
                          <div
                            key={etapa.etapa}
                            className={`${getColorForEtapa(etapa.etapa)} flex items-center justify-center text-white text-xs font-medium`}
                            style={{ width: `${etapa.porcentaje}%` }}
                            title={`${etapa.etapa}: ${formatTiempo(etapa.tiempoMinutos)} (${formatPercent(etapa.porcentaje)})`}
                          >
                            {etapa.porcentaje >= 15 && `${etapa.etapa}: ${formatPercent(etapa.porcentaje)}`}
                          </div>
                        )
                      ))}
                    </div>
                  </div>

                  {/* Leyenda */}
                  <div className="flex flex-wrap gap-4 justify-center">
                    {analisisCruzado.tiemposPorEtapa.map((etapa) => (
                      <div key={etapa.etapa} className="flex items-center">
                        <div className={`w-4 h-4 rounded ${getColorForEtapa(etapa.etapa)} mr-2`}></div>
                        <span className="text-sm text-gray-700">
                          {etapa.etapa}: {formatTiempo(etapa.tiempoMinutos)} ({formatPercent(etapa.porcentaje)})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Estadísticas del análisis */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-500 mb-2">Pickings Analizados</p>
                      <p className="text-2xl font-bold text-blue-600">{formatNumber(analisisCruzado.pickingsEncontrados)}</p>
                      <p className="text-xs text-gray-400 mt-1">de {formatNumber(analisisCruzado.pickingsTotales)} totales</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-500 mb-2">Con Verificación</p>
                      <p className="text-2xl font-bold text-green-600">{formatNumber(analisisCruzado.verificacionesEncontradas)}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {analisisCruzado.pickingsEncontrados > 0 
                          ? formatPercent((analisisCruzado.verificacionesEncontradas / analisisCruzado.pickingsEncontrados) * 100)
                          : '0%'} de los pickings
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-500 mb-2">Despachos Procesados</p>
                      <p className="text-2xl font-bold text-purple-600">{formatNumber(metrics.totalDespachos)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Distribución por Tipo de Documento, Usuario y Proveedor */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Por Tipo de Documento */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Por Tipo de Documento</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {Object.entries(metrics.despachosPorTipoDocumento)
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
                              className="bg-purple-600 h-2 rounded-full" 
                              style={{ width: `${porcentaje}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Por Usuario */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Líneas por Usuario</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {Object.entries(metrics.despachosPorUsuario)
                    .sort((a, b) => b[1] - a[1])
                    .map(([usuario, cantidad]) => {
                      const porcentaje = (cantidad / metrics.totalLineas) * 100;
                      return (
                        <div key={usuario}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700 truncate" title={usuario}>{usuario}</span>
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
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 lg:col-span-2">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Líneas por Cliente/Proveedor (Top 10)</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {Object.entries(metrics.despachosPorProveedor)
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
                              className="bg-indigo-600 h-2 rounded-full" 
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
              <div className="border-t-4 border-amber-500 pt-6">
                <div className="flex items-center mb-6">
                  <ClockIcon className="h-8 w-8 text-amber-600 mr-3" />
                  <h2 className="text-xl font-bold text-gray-900">Análisis de Tiempos y Productividad (Despacho)</h2>
                </div>

                {/* Indicadores de tiempo */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg shadow-sm border border-amber-200 p-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-amber-700 mb-2">Tiempo Promedio/Despacho</p>
                      <p className="text-2xl font-bold text-amber-900">{formatTiempo(productividad.tiempoPromedioMinutos)}</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-sm border border-green-200 p-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-green-700 mb-2">Productividad Global</p>
                      <p className="text-2xl font-bold text-green-900">{formatNumber(productividad.lineasPorHora, 1)} <span className="text-sm font-normal">líneas/hora</span></p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-sm border border-blue-200 p-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-blue-700 mb-2">Tiempo Total Operativo</p>
                      <p className="text-2xl font-bold text-blue-900">{formatNumber(productividad.tiempoTotalHoras, 1)} <span className="text-sm font-normal">horas</span></p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-sm border border-purple-200 p-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-purple-700 mb-2">Usuarios con Registro</p>
                      <p className="text-2xl font-bold text-purple-900">{productividad.productividadPorOperador.length}</p>
                    </div>
                  </div>
                </div>

                {/* Productividad por Usuario y Distribución por Hora */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {productividad.productividadPorOperador.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Ranking de Productividad por Usuario</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
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
                                  className="bg-gradient-to-r from-purple-400 to-purple-600 h-4 rounded-full flex items-center justify-end pr-2"
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
            )}
          </>
        )}

        {/* Estado inicial */}
        {!metrics && !loading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <PaperAirplaneIcon className="mx-auto h-12 w-12 text-gray-400" />
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

export default KPIDespacho;
