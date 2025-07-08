
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from '@/components/Layout';
import { ArrowLeftIcon, DocumentTextIcon, ClipboardDocumentListIcon, TruckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { salidasAPI } from '@/api/api';

interface DetallePE {
  no_Linea: number;
  codigo_producto: string;
  nombre_producto: string;
  nombre_unidad_medida_basica: string;
  cantidad: number;
  precio_unitario?: number;
  total?: number;
}

interface DespachoDetalle {
  no_Linea: number;
  codigo_producto: string;
  nombre_producto: string;
  cantidad_despachada: number;
  nombre_unidad_medida: string;
  nombre_producto_estado: string;
  lote: string;
  fecha_vence: string;
  fecha_despacho: string;
  peso: number;
  lic_plate: string;
}

interface Despacho {
  idDespacho: number;
  fechaDespacho: string;
  usuario: string;
  transportista?: string;
  placa?: string;
  detalles: DespachoDetalle[];
}

function DetalleDocumentoSalida() {
  const { IdDocumento } = useParams();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState(0);
  const [detallePE, setDetallePE] = useState<DetallePE[]>([]);
  const [despachos, setDespachos] = useState<Despacho[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  useEffect(() => {
    document.title = `TOMWMSUX - Detalle Documento Salida ${IdDocumento}`;
    if (IdDocumento) {
      cargarTab(selectedTab);
    }
  }, [IdDocumento]);

  const cargarTab = async (index: number) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('wms_token') || localStorage.getItem('token') || '';

      const id = parseInt(IdDocumento || '0');
      if (!id) {
        toast.error('ID de documento inválido');
        return;
      }

      console.log(`Cargando tab ${index} con ID: ${id} y token: ${token ? 'presente' : 'ausente'}`);

      switch (index) {
        case 0:
          console.log("clic en detalle PE");
          await cargarDetallePE(id, token);
          break;
        case 1:
          console.log("clic en despachos");
          await cargarDespachos(id, token);
          break;
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error(`Error al cargar ${index === 0 ? 'detalle del pedido' : 'despachos'}`);
    } finally {
      setLoading(false);
    }
  };

  const cargarDetallePE = async (id: number, token: string) => {
    try {
      console.log(`Cargando detalle PE para ID: ${id}`);
      const data = await salidasAPI.obtenerDetallePE(id, token);
      console.log("Respuesta detalle PE:", data);
      setDetallePE(data || []);

      if (!data || data.length === 0) {
        toast('No se encontró detalle para este pedido', {
          icon: 'ℹ️',
          style: {
            background: '#3b82f6',
            color: '#fff'
          }
        });
      } else {
        toast.success(`Se cargaron ${data.length} elementos del detalle`);
      }
    } catch (error) {
        console.error('Error al cargar detalle PE:', error);
        toast.error('Error al cargar el detalle del pedido');
      }
  };

  const cargarDespachos = async (id: number, token: string) => {
    try {
      console.log(`Cargando despachos para ID: ${id}`);
      const data = await salidasAPI.obtenerDespachos(id, token);
      console.log("Respuesta directa de la API (despachos):", data);
      setDespachos(data || []);

      if (!data || data.length === 0) {
        toast('No se encontraron despachos para este documento', {
          icon: 'ℹ️',
          style: {
            background: '#3b82f6',
            color: '#fff'
          }
        });
      } else {
        toast.success(`Se cargaron ${data.length} despachos`);
      }
    } catch (error) {
          console.error('Error al cargar despachos:', error);
          toast.error('Error al cargar los despachos');
        }
  };

  const handleTabClick = (index: number) => {
    setSelectedTab(index);
    cargarTab(index);
  };

  const toggleExpandRow = (despachoId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(despachoId)) {
      newExpanded.delete(despachoId);
    } else {
      newExpanded.add(despachoId);
    }
    setExpandedRows(newExpanded);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const formatNumber = (value: number, precision: number = 2) => {
    if (value === null || value === undefined) return '';
    return value.toLocaleString('es-ES', { 
      minimumFractionDigits: precision, 
      maximumFractionDigits: precision 
    });
  };

  const tabs = [
    { text: "Detalle Pedido", icon: ClipboardDocumentListIcon },
    { text: "Despachos", icon: TruckIcon }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/salidas')}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div className="p-2 bg-red-100 rounded-lg">
                <DocumentTextIcon className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Detalle del Documento: {IdDocumento}
                </h1>
                <p className="text-gray-600">Información detallada del documento de salida</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Container */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab, index) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={index}
                    onClick={() => handleTabClick(index)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      selectedTab === index
                        ? "border-red-500 text-red-600" 
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <IconComponent className="h-4 w-4" />
                      <span>{tab.text}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                <span className="ml-2 text-gray-600">
                  Cargando {selectedTab === 0 ? 'detalle del pedido' : 'despachos'}...
                </span>
              </div>
            ) : selectedTab === 0 ? (
              /* Detalle Pedido */
              <div className="overflow-x-auto">
                {detallePE.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No se encontró detalle para este pedido</p>
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
                      {detallePE.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.no_Linea}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.codigo_producto}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{item.nombre_producto}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.nombre_unidad_medida_basica}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(item.cantidad)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.precio_unitario ? formatNumber(item.precio_unitario) : ''}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.total ? formatNumber(item.total) : ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ) : (
              /* Despachos con Master-Detail */
              <div className="space-y-4">
                {despachos.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No se encontraron despachos para este documento</p>
                  </div>
                ) : (
                  despachos.map((despacho) => (
                    <div key={despacho.idDespacho} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Master Row */}
                      <div 
                        className="bg-gray-50 px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => toggleExpandRow(despacho.idDespacho)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="grid grid-cols-4 gap-4 flex-1">
                            <div>
                              <span className="text-sm font-medium text-gray-900">Despacho: </span>
                              <span className="text-sm text-gray-700">{despacho.idDespacho}</span>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-900">Fecha: </span>
                              <span className="text-sm text-gray-700">{formatDate(despacho.fechaDespacho)}</span>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-900">Usuario: </span>
                              <span className="text-sm text-gray-700">{despacho.usuario}</span>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-900">Transportista: </span>
                              <span className="text-sm text-gray-700">{despacho.transportista || 'N/A'}</span>
                            </div>
                          </div>
                          <div className="text-gray-400">
                            {expandedRows.has(despacho.idDespacho) ? '▼' : '▶'}
                          </div>
                        </div>
                      </div>

                      {/* Detail Rows */}
                      {expandedRows.has(despacho.idDespacho) && (
                        <div className="bg-gray-50 p-4 border-t border-gray-200">
                          {despacho.detalles && despacho.detalles.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-white">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">No. Línea</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Despachado</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">UmBas</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Lote</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Vence</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Despacho</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Peso</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Licencia</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {despacho.detalles.map((detalle, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                      <td className="px-4 py-2 text-sm text-gray-900">{detalle.no_Linea}</td>
                                      <td className="px-4 py-2 text-sm text-gray-900">{detalle.codigo_producto}</td>
                                      <td className="px-4 py-2 text-sm text-gray-900">{detalle.nombre_producto}</td>
                                      <td className="px-4 py-2 text-sm text-gray-900">{formatNumber(detalle.cantidad_despachada)}</td>
                                      <td className="px-4 py-2 text-sm text-gray-900">{detalle.nombre_unidad_medida}</td>
                                      <td className="px-4 py-2 text-sm text-gray-900">{detalle.nombre_producto_estado}</td>
                                      <td className="px-4 py-2 text-sm text-gray-900">{detalle.lote}</td>
                                      <td className="px-4 py-2 text-sm text-gray-900">{formatDate(detalle.fecha_vence)}</td>
                                      <td className="px-4 py-2 text-sm text-gray-900">{formatDate(detalle.fecha_despacho)}</td>
                                      <td className="px-4 py-2 text-sm text-gray-900">{formatNumber(detalle.peso)}</td>
                                      <td className="px-4 py-2 text-sm text-gray-900">{detalle.lic_plate}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 text-center py-4">
                              No se encontraron detalles para este despacho.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default DetalleDocumentoSalida;
