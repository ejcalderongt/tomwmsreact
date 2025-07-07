import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

const topProducts = [
  { rank: 1, name: "Laptop HP", category: "Electrónicos", movements: 156, color: "bg-blue-600" },
  { rank: 2, name: "Silla Oficina", category: "Oficina", movements: 142, color: "bg-gray-600" },
  { rank: 3, name: "Aspiradora", category: "Hogar", movements: 128, color: "bg-orange-600" }
];

export default function ChartsSection() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Weekly Movements Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Movimientos Semanales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-border rounded-lg">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Gráfico de movimientos</p>
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
            {topProducts.map((product) => (
              <div key={product.rank} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center">
                  <div className={`w-8 h-8 ${product.color} rounded-full flex items-center justify-center text-white text-sm font-medium`}>
                    {product.rank}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-foreground">{product.name}</p>
                    <p className="text-xs text-muted-foreground">Categoría: {product.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{product.movements}</p>
                  <p className="text-xs text-muted-foreground">movimientos</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
