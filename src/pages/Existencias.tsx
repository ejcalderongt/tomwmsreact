
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logout, getUser } from "@/utils/auth";

const menuItems = [
  { text: "Inicio", path: "/existencias", icon: "🏠", description: "Panel principal del sistema" },
  { text: "Documentos de Ingreso", path: "/ingresos", icon: "📥", description: "Gestión de ingresos de mercancía" },
  { text: "Documentos de Salida", path: "/salidas", icon: "📤", description: "Control de salidas y despachos" }
];

function Existencias() {
  const navigate = useNavigate();
  const user = getUser();

  useEffect(() => {
    document.title = "TOMWMSUX - Dashboard";
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Modern Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="flex justify-between items-center px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-xl text-gray-900">TOMWMSUX</h1>
              <p className="text-xs text-gray-500">Sistema de Gestión de Inventarios</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-3 bg-gray-50 rounded-lg px-3 py-2">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user?.username || 'Usuario'}</p>
                <p className="text-xs text-gray-500">Administrador</p>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm border border-red-200"
            >
              <div className="flex items-center space-x-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Salir</span>
              </div>
            </button>
          </div>
        </div>
      </header>

      <main className="flex flex-1">
        {/* Modern Sidebar */}
        <aside className="w-64 bg-white shadow-sm border-r border-gray-200 hidden lg:block">
          <nav className="p-6">
            <div className="space-y-3">
              {menuItems.map((item) => {
                const isActive = window.location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`w-full text-left px-4 py-3 rounded-xl flex items-center space-x-3 transition-all duration-200 group ${
                      isActive 
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200 shadow-sm' 
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className={`text-lg p-2 rounded-lg ${
                      isActive 
                        ? 'bg-blue-100' 
                        : 'bg-gray-100 group-hover:bg-gray-200'
                    }`}>
                      {item.icon}
                    </div>
                    <div>
                      <p className={`font-medium text-sm ${isActive ? 'text-blue-700' : 'text-gray-900'}`}>
                        {item.text}
                      </p>
                      <p className="text-xs text-gray-500">{item.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <section className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white mb-8 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    ¡Bienvenido de vuelta, {user?.username || 'Usuario'}!
                  </h1>
                  <p className="text-blue-100 text-lg">
                    Sistema de gestión de inventarios y documentos
                  </p>
                  <p className="text-blue-200 text-sm mt-2">
                    Administra tus operaciones de manera eficiente
                  </p>
                </div>
                <div className="hidden md:block">
                  <div className="h-24 w-24 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
                    <svg className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Access Cards */}
            <div className="grid md:grid-cols-2 gap-8">
              {menuItems.slice(1).map((item) => (
                <div 
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-100 hover:border-blue-200 group"
                >
                  <div className="flex items-start space-x-6">
                    <div className="h-16 w-16 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {item.text}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {item.description}
                      </p>
                      <div className="mt-4 flex items-center text-blue-600 text-sm font-medium group-hover:text-blue-700">
                        <span>Acceder</span>
                        <svg className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats Section */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Documentos</p>
                    <p className="text-2xl font-bold text-gray-900">--</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ingresos Mes</p>
                    <p className="text-2xl font-bold text-gray-900">--</p>
                  </div>
                  <div className="h-12 w-12 bg-green-50 rounded-lg flex items-center justify-center">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Salidas Mes</p>
                    <p className="text-2xl font-bold text-gray-900">--</p>
                  </div>
                  <div className="h-12 w-12 bg-orange-50 rounded-lg flex items-center justify-center">
                    <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Modern Footer */}
      <footer className="bg-white border-t border-gray-200 text-center py-6">
        <div className="text-sm text-gray-600">
          <p>© 2024 TOMWMSUX | Sistema de Gestión de Inventarios</p>
          <p className="text-xs text-gray-500 mt-1">Desarrollado con tecnología avanzada</p>
        </div>
      </footer>
    </div>
  );
}

export default Existencias;
