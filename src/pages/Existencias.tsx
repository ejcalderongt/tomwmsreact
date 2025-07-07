
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logout, getUser } from "@/utils/auth";

const menuItems = [
  { text: "Inicio", path: "/existencias", icon: "🏠" },
  { text: "Documentos de Ingreso", path: "/ingresos", icon: "📥" },
  { text: "Documentos de Salida", path: "/salidas", icon: "📤" }
];

function Existencias() {
  const navigate = useNavigate();
  const user = getUser();

  useEffect(() => {
    document.title = "TOMWMSUX";
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

      <main className="flex flex-1">
        {/* Sidebar */}
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

        {/* Main Content */}
        <section className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  Bienvenido al sistema TOMWMSUX
                </h1>
                <p className="text-lg text-gray-600 mb-8">
                  Sistema de gestión de inventarios y documentos
                </p>
                
                {/* Quick Access Cards */}
                <div className="grid md:grid-cols-2 gap-6 mt-8">
                  <div 
                    onClick={() => navigate("/ingresos")}
                    className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer hover:border-blue-300"
                  >
                    <div className="text-4xl mb-4">📥</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Documentos de Ingreso
                    </h3>
                    <p className="text-gray-600">
                      Gestiona y consulta los documentos de ingreso de mercancía
                    </p>
                  </div>
                  
                  <div 
                    onClick={() => navigate("/salidas")}
                    className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer hover:border-blue-300"
                  >
                    <div className="text-4xl mb-4">📤</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Documentos de Salida
                    </h3>
                    <p className="text-gray-600">
                      Administra los documentos de salida y despachos
                    </p>
                  </div>
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

export default Existencias;
