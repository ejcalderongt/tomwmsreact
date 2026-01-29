import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { ClipboardDocumentCheckIcon, CalendarIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { kpiAPI, KpiVerificacionItem } from '@/api/api';
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

function KPIVerificacion() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<KpiVerificacionItem[]>([]);
  const [metrics, setMetrics] = useState<KPIMetrics | null>(null);

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

  const consultarKPI = async () => {
    const token = getToken();
    if (!token) {
      logout();
      navigate('/login', { replace: true });
      return;
    }

    setLoading(true);
    try {
      const resultado = await kpiAPI.getVerificacion(fechaDesde, fechaHasta);
      setData(resultado);
      
      if (resultado.length === 0) {
        toast('No se encontraron datos para el rango de fechas seleccionado', {
          icon: 'ℹ️',
          style: { background: '#3b82f6', color: '#fff' }
        });
        setMetrics(null);
      } else {
        const metricas = calcularMetricas(resultado);
        setMetrics(metricas);
        toast.success(`Se procesaron ${resultado.length} registros de verificación`);
      }
    } catch (error) {
      console.error('Error al consultar KPI:', error);
      toast.error('Error al consultar los indicadores');
      setMetrics(null);
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
