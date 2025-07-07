
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logout, getUser, getToken } from "@/utils/auth";
import { ingresosAPI } from "@/api/api";

const menuItems = [
  { text: "Inicio", path: "/existencias", icon: "🏠" },
  { text: "Documentos de Ingreso", path: "/ingresos", icon: "📥" },
  { text: "Documentos de Salida", path: "/salidas", icon: "📤" }
];

interface DocumentoIngreso {
  idOrdenCompraEnc: number;
  no_Documento: string;
  fecha_Creacion: string;
  estado: string;
  proveedor: string;
}

function Ingresos() {
  const navigate = useNavigate();
  const user = getUser();
  const [documentos, setDocumentos] = useState<DocumentoIngreso[]>([]);
  const [loading, setLoading] = useState(true);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  useEffect(() => {
    document.title = "TOMWMSUX - Documentos de Ingreso";
    cargarDocumentos();
  }, []);

  const cargarDocumentos = async () => {
    try {
      const token = getToken();
      if (!token) {
        navigate("/login");
        return;
      }

      const hoy = new Date();
      const hace30Dias = new Date(hoy.getTime() - (30 * 24 * 60 * 60 * 1000));
      
      const filtro = {
        fechaInicio: hace30Dias.toISOString(),
        fechaFin: hoy.toISOString(),
        idBodega: 1, // Valor por defecto
        idPropietario: 1 // Valor por defecto
      };

      const data = await ingresosAPI.listarDocumentos(filtro, token);
      setDocumentos(data || []);
    } catch (error) {
      console.error("Error al cargar documentos:", error);
    } finally {
      setLoading(false);
    }
  };

  const buscarDocumentos = async () => {
    if (!fechaInicio || !fechaFin) {
      alert("Por favor selecciona ambas fechas");
      return;
    }

    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        navigate("/login");
        return;
      }

      const filtro = {
        fechaInicio: new Date(fechaInicio).toISOString(),
        fechaFin: new Date(fechaFin).toISOString(),
        idBodega: 1,
        idPropietario: 1
      };

      const data = await ingresosAPI.listarDocumentos(filtro, token);
      setDocumentos(data || []);
    } catch (error) {
      console.error("Error al buscar documentos:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
        <div className="font-bold text-xl">TOMWMSUX</div>
        <div className="flex items-center space-x-4">
          <span>👤 {user.username}</span>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="bg-white text-blue-600 px-3 py-1 rounded hover:bg-gray-100"
          >
            Salir
          </button>
        </div>
      </header>

      <main className="flex flex-1">
        <aside className="w-64 bg-white shadow-md border-r border-gray-200 hidden lg:block">
          <nav className="p-4">
            <div className="space-y-2">
              {menuItems.map((item) => {
                const isActive = window.location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 transition-colors ${
                      isActive 
                        ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-600' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="font-medium">{item.text}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </aside>

        <section className="flex-1 p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">
              Documentos de Ingreso
            </h1>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Filtros de búsqueda</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={buscarDocumentos}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Buscar
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Lista de Documentos ({documentos.length})
                </h2>
              </div>

              {loading ? (
                <div className="p-6 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Cargando documentos...</p>
                </div>
              ) : documentos.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No se encontraron documentos
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          No. Documento
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Proveedor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {documentos.map((doc) => (
                        <tr key={doc.idOrdenCompraEnc} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {doc.no_Documento || `DOC-${doc.idOrdenCompraEnc}`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {doc.fecha_Creacion ? new Date(doc.fecha_Creacion).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              {doc.estado || 'Activo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {doc.proveedor || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => navigate(`/ingresos/detalle/${doc.idOrdenCompraEnc}`)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Ver Detalle
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Ingresos;
