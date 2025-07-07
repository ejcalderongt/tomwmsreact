import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Activity {
  type: string;
  description: string;
  reference?: string;
  user: string;
  timestamp: string;
  status: string;
}

interface RecentActivitiesProps {
  activities: Activity[];
}

export default function RecentActivities({ activities }: RecentActivitiesProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'in':
        return <ArrowDown className="h-4 w-4 text-green-600" />;
      case 'out':
        return <ArrowUp className="h-4 w-4 text-blue-600" />;
      case 'alert':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default:
        return <ArrowDown className="h-4 w-4 text-green-600" />;
    }
  };

  const getActivityBgColor = (type: string) => {
    switch (type) {
      case 'in':
        return 'bg-green-50';
      case 'out':
        return 'bg-blue-50';
      case 'alert':
        return 'bg-orange-50';
      default:
        return 'bg-green-50';
    }
  };

  const getActivityText = (type: string) => {
    switch (type) {
      case 'in':
        return 'Ingreso';
      case 'out':
        return 'Salida';
      case 'alert':
        return 'Alerta';
      default:
        return 'Actividad';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completado':
        return <Badge className="status-badge completed">Completado</Badge>;
      case 'en proceso':
        return <Badge className="status-badge pending">En proceso</Badge>;
      case 'requiere acción':
        return <Badge className="status-badge error">Requiere acción</Badge>;
      default:
        return <Badge className="status-badge pending">{status}</Badge>;
    }
  };

  return (
    <Card className="warehouse-table">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle>Actividades Recientes</CardTitle>
          <Button variant="outline" size="sm">
            Ver todas
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="warehouse-table-header">Tipo</th>
                <th className="warehouse-table-header">Descripción</th>
                <th className="warehouse-table-header">Usuario</th>
                <th className="warehouse-table-header">Fecha</th>
                <th className="warehouse-table-header">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {activities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    No hay actividades recientes
                  </td>
                </tr>
              ) : (
                activities.map((activity, index) => (
                  <tr key={index} className="warehouse-table-row">
                    <td className="warehouse-table-cell">
                      <div className="flex items-center">
                        <div className={`p-2 ${getActivityBgColor(activity.type)} rounded-lg mr-3`}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {getActivityText(activity.type)}
                        </span>
                      </div>
                    </td>
                    <td className="warehouse-table-cell">
                      <p className="text-sm text-foreground">{activity.description}</p>
                      {activity.reference && (
                        <p className="text-xs text-muted-foreground">Referencia: {activity.reference}</p>
                      )}
                    </td>
                    <td className="warehouse-table-cell text-sm text-foreground">
                      {activity.user}
                    </td>
                    <td className="warehouse-table-cell text-sm text-muted-foreground">
                      {activity.timestamp && format(new Date(activity.timestamp), 'PPp', { locale: es })}
                    </td>
                    <td className="warehouse-table-cell">
                      {getStatusBadge(activity.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
