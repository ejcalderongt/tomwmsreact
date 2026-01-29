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

### Enero 29, 2026
1. ✅ **Nuevo Módulo: Análisis de Inventario**
   - Ruta: `/analisis-inventario`
   - 4 secciones de análisis visual interactivo:
     - **Vencimientos**: Semáforo de productos vencidos/próximos a vencer (30d, 90d, OK)
     - **Antigüedad**: Distribución por días en inventario (0-30, 31-60, 61-90, >90)
     - **Por Bodega**: Distribución de SKUs, unidades y valor por bodega
     - **Composición**: Treemap de familias por volumen con tabla detallada
   - Navegación por tabs con contadores de productos críticos
   - Tabla de productos críticos (vencidos y estancados)
   - Gráficos de barras horizontales para distribución

2. ✅ **Descripciones Elegantes en Todos los Reportes**
   - Componente ReportDescription añadido a los 11 módulos de indicadores
   - Cada reporte incluye: título, descripción, métricas clave, interpretación
   - Códigos de color diferenciados por módulo

3. ✅ **Módulos de Análisis Avanzado - Sistema Completo de Reportes**
   - **Dashboard Ejecutivo** (`/dashboard-ejecutivo`):
     - Vista unificada de métricas de los 4 KPIs operativos
     - Cards con cumplimiento, tiempos promedio y alertas automáticas
     - Flujo operativo visual: Recepción → Picking → Verificación → Despacho
     - Alertas por bajo cumplimiento (<80%) o merma elevada
   
   - **Análisis de Ciclo Completo** (`/analisis-ciclo`):
     - Lead time desde Picking hasta Verificación
     - Detección automática de cuellos de botella
     - Distribución de tiempos por rangos
     - Top 10 documentos con mayor lead time
     - Flujo visual con tiempos por etapa
   
   - **Productividad de Operadores** (`/productividad-operadores`):
     - Ranking cruzado entre Picking, Verificación y Recepción
     - Métricas: líneas/hora por operador por área
     - Comparativo vs promedio con códigos de color
     - Medallas para top 3 operadores (🥇🥈🥉)
   
   - **ABC de Productos (Pareto)** (`/abc-productos`):
     - Clasificación automática: A (80%), B (15%), C (5%)
     - Basado en datos históricos de despacho
     - Filtros por clasificación
     - Curva de Pareto visual
     - Usa endpoint `/api/Kpi/tendencias/despacho`
   
   - **Análisis de Merma y Calidad** (`/analisis-merma`):
     - Tasa de merma global
     - Desglose por tipo: Merma, Dañado Picking, Dañado Verificación, No Encontrado
     - Top 20 productos con mayor merma
     - Top 10 clientes con mayor merma
     - Indicadores con colores según severidad

2. ✅ **Navegación Actualizada**
   - Nueva sección "Análisis Avanzado" en el sidebar
   - Colores diferenciados para cada módulo analítico
   - Separador visual entre KPIs operativos y análisis avanzado

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

3. ✅ **Campos Simplificados en Excel - Inventario en Línea**
   - Reducido el archivo Excel a solo 8 campos esenciales:
     1. Código
     2. Producto
     3. Disponible U.M. Bas
     4. Lote
     5. Licencia
     6. Referencia
     7. Fecha Vence
     8. Fecha Ingreso
   - Eliminados campos adicionales para simplificar la exportación
   - Eliminada sección de totales del archivo Excel

4. ✅ **Renombrar Columna en Grid de Inventario en Línea**
   - Columna "Bodega" renombrada a "Regimen(Bodega)" en la vista de grid

6. ✅ **Limpieza de Grid al Filtrar por Bodega - Inventario en Línea**
   - Cuando se filtra por bodega y no se encuentran datos, el grid ahora se limpia correctamente
   - Se vacían los arrays de inventario (allInventario e inventario)
   - Se resetean los contadores (totalRegistros, totalPaginas, paginaActual)
   - Se actualiza el localStorage con estado vacío
   - Solución al problema donde se mostraban los datos de la carga previa

7. ✅ **Corrección del Filtro de Bodega - Inventario en Línea**
   - Corregido comportamiento del cambio de bodega para que cargue datos basados en la nueva selección
   - Modificada función cargarInventario para aceptar parámetros opcionales (idBodegaParam, paginaParam)
   - handleBodegaChange ahora pasa directamente el idBodega seleccionado a cargarInventario
   - Solución al problema donde mostraba registros de la bodega previamente cargada
   - El comportamiento ahora es consistente con el botón "Consultar"

