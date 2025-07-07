import { useEffect } from "react";
import { useLocation } from "wouter";
import Sidebar from "./sidebar";
import Header from "./header";
import { getCurrentUser } from "@/lib/auth";

interface LayoutProps {
  children: React.ReactNode;
}

const getPageTitle = (pathname: string) => {
  switch (pathname) {
    case "/":
    case "/dashboard":
      return "Dashboard";
    case "/inventory":
      return "Existencias";
    case "/incoming":
      return "Ingresos";
    case "/outgoing":
      return "Salidas";
    case "/reports":
      return "Reportes";
    case "/locations":
      return "Ubicaciones";
    default:
      return "TomWMS";
  }
};

export default function Layout({ children }: LayoutProps) {
  const [location, setLocation] = useLocation();
  const user = getCurrentUser();

  useEffect(() => {
    if (!user) {
      setLocation("/login");
    }
  }, [user, setLocation]);

  if (!user) {
    return null;
  }

  const title = getPageTitle(location);
  const subtitle = "Hace 2 minutos";

  return (
    <div className="min-h-screen flex bg-warehouse-background">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <Header title={title} subtitle={subtitle} />
        <div className="flex-1 p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
