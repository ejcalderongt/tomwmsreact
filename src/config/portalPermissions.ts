export const MODULE_PERMISSIONS: Record<string, string[]> = {
  inventario: ['inventario.ver'],
  ingresos: ['ingresos.ver', 'ingresos.crear', 'ingresos.importar', 'ingresos.enviar'],
  salidas: ['salidas.ver', 'salidas.crear', 'salidas.importar', 'salidas.enviar'],
  indicadores: ['indicadores.ver'],
  analisis: ['analisis.ver'],
  kairos: ['kairos.usar'],
  automatizaciones: ['automatizaciones.ver'],
};

export interface PortalPrincipal {
  permissions?: string[];
  isAdmin?: boolean;
  isSystemAdmin?: boolean;
}

export const hasPermission = (user: PortalPrincipal, code: string) =>
  !!user.permissions?.includes(code);

export const canAccessPath = (path: string, user: PortalPrincipal): boolean => {
  if (path === '/' || path === '/login' || path === '/acceso-interno') return true;
  if (path === '/permisos') return !!(user.isAdmin || user.isSystemAdmin);
  if (user.isSystemAdmin) return false;
  if (path.startsWith('/detalle-ingreso') || path.startsWith('/ingresos'))
    return hasPermission(user, 'ingresos.ver');
  if (path.startsWith('/detalle-salida') || path.startsWith('/salidas'))
    return hasPermission(user, 'salidas.ver');
  if (path.startsWith('/kpi-')) return hasPermission(user, 'indicadores.ver');
  if (path === '/asistente-inventario') return hasPermission(user, 'kairos.usar');
  if (path === '/automatizaciones') return hasPermission(user, 'automatizaciones.ver');
  if (['/dashboard-ejecutivo', '/analisis-ciclo', '/productividad-operadores',
    '/abc-productos', '/analisis-merma', '/analisis-inventario', '/analisis-ubicaciones'].includes(path))
    return hasPermission(user, 'analisis.ver');
  if (['/dashboard', '/existencias', '/resumen-existencias', '/movimientos',
    '/inventario-en-linea'].includes(path)) return hasPermission(user, 'inventario.ver');
  return false;
};

export const firstAllowedRoute = (user: PortalPrincipal): string => {
  if (user.isSystemAdmin || user.isAdmin && !user.permissions?.length) return '/permisos';
  return ['/inventario-en-linea', '/ingresos', '/salidas', '/kpi-picking',
    '/dashboard-ejecutivo', '/asistente-inventario', '/automatizaciones', '/permisos']
    .find(path => canAccessPath(path, user)) || '/sin-acceso';
};
