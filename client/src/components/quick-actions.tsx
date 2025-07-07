import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Truck, ClipboardCheck, FileText } from "lucide-react";

const quickActions = [
  {
    title: "Recibir Mercancía",
    icon: Plus,
    description: "Registrar nueva mercancía entrante",
    action: "quickReceiveGoods"
  },
  {
    title: "Procesar Orden",
    icon: Truck,
    description: "Procesar orden de salida",
    action: "quickProcessOrder"
  },
  {
    title: "Verificar Inventario",
    icon: ClipboardCheck,
    description: "Realizar conteo de inventario",
    action: "quickInventoryCheck"
  },
  {
    title: "Generar Reporte",
    icon: FileText,
    description: "Crear reporte rápido",
    action: "quickGenerateReport"
  }
];

export default function QuickActions() {
  const handleQuickAction = (action: string) => {
    // TODO: Implement specific action handlers
    console.log('Quick action:', action);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Acciones Rápidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            
            return (
              <Button 
                key={index}
                variant="outline" 
                className="h-20 flex-col border-2 border-dashed hover:border-warehouse-primary hover:bg-blue-50 transition-colors duration-200"
                onClick={() => handleQuickAction(action.action)}
              >
                <Icon className="h-6 w-6 text-muted-foreground mb-2" />
                <span className="text-sm font-medium text-muted-foreground">{action.title}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
