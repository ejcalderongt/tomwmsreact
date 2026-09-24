# Portal TOMWMSUX: permisos vigentes

Publicado el 24/09/2026. La guía completa de operación está en [brain/portal-operacion-permisos.md](https://github.com/ejcalderongt/tomwms-replit-client-automate/blob/wms-brain/brain/portal-operacion-permisos.md). El documento `PORTAL_ARCHITECTURE.md` conserva el análisis previo a esta implementación.

## Flujo

`https://existenciasenlinea.com.gt` → IIS `PortalDMS` (`C:\Sites\PortalDMS`) → `/api/*` por URL Rewrite/ARR → `WMSWebAPI2` (`192.168.1.4:8097`) → SQL Server local `IMS4MB_CEALSA_QAS`. El puerto HTTP 80 está cerrado. IIS entrega el build estático de React; `server.js` no se ejecuta allí.

| Función | Ruta | Actor |
| --- | --- | --- |
| Login de propietario o delegado | `/login` | Propietario y usuarios delegados |
| Administrar delegados y permisos | `/permisos` | Administrador del propietario |
| Habilitar módulos por propietario | `/acceso-interno` y luego `/permisos` | Cuenta interna |

El propietario legacy es administrador inicial. La persona delegada se representa en `portal_usuario`; sus asignaciones viven en `portal_usuario_permiso`. `portal_propietario_modulo` permite a la empresa habilitar módulos para cada propietario. Un delegado solo puede usar permisos asignados cuyo módulo esté habilitado. Los administradores del propietario reciben todos los permisos de los módulos habilitados. No hay tabla nueva de roles; `EsAdministrador` es el perfil administrativo actual. Los scripts están en `ejcalderongt/DBA/master`.

## Mapa de código

- `src/App.tsx` registra las rutas y `src/components/PrivateRoute.tsx` comprueba acceso directo.
- `src/components/Layout.tsx` oculta opciones según `src/config/portalPermissions.ts`.
- `src/pages/PortalPermissions.tsx` administra usuarios delegados y muestra módulos; la cuenta interna puede modificarlos.
- `src/api/api.ts` usa `POST /api/PortalAcceso/login`; `src/api/portalAccessApi.ts` usa los endpoints administrativos y el login interno existente.
- El catálogo que gobierna la API está en `TOMWMS_BOF/WMSWebAPI/Services/Portal/PortalCatalogo.cs`; mantener su lista de códigos alineada con React.

Módulos: `inventario`, `ingresos`, `salidas`, `indicadores`, `analisis`, `kairos` y `automatizaciones`. Los permisos `crear`, `importar` y `enviar` de ingresos/salidas preparan funciones futuras y todavía no habilitan escritura en el portal.

## Estado probado y límite

La publicación pasó login de Manuchar con siete módulos y trece permisos; cinco salidas para agosto de 2026 y cero ingresos de ese propietario en el rango 24/01/2021–24/09/2026. Se probó desactivar/restaurar Kairos y un delegado temporal con un permiso y acceso administrativo denegado. HTTP 80 no respondió.

Los endpoints legacy de lectura de ingresos, salidas y stock aún aceptan solicitudes anónimas. Ocultar enlaces y bloquear rutas React no sustituye la autorización en la API. Antes de exponer creación/importación/envío o afirmar aislamiento completo, exigir JWT y permiso efectivo en esos endpoints y tomar el propietario del token.

## Sincronización

Azure DevOps `TOMWMSReact/dev_replit` es la fuente principal; GitHub `ejcalderongt/tomwmsreact/dev_replit` es el espejo. Publicar cambios primero en Azure, verificar el SHA y avanzar GitHub sin forzar. El despliegue IIS requiere compilar y copiar por separado, publicando API antes que React cuando cambie el contrato.
