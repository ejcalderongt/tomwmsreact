---
name: WMS API topology and known failures
description: Which external WMS API ports are live, where KPI endpoints actually live, the broken picking query, and how to reach the AWS SQL DB
---

# WMS external API (host 52.41.114.122)

- **Port 8097** (main WebAPI, `WMSWebAPI`, IIS/ASP.NET): healthy. Serves auth, stock, movimientos, sync ingresos/salidas, AND all `Kpi/*` endpoints plus `Bodegas/listar`. Swagger at `/swagger/v1/swagger.json` lists ~62 endpoints.
- **Port 8091** (dedicated KPI server): DOWN — returns `HTTP 500.30 - ASP.NET Core app failed to start` on every path. Treat as dead until DBA/infra revives it.

**Decision:** the Express proxy `/kpi` route targets **8097, not 8091**, because every KPI endpoint also exists on 8097.
**Why:** 8091 fails to start; 8097 is healthy and serves the same KPI surface.
**How to apply:** if KPI screens 502/500, confirm `/kpi` proxy target in `server.js` is 8097.

## Broken endpoint: Kpi/picking — real root cause
- `GET /api/Kpi/picking?from&to` times out (>90s) on BOTH ports for ANY range (1 day or 6 months) — because the response time is independent of the range.
- **The WebAPI's SQL has NO date predicate.** Captured the live query (`-- PICKING KPI` inline SELECT, ~18 joins, ORDER BY b.IdPickingEnc). Its only WHERE is `dañado_picking=0 AND no_encontrado=0 AND dañado_verificacion=0 AND m.estado<>'Anulado' AND m.ubicacion<>'TMP'`. The from/to URL params are NEVER applied in SQL — it returns the ENTIRE picking universe (~444,825 rows) every call and presumably filters client-side. Waits are ~100% CPU.
- **Implication:** DB indexing alone cannot fix the endpoint; the fix MUST introduce a date predicate. Either (a) fix the WebAPI C# (out of our control), or (b) bypass it for picking — have our Express proxy query SQL Server directly with a real `WHERE fecha_picking BETWEEN @from AND @to`.
- The view `VW_Productividad_Picking` mirrors this query but, WHEN filtered by date, runs in ~4–8s (after the index/stats fixes below). So a date-filtered query is the viable path.

## Secondary slowness factors (fixed/known)
- **Collation mismatch:** `cliente.codigo` = `SQL_Latin1_General_CP1_CI_AS` vs DB default `Modern_Spanish_CI_AS` (e.g. `trans_pe_enc.bodega_destino`). Both the view and the WebAPI hardcode `COLLATE Modern_Spanish_CI_AS` on the cliente join → non-sargable.
- **Unfiltered aggregate subquery `fo`** over all of `trans_picking_ubic` (no date filter) — full scan each call.
- **Stale statistics on the boundary (today's) date** caused a 22s bad plan for the current day specifically; `UPDATE STATISTICS ... WITH FULLSCAN` dropped it to ~4s.

## DB access — NOW REACHABLE
- AWS **SQL Server 2022**, server `52.41.114.122` **port 1437**, DB `TOMWMS_LA_CUMBRE_QA`. Reachable from Replit AFTER the user whitelisted Replit's outbound IP `35.253.109.164` for port 1437.
- Connect with the `mssql` npm pkg, options `{encrypt:false, trustServerCertificate:true, requestTimeout:180000}`. Pass creds via env vars (never hardcode/log them). To run ad-hoc SQL, write a temp `.mjs` in the WORKSPACE ROOT (not /tmp — mssql isn't resolvable there) and `rm` it after.
- `trans_picking_ubic` ≈ 448K rows. Backing DDL repo cloned reference: github.com/ejcalderongt/DBA.

## Indexes added by us (additive, reversible) on `trans_picking_ubic`
- `NCLI_picking_ubic_kpi_agg_2026` — (no_encontrado, dañado_picking, IdPickingEnc, IdOperadorBodega_Pickeo) INCLUDE (fecha_picking, ...) to serve the `fo` aggregate.
- `NCLI_picking_ubic_fecha_kpi_2026` — leads with fecha_picking for date-range seeks (only helps queries that actually filter by date).
