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
import { 
  Search, 
  MapPin, 
  Plus, 
  Filter, 
  Download, 
  Building, 
  Archive,
  Grid3x3,
  Square
} from "lucide-react";
import { useState } from "react";

interface Location {
  id: number;
  code: string;
  name: string;
  type: string;
  parentId: number | null;
  capacity: number | null;
  isActive: boolean;
  createdAt: string;
}

export default function Locations() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: locations, isLoading, error } = useQuery<Location[]>({
    queryKey: ['/api/locations'],
  });

  const filteredLocations = locations?.filter(location =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const warehouseLocations = locations?.filter(loc => loc.type === 'warehouse');
  const zoneLocations = locations?.filter(loc => loc.type === 'zone');
  const rackLocations = locations?.filter(loc => loc.type === 'rack');

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'warehouse': return Building;
      case 'zone': return Archive;
      case 'rack': return Grid3x3;
      case 'shelf': return Square;
      default: return MapPin;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'warehouse': return 'bg-blue-100 text-blue-800';
      case 'zone': return 'bg-green-100 text-green-800';
      case 'rack': return 'bg-purple-100 text-purple-800';
      case 'shelf': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'warehouse': return 'Almacén';
      case 'zone': return 'Zona';
      case 'rack': return 'Rack';
      case 'shelf': return 'Estante';
      default: return type;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
          <MapPin className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900">Error al cargar ubicaciones</p>
          <p className="text-sm text-gray-500">Por favor intente nuevamente</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Ubicaciones</p>
                <p className="text-2xl font-bold text-gray-900">{locations?.length || 0}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Almacenes</p>
                <p className="text-2xl font-bold text-blue-600">{warehouseLocations?.length || 0}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Building className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Zonas</p>
                <p className="text-2xl font-bold text-green-600">{zoneLocations?.length || 0}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Archive className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Racks</p>
                <p className="text-2xl font-bold text-purple-600">{rackLocations?.length || 0}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Grid3x3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Locations Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Ubicaciones</CardTitle>
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
                Nueva Ubicación
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar ubicaciones..."
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
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Capacidad</TableHead>
                  <TableHead>Utilización</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Ubicación Padre</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLocations?.map((location) => {
                  const TypeIcon = getTypeIcon(location.type);
                  const parentLocation = locations?.find(l => l.id === location.parentId);
                  
                  return (
                    <TableRow key={location.id}>
                      <TableCell className="font-medium">{location.code}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TypeIcon className="h-4 w-4 text-gray-500" />
                          {location.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(location.type)}>
                          {getTypeText(location.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {location.capacity ? location.capacity.toLocaleString() : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: '65%' }}
                            />
                          </div>
                          <span className="text-sm text-gray-500">65%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={location.isActive ? 'default' : 'secondary'}>
                          {location.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {parentLocation ? (
                          <span className="text-sm text-gray-600">
                            {parentLocation.name}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            Editar
                          </Button>
                          <Button variant="outline" size="sm">
                            Ver
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Location Hierarchy */}
      <Card>
        <CardHeader>
          <CardTitle>Jerarquía de Ubicaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {warehouseLocations?.map((warehouse) => (
              <div key={warehouse.id} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Building className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">{warehouse.name}</span>
                  <Badge variant="outline">{warehouse.code}</Badge>
                </div>
                
                <div className="ml-6 space-y-2">
                  {locations?.filter(loc => loc.parentId === warehouse.id).map((zone) => (
                    <div key={zone.id} className="flex items-center gap-2">
                      <Archive className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{zone.name}</span>
                      <Badge variant="outline" className="text-xs">{zone.code}</Badge>
                      
                      <div className="ml-4 flex items-center gap-1 text-xs text-gray-500">
                        ({locations?.filter(loc => loc.parentId === zone.id).length || 0} racks)
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
