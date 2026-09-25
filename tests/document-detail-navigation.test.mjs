import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const baseUrl = process.env.PORTAL_TEST_URL || 'https://existenciasenlinea.com.gt';
const edgePath = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function openPortal(t, path, listPath, listItem) {
  const browser = await chromium.launch({ executablePath: edgePath, headless: true });
  t.after(() => browser.close());
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  await context.addInitScript(() => {
    try {
      localStorage.setItem('wms_token', 'navigation-test-token');
      localStorage.setItem('wms_user', JSON.stringify({
        username: 'navigation-test',
        permissions: ['ingresos.ver', 'salidas.ver'],
        propietario: { idPropietario: 1 },
      }));
      localStorage.setItem('wms_idPropietario', '1');
      localStorage.removeItem('ingresos_documentos');
      localStorage.removeItem('salidas_documentos');
    } catch { /* about:blank has no storage */ }
  });
  const page = await context.newPage();
  page.setDefaultTimeout(7000);
  const requestedDetails = [];
  await page.route('**/api/sync/**', async route => {
    const url = new URL(route.request().url());
    if (url.pathname === listPath) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([listItem]) });
      return;
    }
    requestedDetails.push(url.pathname);
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await page.goto(`${baseUrl}${path}`, { waitUntil: 'domcontentloaded' });
  return { page, requestedDetails };
}

test('clicking an ingreso opens its document and fetches the matching order', async t => {
  const { page, requestedDetails } = await openPortal(
    t, '/ingresos', '/api/sync/ingresos/documentos-ingreso/listar',
    { codigo: '19171', bodega: 'TEST', proveedor: 'TEST', estado: 'Pendiente', fecha: '2026-08-21' },
  );
  const detailRequest = page.waitForRequest('**/api/sync/ingresos/19171/detalle-oc');
  await page.locator('tbody tr').first().click();
  await page.waitForURL('**/detalle-ingreso/19171');
  assert.match(await page.getByRole('heading', { name: /Detalle del Documento: 19171/ }).textContent(), /Detalle del Documento: 19171/);
  await detailRequest;
  assert.ok(requestedDetails.includes('/api/sync/ingresos/19171/detalle-oc'));
});

test('clicking a salida uses the order ID and fetches its detail', async t => {
  const { page, requestedDetails } = await openPortal(
    t, '/salidas', '/api/sync/salidas/documentos-salida/listar',
    { correlativo: 49485, idDespachoEnc: 69675, bodega: 'TEST', cliente: 'TEST', estado: 'Despachado', fechaPedido: '2026-08-05' },
  );
  const detailRequest = page.waitForRequest('**/api/sync/salidas/49485/detalle-pe');
  await page.locator('tbody tr').first().click();
  await page.waitForURL('**/detalle-salida/49485');
  assert.match(await page.getByRole('heading', { name: /Detalle del Documento: 49485/ }).textContent(), /Detalle del Documento: 49485/);
  await detailRequest;
  assert.ok(requestedDetails.includes('/api/sync/salidas/49485/detalle-pe'));
});

test('the published ingreso detail API returns document lines', async () => {
  const id = process.env.PORTAL_INGRESO_TEST_ID || '229';
  const response = await fetch(`${baseUrl}/api/sync/ingresos/${id}/detalle-oc`);
  assert.equal(response.status, 200);
  const lines = await response.json();
  assert.ok(Array.isArray(lines) && lines.length > 0);
  assert.ok(lines.every(line => line.codigo_producto !== undefined && line.cantidad !== undefined));
});

test('the published ingreso page renders the actual document lines', async t => {
  const browser = await chromium.launch({ executablePath: edgePath, headless: true });
  t.after(() => browser.close());
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  await context.addInitScript(() => {
    try {
      localStorage.setItem('wms_token', 'navigation-test-token');
      localStorage.setItem('wms_user', JSON.stringify({
        username: 'navigation-test',
        permissions: ['ingresos.ver'],
        propietario: { idPropietario: 1 },
      }));
    } catch { /* about:blank has no storage */ }
  });
  const page = await context.newPage();
  const id = process.env.PORTAL_INGRESO_TEST_ID || '229';
  await page.goto(`${baseUrl}/detalle-ingreso/${id}`, { waitUntil: 'domcontentloaded' });
  await page.locator('tbody tr').first().waitFor({ timeout: 15000 });
  assert.match(await page.getByRole('heading', { name: `Detalle del Documento: ${id}` }).textContent(), new RegExp(id));
});
