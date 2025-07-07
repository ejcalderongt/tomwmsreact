import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  AlertTriangle, 
  ArrowDown, 
  Clock, 
  ArrowUp, 
  TrendingUp, 
  TrendingDown,
  Plus,
  Truck,
  ClipboardCheck,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface DashboardData {
  totalProducts: number;
  lowStock: number;
  todayIncoming: number;
  pendingOutgoing: number;
  recentActivities: Array<{
    type: string;
    description: string;
    reference?: string;
    user: string;
    timestamp: string;
    status: string;
  }>;
}

export default function Dashboard() {
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['/api/dashboard'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16 mb-4" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900">Error al cargar el dashboard</p>
          <p className="text-sm text-gray-500">Por favor intente nuevamente</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card className="warehouse-kpi-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Productos</p>
                <p className="text-2xl font-bold text-gray-900">{data?.totalProducts || 0}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500">5.2%</span>
              <span className="text-gray-500 ml-2">vs mes anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card className="warehouse-kpi-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Stock Bajo</p>
                <p className="text-2xl font-bold text-orange-600">{data?.lowStock || 0}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              <span className="text-red-500">12.3%</span>
              <span className="text-gray-500 ml-2">vs mes anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card className="warehouse-kpi-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos Hoy</p>
                <p className="text-2xl font-bold text-gray-900">{data?.todayIncoming || 0}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <ArrowDown className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500">8.1%</span>
              <span className="text-gray-500 ml-2">vs ayer</span>
            </div>
          </CardContent>
        </Card>

        <Card className="warehouse-kpi-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Salidas Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">{data?.pendingOutgoing || 0}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <Clock className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
              <span className="text-red-500">2.5%</span>
              <span className="text-gray-500 ml-2">vs ayer</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Activities */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Movimientos Semanales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Gráfico de movimientos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Productos más Movidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    1
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Laptop HP</p>
                    <p className="text-xs text-gray-500">Categoría: Electrónicos</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">156</p>
                  <p className="text-xs text-gray-500">movimientos</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    2
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Silla Oficina</p>
                    <p className="text-xs text-gray-500">Categoría: Oficina</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">142</p>
                  <p className="text-xs text-gray-500">movimientos</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    3
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Aspiradora</p>
                    <p className="text-xs text-gray-500">Categoría: Hogar</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">128</p>
                  <p className="text-xs text-gray-500">movimientos</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Actividades Recientes</CardTitle>
            <Button variant="outline" size="sm">
              Ver todas
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="warehouse-table-header">Tipo</th>
                  <th className="warehouse-table-header">Descripción</th>
                  <th className="warehouse-table-header">Usuario</th>
                  <th className="warehouse-table-header">Fecha</th>
                  <th className="warehouse-table-header">Estado</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentActivities?.map((activity, index) => (
                  <tr key={index} className="warehouse-table-row border-b">
                    <td className="warehouse-table-cell">
                      <div className="flex items-center">
                        <div className="p-2 bg-green-50 rounded-lg mr-3">
                          {activity.type === 'in' ? (
                            <ArrowDown className="h-4 w-4 text-green-600" />
                          ) : (
                            <ArrowUp className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {activity.type === 'in' ? 'Ingreso' : 'Salida'}
                        </span>
                      </div>
                    </td>
                    <td className="warehouse-table-cell">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      {activity.reference && (
                        <p className="text-xs text-gray-500">Referencia: {activity.reference}</p>
                      )}
                    </td>
                    <td className="warehouse-table-cell text-sm text-gray-900">
                      {activity.user}
                    </td>
                    <td className="warehouse-table-cell text-sm text-gray-500">
                      {activity.timestamp && format(new Date(activity.timestamp), 'PPp', { locale: es })}
                    </td>
                    <td className="warehouse-table-cell">
                      <Badge 
                        variant={activity.status === 'completado' ? 'default' : 'secondary'}
                        className={`status-badge ${activity.status === 'completado' ? 'completed' : 'pending'}`}
                      >
                        {activity.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex-col border-2 border-dashed hover:border-blue-600 hover:bg-blue-50"
            >
              <Plus className="h-6 w-6 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-600">Recibir Mercancía</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex-col border-2 border-dashed hover:border-blue-600 hover:bg-blue-50"
            >
              <Truck className="h-6 w-6 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-600">Procesar Orden</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex-col border-2 border-dashed hover:border-blue-600 hover:bg-blue-50"
            >
              <ClipboardCheck className="h-6 w-6 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-600">Verificar Inventario</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex-col border-2 border-dashed hover:border-blue-600 hover:bg-blue-50"
            >
              <FileText className="h-6 w-6 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-600">Generar Reporte</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
