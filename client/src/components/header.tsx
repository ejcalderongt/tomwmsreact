import { Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <header className="bg-warehouse-surface shadow-sm border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          {subtitle && (
            <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
              <span>Última actualización:</span>
              <span>{subtitle}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Global Search */}
          <div className="relative hidden md:block">
            <Input 
              type="text" 
              placeholder="Buscar productos, órdenes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 pl-10 pr-4 py-2"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <Button variant="ghost" size="sm" className="p-2">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-2 w-2 p-0 bg-warehouse-error" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
