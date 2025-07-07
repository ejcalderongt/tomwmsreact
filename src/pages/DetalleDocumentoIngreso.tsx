
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from '@/components/Layout';
import { ArrowLeftIcon, DocumentTextIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { ingresosAPI } from '@/api/api';

interface DetalleOC {
  no_Linea: number;
  codigo_producto: string;
  nombre_producto: string;
  nombre_unidad_medida_basica: string;
  cantidad: number;
  precio_unitario?: number;
  total?: number;
}

interface Recepcion {
  id: number;
  fecha: string;
  codigo_producto: string;
  nombre_producto: string;
  cantidad_recibida: number;
  observaciones?: string;
}

function DetalleDocumentoIngreso() {
  const { IdOrdenCompraEnc } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState("oc");
  const [detalleOC, setDetalleOC] = useState<DetalleOC[]>([]);
  const [recepciones, setRecepciones] = useState<Recepcion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = `TOMWMSUX - Detalle Documento ${IdOrdenCompraEnc}`;
    if (IdOrdenCompraEnc) {
      cargarDatos();
    }
  }, [IdOrdenCompraEnc, tab]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('No hay sesión activa');
        navigate('/login');
        return;
      }

      const id = parseInt(IdOrdenCompraEnc || '0');
      if (!id) {
        toast.error('ID de documento inválido');
        return;
      }

      if (tab === "oc") {
        const data = await ingresosAPI.obtenerDetalle(id, token);
        setDetalleOC(data || []);
      } else if (tab === "rec") {
        const data = await ingresosAPI.obtenerRecepciones(id, token);
        setRecepciones(data || []);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error(`Error al cargar ${tab === 'oc' ? 'detalle de orden' : 'recepciones'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/ingresos')}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div className="p-2 bg-blue-100 rounded-lg">
                <DocumentTextIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Detalle Documento de Ingreso #{IdOrdenCompraEnc}
                </h1>
                <p className="text-gray-600">Información detallada del documento</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setTab("oc")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  tab === "oc" 
                    ? "border-blue-500 text-blue-600" 
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <ClipboardDocumentListIcon className="h-4 w-4" />
                  <span>Detalle Orden de Compra</span>
                </div>
              </button>
              <button
                onClick={() => setTab("rec")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  tab === "rec" 
                    ? "border-blue-500 text-blue-600" 
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <DocumentTextIcon className="h-4 w-4" />
                  <span>Recepciones</span>
                </div>
              </button>
            </nav>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">
                  Cargando {tab === 'oc' ? 'detalle de orden' : 'recepciones'}...
                </span>
              </div>
            ) : tab === "oc" ? (
              <div className="overflow-x-auto">
                {detalleOC.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No se encontró detalle para esta orden de compra</p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No Línea</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UmBas</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unit.</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {detalleOC.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.no_Linea}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.codigo_producto}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{item.nombre_producto}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.nombre_unidad_medida_basica}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.cantidad}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.precio_unitario ? `$${item.precio_unitario.toLocaleString()}` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.total ? `$${item.total.toLocaleString()}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                {recepciones.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No se encontraron recepciones para este documento</p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código Producto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad Recibida</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observaciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recepciones.map((recepcion, index) => (
                        <tr key={recepcion.id || index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{recepcion.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(recepcion.fecha).toLocaleDateString('es-ES')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{recepcion.codigo_producto}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{recepcion.nombre_producto}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{recepcion.cantidad_recibida}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{recepcion.observaciones || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default DetalleDocumentoIngreso;
