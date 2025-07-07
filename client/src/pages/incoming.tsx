import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ArrowDown, Plus, Filter, Download, Package } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface IncomingOrder {
  id: number;
  orderNumber: string;
  supplierName: string;
  status: string;
  totalItems: number;
  receivedItems: number;
  createdAt: string;
  completedAt: string | null;
}

export default function Incoming() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: orders, isLoading, error } = useQuery<IncomingOrder[]>({
    queryKey: ['/api/incoming-orders'],
  });

  const filteredOrders = orders?.filter(order =>
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.supplierName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingOrders = orders?.filter(order => order.status === 'pending');
  const completedOrders = orders?.filter(order => order.status === 'completed');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'receiving': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'receiving': return 'Recibiendo';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16 mb-4" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900">Error al cargar órdenes de ingreso</p>
          <p className="text-sm text-gray-500">Por favor intente nuevamente</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Órdenes</p>
                <p className="text-2xl font-bold text-gray-900">{orders?.length || 0}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <ArrowDown className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingOrders?.length || 0}</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <Package className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completadas</p>
                <p className="text-2xl font-bold text-green-600">{completedOrders?.length || 0}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Package className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Órdenes de Ingreso</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtrar
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Orden
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar órdenes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número de Orden</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Total Items</TableHead>
                  <TableHead>Recibidos</TableHead>
                  <TableHead>Progreso</TableHead>
                  <TableHead>Fecha Creación</TableHead>
                  <TableHead>Fecha Completado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders?.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>{order.supplierName || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusText(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{order.totalItems}</TableCell>
                    <TableCell className="text-right">{order.receivedItems}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ 
                              width: `${order.totalItems > 0 ? (order.receivedItems / order.totalItems) * 100 : 0}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-500">
                          {order.totalItems > 0 ? Math.round((order.receivedItems / order.totalItems) * 100) : 0}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(order.createdAt), 'PPP', { locale: es })}
                    </TableCell>
                    <TableCell>
                      {order.completedAt ? format(new Date(order.completedAt), 'PPP', { locale: es }) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          Ver
                        </Button>
                        {order.status !== 'completed' && (
                          <Button variant="outline" size="sm">
                            Procesar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
