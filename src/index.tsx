
// src/pages/Index.tsx

import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { logout, getUser } from "@/utils/auth";

const menuItems = [
  { text: "Inicio", path: "/existencias", icon: "🏠" },
  { text: "Documentos de Ingreso", path: "/ingresos", icon: "📥" },
  { text: "Documentos de Salida", path: "/salidas", icon: "📤" }
];

function Index() {
  const navigate = useNavigate();
  const user = getUser();

  useEffect(() => {
    document.title = "TOMWMSUX";
  }, []);

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
        <aside className="w-64 bg-gray-100 p-4 border-r">
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="w-full text-left px-3 py-2 rounded hover:bg-blue-100 flex items-center space-x-2"
              >
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </button>
            ))}
          </nav>
        </aside>

        <section className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              Bienvenido a TOMWMSUX
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {menuItems.map((item) => (
                <div
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg cursor-pointer transition-shadow border border-gray-200"
                >
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-900">{item.text}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Index;
