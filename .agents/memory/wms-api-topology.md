---
name: WMS API topology and known failures
description: Puertos activos, configuración del proxy /kpi, fix picking aplicado, y endpoints pendientes en 8091
---

# WMS external API (host 52.41.114.122)

- **Port 8097** (main WebAPI, WMSWebAPI, IIS/ASP.NET): activo. Sirve auth, stock, movimientos, sync. NO tiene el fix del filtro de fecha en picking.
- **Port 8091** (servidor KPI dedicado, ASP.NET Core): **ACTIVO con fix picking**. Antes estaba caído (500.30). Codex aplicó la corrección del filtro de fecha (`WHERE a.fecha_picking >= @from AND < DATEADD(day,1,@to)`) y republicó en 8091.

## Configuración del proxy en server.js

- Ruta `/kpi/*` → **8091** (target: `http://52.41.114.122:8091`)
- pathRewrite: `(path) => '/api/Kpi' + path`  ← CRÍTICO: 8091 requiere el segmento `/Kpi/` en la ruta
- Ruta `/api/*` → **8097** (target: `http://52.41.114.122:8097`)

**Por qué pathRewrite necesita `/api/Kpi`:** Express monta el proxy en `/kpi` y entrega el path sin ese prefijo (ej: `/picking`). El pathRewrite debe reconstruir `/api/Kpi/picking` para que coincida con las rutas del servidor ASP.NET Core en 8091. Sin el segmento `Kpi`, el servidor devuelve 404.

## Estado actual de endpoints KPI en 8091

| Endpoint | Estado | Tiempo |
|---|---|---|
| picking | ✅ HTTP 200 | ~2.6s (mes) / ~0.3s (día) |
| recepcion | ✅ HTTP 200 | ~0.1s |
| despacho | ✅ HTTP 200 | ~0.1s |
| verificacion | ✅ HTTP 200 | ~0.1s |
| stock | ❌ 404 — pendiente backend |
| bodegas | ❌ 404 — pendiente backend |
| tendencias | ❌ 404 — pendiente backend |
| heatmap | ❌ 404 — pendiente backend |

Los 4 endpoints con 404 necesitan ser implementados en el servidor 8091 por el equipo backend/Codex.

## Fix picking — causa raíz y solución

- **Causa raíz:** la consulta SQL del WebAPI no tenía predicado de fecha. Traía todas las ~444K filas en cada llamada → siempre timeout >90s.
- **Fix aplicado (Codex en C#):** agregó `AND (@from IS NULL OR a.fecha_picking >= @from) AND (@to IS NULL OR a.fecha_picking < DATEADD(day,1,@to))` en el WHERE.
- **Fix BD (ya aplicado):** dos índices en `trans_picking_ubic` + UPDATE STATISTICS WITH FULLSCAN. Esos índices ya están en la BD QA.

## DB access

- SQL Server 2022, `52.41.114.122` puerto 1437, BD `TOMWMS_LA_CUMBRE_QA`.
- Reachable desde Replit tras whitelist de IP. Conectar con `mssql` npm, opciones `{encrypt:false, trustServerCertificate:true}`.
- Índices ya aplicados: `NCLI_picking_ubic_kpi_agg_2026`, `NCLI_picking_ubic_fecha_kpi_2026`.
