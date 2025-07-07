
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logout, getUser } from "@/utils/auth";

const menuItems = [
  { text: "Inicio", path: "/existencias", icon: "🏠" },
  { text: "Documentos de Ingreso", path: "/ingresos", icon: "📥" },
  { text: "Documentos de Salida", path: "/salidas", icon: "📤" },
];

function Salidas() {
  const navigate = useNavigate();
  const user = getUser();

  useEffect(() => {
    document.title = "Salidas - TOMWMSUX";
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="flex justify-between items-center px-6 py-4">
          <div className="flex items-center space-x-4">
            <button className="lg:hidden text-white hover:bg-blue-700 p-2 rounded">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="font-bold text-xl">TOMWMSUX</div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="hidden sm:inline">👤 {user?.username || 'Usuario'}</span>
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="bg-white text-blue-600 px-4 py-2 rounded hover:bg-gray-100 transition-colors font-medium"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md">
          <nav className="p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <button
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      item.path === "/salidas"
                        ? "bg-blue-100 text-blue-700 font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.text}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <section className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Documentos de Salida
                </h1>
                <p className="text-gray-600">
                  Gestiona y consulta los documentos de salida de mercancía
                </p>
              </div>

              {/* Search Section */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h2 className="text-lg font-semibold mb-4">Filtros de Búsqueda</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha Inicio
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha Fin
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                      Buscar
                    </button>
                  </div>
                </div>
              </div>

              {/* Results Section */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Resultados
                  </h3>
                </div>
                <div className="p-6 text-center text-gray-500">
                  <div className="text-4xl mb-4">📤</div>
                  <p className="text-lg">No hay documentos de salida disponibles</p>
                  <p className="text-sm mt-2">
                    Utiliza los filtros de búsqueda para encontrar documentos específicos
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 text-center py-4">
        <div className="text-sm text-gray-600">
          Copyright © 2000–2024 Developer Express Inc. | Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}

export default Salidas;
