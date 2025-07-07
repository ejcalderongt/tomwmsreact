// src/pages/DetalleDocumentoIngreso.tsx

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function DetalleDocumentoIngreso() {
  const { IdOrdenCompraEnc } = useParams();
  const [tab, setTab] = useState("oc");
  const [detalleOC, setDetalleOC] = useState([]);
  const [recepciones, setRecepciones] = useState([]);

  useEffect(() => {
    if (tab === "oc") {
      fetch(
        `http://52.41.114.122:8091/sync/ingresos/${IdOrdenCompraEnc}/detalle-oc`
      )
        .then((res) => res.json())
        .then(setDetalleOC);
    } else if (tab === "rec") {
      fetch(
        `http://52.41.114.122:8091/sync/ingresos/${IdOrdenCompraEnc}/recepciones`
      )
        .then((res) => res.json())
        .then(setRecepciones);
    }
  }, [IdOrdenCompraEnc, tab]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">
        Detalle Documento de Ingreso #{IdOrdenCompraEnc}
      </h2>

      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setTab("oc")}
          className={`px-4 py-2 rounded-md ${
            tab === "oc" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          Detalle Orden de Compra
        </button>
        <button
          onClick={() => setTab("rec")}
          className={`px-4 py-2 rounded-md ${
            tab === "rec" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          Recepciones
        </button>
      </div>

      {tab === "oc" ? (
        <div className="overflow-x-auto bg-white rounded shadow">
          <table className="w-full table-auto">
            <thead>
              <tr>
                <th>No Línea</th>
                <th>Código</th>
                <th>Producto</th>
                <th>UmBas</th>
                <th>Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {detalleOC.map((item: any, i: number) => (
                <tr key={i} className="text-sm text-gray-700">
                  <td>{item.no_Linea}</td>
                  <td>{item.codigo_producto}</td>
                  <td>{item.nombre_producto}</td>
                  <td>{item.nombre_unidad_medida_basica}</td>
                  <td>{item.cantidad}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow">
          <table className="w-full table-auto">
            <thead>
              <tr>
                <th>Recepción</th>
                <th>Fecha</th>
                <th>Usuario</th>
              </tr>
            </thead>
            <tbody>
              {recepciones.map((item: any, i: number) => (
                <tr key={i} className="text-sm text-gray-700">
                  <td>{item.idRecepcion}</td>
                  <td>{new Date(item.fechaRecepcion).toLocaleDateString()}</td>
                  <td>{item.usuario}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default DetalleDocumentoIngreso;