8. ✅ **Rediseño Completo del Encabezado Excel con ExcelJS + Logotipo - Inventario en Línea**
   - **Migración de xlsx a ExcelJS:** Cambio de librería para soportar estilos completos en archivos Excel
   - La librería `xlsx` gratuita NO soporta estilos (solo versión Pro de pago)
   - Implementación completa con `exceljs` que soporta todos los estilos de forma gratuita
   - Encabezado completamente rediseñado según especificación de imagen encabezado.png
   - **Estructura del encabezado:**
     - Columna B: Etiquetas (EMPRESA, FECHA DE GENERACIÓN, HORA DE GENERACIÓN, USUARIO)
     - Columna C-D: Valores correspondientes (propietario, fecha, hora, usuario) con celdas combinadas
     - Columna E: Etiquetas adicionales (TIPO DE CARGA, TOTAL DE INVENTARIO)
     - Columna F: Valor total calculado (solo para TOTAL DE INVENTARIO)
     - **Columnas H-J: Logotipo CEALSA insertado (celdas H2:J7 combinadas, imagen PNG 200x90px)**
   - **Logotipo corporativo:**
     - Imagen `logotipo.png` insertada automáticamente en el Excel
     - Posicionada en celdas H2:J7 (columnas H-I-J, filas 2-7)
     - Tamaño ampliado: 200x90 píxeles (3 columnas x 6 filas)
     - Carga dinámica desde `/public/logotipo.png`
   - **Título "INVENTARIO":** Fila 9, centrado en toda la fila (A9:H9) en negrita con tamaño 14pt
   - **Formato profesional aplicado:**
     - **Fondo blanco:** Aplicado desde columna A hasta N (14 columnas) y desde fila 1 hasta fila 1000
     - **Bordes internos:** Bordes delgados negros en todas las celdas desde fila 9 hasta fila 1000 (columnas A-H)
     - **Borde exterior grueso:** Borde perimetral grueso aplicado a toda la tabla de datos (desde fila 9 hasta la última fila con datos)
     - Etiquetas en negrita, alineación izquierda
     - Valores en fuente normal, alineación izquierda
     - Cabeceras de columnas en negrita, centradas, con fondo gris (D3D3D3)
     - Contenido de la fila 9 completamente centrado
   - **Funcionalidades:**
     - Cálculo automático del total de inventario (suma de disponible_UMBas)
     - Fusión de celdas para mantener diseño profesional
     - Anchos de columnas configurados para mejor visualización
     - **Inserción automática de imagen del logotipo corporativo CEALSA**
     - Formato de tabla profesional con bordes internos y externos diferenciados
     - **TODOS LOS ESTILOS SE APLICAN CORRECTAMENTE** gracias a ExcelJS
   - Datos comienzan en fila 11 después del encabezado completo
   - Excel generado con aspecto limpio y profesional sin líneas de grid visibles
   - **Etiqueta TIPO DE CARGA presente** (sin valor en columna posterior)

5. ✅ **Encabezado Mejorado en Archivo Excel - Inventario en Línea**
   - Agregado encabezado informativo al archivo Excel con los siguientes campos:
     - EMPRESA: Nombre del propietario (obtenido desde los datos del grid)
     - FECHA DE GENERACIÓN: Fecha cuando se genera la descarga (DD/MM/AAAA)
     - HORA DE GENERACIÓN: Hora cuando se genera la descarga (HH:MM:SS)
     - TIPO DE CARGA: Campo vacío para uso futuro
     - TOTAL DE INVENTARIO: Campo vacío para uso futuro
     - USUARIO: Usuario que genera la descarga
   - Encabezado se muestra antes de los datos de inventario
   - Fila vacía separa el encabezado de los datos
   - El campo propietario se obtiene de los datos del API (campo oculto en el grid)
   - Celdas combinadas (merged) en el encabezado para mantener diseño independiente de las columnas del detalle:
     - Fila 1: EMPRESA (A1:B1) | Propietario (C1:D1)
     - Fila 2: FECHA DE GENERACIÓN: (A2:B2) | Fecha visible en C2 | TIPO DE CARGA: (E2:G2)
     - Fila 3: HORA DE GENERACIÓN: (A3:B3) | Hora visible en C3 | TOTAL DE INVENTARIO: (E3:G3)
     - Fila 4: USUARIO: (A4:B4) | Usuario (C4:D4)
   - Los valores de fecha y hora son visibles en celdas separadas (no combinadas con etiquetas)
   - TIPO DE CARGA y TOTAL DE INVENTARIO se alinean con el espacio de las columnas de datos

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
