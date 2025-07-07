import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { LoginRequest } from "@shared/schema";

export default function Login() {
  const [, setLocation] = useLocation();
  const [credentials, setCredentials] = useState<LoginRequest>({
    username: "",
    password: ""
  });
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (data: LoginRequest) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("user", JSON.stringify(data.user));
      toast({
        title: "Inicio de sesión exitoso",
        description: `Bienvenido, ${data.user.name}`,
      });
      setLocation("/dashboard");
    },
    onError: (error) => {
      toast({
        title: "Error de autenticación",
        description: "Usuario o contraseña incorrectos",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentials.username || !credentials.password) {
      toast({
        title: "Campos requeridos",
        description: "Por favor complete todos los campos",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate(credentials);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-warehouse-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-warehouse-primary">TomWMS</h1>
            <p className="text-gray-600">Sistema de Gestión de Almacén</p>
          </div>
          <CardTitle>Iniciar Sesión</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                type="text"
                placeholder="Ingrese su usuario"
                value={credentials.username}
                onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                disabled={loginMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Ingrese su contraseña"
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                disabled={loginMutation.isPending}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </form>
          <div className="mt-4 text-sm text-gray-600 text-center">
            <p>Usuario demo: <strong>admin</strong></p>
            <p>Contraseña: <strong>admin123</strong></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
