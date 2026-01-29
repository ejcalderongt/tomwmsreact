import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { ExclamationTriangleIcon, CalendarIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { kpiAPI, KpiDespachoItem } from '@/api/api';
import { getToken, logout } from '@/utils/auth';

interface MermaResumen {
  totalLineas: number;
  totalSolicitado: number;
  totalDespachado: number;
  totalMerma: number;
  totalDañadoPicking: number;
  totalDañadoVerificacion: number;
  totalNoEncontrado: number;
  tasaMerma: number;
  mermaPorProducto: { codigo: string; nombre: string; merma: number; porcentaje: number }[];
  mermaPorProveedor: { proveedor: string; merma: number; porcentaje: number }[];
}

function AnalisisMerma() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [resumen, setResumen] = useState<MermaResumen | null>(null);

  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const [fechaDesde, setFechaDesde] = useState<string>(firstDayOfMonth.toISOString().split('T')[0]);
  const [fechaHasta, setFechaHasta] = useState<string>(today.toISOString().split('T')[0]);

  useEffect(() => {
    document.title = 'TOMWMSUX - Análisis de Merma';
  }, []);

  const analizarMerma = async () => {
    const token = getToken();
    if (!token) {
      logout();
      navigate('/login', { replace: true });
      return;
    }

    setLoading(true);
    try {
      const data = await kpiAPI.getDespacho(fechaDesde, fechaHasta);
      
      const totalSolicitado = data.reduce((sum: number, d: KpiDespachoItem) => sum + (d.cantidad_Solicitada_Despacho || 0), 0);
      const totalDespachado = data.reduce((sum: number, d: KpiDespachoItem) => sum + (d.cantidad_Despachada || 0), 0);
      const totalMerma = data.reduce((sum: number, d: KpiDespachoItem) => sum + (d.cantidad_Merma_Despacho || 0), 0);
      const totalDañadoPicking = data.reduce((sum: number, d: KpiDespachoItem) => sum + (d.cantidad_Dañada_Picking || 0), 0);
      const totalDañadoVerificacion = data.reduce((sum: number, d: KpiDespachoItem) => sum + (d.cantidad_Dañada_Verificacion || 0), 0);
      const totalNoEncontrado = data.reduce((sum: number, d: KpiDespachoItem) => sum + (d.cantidad_No_Encontrada || 0), 0);

      const mermaPorProductoMap: { [key: string]: { nombre: string; merma: number } } = {};
      const mermaPorProveedorMap: { [key: string]: number } = {};

      data.forEach((d: KpiDespachoItem) => {
        const mermaTotal = (d.cantidad_Merma_Despacho || 0) + (d.cantidad_Dañada_Picking || 0) + 
                          (d.cantidad_Dañada_Verificacion || 0) + (d.cantidad_No_Encontrada || 0);
        
        if (mermaTotal > 0) {
          const codigo = d.código_Producto || 'SIN_CODIGO';
          if (!mermaPorProductoMap[codigo]) {
            mermaPorProductoMap[codigo] = { nombre: d.nombre_Producto || '', merma: 0 };
          }
          mermaPorProductoMap[codigo].merma += mermaTotal;

          const proveedor = d.descripción_Proveedor?.trim() || 'Sin proveedor';
          mermaPorProveedorMap[proveedor] = (mermaPorProveedorMap[proveedor] || 0) + mermaTotal;
        }
      });

      const totalMermaGlobal = totalMerma + totalDañadoPicking + totalDañadoVerificacion + totalNoEncontrado;

      const mermaPorProducto = Object.entries(mermaPorProductoMap)
        .map(([codigo, data]) => ({
          codigo,
          nombre: data.nombre,
          merma: data.merma,
          porcentaje: totalMermaGlobal > 0 ? (data.merma / totalMermaGlobal) * 100 : 0
        }))
        .sort((a, b) => b.merma - a.merma)
        .slice(0, 20);

      const mermaPorProveedor = Object.entries(mermaPorProveedorMap)
        .map(([proveedor, merma]) => ({
          proveedor,
          merma,
          porcentaje: totalMermaGlobal > 0 ? (merma / totalMermaGlobal) * 100 : 0
        }))
        .sort((a, b) => b.merma - a.merma)
        .slice(0, 10);

      setResumen({
        totalLineas: data.length,
        totalSolicitado,
        totalDespachado,
        totalMerma,
        totalDañadoPicking,
        totalDañadoVerificacion,
        totalNoEncontrado,
        tasaMerma: totalSolicitado > 0 ? (totalMermaGlobal / totalSolicitado) * 100 : 0,
        mermaPorProducto,
        mermaPorProveedor
      });

      toast.success(`Se analizaron ${data.length} registros de despacho`);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al analizar merma');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value: number, decimals: number = 0) => 
    value.toLocaleString('es-ES', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  return (
    <Layout pageTitle="Análisis de Merma y Calidad">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <button
              onClick={analizarMerma}
              disabled={loading}
              className="flex items-center px-6 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Analizando...' : 'Analizar Merma'}
            </button>
          </div>
        </div>

        {resumen && (
          <>
            {/* Métricas principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl font-bold text-gray-600">#</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500">Total Solicitado</p>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(resumen.totalSolicitado)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl font-bold text-green-600">ok</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500">Total Despachado</p>
                    <p className="text-2xl font-bold text-green-600">{formatNumber(resumen.totalDespachado)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${resumen.totalMerma > 0 ? 'bg-orange-100' : 'bg-green-100'}`}>
                    <ExclamationTriangleIcon className={`h-6 w-6 ${resumen.totalMerma > 0 ? 'text-orange-600' : 'text-green-600'}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500">Total Merma</p>
                    <p className={`text-2xl font-bold ${resumen.totalMerma > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {formatNumber(resumen.totalMerma)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${resumen.tasaMerma > 5 ? 'bg-red-100' : resumen.tasaMerma > 2 ? 'bg-yellow-100' : 'bg-green-100'}`}>
                    <span className={`text-lg font-bold ${resumen.tasaMerma > 5 ? 'text-red-600' : resumen.tasaMerma > 2 ? 'text-yellow-600' : 'text-green-600'}`}>%</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500">Tasa de Merma</p>
                    <p className={`text-2xl font-bold ${resumen.tasaMerma > 5 ? 'text-red-600' : resumen.tasaMerma > 2 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {formatNumber(resumen.tasaMerma, 2)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Desglose de merma por tipo */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Desglose por Tipo de Pérdida</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-orange-50 rounded-lg p-4 text-center border border-orange-200">
                  <p className="text-sm text-orange-700">Merma Despacho</p>
                  <p className="text-2xl font-bold text-orange-800">{formatNumber(resumen.totalMerma)}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center border border-red-200">
                  <p className="text-sm text-red-700">Dañado Picking</p>
                  <p className="text-2xl font-bold text-red-800">{formatNumber(resumen.totalDañadoPicking)}</p>
                </div>
                <div className="bg-pink-50 rounded-lg p-4 text-center border border-pink-200">
                  <p className="text-sm text-pink-700">Dañado Verificación</p>
                  <p className="text-2xl font-bold text-pink-800">{formatNumber(resumen.totalDañadoVerificacion)}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center border border-purple-200">
                  <p className="text-sm text-purple-700">No Encontrado</p>
                  <p className="text-2xl font-bold text-purple-800">{formatNumber(resumen.totalNoEncontrado)}</p>
                </div>
              </div>
            </div>

            {/* Top productos y proveedores con merma */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top productos */}
              {resumen.mermaPorProducto.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 20 Productos con Mayor Merma</h3>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {resumen.mermaPorProducto.map((p, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                        <span className="w-6 text-center font-bold text-gray-400 text-sm">{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 truncate" title={p.nombre}>{p.nombre}</p>
                          <p className="text-xs text-gray-500">{p.codigo}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-red-600">{formatNumber(p.merma)}</p>
                          <p className="text-xs text-gray-400">{formatNumber(p.porcentaje, 1)}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top proveedores */}
              {resumen.mermaPorProveedor.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Clientes con Mayor Merma</h3>
                  <div className="space-y-3">
                    {resumen.mermaPorProveedor.map((p, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700 truncate" title={p.proveedor}>{p.proveedor}</span>
                          <span className="text-red-600 font-medium">{formatNumber(p.merma)} ({formatNumber(p.porcentaje, 1)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-red-400 to-red-600 h-2 rounded-full"
                            style={{ width: `${p.porcentaje}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {!resumen && !loading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Análisis de Merma y Calidad</h3>
            <p className="mt-1 text-sm text-gray-500">
              Analiza las pérdidas por merma, daños y productos no encontrados.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default AnalisisMerma;
