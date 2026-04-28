import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Initialize OpenAI client with Replit AI Integrations
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});
// Use environment PORT or default to 5000 (configured in .replit)
const PORT = process.env.PORT || 5000;

// Add CORS middleware for all routes FIRST
app.use((req, res, next) => {
  // Allow all origins
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With');
  
  // Disable cache
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  next();
});

// API proxy middleware - Allows HTTP backend access from HTTPS frontend
const apiProxy = createProxyMiddleware({
  target: 'http://52.41.114.122:8097',
  changeOrigin: true,
  secure: false,
  ws: true,
  followRedirects: true,
  timeout: 30000,
  proxyTimeout: 30000,
  // Keep the /api prefix that the backend expects
  pathRewrite: (path, req) => {
    // Express strips the /api mount, so we add it back
    const newPath = `/api${path}`;
    console.log(`🔀 [${new Date().toISOString()}] Path rewrite: ${path} → ${newPath}`);
    return newPath;
  },
  onProxyReq: (proxyReq, req, res) => {
    // Remove headers that can cause CORS issues
    proxyReq.removeHeader('referer');
    proxyReq.removeHeader('origin');
    proxyReq.removeHeader('host');
    
    // Set explicit headers for the backend
    proxyReq.setHeader('Accept', 'application/json');
    
    console.log(`🟡 [${new Date().toISOString()}] Proxy Request: ${req.method} ${req.url} → ${proxyReq.path}`);
    console.log(`   Headers:`, JSON.stringify(req.headers, null, 2));
  },
  onProxyRes: (proxyRes, req, res) => {
    const statusColor = proxyRes.statusCode >= 400 ? '🔴' : '🟢';
    console.log(`${statusColor} [${new Date().toISOString()}] Proxy Response: ${proxyRes.statusCode} for ${req.url}`);
    console.log(`   Response Headers:`, JSON.stringify(proxyRes.headers, null, 2));

    // CRITICAL: Remove WWW-Authenticate header to prevent browser's native auth dialog
    // This header from IIS causes the browser to show its native credentials popup on 401 errors
    delete proxyRes.headers['www-authenticate'];
    delete proxyRes.headers['WWW-Authenticate'];

    // Force CORS headers on response
    proxyRes.headers['access-control-allow-origin'] = '*';
    proxyRes.headers['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    proxyRes.headers['access-control-allow-headers'] = 'Content-Type, Authorization, Accept';
  },
  onError: (err, req, res) => {
    console.error(`🔴 [${new Date().toISOString()}] Proxy Error:`, err.message);
    console.error(`   Stack:`, err.stack);
    console.error(`   Request URL:`, req.url);
    console.error(`   Request Method:`, req.method);

    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json');
      res.status(502).json({ 
        error: 'Backend proxy error', 
        message: err.message,
        details: 'Cannot connect to backend server',
        url: req.url,
        timestamp: new Date().toISOString()
      });
    }
  }
});

