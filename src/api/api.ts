import { getUser } from "@/utils/auth";

export interface DocumentoIngresoFiltro {
  fechaInicio: string;
  fechaFin: string;
  idBodega: number;
  idPropietario: number;
}

export interface User {
  username: string;
  token: string;
  propietario?: any;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

// Request deduplication cache
const requestCache = new Map<string, Promise<any>>();
let isRedirecting = false;

const clearAuthAndRedirect = () => {
  if (isRedirecting) return;
  isRedirecting = true;

  // Clear localStorage
  if (typeof window !== 'undefined') {
    localStorage.removeItem('wms_token');
    localStorage.removeItem('wms_user');
    localStorage.removeItem('wms_idPropietario');
  }

  // Clear request cache
  requestCache.clear();

  // Only redirect if not already on login page
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.href = '/login';
  }

  // Reset redirecting flag after timeout
  setTimeout(() => {
    isRedirecting = false;
  }, 2000);
};

// Configuración simple de API
const API_BASE = '/api';

// Helper function to get the API base URL.
// This is crucial for distinguishing between local development and Replit deployment.
const getApiBaseUrl = (): string => {
  // In a Replit environment, the API calls should go through the '/api' proxy.
  // In local development, you might want to point directly to a local backend.
  // For this fix, we are assuming '/api' is the correct proxy for Replit.
  return API_BASE;
};

// Función simple para hacer requests
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE}${endpoint}`;

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
  };

  console.log(`🌐 API Call: ${config.method || 'GET'} ${url}`);

  const response = await fetch(url, config);

  console.log(`📡 Response: ${response.status}`);

  if (!response.ok) {
    // Try to get error details from response
    let errorDetails = '';
    try {
      const errorText = await response.text();
      errorDetails = errorText ? ` - ${errorText}` : '';
      console.error('Error response body:', errorText);
    } catch (e) {
      console.error('Could not read error response body');
    }

    const errorMessage = `API Error: ${response.status} ${response.statusText}${errorDetails}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  // Handle authentication errors
  if (response.status === 401 || response.status === 403) {
    console.error('Authentication error, clearing session');
    clearAuthAndRedirect();
    throw new Error(`Authentication failed: ${response.status}`);
  }

  // Check if response has content before parsing as JSON
  const contentLength = response.headers.get('content-length');
  if (contentLength === '0') {
    return {};
  }

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const responseText = await response.text();
    console.warn('Non-JSON response received:', responseText);
    throw new Error('Invalid response format - expected JSON');
  }

  return response.json();
};

// API de autenticación simplificada
export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<User> => {
    console.log('🔐 Login attempt for:', credentials.username);

    try {
      // Use the working login endpoint with proper proxy path
      const endpoint = '/Auth/login-propietario';
      const baseUrl = getApiBaseUrl();
      const cleanEndpoint = endpoint.startsWith('/api') ? endpoint.substring(4) : endpoint;
      const fullUrl = `${baseUrl}${cleanEndpoint}`;

      // Debug the URL construction for login
      if (endpoint.includes('login')) {
        console.log('🔍 LOGIN URL DEBUG:');
        console.log('  - Original endpoint:', endpoint);
        console.log('  - Base URL:', baseUrl);
        console.log('  - Clean endpoint:', cleanEndpoint);
        console.log('  - Final URL:', fullUrl);
        console.log('  - Should be using proxy:', baseUrl === '/api');
      }

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      console.log(`📡 Response: ${response.status}`);

      if (!response.ok) {
        let errorDetails = '';
        try {
          const errorText = await response.text();
          errorDetails = errorText ? ` - ${errorText}` : '';
          console.error('Error response body:', errorText);
        } catch (e) {
          console.error('Could not read error response body');
        }
        const errorMessage = `API Error: ${response.status} ${response.statusText}${errorDetails}`;
        console.error(errorMessage);
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log('✅ Login successful:', responseData);

      if (!responseData.token) {
        console.error('❌ No token received from server:', responseData);
        throw new Error('Token no recibido del servidor');
      }

      const user: User = {
        username: credentials.username,
        token: responseData.token,
        propietario: responseData.propietario
      };

      // Guardar ID del propietario si está disponible
      if (responseData.propietario?.idPropietario) {
        localStorage.setItem('wms_idPropietario', responseData.propietario.idPropietario.toString());
        console.log('💾 Propietario ID stored:', responseData.propietario.idPropietario);
      } else {
        console.log('No propietario data found or idPropietario missing.');
      }

      console.log('=== LOGIN PROCESS COMPLETED SUCCESSFULLY ===');
      return user;
    } catch (error) {
      console.error('❌ === LOGIN FAILED ===');
      console.error('Error type:', typeof error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Full error object:', error);

      // Clear any partial auth data on failure
      localStorage.removeItem('wms_token');
      localStorage.removeItem('wms_user');
      localStorage.removeItem('wms_idPropietario');

      // Provide more specific error messages based on common issues
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes('401') || errorMessage.includes('403')) {
          throw new Error('Credenciales incorrectas. Verifique usuario y contraseña.');
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          throw new Error('Error de conexión. No se puede conectar al servidor API.');
        } else if (errorMessage.includes('404')) {
          throw new Error('Servicio de autenticación no disponible.');
        } else if (errorMessage.includes('500')) {
          throw new Error('Error interno del servidor. Verifique que la API esté funcionando correctamente.');
        }
        throw new Error(`Error de login: ${error.message}`);
      }

      throw new Error('Error desconocido durante el login');
    }
  }
};

