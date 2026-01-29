import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { ClockIcon, CalendarIcon, ArrowPathIcon, ArrowLongRightIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { kpiAPI, KpiPickingItem, KpiVerificacionItem } from '@/api/api';
import { getToken, logout } from '@/utils/auth';

interface CicloDocumento {
  numeroPicking: number;
  pickingInicio: Date | null;
  pickingFin: Date | null;
  verificacionInicio: Date | null;
  verificacionFin: Date | null;
  tiempoPicking: number;
  tiempoVerificacion: number;
  tiempoTotal: number;
  lineasPicking: number;
  lineasVerificacion: number;
  operadorPicking: string;
  operadorVerificacion: string;
}

interface ResumenCiclo {
  documentosAnalizados: number;
  tiempoPickingPromedio: number;
  tiempoVerificacionPromedio: number;
  tiempoTotalPromedio: number;
  cuellosDetectados: { etapa: string; documentos: number; tiempoPromedio: number }[];
  distribucionTiempos: { rango: string; cantidad: number; porcentaje: number }[];
  documentosLentos: CicloDocumento[];
}

function AnalisisCiclo() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [ciclos, setCiclos] = useState<CicloDocumento[]>([]);
  const [resumen, setResumen] = useState<ResumenCiclo | null>(null);

  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const [fechaDesde, setFechaDesde] = useState<string>(firstDayOfMonth.toISOString().split('T')[0]);
  const [fechaHasta, setFechaHasta] = useState<string>(today.toISOString().split('T')[0]);

  useEffect(() => {
    document.title = 'TOMWMSUX - Análisis de Ciclo';
  }, []);

  const analizarCiclos = async () => {
    const token = getToken();
    if (!token) {
      logout();
      navigate('/login', { replace: true });
      return;
    }

    setLoading(true);
    try {
      const [pickingData, verificacionData] = await Promise.all([
        kpiAPI.getPicking(fechaDesde, fechaHasta),
        kpiAPI.getVerificacion(fechaDesde, fechaHasta)
      ]);

      const pickingPorNumero: { [key: number]: KpiPickingItem[] } = {};
      pickingData.forEach(p => {
        if (!pickingPorNumero[p.número_Picking]) pickingPorNumero[p.número_Picking] = [];
        pickingPorNumero[p.número_Picking].push(p);
      });

      const verificacionPorPicking: { [key: number]: KpiVerificacionItem[] } = {};
      verificacionData.forEach(v => {
        if (!verificacionPorPicking[v.id_Picking]) verificacionPorPicking[v.id_Picking] = [];
        verificacionPorPicking[v.id_Picking].push(v);
      });

      const ciclosCalculados: CicloDocumento[] = [];

      Object.entries(pickingPorNumero).forEach(([numPickingStr, pickings]) => {
        const numPicking = parseInt(numPickingStr);
        const verificaciones = verificacionPorPicking[numPicking] || [];

        const pickingInicios = pickings.map(p => new Date(p.fecha_Hora_Inicio).getTime()).filter(t => !isNaN(t) && t > 0);
        const pickingFines = pickings.map(p => new Date(p.fecha_Hora_Fin).getTime()).filter(t => !isNaN(t) && t > 0);
        
        const pickingInicio = pickingInicios.length > 0 ? new Date(Math.min(...pickingInicios)) : null;
        const pickingFin = pickingFines.length > 0 ? new Date(Math.max(...pickingFines)) : null;

        let verificacionInicio: Date | null = null;
        let verificacionFin: Date | null = null;

        if (verificaciones.length > 0) {
          const verifInicios = verificaciones.map(v => new Date(v.fecha_Hora_Inicio).getTime()).filter(t => !isNaN(t) && t > 0);
          const verifFines = verificaciones.map(v => new Date(v.fecha_Hora_Fin).getTime()).filter(t => !isNaN(t) && t > 0);
          
          if (verifInicios.length > 0) verificacionInicio = new Date(Math.min(...verifInicios));
          if (verifFines.length > 0) verificacionFin = new Date(Math.max(...verifFines));
        }

        const tiempoPicking = (pickingInicio && pickingFin && pickingFin > pickingInicio) 
          ? (pickingFin.getTime() - pickingInicio.getTime()) / 60000 : 0;
        const tiempoVerificacion = (verificacionInicio && verificacionFin && verificacionFin > verificacionInicio)
          ? (verificacionFin.getTime() - verificacionInicio.getTime()) / 60000 : 0;

        if (tiempoPicking > 0) {
          ciclosCalculados.push({
            numeroPicking: numPicking,
            pickingInicio,
            pickingFin,
            verificacionInicio,
            verificacionFin,
            tiempoPicking,
            tiempoVerificacion,
            tiempoTotal: tiempoPicking + tiempoVerificacion,
            lineasPicking: pickings.length,
            lineasVerificacion: verificaciones.length,
            operadorPicking: pickings[0]?.descripción_Operador || 'Sin asignar',
            operadorVerificacion: verificaciones[0]?.descripción_Operador || 'Sin asignar'
          });
        }
      });

      setCiclos(ciclosCalculados);

      if (ciclosCalculados.length > 0) {
        const tiempoPickingPromedio = ciclosCalculados.reduce((sum, c) => sum + c.tiempoPicking, 0) / ciclosCalculados.length;
        const ciclosConVerif = ciclosCalculados.filter(c => c.tiempoVerificacion > 0);
        const tiempoVerificacionPromedio = ciclosConVerif.length > 0 
          ? ciclosConVerif.reduce((sum, c) => sum + c.tiempoVerificacion, 0) / ciclosConVerif.length : 0;
        const tiempoTotalPromedio = ciclosCalculados.reduce((sum, c) => sum + c.tiempoTotal, 0) / ciclosCalculados.length;

        const cuellosDetectados = [];
        const pickingLentos = ciclosCalculados.filter(c => c.tiempoPicking > tiempoPickingPromedio * 1.5);
        const verifLentos = ciclosConVerif.filter(c => c.tiempoVerificacion > tiempoVerificacionPromedio * 1.5);
        
        if (pickingLentos.length > 0) {
          cuellosDetectados.push({
            etapa: 'Picking',
            documentos: pickingLentos.length,
            tiempoPromedio: pickingLentos.reduce((sum, c) => sum + c.tiempoPicking, 0) / pickingLentos.length
          });
        }
        if (verifLentos.length > 0) {
          cuellosDetectados.push({
            etapa: 'Verificación',
            documentos: verifLentos.length,
            tiempoPromedio: verifLentos.reduce((sum, c) => sum + c.tiempoVerificacion, 0) / verifLentos.length
          });
        }

        const rangos = [
          { min: 0, max: 30, label: '< 30 min' },
          { min: 30, max: 60, label: '30-60 min' },
          { min: 60, max: 120, label: '1-2 horas' },
          { min: 120, max: 240, label: '2-4 horas' },
          { min: 240, max: Infinity, label: '> 4 horas' }
        ];

        const distribucionTiempos = rangos.map(rango => {
          const cantidad = ciclosCalculados.filter(c => c.tiempoTotal >= rango.min && c.tiempoTotal < rango.max).length;
          return {
            rango: rango.label,
            cantidad,
            porcentaje: (cantidad / ciclosCalculados.length) * 100
          };
        });

        const documentosLentos = [...ciclosCalculados]
          .sort((a, b) => b.tiempoTotal - a.tiempoTotal)
          .slice(0, 10);

        setResumen({
          documentosAnalizados: ciclosCalculados.length,
          tiempoPickingPromedio,
          tiempoVerificacionPromedio,
          tiempoTotalPromedio,
          cuellosDetectados,
          distribucionTiempos,
          documentosLentos
        });

        toast.success(`Se analizaron ${ciclosCalculados.length} ciclos de documentos`);
      } else {
        setResumen(null);
        toast('No se encontraron ciclos con datos de tiempo válidos', { icon: 'ℹ️' });
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al analizar los ciclos');
    } finally {
      setLoading(false);
    }
  };

  const formatTiempo = (minutos: number) => {
    if (minutos < 60) return `${minutos.toFixed(0)} min`;
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins.toFixed(0)}m`;
  };

  const formatNumber = (value: number) => value.toLocaleString('es-ES');

  return (
    <Layout pageTitle="Análisis de Ciclo Completo">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <button
              onClick={analizarCiclos}
              disabled={loading}
              className="flex items-center px-6 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Analizando...' : 'Analizar Ciclos'}
            </button>
          </div>
        </div>

        {resumen && (
          <>
            {/* Métricas principales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                <p className="text-sm text-gray-500 mb-2">Documentos Analizados</p>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(resumen.documentosAnalizados)}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 text-center">
                <p className="text-sm text-blue-700 mb-2">Tiempo Promedio Picking</p>
                <p className="text-3xl font-bold text-blue-900">{formatTiempo(resumen.tiempoPickingPromedio)}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 text-center">
                <p className="text-sm text-green-700 mb-2">Tiempo Promedio Verificación</p>
                <p className="text-3xl font-bold text-green-900">{formatTiempo(resumen.tiempoVerificacionPromedio)}</p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-6 text-center">
                <p className="text-sm text-amber-700 mb-2">Lead Time Total</p>
                <p className="text-3xl font-bold text-amber-900">{formatTiempo(resumen.tiempoTotalPromedio)}</p>
              </div>
            </div>

            {/* Flujo visual */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución del Lead Time</h3>
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <div className="bg-blue-500 text-white rounded-lg p-4 w-40">
                    <p className="text-sm">Picking</p>
                    <p className="text-xl font-bold">{formatTiempo(resumen.tiempoPickingPromedio)}</p>
                  </div>
                </div>
                <ArrowLongRightIcon className="h-8 w-8 text-gray-300" />
                <div className="text-center">
                  <div className="bg-green-500 text-white rounded-lg p-4 w-40">
                    <p className="text-sm">Verificación</p>
                    <p className="text-xl font-bold">{formatTiempo(resumen.tiempoVerificacionPromedio)}</p>
                  </div>
                </div>
                <ArrowLongRightIcon className="h-8 w-8 text-gray-300" />
                <div className="text-center">
                  <div className="bg-amber-500 text-white rounded-lg p-4 w-40">
                    <p className="text-sm">TOTAL</p>
                    <p className="text-xl font-bold">{formatTiempo(resumen.tiempoTotalPromedio)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cuellos de botella y distribución */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cuellos de botella */}
              {resumen.cuellosDetectados.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Cuellos de Botella Detectados</h3>
                  <div className="space-y-4">
                    {resumen.cuellosDetectados.map((cuello, idx) => (
                      <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-red-800">{cuello.etapa}</p>
                            <p className="text-sm text-red-600">{cuello.documentos} documentos afectados</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-red-700">{formatTiempo(cuello.tiempoPromedio)}</p>
                            <p className="text-xs text-red-500">tiempo promedio</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Distribución de tiempos */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución de Lead Time</h3>
                <div className="space-y-3">
                  {resumen.distribucionTiempos.map((dist, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">{dist.rango}</span>
                        <span className="font-medium">{dist.cantidad} ({dist.porcentaje.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-amber-400 to-amber-600 h-3 rounded-full"
                          style={{ width: `${dist.porcentaje}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top documentos más lentos */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Documentos con Mayor Lead Time</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Picking</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Operador Picking</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tiempo Picking</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tiempo Verif.</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Líneas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {resumen.documentosLentos.map((doc, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">#{doc.numeroPicking}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 truncate max-w-40">{doc.operadorPicking}</td>
                        <td className="px-4 py-3 text-sm text-right text-blue-600">{formatTiempo(doc.tiempoPicking)}</td>
                        <td className="px-4 py-3 text-sm text-right text-green-600">{formatTiempo(doc.tiempoVerificacion)}</td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-amber-600">{formatTiempo(doc.tiempoTotal)}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-500">{doc.lineasPicking}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {!resumen && !loading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Análisis de Ciclo Completo</h3>
            <p className="mt-1 text-sm text-gray-500">
              Analiza el lead time desde Picking hasta Verificación para identificar cuellos de botella.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default AnalisisCiclo;
