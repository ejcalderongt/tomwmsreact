# Detalle de ingresos y salidas: contrato y pruebas

Verificado el 25/09/2026 en el portal IIS `https://existenciasenlinea.com.gt`.

## Contrato de navegación

| Lista | Identificador de la fila | Ruta React | Consulta API |
| --- | --- | --- | --- |
| Ingresos | `codigo` = `IdOrdenCompraEnc` | `/detalle-ingreso/:id` | `/api/sync/ingresos/:id/detalle-oc` |
| Salidas | `correlativo` = `IdPedidoEnc` | `/detalle-salida/:id` | `/api/sync/salidas/:id/detalle-pe` |

`idDespachoEnc` no identifica el pedido de salida. Las páginas de detalle leen el parámetro `id` del router. Una ruta de fila no registrada cae en la redirección general del portal.

## Prueba automatizada

El archivo `tests/document-detail-navigation.test.mjs` usa Node `--test` y `playwright-core` con Microsoft Edge instalado. Desde un clon limpio:

```powershell
npm ci
npm run test:documents
```

La prueba abre el portal publicado. Simula los listados de ingreso y salida para comprobar el clic, la ruta y el ID enviado a la API; no necesita credenciales. Además consulta un ingreso real y comprueba que la página muestre sus líneas. El documento de referencia en la base QAS es `229`; se puede cambiar con `PORTAL_INGRESO_TEST_ID`. `PORTAL_TEST_URL` permite probar otro despliegue y `EDGE_PATH` permite elegir el ejecutable de Edge.

El test de clic por sí solo no detectaba errores de lectura o serialización de la API. Por eso la prueba de datos reales es obligatoria antes de dar por válido el detalle. En la reproducción previa a la corrección, el clic fallaba por rutas equivocadas y después el endpoint de ingreso devolvía HTTP 500. Tras publicar ambas correcciones, las cuatro pruebas pasaron y el documento 229 devolvió siete líneas.

## Publicación y comprobación

Compilar con `npm run build`, publicar `dist` en `C:\Sites\PortalDMS` conservando `web.config`, y ejecutar `npm run test:documents` contra la URL pública. El build y el commit no publican automáticamente los archivos en IIS. Mantener fuera de Git los respaldos de IIS y cualquier configuración con secretos.
