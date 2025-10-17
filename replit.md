# TOM WMS - Sistema de Gestión de Almacén

## Descripción del Proyecto
Sistema de gestión de almacén (Warehouse Management System) desarrollado con React + TypeScript + Vite que se conecta a un servidor API externo HTTP.

**Backend API:** http://52.41.114.122:8097

## Tecnologías Utilizadas
- **Frontend:** React 18 + TypeScript + Vite
- **Routing:** React Router DOM
- **UI/Styling:** Tailwind CSS
- **Iconos:** Heroicons
- **Notificaciones:** React Hot Toast
- **Backend Proxy:** Express (para manejar conexiones HTTP desde HTTPS)
- **Excel Export:** XLSX library

## Estructura del Proyecto

### Componentes Principales
- **Layout.tsx** - Componente de layout principal con sidebar y navegación
- **Login.tsx** - Página de inicio de sesión

### Páginas de Inventario
- **InventarioEnLinea.tsx** - Vista de inventario en tiempo real
- **Existencias.tsx** - Detalle de existencias
- **ResumenExistencias.tsx** - Resumen agrupado de existencias
- **Movimientos.tsx** - Historial de movimientos

### API Integration
- **api.ts** - Cliente API configurado para proxy
- **auth.ts** - Utilidades de autenticación

### Servidor Proxy
- **server.js** - Servidor Express que maneja:
  - Proxy HTTP→HTTPS para comunicación con backend
  - Servir archivos estáticos del build

## Configuración de Desarrollo

### Workflows Configurados
- **Server** - Comando: `npm start`
  - Ejecuta el servidor Express en puerto 5000
  - Sirve el frontend y proxy al backend

### Variables de Entorno
Ninguna variable de entorno requerida. La configuración del proxy está hardcoded en `server.js`.

## Mejoras Recientes

### Octubre 17, 2025
1. ✅ **Navegación Simplificada - Sistema Completo**
   - **Sidebar:** Ocultado acceso a Detalle, Resumen y Movimientos
   - **Dashboard:** Ocultado acceso a Existencias, Resumen de Existencias y Movimientos
   - **Menús visibles:** Inventario en Línea, Ingresos, Salidas, Cerrar Sesión
   - Navegación simplificada tanto en sidebar móvil como desktop
   - Dashboard ahora muestra solo 3 opciones principales en grid y accesos rápidos

2. ✅ **Mejora en Descarga de Inventario en Línea**
   - Agregada la hora (HH:MM:SS) al nombre del archivo descargado
   - Formato del nombre: `InventarioCompleto_[Bodega]_[Fecha]_[Hora].xlsx`
   - Ejemplo: `InventarioCompleto_TodasBodegas_17102025_143052.xlsx`

### Octubre 16, 2025
1. ✅ **Sidebar Clickeable al Menú Principal**
   - El título "TOMWMSUX" ahora es clickeable y redirecciona al menú principal (Dashboard)
   - Funciona tanto en sidebar móvil como desktop
   - Efecto hover visual para indicar interactividad (hover:text-blue-600 en móvil, hover:bg-blue-700 en desktop)

2. ✅ **Corrección de Componente Movimientos**
   - Solucionado error de pantalla en blanco causado por orden de declaración de variables
   - `movimientosFiltrados` movido antes de su primer uso
   - Todos los errores LSP/TypeScript corregidos

3. ✅ **Optimización de UI - Componentes de Inventario**
   - Títulos concatenados en header bar (ahorro de ~70px vertical)
   - Componentes optimizados: InventarioEnLinea, Existencias, ResumenExistencias, Movimientos
   - Altura de grids ajustada a `calc(100vh - 350px)` para máxima visualización

4. ✅ **Integración API ResumenExistencias**
   - Implementado procesamiento local usando `existenciasAPI.listar()`
   - Agrupación por producto en cliente (no existe endpoint `/resumen` en backend)

## Arquitectura de Conexión

### Flujo de Comunicación
```
Frontend (HTTPS) → Express Proxy (Port 5000) → Backend API (HTTP:8097)
```

### Configuración Crítica en server.js
- ❌ **NO usar** `express.json()` antes del proxy (consume el body stream)
- ✅ Proxy maneja conversión HTTP→HTTPS para mixed content
- ✅ Configuración CORS habilitada en proxy

## Deployment (Autoscale)

### Configuración Actual
- **Tipo:** Autoscale (recomendado para sitios web sin estado)
- **Build Command:** `npm run build`
- **Run Command:** `npm start`
- **Puerto:** 5000

### Nota Importante sobre Cache
Si los cambios no se ven en producción después de redesplegar:
1. Eliminar deployment existente manualmente
2. Crear nuevo deployment
3. Autoscale puede cachear código viejo

### Dominios Personalizados
- Disponible enlazar dominios personalizados (gratis en Autoscale)
- Configuración vía DNS A y TXT records

## Patrones de Diseño

### Optimización de Espacio en Grids
```typescript
// Patrón usado en todos los componentes de inventario
<Layout pageTitle="Título del Componente">
  // Sin header duplicado - título va en Layout
  <div className="h-[calc(100vh-350px)]">
    // Grid content
  </div>
</Layout>
```

### Orden de Declaración en React
⚠️ **Importante:** Declarar variables computadas/filtradas DESPUÉS de sus dependencias
```typescript
// ✅ CORRECTO
const [data, setData] = useState([]);
const filteredData = data.filter(...);
const paginatedData = filteredData.slice(...);

// ❌ INCORRECTO
const paginatedData = filteredData.slice(...); // Error: filteredData no definido aún
const filteredData = data.filter(...);
```

## Usuarios y Preferencias

### Idioma
- Usuario habla español
- UI en español

### Estilo de Código
- TypeScript estricto
- Componentes funcionales con hooks
- Tailwind para estilos
- Manejo de errores con toast notifications

## Próximos Pasos Sugeridos
- Implementar páginas de Ingresos y Salidas
- Agregar más filtros avanzados en reportes
- Implementar paginación del lado del servidor para mejor rendimiento
- Considerar implementar React Query para cache de datos
