---
name: WMS API topology and known failures
description: Which external WMS API ports are live, where KPI endpoints actually live, and the known broken picking SP
---

# WMS external API (host 52.41.114.122)

- **Port 8097** (main WebAPI, `WMSWebAPI`, IIS/ASP.NET): healthy. Serves auth, stock, movimientos, sync ingresos/salidas, AND all `Kpi/*` endpoints plus `Bodegas/listar`. Swagger at `/swagger/v1/swagger.json` lists ~62 endpoints.
- **Port 8091** (dedicated KPI server): DOWN — returns `HTTP 500.30 - ASP.NET Core app failed to start` on every path including swagger. Treat as dead until DBA/infra revives it.

**Decision:** the Express proxy `/kpi` route targets **8097, not 8091**, because every KPI endpoint also exists on 8097.
**Why:** 8091 has been failing to start; 8097 is healthy and serves the same KPI surface, so routing there restores stock/bodegas/recepcion/despacho/verificacion/tendencias/heatmap immediately.
**How to apply:** if KPI screens 502/500, confirm `/kpi` proxy target in `server.js` is 8097; only switch back to 8091 once that server is confirmed healthy.

## Broken endpoint: Kpi/picking
- `GET /api/Kpi/picking?from&to` **times out (>55s, HTTP 000)** on BOTH 8097 and 8091, even for a single-day range. Every other KPI endpoint responds in <0.2s (stock/res ~0.6–3.5s).
- Root cause is server-side: a slow/broken stored procedure or missing index on the picking query in the AWS SQL Server DB. Not a data-volume issue (1 day still times out), not a proxy issue.
- This is the only WMS screen that needs a DBA fix (optimize/repair the picking SP). The app code cannot fix it.

## DB access boundary
- The WMS data lives in an **AWS SQL Server** behind the WebAPI on 52.41.114.122. There is NO direct connection string available in this repl and it is not reachable/whitelisted from Replit.
- Replit's `DATABASE_URL`/`PGDATABASE` secrets point to the repl's own internal PostgreSQL, which is unrelated to the WMS data. Do not confuse them.
- Therefore stored-procedure/schema work must go through the DBA's own SQL Server tooling, not from this environment.