// KPI API proxy middleware - For KPI endpoints on port 8091
const kpiApiProxy = createProxyMiddleware({
  target: 'http://52.41.114.122:8091',
  changeOrigin: true,
  secure: false,
  ws: true,
  followRedirects: true,
  timeout: 60000,
  proxyTimeout: 60000,
  pathRewrite: (path, req) => {
    const newPath = `/api${path}`;
    console.log(`🔀 [${new Date().toISOString()}] KPI Path rewrite: ${path} → ${newPath}`);
    return newPath;
  },
  onProxyReq: (proxyReq, req, res) => {
    proxyReq.removeHeader('referer');
    proxyReq.removeHeader('origin');
    proxyReq.removeHeader('host');
    proxyReq.setHeader('Accept', 'application/json');
    console.log(`🟣 [${new Date().toISOString()}] KPI Proxy Request: ${req.method} ${req.url} → ${proxyReq.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    const statusColor = proxyRes.statusCode >= 400 ? '🔴' : '🟢';
    console.log(`${statusColor} [${new Date().toISOString()}] KPI Proxy Response: ${proxyRes.statusCode} for ${req.url}`);
    delete proxyRes.headers['www-authenticate'];
    delete proxyRes.headers['WWW-Authenticate'];
    proxyRes.headers['access-control-allow-origin'] = '*';
    proxyRes.headers['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    proxyRes.headers['access-control-allow-headers'] = 'Content-Type, Authorization, Accept';
  },
  onError: (err, req, res) => {
    console.error(`🔴 [${new Date().toISOString()}] KPI Proxy Error:`, err.message);
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json');
      res.status(502).json({ 
        error: 'KPI Backend proxy error', 
        message: err.message,
        details: 'Cannot connect to KPI backend server',
        url: req.url,
        timestamp: new Date().toISOString()
      });
    }
  }
});

// Agent Info endpoint - Exposes structured context for external AI agents
app.get('/agent-info', (req, res) => {
  const BASE_URL = `${req.protocol}://${req.get('host')}`;

  res.json({
    sistema: {
      nombre: "TOM WMS",
      version: "1.0.0",
      descripcion: "Sistema de Gestión de Almacén (Warehouse Management System) para control de inventario en tiempo real, análisis avanzado de stock y operaciones de bodega.",
      idioma: "Español",
      estado: "Producción activa",
      url_base: BASE_URL
    },

    asistente_ia: {
      nombre: "Kairos EC",
      descripcion: "Asistente conversacional especializado en inventario y operaciones de almacén. Conectado a datos reales del sistema vía contexto inyectado en cada consulta.",
      modelo: "gpt-4o",
      endpoint: `${BASE_URL}/ai/chat`,
      metodo: "POST",
      formato_request: {
        message: "string — Pregunta o instrucción del usuario",
        inventoryContext: "string (opcional) — Datos de inventario actuales para contextualizar la respuesta",
        knowledgeBase: "string (opcional) — Base de conocimiento personalizada del negocio"
      },
      formato_response: "Server-Sent Events (SSE). Cada evento: data: {content: string}. Fin: data: {done: true}",
      ejemplo_uso: {
        message: "¿Cuáles son los productos con stock más bajo?",
        inventoryContext: "Producto: LECHE ENTERA, Stock: 5 unidades, Ubicación: PICKING...",
        knowledgeBase: "Esta bodega maneja productos perecederos..."
      }
    },

    modulos: [
      {
        nombre: "Inventario en Línea",
        ruta: "/inventario",
        descripcion: "Consulta de stock en tiempo real por ubicación, producto y bodega",
        datos_disponibles: ["stock_actual", "ubicacion", "lote", "fecha_vence", "codigo_producto"]
      },
      {
        nombre: "Existencias",
        ruta: "/existencias",
        descripcion: "Resumen consolidado de existencias con exportación Excel",
        datos_disponibles: ["cantidad_disponible", "unidad_base", "bodega", "agrupaciones"]
      },
      {
        nombre: "Movimientos",
        ruta: "/movimientos",
        descripcion: "Historial de ingresos, salidas y traspasos de mercadería",
        datos_disponibles: ["tipo_movimiento", "fecha", "documento", "usuario", "cantidad"]
      },
      {
        nombre: "Dashboard Ejecutivo",
        ruta: "/dashboard",
        descripcion: "KPIs ejecutivos: valor de inventario, rotación, alertas críticas",
        datos_disponibles: ["valor_total", "productos_criticos", "rotacion", "kpis_resumen"]
      },
      {
        nombre: "Análisis de Vencimientos",
        ruta: "/analisis/vencimientos",
        descripcion: "Productos próximos a vencer y ya vencidos con semáforo de urgencia",
        datos_disponibles: ["dias_para_vencer", "estado_semaforo", "valor_en_riesgo"]
      },
      {
        nombre: "Análisis de Antigüedad",
        ruta: "/analisis/antiguedad",
        descripcion: "Clasificación de stock por tiempo de permanencia en bodega",
        datos_disponibles: ["dias_en_bodega", "rango_antiguedad", "valor_antiguo"]
      },
      {
        nombre: "Análisis por Bodega",
        ruta: "/analisis/bodega",
        descripcion: "Distribución del inventario por ubicación física",
        datos_disponibles: ["nombre_bodega", "porcentaje_ocupacion", "valor_por_bodega"]
      },
      {
        nombre: "Análisis de Merma",
        ruta: "/analisis/merma",
        descripcion: "Productos con pérdidas, daños o merma registrada",
        datos_disponibles: ["tipo_merma", "valor_perdido", "tendencia"]
      },
      {
        nombre: "Análisis ABC",
        ruta: "/analisis/abc",
        descripcion: "Clasificación de productos por rotación: A (alta), B (media), C (baja)",
        datos_disponibles: ["clasificacion_abc", "frecuencia_movimiento", "valor_relativo"]
      },
      {
        nombre: "Productividad Operadores",
        ruta: "/productividad",
        descripcion: "Rendimiento del personal de bodega por operación y turno",
        datos_disponibles: ["operador", "picking_por_hora", "documentos_procesados"]
      },
      {
        nombre: "Análisis de Ciclo",
        ruta: "/ciclo",
        descripcion: "KPIs de picking: velocidad, documentos pendientes, tiempos promedio",
        datos_disponibles: ["documentos_abiertos", "tiempo_promedio_ciclo", "cliente"]
      },
      {
        nombre: "Automatizaciones",
        ruta: "/automatizaciones",
        descripcion: "Motor de reglas configurable: alertas automáticas por stock bajo, vencimientos, merma alta",
        datos_disponibles: ["reglas_activas", "alertas_generadas", "historial_ejecuciones"]
      }
    ],

    api_endpoints: {
      descripcion: "Los siguientes endpoints proxy están disponibles para consultar datos en tiempo real",
      inventario: {
        stock: { url: `${BASE_URL}/kpi/stock`, metodo: "GET", descripcion: "Lista completa de stock con ubicación, lotes y vencimientos" },
        bodegas: { url: `${BASE_URL}/kpi/bodegas`, metodo: "GET", descripcion: "Catálogo de bodegas y ubicaciones del almacén" },
        existencias: { url: `${BASE_URL}/api/existencias/listar`, metodo: "POST", descripcion: "Consulta de existencias actuales", autenticacion: "Bearer token requerido" },
        movimientos: { url: `${BASE_URL}/api/movimientos/listar`, metodo: "POST", descripcion: "Historial de movimientos", autenticacion: "Bearer token requerido" },
        picking: { url: `${BASE_URL}/kpi/picking`, metodo: "GET", descripcion: "Documentos de picking activos con datos de cliente" }
      }
    },

    integraciones: {
      openai: { estado: "activo", modelo: "gpt-4o", uso: "Asistente Kairos EC" },
      backend_principal: { host: "52.41.114.122", puerto: 8097, protocolo: "HTTP", estado: "proxy_activo" },
      backend_kpi: { host: "52.41.114.122", puerto: 8091, protocolo: "HTTP", estado: "proxy_activo" }
    },

    capacidades_kairos: [
      "Consultar stock de productos específicos por nombre o código",
      "Identificar productos próximos a vencer o ya vencidos",
      "Analizar niveles de stock bajo y hacer recomendaciones",
      "Revisar movimientos recientes de un producto",
      "Comparar rendimiento entre bodegas",
      "Resumir KPIs ejecutivos del inventario",
      "Detectar anomalías en merma o rotación",
      "Responder preguntas sobre operaciones de almacén"
    ],

    instrucciones_para_agente: {
      como_consultar_kairos: "Haz POST a /ai/chat con {message, inventoryContext}. Usa SSE para leer la respuesta en streaming.",
      como_obtener_contexto: "Primero llama a /kpi/stock para obtener inventario actual, luego pásalo como string en inventoryContext al llamar /ai/chat.",
      autenticacion_requerida: "Los endpoints /api/* requieren header Authorization: Bearer <token>. Los endpoints /kpi/* y /ai/chat son abiertos.",
      formato_inventoryContext: "Texto plano con datos de productos, uno por línea. Ejemplo: 'Producto: X, Stock: 100, Ubicación: PICKING, Vence: 2025-06-01'"
    },

    generado_en: new Date().toISOString()
  });
});

// Parse JSON for AI chat endpoint (must be before proxy)
app.use('/ai', express.json());

// AI Chat endpoint for inventory assistant
app.post('/ai/chat', async (req, res) => {
  try {
    const { message, inventoryContext, knowledgeBase } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const systemPrompt = `Eres Kairos EC, un asistente inteligente experto en gestión de almacén (WMS).
Tu personalidad es profesional pero amigable, enfocado en soluciones prácticas.
Responde siempre en español, de forma clara y concisa.
Si te proporcionan datos de inventario, úsalos para responder con precisión.
Si detectas problemas (vencimientos, stock bajo), sugiere acciones.
Si no tienes información suficiente, indícalo amablemente.

${knowledgeBase ? `BASE DE CONOCIMIENTO:\n${knowledgeBase}\n` : ''}

CONTEXTO DEL INVENTARIO:
${inventoryContext || 'No hay datos de inventario disponibles actualmente.'}

Formato de respuesta:
- NO uses asteriscos (**) ni markdown para formatear
- Para mostrar datos de productos o inventario, usa formato de tabla o lista simple con guiones
- Para códigos o valores importantes, preséntalos claramente sin formato markdown
- Ejemplo de cómo mostrar un producto:
  Producto: CHILE JALAPENO 48/5.8 oz. SEMIPICANTE
  Código: 00025004
  Stock: 7,680 unidades
  Ubicación: RECEPCIÓN
- Sé conciso pero informativo
- Ofrece sugerencias prácticas cuando sea apropiado`;

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      stream: true,
      max_tokens: 1024,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error('AI Chat Error:', error);
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: 'Error al procesar la solicitud' })}\n\n`);
      res.end();
    } else {
      res.status(500).json({ error: 'Failed to process chat request' });
    }
  }
});

// Apply KPI proxy middleware for /kpi routes
app.use('/kpi', kpiApiProxy);

// Apply proxy middleware FIRST
app.use('/api', apiProxy);

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle client-side routing - serve index.html for all other routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Production server running on http://0.0.0.0:${PORT}`);
  console.log(`📁 Serving static files from: ${path.join(__dirname, 'dist')}`);
  console.log(`🔄 API proxy configured for: http://52.41.114.122:8097`);
});