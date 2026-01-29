import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { ClipboardDocumentCheckIcon, CalendarIcon, ArrowPathIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { kpiAPI, KpiVerificacionItem, KpiPickingItem } from '@/api/api';
import { getToken, logout } from '@/utils/auth';

interface KPIMetrics {
  totalVerificaciones: number;
  totalLineas: number;
  totalSolicitado: number;
  totalVerificado: number;
  porcentajeCumplimiento: number;
  totalMerma: number;
  verificacionesPorOperador: { [key: string]: number };
  verificacionesPorTipo: { [key: string]: number };
  verificacionesPorEstado: { [key: string]: number };
  promedioLineasPorVerificacion: number;
}

interface AnalisisCruzado {
  totalPickings: number;
  pickingsVerificados: number;
  pickingsSinVerificar: number;
  porcentajeVerificados: number;
  unidadesPickingRecibidas: number;
  unidadesVerificadas: number;
  discrepanciaUnidades: number;
  porcentajeCoincidencia: number;
  mermaPorOperadorPicking: { operador: string; merma: number; lineas: number }[];
  productosMayorDiscrepancia: { producto: string; recibido: number; verificado: number; diferencia: number }[];
}

function KPIVerificacion() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<KpiVerificacionItem[]>([]);
  const [pickingData, setPickingData] = useState<KpiPickingItem[]>([]);
  const [metrics, setMetrics] = useState<KPIMetrics | null>(null);
  const [analisisCruzado, setAnalisisCruzado] = useState<AnalisisCruzado | null>(null);

  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const [fechaDesde, setFechaDesde] = useState<string>(firstDayOfMonth.toISOString().split('T')[0]);
  const [fechaHasta, setFechaHasta] = useState<string>(today.toISOString().split('T')[0]);

  useEffect(() => {
    document.title = 'TOMWMSUX - KPI Verificación';
  }, []);

  const calcularMetricas = (items: KpiVerificacionItem[]): KPIMetrics => {
    const verificacionesUnicas = new Set(items.map(i => i.id_Picking));
    const totalSolicitado = items.reduce((sum, i) => sum + (i.cantidad_Solicita_Ver || 0), 0);
    const totalVerificado = items.reduce((sum, i) => sum + (i.cantidad_Verificada || 0), 0);
    const totalMerma = items.reduce((sum, i) => sum + (i.cantidad_Merma_Ver || 0), 0);
    
    const verificacionesPorOperador: { [key: string]: number } = {};
    const verificacionesPorTipo: { [key: string]: number } = {};
    const verificacionesPorEstado: { [key: string]: number } = {};
    
    items.forEach(item => {
      const operador = item.descripción_Operador?.trim() || 'Sin asignar';
      const tipo = item.tipo_Documento_Pedido || 'Sin tipo';
      const estado = item.nombre_Producto_Estado || 'Sin estado';
      
      verificacionesPorOperador[operador] = (verificacionesPorOperador[operador] || 0) + 1;
      verificacionesPorTipo[tipo] = (verificacionesPorTipo[tipo] || 0) + 1;
      verificacionesPorEstado[estado] = (verificacionesPorEstado[estado] || 0) + 1;
    });

    return {
      totalVerificaciones: verificacionesUnicas.size,
      totalLineas: items.length,
      totalSolicitado,
      totalVerificado,
      porcentajeCumplimiento: totalSolicitado > 0 ? (totalVerificado / totalSolicitado) * 100 : 0,
      totalMerma,
      verificacionesPorOperador,
      verificacionesPorTipo,
      verificacionesPorEstado,
      promedioLineasPorVerificacion: verificacionesUnicas.size > 0 ? items.length / verificacionesUnicas.size : 0
    };
  };

  const calcularAnalisisCruzado = (verificacion: KpiVerificacionItem[], picking: KpiPickingItem[]): AnalisisCruzado => {
    const pickingsUnicos = new Set(picking.map(p => p.número_Picking));
    const verificacionesUnicas = new Set(verificacion.map(v => v.id_Picking));
    
    const pickingsVerificados = [...pickingsUnicos].filter(p => verificacionesUnicas.has(p)).length;
    const pickingsSinVerificar = pickingsUnicos.size - pickingsVerificados;
    
    const unidadesPickingRecibidas = picking.reduce((sum, p) => sum + (p.cantidad_Recibida || 0), 0);
    const unidadesVerificadas = verificacion.reduce((sum, v) => sum + (v.cantidad_Verificada || 0), 0);
    
    const mermaPorOperadorMap: { [key: string]: { merma: number; lineas: number } } = {};
    const pickingPorNumero: { [key: number]: KpiPickingItem[] } = {};
    
    picking.forEach(p => {
      if (!pickingPorNumero[p.número_Picking]) {
        pickingPorNumero[p.número_Picking] = [];
      }
      pickingPorNumero[p.número_Picking].push(p);
    });
    
    verificacion.forEach(v => {
      if (v.cantidad_Merma_Ver > 0) {
        const pickingItems = pickingPorNumero[v.id_Picking];
        if (pickingItems && pickingItems.length > 0) {
          const operador = pickingItems[0].descripción_Operador?.trim() || 'Sin asignar';
          if (!mermaPorOperadorMap[operador]) {
            mermaPorOperadorMap[operador] = { merma: 0, lineas: 0 };
          }
          mermaPorOperadorMap[operador].merma += v.cantidad_Merma_Ver;
          mermaPorOperadorMap[operador].lineas += 1;
        }
      }
    });
    
    const mermaPorOperadorPicking = Object.entries(mermaPorOperadorMap)
      .map(([operador, data]) => ({ operador, ...data }))
      .sort((a, b) => b.merma - a.merma)
      .slice(0, 10);
    
    const productosPickingMap: { [key: string]: number } = {};
    const productosVerificacionMap: { [key: string]: number } = {};
    const productosNombres: { [key: string]: string } = {};
    
    picking.forEach(p => {
      const codigo = p.código_Producto;
      productosPickingMap[codigo] = (productosPickingMap[codigo] || 0) + (p.cantidad_Recibida || 0);
      productosNombres[codigo] = p.nombre_Producto;
    });
    
    verificacion.forEach(v => {
      const codigo = v.código_Producto;
      productosVerificacionMap[codigo] = (productosVerificacionMap[codigo] || 0) + (v.cantidad_Verificada || 0);
      productosNombres[codigo] = v.nombre_Producto;
    });
    
    const todosProductos = new Set([...Object.keys(productosPickingMap), ...Object.keys(productosVerificacionMap)]);
    const productosMayorDiscrepancia = [...todosProductos]
      .map(codigo => ({
        producto: productosNombres[codigo] || codigo,
        recibido: productosPickingMap[codigo] || 0,
        verificado: productosVerificacionMap[codigo] || 0,
        diferencia: Math.abs((productosPickingMap[codigo] || 0) - (productosVerificacionMap[codigo] || 0))
      }))
      .filter(p => p.diferencia > 0)
      .sort((a, b) => b.diferencia - a.diferencia)
      .slice(0, 10);
    
    return {
      totalPickings: pickingsUnicos.size,
      pickingsVerificados,
      pickingsSinVerificar,
      porcentajeVerificados: pickingsUnicos.size > 0 ? (pickingsVerificados / pickingsUnicos.size) * 100 : 0,
      unidadesPickingRecibidas,
      unidadesVerificadas,
      discrepanciaUnidades: unidadesPickingRecibidas - unidadesVerificadas,
      porcentajeCoincidencia: unidadesPickingRecibidas > 0 ? (unidadesVerificadas / unidadesPickingRecibidas) * 100 : 0,
      mermaPorOperadorPicking,
      productosMayorDiscrepancia
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
      const [resultadoVerificacion, resultadoPicking] = await Promise.all([
        kpiAPI.getVerificacion(fechaDesde, fechaHasta),
        kpiAPI.getPicking(fechaDesde, fechaHasta)
      ]);
      
      setData(resultadoVerificacion);
      setPickingData(resultadoPicking);
      
      if (resultadoVerificacion.length === 0) {
        toast('No se encontraron datos de verificación para el rango seleccionado', {
          icon: 'ℹ️',
          style: { background: '#3b82f6', color: '#fff' }
        });
        setMetrics(null);
        setAnalisisCruzado(null);
      } else {
        const metricas = calcularMetricas(resultadoVerificacion);
        setMetrics(metricas);
        
        if (resultadoPicking.length > 0) {
          const cruzado = calcularAnalisisCruzado(resultadoVerificacion, resultadoPicking);
          setAnalisisCruzado(cruzado);
        } else {
          setAnalisisCruzado(null);
        }
        
        toast.success(`Verificación: ${resultadoVerificacion.length} registros | Picking: ${resultadoPicking.length} registros`);
      }
    } catch (error) {
      console.error('Error al consultar KPI:', error);
      toast.error('Error al consultar los indicadores');
      setMetrics(null);
      setAnalisisCruzado(null);
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

  return (
    <Layout pageTitle="KPI Verificación">
      <div className="space-y-6">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            <button
              onClick={consultarKPI}
              disabled={loading}
              className="flex items-center px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
              {/* Total Verificaciones */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                      <ClipboardDocumentCheckIcon className="h-6 w-6 text-teal-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Verificaciones</p>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.totalVerificaciones)}</p>
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
                      metrics.totalMerma === 0 ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <svg className={`h-6 w-6 ${
                        metrics.totalMerma === 0 ? 'text-green-600' : 'text-red-600'
                      }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Merma</p>
                    <p className={`text-2xl font-bold ${
                      metrics.totalMerma === 0 ? 'text-green-600' : 'text-red-600'
                    }`}>{formatNumber(metrics.totalMerma)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Segunda fila de métricas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Unidades Solicitadas */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500 mb-2">Unidades Solicitadas</p>
                  <p className="text-3xl font-bold text-gray-900">{formatNumber(metrics.totalSolicitado)}</p>
                </div>
              </div>

              {/* Unidades Verificadas */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500 mb-2">Unidades Verificadas</p>
                  <p className="text-3xl font-bold text-green-600">{formatNumber(metrics.totalVerificado)}</p>
                </div>
              </div>

              {/* Promedio Líneas por Verificación */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500 mb-2">Promedio Líneas/Verificación</p>
                  <p className="text-3xl font-bold text-teal-600">{formatNumber(metrics.promedioLineasPorVerificacion, 1)}</p>
                </div>
              </div>
            </div>

            {/* Distribución por Estado, Operador y Tipo */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Por Estado del Producto */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Por Estado del Producto</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {Object.entries(metrics.verificacionesPorEstado)
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

              {/* Por Operador */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Líneas por Operador</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {Object.entries(metrics.verificacionesPorOperador)
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
                              className="bg-teal-600 h-2 rounded-full" 
                              style={{ width: `${porcentaje}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Por Tipo de Documento */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Por Tipo de Documento</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {Object.entries(metrics.verificacionesPorTipo)
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
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${porcentaje}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Análisis Cruzado Picking vs Verificación */}
            {analisisCruzado && (
              <>
                <div className="border-t-4 border-indigo-500 pt-6">
                  <div className="flex items-center mb-6">
                    <ArrowsRightLeftIcon className="h-8 w-8 text-indigo-600 mr-3" />
                    <h2 className="text-xl font-bold text-gray-900">Análisis Cruzado: Picking vs Verificación</h2>
                  </div>

                  {/* Indicadores de cruce principales */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* Pickings Verificados */}
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg shadow-sm border border-indigo-200 p-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-indigo-700 mb-2">Pickings Verificados</p>
                        <p className="text-3xl font-bold text-indigo-900">{formatNumber(analisisCruzado.pickingsVerificados)}</p>
                        <p className="text-xs text-indigo-600 mt-1">de {formatNumber(analisisCruzado.totalPickings)} totales</p>
                      </div>
                    </div>

                    {/* Pickings Sin Verificar */}
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow-sm border border-orange-200 p-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-orange-700 mb-2">Pickings Sin Verificar</p>
                        <p className="text-3xl font-bold text-orange-900">{formatNumber(analisisCruzado.pickingsSinVerificar)}</p>
                        <p className="text-xs text-orange-600 mt-1">{formatPercent(100 - analisisCruzado.porcentajeVerificados)} pendientes</p>
                      </div>
                    </div>

                    {/* Tasa de Verificación */}
                    <div className={`bg-gradient-to-br rounded-lg shadow-sm border p-6 ${
                      analisisCruzado.porcentajeVerificados >= 90 
                        ? 'from-green-50 to-green-100 border-green-200' 
                        : analisisCruzado.porcentajeVerificados >= 70 
                          ? 'from-yellow-50 to-yellow-100 border-yellow-200'
                          : 'from-red-50 to-red-100 border-red-200'
                    }`}>
                      <div className="text-center">
                        <p className={`text-sm font-medium mb-2 ${
                          analisisCruzado.porcentajeVerificados >= 90 ? 'text-green-700' :
                          analisisCruzado.porcentajeVerificados >= 70 ? 'text-yellow-700' : 'text-red-700'
                        }`}>Tasa de Verificación</p>
                        <p className={`text-3xl font-bold ${
                          analisisCruzado.porcentajeVerificados >= 90 ? 'text-green-900' :
                          analisisCruzado.porcentajeVerificados >= 70 ? 'text-yellow-900' : 'text-red-900'
                        }`}>{formatPercent(analisisCruzado.porcentajeVerificados)}</p>
                      </div>
                    </div>

                    {/* Coincidencia Unidades */}
                    <div className={`bg-gradient-to-br rounded-lg shadow-sm border p-6 ${
                      analisisCruzado.porcentajeCoincidencia >= 95 
                        ? 'from-green-50 to-green-100 border-green-200' 
                        : analisisCruzado.porcentajeCoincidencia >= 85 
                          ? 'from-yellow-50 to-yellow-100 border-yellow-200'
                          : 'from-red-50 to-red-100 border-red-200'
                    }`}>
                      <div className="text-center">
                        <p className={`text-sm font-medium mb-2 ${
                          analisisCruzado.porcentajeCoincidencia >= 95 ? 'text-green-700' :
                          analisisCruzado.porcentajeCoincidencia >= 85 ? 'text-yellow-700' : 'text-red-700'
                        }`}>Coincidencia Unidades</p>
                        <p className={`text-3xl font-bold ${
                          analisisCruzado.porcentajeCoincidencia >= 95 ? 'text-green-900' :
                          analisisCruzado.porcentajeCoincidencia >= 85 ? 'text-yellow-900' : 'text-red-900'
                        }`}>{formatPercent(analisisCruzado.porcentajeCoincidencia)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Comparativa de Unidades */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-500 mb-2">Unidades Recibidas (Picking)</p>
                        <p className="text-3xl font-bold text-purple-600">{formatNumber(analisisCruzado.unidadesPickingRecibidas)}</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-500 mb-2">Unidades Verificadas</p>
                        <p className="text-3xl font-bold text-teal-600">{formatNumber(analisisCruzado.unidadesVerificadas)}</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-500 mb-2">Discrepancia</p>
                        <p className={`text-3xl font-bold ${analisisCruzado.discrepanciaUnidades === 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {analisisCruzado.discrepanciaUnidades > 0 ? '+' : ''}{formatNumber(analisisCruzado.discrepanciaUnidades)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tablas de análisis detallado */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Merma por Operador de Picking */}
                    {analisisCruzado.mermaPorOperadorPicking.length > 0 && (
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Merma por Operador de Picking</h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Operador</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Merma</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Líneas</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {analisisCruzado.mermaPorOperadorPicking.map((item, idx) => (
                                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  <td className="px-4 py-2 text-sm text-gray-900 truncate max-w-48" title={item.operador}>{item.operador}</td>
                                  <td className="px-4 py-2 text-sm text-red-600 font-medium text-right">{formatNumber(item.merma)}</td>
                                  <td className="px-4 py-2 text-sm text-gray-600 text-right">{formatNumber(item.lineas)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Productos con Mayor Discrepancia */}
                    {analisisCruzado.productosMayorDiscrepancia.length > 0 && (
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Productos con Mayor Discrepancia</h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Recibido</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Verificado</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Diferencia</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {analisisCruzado.productosMayorDiscrepancia.map((item, idx) => (
                                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  <td className="px-4 py-2 text-sm text-gray-900 truncate max-w-48" title={item.producto}>{item.producto}</td>
                                  <td className="px-4 py-2 text-sm text-purple-600 text-right">{formatNumber(item.recibido)}</td>
                                  <td className="px-4 py-2 text-sm text-teal-600 text-right">{formatNumber(item.verificado)}</td>
                                  <td className="px-4 py-2 text-sm text-red-600 font-medium text-right">{formatNumber(item.diferencia)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mensaje si no hay discrepancias */}
                  {analisisCruzado.mermaPorOperadorPicking.length === 0 && analisisCruzado.productosMayorDiscrepancia.length === 0 && (
                    <div className="bg-green-50 rounded-lg border border-green-200 p-6">
                      <div className="text-center">
                        <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-green-900">Sin discrepancias significativas</h3>
                        <p className="mt-1 text-sm text-green-700">
                          No se detectaron mermas ni diferencias importantes entre picking y verificación.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* Estado inicial */}
        {!metrics && !loading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <ClipboardDocumentCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
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

export default KPIVerificacion;