// Función para requests autenticados
const authenticatedCall = async (endpoint: string, token: string, options: RequestInit = {}) => {
  return apiCall(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });
};

// Ingresos API
export const ingresosAPI = {
  listarDocumentos: async (filtro: DocumentoIngresoFiltro, token: string) => {
    try {
      const data = await authenticatedCall(`/sync/ingresos/documentos-ingreso/listar`, token, {
        method: 'POST',
        body: JSON.stringify(filtro),
      });
      return data;
    } catch (error) {
      console.error('Ingresos API Error:', error);
      throw new Error('Failed to fetch documents');
    }
  },

  obtenerDetalle: async (idOrdenCompraEnc: number, token: string) => {
    try {
      const url = `/sync/ingresos/${idOrdenCompraEnc}/detalle-oc`;
      console.log('URL detalle OC:', url);
      const data = await authenticatedCall(url, token);
      return data;
    } catch (error) {
      console.error('Detalle API Error:', error);
      throw new Error('Failed to fetch detail');
    }
  },

  obtenerRecepciones: async (idOrdenCompraEnc: number, token: string) => {
    try {
      const url = `/sync/ingresos/${idOrdenCompraEnc}/recepciones`;
      console.log('URL recepciones:', url);
      const data = await authenticatedCall(url, token);
      return data;
    } catch (error) {
      console.error('Recepciones API Error:', error);
      throw new Error('Failed to fetch receptions');
    }
  }
};

// Salidas API
export const salidasAPI = {
  listarDocumentos: async (filtro: DocumentoIngresoFiltro, token: string) => {
    try {
      const data = await authenticatedCall(`/sync/salidas/documentos-salida/listar`, token, {
        method: 'POST',
        body: JSON.stringify(filtro),
      });
      return data;
    } catch (error) {
      console.error('Salidas API Error:', error);
      throw new Error('Failed to fetch salidas documents');
    }
  },

  obtenerDetallePE: async (idPedidoEnc: number, token: string) => {
    try {
      const url = `/sync/salidas/${idPedidoEnc}/detalle-pe`;
      console.log('URL detalle PE:', url);
      const data = await authenticatedCall(url, token);
      return data;
    } catch (error) {
      console.error('Detalle PE API Error:', error);
      throw new Error('Failed to fetch detalle PE');
    }
  },

  obtenerDespachos: async (idOrdenSalidaEnc: number, token: string) => {
    try {
      const url = `/sync/salidas/${idOrdenSalidaEnc}/despachos`;
      console.log('URL despachos:', url);
      const data = await authenticatedCall(url, token);
      return data;
    } catch (error) {
      console.error('Despachos API Error:', error);
      throw new Error('Failed to fetch despachos');
    }
  }
};

// Pólizas API
export const polizasAPI = {
  obtenerPoliza: async (idOrdenCompraEnc: number, token: string) => {
    try {
      const url = `/sync/ingresos/${idOrdenCompraEnc}/poliza`;
      console.log('URL póliza:', url);
      const data = await authenticatedCall(url, token);
      return data;
    } catch (error) {
      console.error('Póliza API Error:', error);
      throw new Error('Failed to fetch poliza');
    }
  }
};

