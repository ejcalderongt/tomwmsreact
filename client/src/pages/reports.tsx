import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  Calendar, 
  BarChart3, 
  TrendingUp, 
  Package, 
  ArrowUpDown,
  PieChart
} from "lucide-react";

export default function Reports() {
  const reportCategories = [
    {
      id: 'inventory',
      name: 'Inventario',
      icon: Package,
      color: 'bg-blue-50 text-blue-600',
      reports: [
        { name: 'Reporte de Stock Actual', description: 'Estado actual del inventario por ubicación', format: 'PDF, Excel' },
        { name: 'Productos con Stock Bajo', description: 'Productos que requieren reposición', format: 'PDF, Excel' },
        { name: 'Valorización de Inventario', description: 'Valor total del inventario por categoría', format: 'PDF, Excel' },
        { name: 'Historial de Movimientos', description: 'Movimientos de inventario por período', format: 'PDF, Excel' },
      ]
    },
    {
      id: 'operations',
      name: 'Operaciones',
      icon: ArrowUpDown,
      color: 'bg-green-50 text-green-600',
      reports: [
        { name: 'Ingresos por Período', description: 'Órdenes de ingreso completadas', format: 'PDF, Excel' },
        { name: 'Salidas por Período', description: 'Órdenes de salida procesadas', format: 'PDF, Excel' },
        { name: 'Productividad del Personal', description: 'Rendimiento del equipo de almacén', format: 'PDF, Excel' },
        { name: 'Tiempos de Procesamiento', description: 'Análisis de tiempos operativos', format: 'PDF, Excel' },
      ]
    },
    {
      id: 'analytics',
      name: 'Análisis',
      icon: TrendingUp,
      color: 'bg-purple-50 text-purple-600',
      reports: [
        { name: 'Rotación de Inventario', description: 'Análisis de rotación por producto', format: 'PDF, Excel' },
        { name: 'Productos Más Movidos', description: 'Ranking de productos por actividad', format: 'PDF, Excel' },
        { name: 'Análisis de Tendencias', description: 'Tendencias de inventario y demanda', format: 'PDF, Excel' },
        { name: 'Eficiencia de Ubicaciones', description: 'Utilización de espacios de almacén', format: 'PDF, Excel' },
      ]
    }
  ];

  const quickReports = [
    {
      name: 'Resumen Diario',
      description: 'Resumen de actividades del día',
      lastGenerated: '2 horas',
      status: 'ready'
    },
    {
      name: 'Stock Crítico',
      description: 'Productos con stock bajo',
      lastGenerated: '1 hora',
      status: 'ready'
    },
    {
      name: 'Órdenes Pendientes',
      description: 'Órdenes sin procesar',
      lastGenerated: '30 min',
      status: 'ready'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-600">Genere reportes detallados del sistema</p>
        </div>
        <Button>
          <Calendar className="h-4 w-4 mr-2" />
          Programar Reporte
        </Button>
      </div>

      {/* Quick Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Reportes Rápidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickReports.map((report, index) => (
              <div key={index} className="p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{report.name}</h3>
                  <Badge variant="outline" className="text-xs">
                    Hace {report.lastGenerated}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">{report.description}</p>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Report Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {reportCategories.map((category) => (
          <Card key={category.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${category.color}`}>
                  <category.icon className="h-5 w-5" />
                </div>
                {category.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {category.reports.map((report, index) => (
                  <div key={index} className="p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">{report.name}</h4>
                        <p className="text-xs text-gray-600 mt-1">{report.description}</p>
                        <p className="text-xs text-gray-500 mt-1">Formatos: {report.format}</p>
                      </div>
                      <Button size="sm" variant="outline" className="ml-2">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Resumen de Reportes Generados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-center">
                <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Gráfico de reportes por categoría</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Frecuencia de Generación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Gráfico de frecuencia mensual</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Reportes Programados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay reportes programados</p>
            <Button variant="outline" className="mt-4">
              <Calendar className="h-4 w-4 mr-2" />
              Programar Primer Reporte
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
