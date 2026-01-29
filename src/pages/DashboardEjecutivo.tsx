import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { 
  PresentationChartBarIcon, 
  CalendarIcon, 
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { kpiAPI } from '@/api/api';
import { getToken, logout } from '@/utils/auth';

interface ResumenOperativo {
  picking: { total: number; lineas: number; cumplimiento: number; tiempoPromedio: number };
  verificacion: { total: number; lineas: number; cumplimiento: number; tiempoPromedio: number };
  recepcion: { total: number; lineas: number; cumplimiento: number; tiempoPromedio: number };
  despacho: { total: number; lineas: number; cumplimiento: number; merma: number };
}

interface Alerta {
  tipo: 'warning' | 'error' | 'success';
  mensaje: string;
  area: string;
}

function DashboardEjecutivo() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [resumen, setResumen] = useState<ResumenOperativo | null>(null);
  const [alertas, setAlertas] = useState<Alerta[]>([]);

  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const [fechaDesde, setFechaDesde] = useState<string>(firstDayOfMonth.toISOString().split('T')[0]);
  const [fechaHasta, setFechaHasta] = useState<string>(today.toISOString().split('T')[0]);

  useEffect(() => {
    document.title = 'TOMWMSUX - Dashboard Ejecutivo';
  }, []);

  const consultarTodo = async () => {
    const token = getToken();
    if (!token) {
      logout();
      navigate('/login', { replace: true });
      return;
    }

    setLoading(true);
    try {
      const [pickingData, verificacionData, recepcionData, despachoData] = await Promise.all([
        kpiAPI.getPicking(fechaDesde, fechaHasta).catch(() => []),
        kpiAPI.getVerificacion(fechaDesde, fechaHasta).catch(() => []),
        kpiAPI.getRecepcion(fechaDesde, fechaHasta).catch(() => []),
        kpiAPI.getDespacho(fechaDesde, fechaHasta).catch(() => [])
      ]);

      const pickingsUnicos = new Set(pickingData.map(p => p.número_Picking));
      const pickingCumplimiento = pickingData.length > 0 
        ? (pickingData.reduce((sum, p) => sum + (p.cantidad_Recibida || 0), 0) / 
           pickingData.reduce((sum, p) => sum + (p.cantidad_Solicitada || 0), 0)) * 100 
        : 0;
      
      let pickingTiempoTotal = 0;
      let pickingCount = 0;
      const pickingsProcesados = new Set<number>();
      pickingData.forEach(p => {
        if (!pickingsProcesados.has(p.número_Picking) && p.fecha_Hora_Inicio && p.fecha_Hora_Fin) {
          const inicio = new Date(p.fecha_Hora_Inicio);
          const fin = new Date(p.fecha_Hora_Fin);
          if (!isNaN(inicio.getTime()) && !isNaN(fin.getTime()) && fin > inicio) {
            pickingTiempoTotal += (fin.getTime() - inicio.getTime()) / 60000;
            pickingCount++;
            pickingsProcesados.add(p.número_Picking);
          }
        }
      });

      const verificacionesUnicas = new Set(verificacionData.map(v => v.id_Picking));
      const verifSolicitado = verificacionData.reduce((sum, v) => sum + (v.cantidad_Solicita_Ver || 0), 0);
      const verifVerificado = verificacionData.reduce((sum, v) => sum + (v.cantidad_Verificada || 0), 0);
      const verificacionCumplimiento = verifSolicitado > 0 ? (verifVerificado / verifSolicitado) * 100 : 0;
      
      let verifTiempoTotal = 0;
      let verifCount = 0;
      const verifProcesados = new Set<number>();
      verificacionData.forEach(v => {
        if (!verifProcesados.has(v.id_Picking) && v.fecha_Hora_Inicio && v.fecha_Hora_Fin) {
          const inicio = new Date(v.fecha_Hora_Inicio);
          const fin = new Date(v.fecha_Hora_Fin);
          if (!isNaN(inicio.getTime()) && !isNaN(fin.getTime()) && fin > inicio) {
            verifTiempoTotal += (fin.getTime() - inicio.getTime()) / 60000;
            verifCount++;
            verifProcesados.add(v.id_Picking);
          }
        }
      });

      const recepcionesUnicas = new Set(recepcionData.map(r => r.id_Recepcion));
      const recepSolicitado = recepcionData.reduce((sum, r) => sum + (r.cantidad_Solicita_OC || 0), 0);
      const recepRecibido = recepcionData.reduce((sum, r) => sum + (r.cantidad_Recibida || 0), 0);
      const recepcionCumplimiento = recepSolicitado > 0 ? (recepRecibido / recepSolicitado) * 100 : 0;
      
      let recepTiempoTotal = 0;
      let recepCount = 0;
      const recepProcesados = new Set<number>();
      recepcionData.forEach(r => {
        if (!recepProcesados.has(r.id_Recepcion) && r.fecha_Hora_Inicio && r.fecha_Hora_Fin) {
          const inicio = new Date(r.fecha_Hora_Inicio);
          const fin = new Date(r.fecha_Hora_Fin);
          if (!isNaN(inicio.getTime()) && !isNaN(fin.getTime()) && fin > inicio) {
            recepTiempoTotal += (fin.getTime() - inicio.getTime()) / 60000;
            recepCount++;
            recepProcesados.add(r.id_Recepcion);
          }
        }
      });

      const despachosUnicos = new Set(despachoData.map(d => d.id_Despacho));
      const despSolicitado = despachoData.reduce((sum, d) => sum + (d.cantidad_Solicitada_Despacho || 0), 0);
      const despDespachado = despachoData.reduce((sum, d) => sum + (d.cantidad_Despachada || 0), 0);
      const despachoCumplimiento = despSolicitado > 0 ? (despDespachado / despSolicitado) * 100 : 0;
      const despachoMerma = despachoData.reduce((sum, d) => sum + (d.cantidad_Merma_Despacho || 0), 0);

      const nuevoResumen: ResumenOperativo = {
        picking: {
          total: pickingsUnicos.size,
          lineas: pickingData.length,
          cumplimiento: pickingCumplimiento || 0,
          tiempoPromedio: pickingCount > 0 ? pickingTiempoTotal / pickingCount : 0
        },
        verificacion: {
          total: verificacionesUnicas.size,
          lineas: verificacionData.length,
          cumplimiento: verificacionCumplimiento,
          tiempoPromedio: verifCount > 0 ? verifTiempoTotal / verifCount : 0
        },
        recepcion: {
          total: recepcionesUnicas.size,
          lineas: recepcionData.length,
          cumplimiento: recepcionCumplimiento,
          tiempoPromedio: recepCount > 0 ? recepTiempoTotal / recepCount : 0
        },
        despacho: {
          total: despachosUnicos.size,
          lineas: despachoData.length,
          cumplimiento: despachoCumplimiento,
          merma: despachoMerma
        }
      };

      setResumen(nuevoResumen);

      const nuevasAlertas: Alerta[] = [];
      
      if (nuevoResumen.picking.cumplimiento < 80 && nuevoResumen.picking.total > 0) {
        nuevasAlertas.push({ tipo: 'error', mensaje: `Cumplimiento de Picking bajo: ${nuevoResumen.picking.cumplimiento.toFixed(1)}%`, area: 'Picking' });
      } else if (nuevoResumen.picking.cumplimiento >= 95 && nuevoResumen.picking.total > 0) {
        nuevasAlertas.push({ tipo: 'success', mensaje: `Excelente cumplimiento de Picking: ${nuevoResumen.picking.cumplimiento.toFixed(1)}%`, area: 'Picking' });
      }

      if (nuevoResumen.verificacion.cumplimiento < 80 && nuevoResumen.verificacion.total > 0) {
        nuevasAlertas.push({ tipo: 'error', mensaje: `Cumplimiento de Verificación bajo: ${nuevoResumen.verificacion.cumplimiento.toFixed(1)}%`, area: 'Verificación' });
      }

      if (nuevoResumen.despacho.merma > 1000) {
        nuevasAlertas.push({ tipo: 'warning', mensaje: `Merma elevada en Despacho: ${nuevoResumen.despacho.merma.toLocaleString()} unidades`, area: 'Despacho' });
      }

      if (nuevoResumen.picking.tiempoPromedio > 120) {
        nuevasAlertas.push({ tipo: 'warning', mensaje: `Tiempo promedio de Picking alto: ${formatTiempo(nuevoResumen.picking.tiempoPromedio)}`, area: 'Picking' });
      }

      setAlertas(nuevasAlertas);
      toast.success('Dashboard actualizado correctamente');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al consultar los datos');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value: number) => value.toLocaleString('es-ES');
  const formatPercent = (value: number) => value.toFixed(1) + '%';
  const formatTiempo = (minutos: number) => {
    if (minutos < 60) return `${minutos.toFixed(0)} min`;
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins.toFixed(0)}m`;
  };

  const getColorByCumplimiento = (valor: number) => {
    if (valor >= 95) return 'text-green-600 bg-green-100';
    if (valor >= 80) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getIconByTipo = (tipo: string) => {
    switch (tipo) {
      case 'success': return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'warning': return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'error': return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default: return null;
    }
  };

  return (
    <Layout pageTitle="Dashboard Ejecutivo">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={consultarTodo}
              disabled={loading}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Consultando...' : 'Actualizar Dashboard'}
            </button>
          </div>
        </div>

        {/* Alertas */}
        {alertas.length > 0 && (
          <div className="space-y-2">
            {alertas.map((alerta, idx) => (
              <div key={idx} className={`flex items-center gap-3 p-4 rounded-lg border ${
                alerta.tipo === 'error' ? 'bg-red-50 border-red-200' :
                alerta.tipo === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                'bg-green-50 border-green-200'
              }`}>
                {getIconByTipo(alerta.tipo)}
                <span className="text-sm font-medium text-gray-700">[{alerta.area}]</span>
                <span className="text-sm text-gray-600">{alerta.mensaje}</span>
              </div>
            ))}
          </div>
        )}

        {resumen && (
          <>
            {/* Cards principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Picking */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Picking</h3>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getColorByCumplimiento(resumen.picking.cumplimiento)}`}>
                    {formatPercent(resumen.picking.cumplimiento)}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Documentos</span>
                    <span className="font-bold text-gray-900">{formatNumber(resumen.picking.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Líneas</span>
                    <span className="font-bold text-gray-900">{formatNumber(resumen.picking.lineas)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tiempo Prom.</span>
                    <span className="font-bold text-blue-600">{formatTiempo(resumen.picking.tiempoPromedio)}</span>
                  </div>
                </div>
              </div>

              {/* Verificación */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Verificación</h3>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getColorByCumplimiento(resumen.verificacion.cumplimiento)}`}>
                    {formatPercent(resumen.verificacion.cumplimiento)}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Documentos</span>
                    <span className="font-bold text-gray-900">{formatNumber(resumen.verificacion.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Líneas</span>
                    <span className="font-bold text-gray-900">{formatNumber(resumen.verificacion.lineas)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tiempo Prom.</span>
                    <span className="font-bold text-green-600">{formatTiempo(resumen.verificacion.tiempoPromedio)}</span>
                  </div>
                </div>
              </div>

              {/* Recepción */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recepción</h3>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getColorByCumplimiento(resumen.recepcion.cumplimiento)}`}>
                    {formatPercent(resumen.recepcion.cumplimiento)}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Documentos</span>
                    <span className="font-bold text-gray-900">{formatNumber(resumen.recepcion.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Líneas</span>
                    <span className="font-bold text-gray-900">{formatNumber(resumen.recepcion.lineas)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tiempo Prom.</span>
                    <span className="font-bold text-cyan-600">{formatTiempo(resumen.recepcion.tiempoPromedio)}</span>
                  </div>
                </div>
              </div>

              {/* Despacho */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Despacho</h3>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getColorByCumplimiento(resumen.despacho.cumplimiento)}`}>
                    {formatPercent(resumen.despacho.cumplimiento)}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Documentos</span>
                    <span className="font-bold text-gray-900">{formatNumber(resumen.despacho.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Líneas</span>
                    <span className="font-bold text-gray-900">{formatNumber(resumen.despacho.lineas)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Merma</span>
                    <span className={`font-bold ${resumen.despacho.merma > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {formatNumber(resumen.despacho.merma)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Resumen visual */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Flujo Operativo</h3>
              <div className="flex items-center justify-between gap-4 overflow-x-auto pb-4">
                {/* Recepción */}
                <div className="flex-1 min-w-40 text-center">
                  <div className="bg-cyan-100 rounded-lg p-4 mb-2">
                    <p className="text-3xl font-bold text-cyan-700">{formatNumber(resumen.recepcion.lineas)}</p>
                    <p className="text-sm text-cyan-600">líneas recibidas</p>
                  </div>
                  <p className="text-sm font-medium text-gray-600">RECEPCIÓN</p>
                </div>
                
                <ArrowTrendingUpIcon className="h-8 w-8 text-gray-300 flex-shrink-0" />
                
                {/* Picking */}
                <div className="flex-1 min-w-40 text-center">
                  <div className="bg-blue-100 rounded-lg p-4 mb-2">
                    <p className="text-3xl font-bold text-blue-700">{formatNumber(resumen.picking.lineas)}</p>
                    <p className="text-sm text-blue-600">líneas pickeadas</p>
                  </div>
                  <p className="text-sm font-medium text-gray-600">PICKING</p>
                </div>
                
                <ArrowTrendingUpIcon className="h-8 w-8 text-gray-300 flex-shrink-0" />
                
                {/* Verificación */}
                <div className="flex-1 min-w-40 text-center">
                  <div className="bg-green-100 rounded-lg p-4 mb-2">
                    <p className="text-3xl font-bold text-green-700">{formatNumber(resumen.verificacion.lineas)}</p>
                    <p className="text-sm text-green-600">líneas verificadas</p>
                  </div>
                  <p className="text-sm font-medium text-gray-600">VERIFICACIÓN</p>
                </div>
                
                <ArrowTrendingUpIcon className="h-8 w-8 text-gray-300 flex-shrink-0" />
                
                {/* Despacho */}
                <div className="flex-1 min-w-40 text-center">
                  <div className="bg-purple-100 rounded-lg p-4 mb-2">
                    <p className="text-3xl font-bold text-purple-700">{formatNumber(resumen.despacho.lineas)}</p>
                    <p className="text-sm text-purple-600">líneas despachadas</p>
                  </div>
                  <p className="text-sm font-medium text-gray-600">DESPACHO</p>
                </div>
              </div>
            </div>

            {/* Tiempos promedio */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <ClockIcon className="h-6 w-6 text-amber-600" />
                <h3 className="text-lg font-semibold text-gray-900">Tiempos Promedio por Operación</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
                  <p className="text-sm text-blue-700 mb-1">Picking</p>
                  <p className="text-2xl font-bold text-blue-900">{formatTiempo(resumen.picking.tiempoPromedio)}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center">
                  <p className="text-sm text-green-700 mb-1">Verificación</p>
                  <p className="text-2xl font-bold text-green-900">{formatTiempo(resumen.verificacion.tiempoPromedio)}</p>
                </div>
                <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg p-4 text-center">
                  <p className="text-sm text-cyan-700 mb-1">Recepción</p>
                  <p className="text-2xl font-bold text-cyan-900">{formatTiempo(resumen.recepcion.tiempoPromedio)}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {!resumen && !loading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <PresentationChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Dashboard Ejecutivo</h3>
            <p className="mt-1 text-sm text-gray-500">
              Selecciona un rango de fechas y presiona "Actualizar Dashboard" para ver el resumen operativo.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default DashboardEjecutivo;
