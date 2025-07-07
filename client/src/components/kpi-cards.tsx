import { Card, CardContent } from "@/components/ui/card";
import { Package, AlertTriangle, ArrowDown, Clock, TrendingUp, TrendingDown } from "lucide-react";

interface KPIData {
  totalProducts: number;
  lowStock: number;
  todayIncoming: number;
  pendingOutgoing: number;
}

interface KPICardsProps {
  data: KPIData;
}

export default function KPICards({ data }: KPICardsProps) {
  const kpiItems = [
    {
      title: "Total Productos",
      value: data.totalProducts,
      icon: Package,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      trend: { value: 5.2, direction: "up" as const },
      comparison: "vs mes anterior"
    },
    {
      title: "Stock Bajo",
      value: data.lowStock,
      icon: AlertTriangle,
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
      trend: { value: 12.3, direction: "down" as const },
      comparison: "vs mes anterior"
    },
    {
      title: "Ingresos Hoy",
      value: data.todayIncoming,
      icon: ArrowDown,
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      trend: { value: 8.1, direction: "up" as const },
      comparison: "vs ayer"
    },
    {
      title: "Salidas Pendientes",
      value: data.pendingOutgoing,
      icon: Clock,
      bgColor: "bg-red-50",
      iconColor: "text-red-600",
      trend: { value: 2.5, direction: "up" as const },
      comparison: "vs ayer"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {kpiItems.map((item, index) => {
        const Icon = item.icon;
        const TrendIcon = item.trend.direction === "up" ? TrendingUp : TrendingDown;
        const trendColor = item.trend.direction === "up" ? "text-green-500" : "text-red-500";
        
        return (
          <Card key={index} className="warehouse-kpi-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{item.title}</p>
                  <p className="text-2xl font-bold text-foreground">{item.value.toLocaleString()}</p>
                </div>
                <div className={`p-3 ${item.bgColor} rounded-lg`}>
                  <Icon className={`h-6 w-6 ${item.iconColor}`} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendIcon className={`h-4 w-4 mr-1 ${trendColor}`} />
                <span className={trendColor}>{item.trend.value}%</span>
                <span className="text-muted-foreground ml-2">{item.comparison}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
