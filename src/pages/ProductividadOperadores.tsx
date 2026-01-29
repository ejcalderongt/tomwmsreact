import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { UsersIcon, CalendarIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { kpiAPI } from '@/api/api';
import { getToken, logout } from '@/utils/auth';

interface OperadorMetrics {
  nombre: string;
  picking: { lineas: number; tiempoMinutos: number; lineasPorHora: number };
  verificacion: { lineas: number; tiempoMinutos: number; lineasPorHora: number };
  recepcion: { lineas: number; tiempoMinutos: number; lineasPorHora: number };
  totalLineas: number;
  productividadGlobal: number;
}

function ProductividadOperadores() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [operadores, setOperadores] = useState<OperadorMetrics[]>([]);
  const [promedios, setPromedios] = useState<{ picking: number; verificacion: number; recepcion: number }>({ picking: 0, verificacion: 0, recepcion: 0 });

  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const [fechaDesde, setFechaDesde] = useState<string>(firstDayOfMonth.toISOString().split('T')[0]);
  const [fechaHasta, setFechaHasta] = useState<string>(today.toISOString().split('T')[0]);

  useEffect(() => {
    document.title = 'TOMWMSUX - Productividad Operadores';
  }, []);

  const analizarProductividad = async () => {
    const token = getToken();
    if (!token) {
      logout();
      navigate('/login', { replace: true });
      return;
    }

    setLoading(true);
    try {
      const [pickingData, verificacionData, recepcionData] = await Promise.all([
        kpiAPI.getPicking(fechaDesde, fechaHasta).catch(() => []),
        kpiAPI.getVerificacion(fechaDesde, fechaHasta).catch(() => []),
        kpiAPI.getRecepcion(fechaDesde, fechaHasta).catch(() => [])
      ]);

      const operadorData: { [key: string]: OperadorMetrics } = {};

      const initOperador = (nombre: string) => {
        if (!operadorData[nombre]) {
          operadorData[nombre] = {
            nombre,
            picking: { lineas: 0, tiempoMinutos: 0, lineasPorHora: 0 },
            verificacion: { lineas: 0, tiempoMinutos: 0, lineasPorHora: 0 },
            recepcion: { lineas: 0, tiempoMinutos: 0, lineasPorHora: 0 },
            totalLineas: 0,
            productividadGlobal: 0
          };
        }
      };

      const pickingsProcesados = new Set<number>();
      pickingData.forEach(p => {
        const nombre = p.descripción_Operador?.trim() || 'Sin asignar';
        initOperador(nombre);
        operadorData[nombre].picking.lineas++;
        operadorData[nombre].totalLineas++;
        
        if (!pickingsProcesados.has(p.número_Picking) && p.fecha_Hora_Inicio && p.fecha_Hora_Fin) {
          const inicio = new Date(p.fecha_Hora_Inicio);
          const fin = new Date(p.fecha_Hora_Fin);
          if (!isNaN(inicio.getTime()) && !isNaN(fin.getTime()) && fin > inicio) {
            operadorData[nombre].picking.tiempoMinutos += (fin.getTime() - inicio.getTime()) / 60000;
            pickingsProcesados.add(p.número_Picking);
          }
        }
      });

      const verifProcesados = new Set<number>();
      verificacionData.forEach(v => {
        const nombre = v.descripción_Operador?.trim() || 'Sin asignar';
        initOperador(nombre);
        operadorData[nombre].verificacion.lineas++;
        operadorData[nombre].totalLineas++;
        
        if (!verifProcesados.has(v.id_Picking) && v.fecha_Hora_Inicio && v.fecha_Hora_Fin) {
          const inicio = new Date(v.fecha_Hora_Inicio);
          const fin = new Date(v.fecha_Hora_Fin);
          if (!isNaN(inicio.getTime()) && !isNaN(fin.getTime()) && fin > inicio) {
            operadorData[nombre].verificacion.tiempoMinutos += (fin.getTime() - inicio.getTime()) / 60000;
            verifProcesados.add(v.id_Picking);
          }
        }
      });

      const recepProcesados = new Set<number>();
      recepcionData.forEach(r => {
        const nombre = r.descripción_Operador?.trim() || 'Sin asignar';
        initOperador(nombre);
        operadorData[nombre].recepcion.lineas++;
        operadorData[nombre].totalLineas++;
        
        if (!recepProcesados.has(r.id_Recepcion) && r.fecha_Hora_Inicio && r.fecha_Hora_Fin) {
          const inicio = new Date(r.fecha_Hora_Inicio);
          const fin = new Date(r.fecha_Hora_Fin);
          if (!isNaN(inicio.getTime()) && !isNaN(fin.getTime()) && fin > inicio) {
            operadorData[nombre].recepcion.tiempoMinutos += (fin.getTime() - inicio.getTime()) / 60000;
            recepProcesados.add(r.id_Recepcion);
          }
        }
      });

      Object.values(operadorData).forEach(op => {
        const pickingHoras = op.picking.tiempoMinutos / 60;
        const verifHoras = op.verificacion.tiempoMinutos / 60;
        const recepHoras = op.recepcion.tiempoMinutos / 60;
        
        op.picking.lineasPorHora = pickingHoras > 0 ? op.picking.lineas / pickingHoras : 0;
        op.verificacion.lineasPorHora = verifHoras > 0 ? op.verificacion.lineas / verifHoras : 0;
        op.recepcion.lineasPorHora = recepHoras > 0 ? op.recepcion.lineas / recepHoras : 0;
        
        const totalHoras = pickingHoras + verifHoras + recepHoras;
        op.productividadGlobal = totalHoras > 0 ? op.totalLineas / totalHoras : 0;
      });

      const operadoresOrdenados = Object.values(operadorData)
        .filter(op => op.totalLineas > 0)
        .sort((a, b) => b.productividadGlobal - a.productividadGlobal);

      setOperadores(operadoresOrdenados);

      const opsConPicking = operadoresOrdenados.filter(o => o.picking.lineasPorHora > 0);
      const opsConVerif = operadoresOrdenados.filter(o => o.verificacion.lineasPorHora > 0);
      const opsConRecep = operadoresOrdenados.filter(o => o.recepcion.lineasPorHora > 0);

      setPromedios({
        picking: opsConPicking.length > 0 ? opsConPicking.reduce((sum, o) => sum + o.picking.lineasPorHora, 0) / opsConPicking.length : 0,
        verificacion: opsConVerif.length > 0 ? opsConVerif.reduce((sum, o) => sum + o.verificacion.lineasPorHora, 0) / opsConVerif.length : 0,
        recepcion: opsConRecep.length > 0 ? opsConRecep.reduce((sum, o) => sum + o.recepcion.lineasPorHora, 0) / opsConRecep.length : 0
      });

      toast.success(`Se analizaron ${operadoresOrdenados.length} operadores`);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al analizar la productividad');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value: number, decimals: number = 1) => value.toLocaleString('es-ES', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  const getMedal = (idx: number) => {
    if (idx === 0) return '🥇';
    if (idx === 1) return '🥈';
    if (idx === 2) return '🥉';
    return `${idx + 1}`;
  };

  const getColorByPerformance = (value: number, promedio: number) => {
    if (value === 0) return 'text-gray-400';
    if (value >= promedio * 1.2) return 'text-green-600 font-bold';
    if (value >= promedio) return 'text-green-500';
    if (value >= promedio * 0.8) return 'text-yellow-600';
    return 'text-red-500';
  };

  return (
    <Layout pageTitle="Productividad Operadores">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <button
              onClick={analizarProductividad}
              disabled={loading}
              className="flex items-center px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Analizando...' : 'Analizar Productividad'}
            </button>
          </div>
        </div>

        {operadores.length > 0 && (
          <>
            {/* Promedios */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 text-center">
                <p className="text-sm text-blue-700 mb-2">Promedio Picking</p>
                <p className="text-2xl font-bold text-blue-900">{formatNumber(promedios.picking)} <span className="text-sm font-normal">líneas/hora</span></p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 text-center">
                <p className="text-sm text-green-700 mb-2">Promedio Verificación</p>
                <p className="text-2xl font-bold text-green-900">{formatNumber(promedios.verificacion)} <span className="text-sm font-normal">líneas/hora</span></p>
              </div>
              <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg p-6 text-center">
                <p className="text-sm text-cyan-700 mb-2">Promedio Recepción</p>
                <p className="text-2xl font-bold text-cyan-900">{formatNumber(promedios.recepcion)} <span className="text-sm font-normal">líneas/hora</span></p>
              </div>
            </div>

            {/* Tabla de operadores */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ranking de Productividad por Operador</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Operador</th>
                      <th className="px-3 py-3 text-center text-xs font-medium text-blue-600 uppercase" colSpan={2}>Picking</th>
                      <th className="px-3 py-3 text-center text-xs font-medium text-green-600 uppercase" colSpan={2}>Verificación</th>
                      <th className="px-3 py-3 text-center text-xs font-medium text-cyan-600 uppercase" colSpan={2}>Recepción</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Líneas</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Productividad Global</th>
                    </tr>
                    <tr className="bg-gray-100">
                      <th></th>
                      <th></th>
                      <th className="px-2 py-1 text-xs text-blue-500">Líneas</th>
                      <th className="px-2 py-1 text-xs text-blue-500">L/H</th>
                      <th className="px-2 py-1 text-xs text-green-500">Líneas</th>
                      <th className="px-2 py-1 text-xs text-green-500">L/H</th>
                      <th className="px-2 py-1 text-xs text-cyan-500">Líneas</th>
                      <th className="px-2 py-1 text-xs text-cyan-500">L/H</th>
                      <th></th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {operadores.map((op, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-3 text-sm font-medium">{getMedal(idx)}</td>
                        <td className="px-3 py-3 text-sm text-gray-900 truncate max-w-40" title={op.nombre}>{op.nombre}</td>
                        <td className="px-2 py-3 text-sm text-center text-gray-600">{formatNumber(op.picking.lineas, 0)}</td>
                        <td className={`px-2 py-3 text-sm text-center ${getColorByPerformance(op.picking.lineasPorHora, promedios.picking)}`}>
                          {op.picking.lineasPorHora > 0 ? formatNumber(op.picking.lineasPorHora) : '-'}
                        </td>
                        <td className="px-2 py-3 text-sm text-center text-gray-600">{formatNumber(op.verificacion.lineas, 0)}</td>
                        <td className={`px-2 py-3 text-sm text-center ${getColorByPerformance(op.verificacion.lineasPorHora, promedios.verificacion)}`}>
                          {op.verificacion.lineasPorHora > 0 ? formatNumber(op.verificacion.lineasPorHora) : '-'}
                        </td>
                        <td className="px-2 py-3 text-sm text-center text-gray-600">{formatNumber(op.recepcion.lineas, 0)}</td>
                        <td className={`px-2 py-3 text-sm text-center ${getColorByPerformance(op.recepcion.lineasPorHora, promedios.recepcion)}`}>
                          {op.recepcion.lineasPorHora > 0 ? formatNumber(op.recepcion.lineasPorHora) : '-'}
                        </td>
                        <td className="px-3 py-3 text-sm text-right font-medium text-gray-900">{formatNumber(op.totalLineas, 0)}</td>
                        <td className="px-3 py-3 text-sm text-right font-bold text-teal-600">{formatNumber(op.productividadGlobal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-xs text-gray-500">
                <span className="text-green-600 font-bold">Verde</span> = Sobre promedio | 
                <span className="text-yellow-600 ml-2">Amarillo</span> = Cerca del promedio | 
                <span className="text-red-500 ml-2">Rojo</span> = Bajo promedio
              </div>
            </div>
          </>
        )}

        {operadores.length === 0 && !loading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Productividad de Operadores</h3>
            <p className="mt-1 text-sm text-gray-500">
              Compara el rendimiento de operadores en Picking, Verificación y Recepción.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default ProductividadOperadores;
