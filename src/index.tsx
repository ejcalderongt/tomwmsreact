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
          <h1 className="text-2xl font-semibold">Bienvenido al sistema TOMWMSUX</h1>
          <p className="mt-2 text-gray-700">
            Selecciona una opción del menú lateral para continuar.
          </p>
        </section>
      </main>

      <footer className="bg-gray-100 text-sm text-center py-2 border-t">
        Copyright © 2000–2024 Developer Express Inc. | Todos los derechos reservados.
      </footer>
    </div>
  );
}

export default Index;