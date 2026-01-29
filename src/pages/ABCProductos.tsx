import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import ReportDescription from '@/components/ReportDescription';
import { CubeIcon, CalendarIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { kpiAPI, KpiTendenciaDespachoItem } from '@/api/api';
import { getToken, logout } from '@/utils/auth';

interface ProductoABC {
  codigo: string;
  nombre: string;
  familia: string;
  cantidad: number;
  porcentaje: number;
  acumulado: number;
  clasificacion: 'A' | 'B' | 'C';
}

interface ResumenABC {
  totalProductos: number;
  totalCantidad: number;
  productosA: { cantidad: number; porcentaje: number; unidades: number };
  productosB: { cantidad: number; porcentaje: number; unidades: number };
  productosC: { cantidad: number; porcentaje: number; unidades: number };
}

function ABCProductos() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [productos, setProductos] = useState<ProductoABC[]>([]);
  const [resumen, setResumen] = useState<ResumenABC | null>(null);
  const [filtroClasificacion, setFiltroClasificacion] = useState<'todos' | 'A' | 'B' | 'C'>('todos');

  const today = new Date();
  const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1);
  
  const [fechaDesde, setFechaDesde] = useState<string>(threeMonthsAgo.toISOString().split('T')[0]);
  const [fechaHasta, setFechaHasta] = useState<string>(today.toISOString().split('T')[0]);

  useEffect(() => {
    document.title = 'TOMWMSUX - Análisis ABC';
  }, []);

  const analizarABC = async () => {
    const token = getToken();
    if (!token) {
      logout();
      navigate('/login', { replace: true });
      return;
    }

    setLoading(true);
    try {
      const data = await kpiAPI.getTendenciasDespacho(fechaDesde, fechaHasta);
      
      const productosData = data.filter((d: KpiTendenciaDespachoItem) => d.nivel === 'PRODUCTO');
      
      const productosAgrupados: { [key: string]: { nombre: string; familia: string; cantidad: number } } = {};
      productosData.forEach((item: KpiTendenciaDespachoItem) => {
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

      const productosOrdenados = Object.entries(productosAgrupados)
        .map(([codigo, data]) => ({
          codigo,
          nombre: data.nombre,
          familia: data.familia,
          cantidad: data.cantidad
        }))
        .sort((a, b) => b.cantidad - a.cantidad);

      const totalCantidad = productosOrdenados.reduce((sum, p) => sum + p.cantidad, 0);

      let acumulado = 0;
      const productosConClasificacion: ProductoABC[] = productosOrdenados.map(p => {
        const porcentaje = totalCantidad > 0 ? (p.cantidad / totalCantidad) * 100 : 0;
        acumulado += porcentaje;
        
        let clasificacion: 'A' | 'B' | 'C';
        if (acumulado <= 80) {
          clasificacion = 'A';
        } else if (acumulado <= 95) {
          clasificacion = 'B';
        } else {
          clasificacion = 'C';
        }

        return {
          ...p,
          porcentaje,
          acumulado,
          clasificacion
        };
      });

      setProductos(productosConClasificacion);

      const productosA = productosConClasificacion.filter(p => p.clasificacion === 'A');
      const productosB = productosConClasificacion.filter(p => p.clasificacion === 'B');
      const productosC = productosConClasificacion.filter(p => p.clasificacion === 'C');

      setResumen({
        totalProductos: productosConClasificacion.length,
        totalCantidad,
        productosA: {
          cantidad: productosA.length,
          porcentaje: productosConClasificacion.length > 0 ? (productosA.length / productosConClasificacion.length) * 100 : 0,
          unidades: productosA.reduce((sum, p) => sum + p.cantidad, 0)
        },
        productosB: {
          cantidad: productosB.length,
          porcentaje: productosConClasificacion.length > 0 ? (productosB.length / productosConClasificacion.length) * 100 : 0,
          unidades: productosB.reduce((sum, p) => sum + p.cantidad, 0)
        },
        productosC: {
          cantidad: productosC.length,
          porcentaje: productosConClasificacion.length > 0 ? (productosC.length / productosConClasificacion.length) * 100 : 0,
          unidades: productosC.reduce((sum, p) => sum + p.cantidad, 0)
        }
      });

      toast.success(`Se clasificaron ${productosConClasificacion.length} productos`);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al analizar ABC');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value: number, decimals: number = 0) => 
    value.toLocaleString('es-ES', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  const productosFiltrados = filtroClasificacion === 'todos' 
    ? productos 
    : productos.filter(p => p.clasificacion === filtroClasificacion);

  const getClasificacionColor = (clasificacion: string) => {
    switch (clasificacion) {
      case 'A': return 'bg-green-100 text-green-800 border-green-300';
      case 'B': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'C': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout pageTitle="Análisis ABC de Productos">
      <div className="space-y-6">
        <ReportDescription
          title="Análisis ABC de Productos (Pareto)"
          description="Clasificación de productos según el principio de Pareto (80/20). Agrupa productos en categorías A (alta rotación), B (media) y C (baja) basándose en el volumen histórico de despachos para optimizar la gestión de inventario."
          metrics={[
            "Clasificación A (80% del movimiento)",
            "Clasificación B (15% del movimiento)",
            "Clasificación C (5% del movimiento)",
            "Curva de Pareto visual"
          ]}
          interpretation="Productos A: ubicar cerca de zonas de picking, mantener alto stock. Productos B: ubicación intermedia, stock moderado. Productos C: candidatos para revisión de surtido o promociones. Use este análisis para optimizar la distribución física del almacén."
          color="emerald"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              onClick={analizarABC}
              disabled={loading}
              className="flex items-center px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Analizando...' : 'Clasificar ABC'}
            </button>
          </div>
        </div>

        {resumen && (
          <>
            {/* Resumen ABC */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                <p className="text-sm text-gray-500 mb-2">Total Productos</p>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(resumen.totalProductos)}</p>
                <p className="text-xs text-gray-400 mt-1">{formatNumber(resumen.totalCantidad)} unidades</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 text-center border-2 border-green-200">
                <p className="text-sm text-green-700 mb-2">Clase A (80%)</p>
                <p className="text-3xl font-bold text-green-800">{formatNumber(resumen.productosA.cantidad)}</p>
                <p className="text-xs text-green-600 mt-1">{formatNumber(resumen.productosA.porcentaje, 1)}% productos | {formatNumber(resumen.productosA.unidades)} uds</p>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6 text-center border-2 border-yellow-200">
                <p className="text-sm text-yellow-700 mb-2">Clase B (15%)</p>
                <p className="text-3xl font-bold text-yellow-800">{formatNumber(resumen.productosB.cantidad)}</p>
                <p className="text-xs text-yellow-600 mt-1">{formatNumber(resumen.productosB.porcentaje, 1)}% productos | {formatNumber(resumen.productosB.unidades)} uds</p>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 text-center border-2 border-red-200">
                <p className="text-sm text-red-700 mb-2">Clase C (5%)</p>
                <p className="text-3xl font-bold text-red-800">{formatNumber(resumen.productosC.cantidad)}</p>
                <p className="text-xs text-red-600 mt-1">{formatNumber(resumen.productosC.porcentaje, 1)}% productos | {formatNumber(resumen.productosC.unidades)} uds</p>
              </div>
            </div>

            {/* Curva de Pareto visual */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución Pareto</h3>
              <div className="flex h-8 rounded-lg overflow-hidden">
                <div 
                  className="bg-green-500 flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${resumen.productosA.porcentaje}%` }}
                >
                  A: {formatNumber(resumen.productosA.porcentaje, 1)}%
                </div>
                <div 
                  className="bg-yellow-500 flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${resumen.productosB.porcentaje}%` }}
                >
                  B: {formatNumber(resumen.productosB.porcentaje, 1)}%
                </div>
                <div 
                  className="bg-red-500 flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${resumen.productosC.porcentaje}%` }}
                >
                  C: {formatNumber(resumen.productosC.porcentaje, 1)}%
                </div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>A = Alta rotación (80% movimiento)</span>
                <span>B = Media rotación (15% movimiento)</span>
                <span>C = Baja rotación (5% movimiento)</span>
              </div>
            </div>

            {/* Filtros de clasificación */}
            <div className="flex gap-2">
              {['todos', 'A', 'B', 'C'].map((filtro) => (
                <button
                  key={filtro}
                  onClick={() => setFiltroClasificacion(filtro as typeof filtroClasificacion)}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    filtroClasificacion === filtro
                      ? filtro === 'A' ? 'bg-green-600 text-white' :
                        filtro === 'B' ? 'bg-yellow-600 text-white' :
                        filtro === 'C' ? 'bg-red-600 text-white' :
                        'bg-gray-800 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filtro === 'todos' ? 'Todos' : `Clase ${filtro}`}
                  {filtro !== 'todos' && ` (${productos.filter(p => p.clasificacion === filtro).length})`}
                </button>
              ))}
            </div>

            {/* Tabla de productos */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Detalle de Productos ({productosFiltrados.length})
              </h3>
              <div className="overflow-x-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">ABC</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Familia</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">% Individual</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">% Acumulado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {productosFiltrados.slice(0, 100).map((producto, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-2 text-sm text-gray-500">{idx + 1}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-1 text-xs font-bold rounded border ${getClasificacionColor(producto.clasificacion)}`}>
                            {producto.clasificacion}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-sm font-mono text-gray-600">{producto.codigo}</td>
                        <td className="px-3 py-2 text-sm text-gray-900 truncate max-w-60" title={producto.nombre}>{producto.nombre}</td>
                        <td className="px-3 py-2 text-sm text-gray-500 truncate max-w-32">{producto.familia}</td>
                        <td className="px-3 py-2 text-sm text-right font-medium text-gray-900">{formatNumber(producto.cantidad)}</td>
                        <td className="px-3 py-2 text-sm text-right text-gray-600">{formatNumber(producto.porcentaje, 2)}%</td>
                        <td className="px-3 py-2 text-sm text-right font-medium text-indigo-600">{formatNumber(producto.acumulado, 1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {productosFiltrados.length > 100 && (
                  <p className="text-center text-sm text-gray-500 mt-4">
                    Mostrando 100 de {productosFiltrados.length} productos
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {!resumen && !loading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Análisis ABC (Pareto)</h3>
            <p className="mt-1 text-sm text-gray-500">
              Clasifica productos en A (80%), B (15%) y C (5%) según su movimiento.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default ABCProductos;
