import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Package, 
  ArrowDown, 
  ArrowUp, 
  FileText, 
  MapPin,
  LogOut
} from "lucide-react";
import { getCurrentUser, logout } from "@/lib/auth";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Existencias", href: "/inventory", icon: Package },
  { name: "Ingresos", href: "/incoming", icon: ArrowDown },
  { name: "Salidas", href: "/outgoing", icon: ArrowUp },
  { name: "Reportes", href: "/reports", icon: FileText },
  { name: "Ubicaciones", href: "/locations", icon: MapPin },
];

export default function Sidebar() {
  const [location] = useLocation();
  const user = getCurrentUser();

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <aside className="warehouse-sidebar w-64 flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold text-warehouse-primary">TomWMS</h1>
        <p className="text-sm text-muted-foreground">Sistema de Gestión</p>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href || 
              (item.href === "/dashboard" && location === "/");
            
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <a className={`warehouse-nav-item ${isActive ? 'active' : ''}`}>
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center mb-3">
          <div className="w-8 h-8 bg-warehouse-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
            {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-foreground">{user?.name || 'Usuario'}</p>
            <p className="text-xs text-muted-foreground">{user?.role || 'user'}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start p-2 text-muted-foreground hover:text-foreground"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar Sesión
        </Button>
      </div>
    </aside>
  );
}
