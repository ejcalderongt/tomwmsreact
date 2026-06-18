# Reporte técnico — Timeout del endpoint `GET /api/Kpi/picking`

> **Para:** Codex (corrección en el código del WebAPI C#)
> **De:** Diagnóstico realizado con acceso directo a SQL Server 2022 (`52.41.114.122:1437`, BD `TOMWMS_LA_CUMBRE_QA`).
> **Fecha:** 2026-06-18

---

## 1. Síntoma

`GET /api/Kpi/picking?from=YYYY-MM-DD&to=YYYY-MM-DD` **siempre se pasa de 90 s y termina en timeout (HTTP 000)**, tanto en el puerto 8097 (WebAPI principal) como en el 8091 (servidor KPI dedicado, que además está caído con `HTTP 500.30 - ASP.NET Core app failed to start`).

Detalle clave: **el tiempo de respuesta es idéntico para 1 día que para 6 meses.** Eso descarta volumen de datos como causa y apunta a que el rango de fechas no se está usando.

Todos los demás endpoints `Kpi/*` (stock, bodegas, recepción, despacho, verificación, tendencias, heatmap) responden en < 1 s.

---

## 2. Causa raíz (CONFIRMADA)

**La consulta SQL que ejecuta el endpoint NO contiene ningún predicado de fecha.** Los parámetros `from` / `to` de la URL nunca se trasladan al `WHERE` del SQL. La consulta trae **toda la historia de picking (≈ 444,825 filas)** unida a ~18 tablas, con `ORDER BY`, en **cada** llamada. El filtrado por fecha, si existe, ocurre en memoria (C#) **después** de traer todo — por eso siempre revienta el timeout.

Captura en vivo de la consulta real (vía `sys.dm_exec_requests` mientras corría el request). Su `WHERE` completo es:

```sql
WHERE a.dañado_picking = 0
  AND a.no_encontrado = 0
  AND a.dañado_verificacion = 0
  AND m.estado <> 'Anulado'
  AND m.ubicacion <> 'TMP'
ORDER BY b.IdPickingEnc
```

👉 **No hay `AND a.fecha_picking BETWEEN ...` ni nada equivalente.** Ahí está el bug.

Medición directa de esa consulta núcleo (sin filtro de fecha): **444,825 filas en ~40 s** (y luego serialización/ordenamiento → > 90 s end-to-end). Los `wait_type` observados fueron ~100 % CPU.

---

## 3. La consulta completa capturada (referencia)

```sql
-- PICKING KPI
SELECT
    ISNULL(fo.Fecha_Hora_Inicio, DATEADD(day,1, m.Fecha_Pedido)) AS Fecha_Hora_Inicio,
    ISNULL(fo.Fecha_Hora_Fin,    DATEADD(day,1, m.Fecha_Pedido)) AS Fecha_Hora_Fin,
    ISNULL(a.fecha_picking,      DATEADD(day,1, m.Fecha_Pedido)) AS Fecha_Por_Línea,
    o.descripcion AS Tipo_Documento_Pedido,
    ISNULL(e.nombre, 'ND') AS Tipo,
    f.codigo AS Código_Departamento,
    f.nombre AS Descripción_Departamento,
    g.codigo AS Código_Categoría,
    g.nombretipoproducto AS Descripción_Categoría,
    d.codigo AS Código_Producto,
    d.nombre AS Nombre_Producto,
    t.cantidad AS Cantidad_Solicitada,
    ISNULL(a.cantidad_recibida, 0) AS Cantidad_Recibida,
    ISNULL(h.nombre, '') AS Nombre_Estado_Producto,
    ROUND((t.cantidad - ISNULL(a.cantidad_recibida, 0)),2) AS Cantidad_Devolución_Picking,
    ISNULL(q.nombre, '') AS Nombre_Presentación_MPQ,
    CASE WHEN p.IdPresentacion > 0 AND q.factor > 0
         THEN ROUND(ISNULL(a.cantidad_recibida, 0) / q.factor, 2) ELSE 0 END AS Cantidad_Pickeadas_Cajas,
    ISNULL(j.IdRecepcionEnc, 0) AS Id_Recepción,
    ISNULL(b.IdPickingEnc, 0) AS Número_Picking,
    ISNULL(a.fecha_vence, '19000101') AS Fecha_Vence,
    ISNULL(a.lic_plate, '') AS Lic_Plate,
    ISNULL(l.codigo, 'Operador BOF') AS Código_Operador,
    ISNULL(l.nombres, 'Operador BOF') + ' ' + ISNULL(l.apellidos, '') AS Descripción_Operador,
    ISNULL(n.codigo, '') AS Código_Comprador,
    ISNULL(n.nombre_comercial, '') AS Descripción_Comprador,
    m.Referencia_Documento_Ingreso_Bodega_Destino AS Solicitud_SAP,
    ISNULL(w.codigo, '') AS Código_Cliente,
    ISNULL(w.nombre_comercial, '') AS Descripción_Cliente
FROM trans_pe_enc m WITH (NOLOCK)
INNER JOIN trans_pe_det t  WITH (NOLOCK) ON t.IdPedidoEnc = m.IdPedidoEnc
INNER JOIN trans_pe_tipo o WITH (NOLOCK) ON o.IdTipoPedido = m.IdTipoPedido
INNER JOIN producto_bodega c WITH (NOLOCK) ON c.IdProductoBodega = t.IdProductoBodega
INNER JOIN producto d WITH (NOLOCK) ON d.IdProducto = c.IdProducto
LEFT JOIN producto_familia e WITH (NOLOCK) ON e.IdFamilia = d.IdFamilia
LEFT JOIN producto_clasificacion f WITH (NOLOCK) ON f.IdClasificacion = d.IdClasificacion
LEFT JOIN producto_tipo g WITH (NOLOCK) ON g.IdTipoProducto = d.IdTipoProducto
LEFT JOIN trans_picking_ubic a WITH (NOLOCK) ON t.IdPedidoDet = a.IdPedidoDet AND t.IdProductoBodega = a.IdProductoBodega
LEFT JOIN trans_picking_enc b WITH (NOLOCK) ON b.IdPickingEnc = a.IdPickingEnc
LEFT JOIN producto_estado h WITH (NOLOCK) ON h.IdEstado = a.IdProductoEstado
LEFT JOIN (
    SELECT IdOperadorBodega_Pickeo, IdPickingEnc,
           MIN(fecha_picking) AS Fecha_Hora_Inicio,
           MAX(fecha_picking) AS Fecha_Hora_Fin
    FROM trans_picking_ubic WITH (NOLOCK)
    WHERE no_encontrado = 0 AND dañado_picking = 0
    GROUP BY IdOperadorBodega_Pickeo, IdPickingEnc
) fo ON fo.IdOperadorBodega_Pickeo = a.IdOperadorBodega_Pickeo AND fo.IdPickingEnc = a.IdPickingEnc
LEFT JOIN cliente n WITH (NOLOCK) ON n.codigo COLLATE Modern_Spanish_CI_AS = m.bodega_destino COLLATE Modern_Spanish_CI_AS
LEFT JOIN cliente w WITH (NOLOCK) ON w.IdCliente = m.IdCliente
LEFT JOIN stock j WITH (NOLOCK) ON j.IdStock = a.IdStock
LEFT JOIN operador_bodega k WITH (NOLOCK) ON k.IdOperadorBodega = a.IdOperadorBodega_Pickeo
LEFT JOIN operador l WITH (NOLOCK) ON l.IdOperador = k.IdOperador
LEFT JOIN (SELECT MAX(IdPresentacion) IdPresentacion, IdProducto
           FROM producto_presentacion WITH (NOLOCK) GROUP BY IdProducto) p
       ON c.IdProducto = p.IdProducto AND d.IdProducto = p.IdProducto
LEFT JOIN producto_presentacion q WITH (NOLOCK) ON p.IdPresentacion = q.IdPresentacion
WHERE a.dañado_picking = 0
  AND a.no_encontrado = 0
  AND a.dañado_verificacion = 0
  AND m.estado <> 'Anulado'
  AND m.ubicacion <> 'TMP'
ORDER BY b.IdPickingEnc;
```

---

## 4. Corrección requerida en el WebAPI (PRINCIPAL)

**Agregar el predicado de fecha en el SQL, de forma sargable, y parametrizado.** No filtrar en memoria.

La columna lógica de fecha del reporte es `Fecha_Por_Línea = ISNULL(a.fecha_picking, DATEADD(day,1, m.Fecha_Pedido))`. **No filtres sobre esa expresión `ISNULL(...)`** porque es no-sargable (no puede usar índice). Filtra directamente sobre `a.fecha_picking`, que para un KPI de picking es lo correcto (solo cuenta lo efectivamente pickeado en el rango):

```sql
-- ... mismo SELECT/FROM/JOINs ...
WHERE a.dañado_picking = 0
  AND a.no_encontrado = 0
  AND a.dañado_verificacion = 0
  AND m.estado <> 'Anulado'
  AND m.ubicacion <> 'TMP'
  AND a.fecha_picking >= @from
  AND a.fecha_picking <  DATEADD(day, 1, @to)   -- 'to' inclusivo a nivel de día
ORDER BY b.IdPickingEnc
OPTION (RECOMPILE);   -- evita parameter sniffing en la fecha de borde (hoy)
```

Notas para Codex:
- **Parametrizar** `@from` y `@to` como `DateTime` (vía `SqlParameter` / Dapper / EF `FromSqlInterpolated`), nunca por concatenación de strings.
- Si el negocio necesita incluir también líneas **sin** `fecha_picking` (pedidos no pickeados) usando el fallback `Fecha_Pedido+1`, entonces hay que decidir explícitamente el criterio; pero para "productividad de picking" lo natural es filtrar por `a.fecha_picking` (excluye los no pickeados, que es lo esperado). Confirmar con negocio si hace falta.
- `OPTION (RECOMPILE)` es barato aquí (es un reporte, no un OLTP de alta frecuencia) y elimina el mal plan que aparece cuando se consulta la fecha del día actual.

**Impacto esperado:** la misma consulta **con** este filtro de fecha corre en **4–8 s** (medido contra la vista equivalente `VW_Productividad_Picking`), vs. 40–90 s sin filtro. Con un rango de 1 día baja a ~4 s.

---

## 5. Optimizaciones secundarias (recomendadas, no bloqueantes)

### 5.1 Collation mismatch en el join a `cliente`
- `cliente.codigo` → `SQL_Latin1_General_CP1_CI_AS`
- Default de la BD / `trans_pe_enc.bodega_destino` → `Modern_Spanish_CI_AS`

Por eso la consulta hace `n.codigo COLLATE Modern_Spanish_CI_AS = m.bodega_destino COLLATE Modern_Spanish_CI_AS`. Ese `COLLATE` sobre la columna la vuelve **no-sargable** (no puede hacer seek por índice en `cliente`).

Opciones (elegir una, con DBA):
1. **Unificar la collation** de `cliente.codigo` a `Modern_Spanish_CI_AS` (cambio de esquema; requiere ventana y revisar dependencias/FKs).
2. Crear una **columna computada PERSISTED + índice** en `cliente`:
   ```sql
   ALTER TABLE dbo.cliente ADD codigo_ms AS (codigo COLLATE Modern_Spanish_CI_AS) PERSISTED;
   CREATE NONCLUSTERED INDEX NCLI_cliente_codigo_ms ON dbo.cliente (codigo_ms);
   ```
   SQL Server puede emparejar la expresión `codigo COLLATE Modern_Spanish_CI_AS` con esa columna computada y hacer seek. (No requiere tocar el SQL del WebAPI.)

### 5.2 Subquery de agregación `fo`
El derivado `fo` agrega **todo** `trans_picking_ubic` sin filtro de fecha. Con el filtro de fecha del punto 4, el costo total ya baja mucho; el índice de cobertura agregado (ver 6) lo convierte en un index scan + stream aggregate.

---

## 6. Cambios YA aplicados en la BD por nosotros (aditivos y reversibles)

> Estos cambios ya están en `TOMWMS_LA_CUMBRE_QA`. No requieren acción de Codex, pero conviene saber que existen. Son seguros de revertir con `DROP INDEX`.

1. Índice de cobertura para el subquery `fo`:
   ```sql
   CREATE NONCLUSTERED INDEX NCLI_picking_ubic_kpi_agg_2026
   ON dbo.trans_picking_ubic (no_encontrado, dañado_picking, IdPickingEnc, IdOperadorBodega_Pickeo)
   INCLUDE (fecha_picking, IdPedidoDet, IdProductoBodega, IdProductoEstado,
            cantidad_solicitada, cantidad_recibida, fecha_vence, lic_plate,
            IdStock, IdPresentacion, IdPedidoEnc);
   ```

2. Índice líder por `fecha_picking` (lo aprovecha el filtro del punto 4):
   ```sql
   CREATE NONCLUSTERED INDEX NCLI_picking_ubic_fecha_kpi_2026
   ON dbo.trans_picking_ubic (fecha_picking, no_encontrado, dañado_picking)
   INCLUDE (IdPickingEnc, IdProductoBodega, IdProductoEstado, cantidad_solicitada,
            cantidad_recibida, fecha_vence, lic_plate, IdStock, IdPedidoEnc,
            IdPedidoDet, IdOperadorBodega_Pickeo);
   ```

3. Estadísticas actualizadas (resolvió el plan malo del día actual: 22 s → 4 s):
   ```sql
   UPDATE STATISTICS dbo.trans_picking_ubic WITH FULLSCAN;
   UPDATE STATISTICS dbo.trans_pe_enc       WITH FULLSCAN;
   UPDATE STATISTICS dbo.trans_pe_det       WITH FULLSCAN;
   ```

---

## 7. Resumen para Codex (checklist)

- [ ] **Localizar** en el WebAPI el método del endpoint `GET /api/Kpi/picking` (busca el comentario `-- PICKING KPI` o el texto `Fecha_Por_Línea` en el código C#).
- [ ] **Agregar el filtro de fecha en el SQL** sobre `a.fecha_picking` (`>= @from AND < DATEADD(day,1,@to)`), **parametrizado**, y `OPTION (RECOMPILE)`. (Sección 4.)
- [ ] **Eliminar** cualquier filtrado de fecha que se esté haciendo en memoria después de traer los datos.
- [ ] (Opcional) Resolver el collation mismatch del join a `cliente` (Sección 5.1).
- [ ] Verificar tiempos: 1 día ≈ 4 s, 1 mes ≈ 6–8 s.
- [ ] Nota infra: el servidor KPI dedicado (puerto 8091) está caído (`HTTP 500.30`). Mientras tanto, el proxy del frontend apunta `Kpi/*` al 8097, que está sano.

---

## 8. Datos de entorno para reproducir/medir

- SQL Server 2022, host `52.41.114.122`, **puerto 1437**, BD `TOMWMS_LA_CUMBRE_QA`.
- `trans_picking_ubic` ≈ 448,379 filas.
- Para conectar desde fuera hay que tener la IP de origen en whitelist del puerto 1437.
