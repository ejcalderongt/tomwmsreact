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
import { Search, Package, AlertTriangle, Plus, Filter, Download } from "lucide-react";
import { useState } from "react";

interface InventoryItem {
  id: number;
  productId: number;
  locationId: number;
  quantity: number;
  reservedQuantity: number;
  product: {
    id: number;
    sku: string;
    name: string;
    minStock: number;
    maxStock: number;
  };
  location: {
    id: number;
    code: string;
    name: string;
  };
}

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: inventory, isLoading, error } = useQuery<InventoryItem[]>({
    queryKey: ['/api/inventory'],
  });

  const filteredInventory = inventory?.filter(item =>
    item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = inventory?.filter(item => 
    item.quantity <= (item.product.minStock || 0)
  );

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
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900">Error al cargar el inventario</p>
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
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{inventory?.length || 0}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Stock Bajo</p>
                <p className="text-2xl font-bold text-red-600">{lowStockItems?.length || 0}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unidades Totales</p>
                <p className="text-2xl font-bold text-gray-900">
                  {inventory?.reduce((sum, item) => sum + item.quantity, 0) || 0}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Package className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Inventario</CardTitle>
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
                Agregar Producto
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar productos..."
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
                  <TableHead>SKU</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Reservado</TableHead>
                  <TableHead>Disponible</TableHead>
                  <TableHead>Min Stock</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.product.sku}</TableCell>
                    <TableCell>{item.product.name}</TableCell>
                    <TableCell>{item.location.name}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{item.reservedQuantity}</TableCell>
                    <TableCell className="text-right">
                      {item.quantity - item.reservedQuantity}
                    </TableCell>
                    <TableCell className="text-right">{item.product.minStock}</TableCell>
                    <TableCell>
                      {item.quantity <= (item.product.minStock || 0) ? (
                        <Badge variant="destructive">Stock Bajo</Badge>
                      ) : item.quantity <= (item.product.minStock || 0) * 2 ? (
                        <Badge variant="secondary">Stock Medio</Badge>
                      ) : (
                        <Badge variant="default">Stock OK</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                        <Button variant="outline" size="sm">
                          Mover
                        </Button>
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