// Stock API (Existencias)
export const existenciasAPI = {
  listar: async (filtro: { idBodega?: number; idPropietario: number; pagina: number; tamanoPagina: number }, token: string) => {
    const params = new URLSearchParams({
      IdBodega: (filtro.idBodega || 0).toString(),
      IdPropietario: filtro.idPropietario.toString(),
      page: filtro.pagina.toString(),
      pageSize: filtro.tamanoPagina.toString()
    });

    console.log('=== EXISTENCIAS API REQUEST DEBUG ===');
    console.log('Query Parameters:');
    console.log('  - IdBodega:', filtro.idBodega || 0);
    console.log('  - IdPropietario:', filtro.idPropietario);
    console.log('  - page:', filtro.pagina);
    console.log('  - pageSize:', filtro.tamanoPagina);
    console.log('=====================================');

    try {
      const data = await authenticatedCall(`/Stock/listar?${params.toString()}`, token);

      console.log('=== EXISTENCIAS API RESPONSE DEBUG ===');
      console.log('Response received:', data);
      console.log('Response type:', typeof data);
      console.log('Is array:', Array.isArray(data));
      if (data) {
        console.log('Response keys:', Object.keys(data));
        if (data.data) {
          console.log('Data count:', data.data.length);
        }
      }
      console.log('======================================');

      // Map the API response to expected format
      if (data && data.data) {
        const mappedData = data.data.map((item: Record<string, unknown>) => ({
          ...item,
          licencia: item.lic_plate || ''
        }));
        const response = {
          existencias: mappedData,
          totalRegistros: data.total || data.data.length,
          totalPaginas: Math.ceil((data.total || data.data.length) / filtro.tamanoPagina),
          paginaActual: filtro.pagina
        };
        console.log('Mapped response:', response);
        return response;
      }

      // If no data found, return empty response
      return {
        existencias: [],
        totalRegistros: 0,
        totalPaginas: 1,
        paginaActual: filtro.pagina
      };
    } catch (error) {
      console.error('=== EXISTENCIAS API ERROR ===');
      console.error('Error details:', error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('============================');
      throw new Error('Failed to fetch stock data');
    }
  }
};

// Bodegas API
export const bodegasAPI = {
  listar: async (token: string) => {
    try {
      console.log('=== BODEGAS API REQUEST DEBUG ===');
      console.log('Endpoint: /Bodegas/listar');
      console.log('=================================');
      const data = await authenticatedCall('/Bodegas/listar', token);
      console.log('=== BODEGAS API RESPONSE DEBUG ===');
      console.log('Response received:', data);
      console.log('==================================');
      return data;
    } catch (error) {
      console.error('Bodegas API Error:', error);
      throw new Error('Failed to fetch bodegas');
    }
  }
};

// Movimientos API
export const movimientosAPI = {
  listar: async (filtro: { idBodega?: number; idPropietario: number; fechaInicio?: string; fechaFin?: string }, token: string) => {
    try {
      // Build query parameters for GET request
      const params = new URLSearchParams({
        IdPropietario: filtro.idPropietario.toString()
      });

      if (filtro.idBodega && filtro.idBodega > 0) {
        params.append('IdBodega', filtro.idBodega.toString());
      }

      if (filtro.fechaInicio) {
        params.append('FechaInicio', filtro.fechaInicio);
      }

      if (filtro.fechaFin) {
        params.append('FechaFin', filtro.fechaFin);
      }

      const endpoint = `/Movimientos/listar?${params.toString()}`;

      // Create cache key for this request
      const cacheKey = `movimientos_${endpoint}_${token.substring(0, 20)}`;

      // Check if request is already in progress
      if (requestCache.has(cacheKey)) {
        console.log('Movimientos request already in progress, waiting for result...');
        try {
          return await requestCache.get(cacheKey);
        } catch (cacheError) {
          console.log('Cache request failed, removing from cache and retrying:', cacheError);
          requestCache.delete(cacheKey);
        }
      }

      console.log('=== MOVIMIENTOS API REQUEST DEBUG ===');
      console.log('Endpoint:', endpoint);
      console.log('Full URL will be:', `${API_BASE}${endpoint}`);
      console.log('Query Parameters:');
      console.log('  - IdPropietario:', filtro.idPropietario);
      console.log('  - IdBodega:', filtro.idBodega || 'All');
      console.log('  - FechaInicio:', filtro.fechaInicio || 'No filter');
      console.log('  - FechaFin:', filtro.fechaFin || 'No filter');
      console.log('Token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
      console.log('Query String:', params.toString());
      console.log('====================================');

      // Create the request promise and cache it
      const requestPromise = apiCall(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      requestCache.set(cacheKey, requestPromise);

      const data = await requestPromise;

      // Clear from cache after completion
      requestCache.delete(cacheKey);

      console.log('=== MOVIMIENTOS API RESPONSE DEBUG ===');
      console.log('Response received:', data);
      console.log('Response type:', typeof data);
      console.log('Is array:', Array.isArray(data));
      if (data) {
        console.log('Response keys:', Object.keys(data));
        if (Array.isArray(data)) {
          console.log('Movimientos count:', data.length);
        }
      }
      console.log('=====================================');

      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('=== MOVIMIENTOS API ERROR ===');
      console.error('Error details:', error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('============================');
      throw new Error('Failed to fetch movimientos data');
    }
  }
};

// Productos API
export const productosAPI = {
  sincronizar: async (productos: any[], token: string) => {
    try {
      const data = await authenticatedCall(`/Productos/sincronizar`, token, {
        method: 'POST',
        body: JSON.stringify(productos),
      });

      return data;
    } catch (error) {
      console.error('Productos API Error:', error);
      throw new Error('Failed to sync products');
    }
  }
};

// Password API
export const passwordAPI = {
  resetPassword: async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('Attempting password reset for email:', email);
      const data = await apiCall(`/Auth/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      console.log('Password Reset API Response:', data);

      return {
        success: true,
        message: data.message || 'Enlace de restablecimiento enviado exitosamente'
      };
    } catch (error) {
      console.error('Password Reset API Error:', error);
      throw new Error(error instanceof Error ? error.message : 'Error al enviar el enlace de restablecimiento');
    }
  },

  validateResetToken: async (token: string): Promise<{ isValid: boolean; message?: string }> => {
    try {
      console.log('Validating reset token:', token);
      const data = await apiCall(`/Auth/validate-reset-token?token=${encodeURIComponent(token)}`, {
        method: 'GET',
      });

      console.log('Token validation response:', data);

      return {
        isValid: data.isValid !== false, // Assume valid unless explicitly false
        message: data.message
      };
    } catch (error) {
      console.error('Token validation error:', error);
      return {
        isValid: false,
        message: error instanceof Error ? error.message : 'Token inválido o expirado'
      };
    }
  },

  updatePassword: async (token: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('Updating password with token:', token);
      const dto = {
        Token: token,
        NewPassword: newPassword
      };

      const data = await apiCall(`/Auth/update-password`, {
        method: 'POST',
        body: JSON.stringify(dto),
      });

      console.log('Update password response:', data);

      return {
        success: true,
        message: data.message || 'Contraseña actualizada exitosamente'
      };
    } catch (error) {
      console.error('Update password error:', error);
      throw new Error(error instanceof Error ? error.message : 'Error al actualizar la contraseña');
    }
  }
};

// KPI API - Uses different base URL (port 8091)
const KPI_BASE = '/kpi';

export interface KpiPickingItem {
  fecha_Hora_Inicio: string;
  fecha_Hora_Fin: string;
  fecha_Por_Línea: string;
  tipo_Documento_Pedido: string;
  tipo: string;
  código_Departamento: string;
  descripción_Departamento: string;
  código_Categoría: string;
  descripción_Categoría: string;
  código_Producto: string;
  nombre_Producto: string;
  cantidad_Solicitada: number;
  cantidad_Recibida: number;
  nombre_Estado_Producto: string;
  cantidad_Devolución_Picking: number;
  nombre_Presentación_MPQ: string;
  cantidad_Pickeadas_Cajas: number;
  id_Recepción: number;
  número_Picking: number;
  fecha_Vence: string;
  lic_Plate: string;
  código_Operador: string;
  descripción_Operador: string;
  código_Comprador: string;
  descripción_Comprador: string;
  solicitud_SAP: string;
}

export interface KpiVerificacionItem {
  fecha_Hora_Inicio: string;
  fecha_Hora_Fin: string;
  fecha_Por_Línea: string;
  tipo_Documento_Pedido: string;
  tipo: string;
  código_Departamento: string;
  descripción_Departamento: string;
  código_Categoría: string;
  descripción_Categoría: string;
  código_Producto: string;
  nombre_Producto: string;
  cantidad_Verificada: number;
  cantidad_Solicita_Ver: number;
  nombre_Producto_Estado: string;
  cantidad_Merma_Ver: number;
  nombre_Presentación_MPQ: string;
  cantidad_Verificada_Cajas: number;
  id_Picking: number;
  fecha_Vence: string;
  lic_Plate: string;
  código_Operador: string;
  descripción_Operador: string;
  código_Comprador: string;
  nombre_Comprador: string;
  solicitud_SAP: string;
}

export const kpiAPI = {
  async getPicking(from: string, to: string): Promise<KpiPickingItem[]> {
    const url = `${KPI_BASE}/Kpi/picking?from=${from}&to=${to}`;
    
    console.log(`🌐 KPI API Call: GET ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    console.log(`📡 KPI Response: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`KPI API Error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`📊 KPI Data received: ${Array.isArray(data) ? data.length : 0} records`);
    return data;
  },

  async getVerificacion(from: string, to: string): Promise<KpiVerificacionItem[]> {
    const url = `${KPI_BASE}/Kpi/verificacion?from=${from}&to=${to}`;
    
    console.log(`🌐 KPI API Call: GET ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    console.log(`📡 KPI Response: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`KPI API Error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`📊 KPI Verificacion Data received: ${Array.isArray(data) ? data.length : 0} records`);
    return data;
  }
};

export { apiCall as apiRequest };