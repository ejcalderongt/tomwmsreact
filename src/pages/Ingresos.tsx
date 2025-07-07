// src/pages/Ingresos.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getToken, getIdPropietario } from "@/utils/auth";

function Ingresos() {
  const navigate = useNavigate();
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchDocumentos = async () => {
    setLoading(true);
    setError("");

    try {
      const token = getToken();
      const idPropietario = getIdPropietario();

      const response = await fetch("http://52.41.114.122:8091/sync/ingresos/documentos-ingreso/listar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          FechaInicio: fechaInicio,
          FechaFin: fechaFin,
          IdPropietario: idPropietario,
          IdBodega: 0
        })
      });

      if (!response.ok) throw new Error("Error al cargar los documentos");

      const data = await response.json();
      setDocumentos(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltrar = () => {
    if (!fechaInicio || !fechaFin) return;
    fetchDocumentos();
  };

  const handleVerDetalle = (codigo: string) => {
    navigate(`/ingresos/detalle/${codigo}`);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Documentos de Ingreso</h2>

      <div className="flex space-x-4 mb-6">
        <input
          type="date"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
          className="border p-2 rounded-md"
        />
        <input
          type="date"
          value={fechaFin}
          onChange={(e) => setFechaFin(e.target.value)}
          className="border p-2 rounded-md"
        />
        <button
          onClick={handleFiltrar}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Filtrar
        </button>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className="bg-white p-4 rounded shadow overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr>
                <th>Código</th>
                <th>Bodega</th>
                <th>Proveedor</th>
                <th>Tipo Ingreso</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {documentos.map((doc: any, i: number) => (
                <tr key={i} className="border-t">
                  <td>{doc.codigo}</td>
                  <td>{doc.bodega}</td>
                  <td>{doc.proveedor}</td>
                  <td>{doc.tipoIngreso}</td>
                  <td>{doc.estado}</td>
                  <td>{new Date(doc.fecha).toLocaleDateString()}</td>
                  <td>
                    <button
                      onClick={() => handleVerDetalle(doc.codigo)}
                      className="text-blue-600 hover:underline"
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
  );
}

export default Ingresos;