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

// Configure API base URL based on environment
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port;

  console.log('=== API BASE URL CONFIGURATION ===');
  console.log('Current hostname:', hostname);
  console.log('Current protocol:', protocol);
  console.log('Current port:', port);
  console.log('Current URL:', window.location.href);
  console.log('Navigator online:', navigator.onLine);

  // Check if we're in Replit production (deployed app)
  const isReplitProduction = hostname.includes('replit.app');
  const isReplitDev = hostname.includes('replit.dev') || hostname.includes('riker.replit.dev');
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || port === '5001';

  if (isReplitProduction) {
    // In production deployment, proxy might not be available
    // Try proxy first, fallback to direct API if needed
    console.log('Environment type: REPLIT PRODUCTION');
    console.log('✅ Using proxy: /api (production deployment)');
    return '/api';
  } else if (isReplitDev) {
    // Development environment - proxy should work
    console.log('Environment type: REPLIT DEV');
    console.log('✅ Using proxy: /api (development environment)');
    return '/api';
  } else if (isLocal) {
    // Local development
    console.log('Environment type: LOCAL DEV');
    console.log('✅ Using proxy: /api (local development)');
    return '/api';
  } else {
    // Other environments - fallback to direct API
    console.log('Environment type: OTHER');
    console.log('✅ Using direct API: http://52.41.114.122:8097/api');
    return 'http://52.41.114.122:8097/api';
  }
};

const apiRequest = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const isLoginRequest = endpoint.includes('/Auth/login-propietario');

  const config: RequestInit = {
    ...options,
    credentials: 'omit',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
  };

  // Para login, no agregar token
  if (!isLoginRequest) {
    const user = getUser();
    if (user.token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${user.token}`,
      };
    }
  }

  try {
    const baseUrl = getApiBaseUrl();
    const cleanEndpoint = endpoint.startsWith('/api') ? endpoint.substring(4) : endpoint;
    const fullUrl = `${baseUrl}${cleanEndpoint}`;

    console.log(`🌐 API Request: ${config.method || 'GET'} ${fullUrl}`);
    console.log('Request headers:', config.headers);

    const response = await fetch(fullUrl, config);

    console.log(`📡 API Response: ${response.status} ${response.statusText}`);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    // Handle authentication errors
    if (response.status === 401 || response.status === 403) {
      console.error('Authentication error, clearing session');
      clearAuthAndRedirect();
      throw new Error(`Authentication failed: ${response.status}`);
    }

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

      const errorMessage = `Request failed with status ${response.status}: ${response.statusText}${errorDetails}`;
      throw new Error(errorMessage);
    }

    // Check if response has content
    const contentLength = response.headers.get('content-length');
    const contentType = response.headers.get('content-type');
    
    console.log('Response content-type:', contentType);
    console.log('Response content-length:', contentLength);

    if (contentLength === '0') {
      return {};
    }

    if (!contentType || !contentType.includes('application/json')) {
      const responseText = await response.text();
      console.warn('Non-JSON response received:', responseText);
      throw new Error('Invalid response format - expected JSON');
    }

    const responseData = await response.json();
    console.log('✅ API Request successful');
    return responseData;
  } catch (error) {
    console.error('❌ API Request failed:', error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error - check internet connection');
    }
    throw error;
  }
};

// Auth API
export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<User> => {
    try {
      console.log('🔐 === STARTING LOGIN ATTEMPT ===');
      console.log('Username:', credentials.username);
      console.log('Environment URL:', window.location.href);
      console.log('Current time:', new Date().toISOString());

      const baseUrl = getApiBaseUrl();
      console.log('API Base URL will be:', baseUrl);
      console.log('Full login URL:', `${baseUrl}/Auth/login-propietario`);

      // Clear any existing auth data before login attempt
      localStorage.removeItem('wms_token');
      localStorage.removeItem('wms_user');
      localStorage.removeItem('wms_idPropietario');

      const requestBody = JSON.stringify(credentials);
      console.log('Request body:', requestBody);

      const data = await apiRequest(`/Auth/login-propietario`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: requestBody,
      });

      console.log('✅ === LOGIN SUCCESS ===');
      console.log('Login API Response received');
      console.log('Response type:', typeof data);
      console.log('Response keys:', data ? Object.keys(data) : 'No data');

      // Validate response structure
      if (!data) {
        throw new Error('Respuesta vacía del servidor');
      }

      const token = data.token || data.accessToken;
      if (!token) {
        console.error('No token found in response:', data);
        throw new Error('Token no recibido del servidor');
      }

      // Ensure we return the expected format with propietario data
      const user = {
        username: credentials.username,
        token: token,
        propietario: data.propietario
      };

      console.log('Token received:', token.substring(0, 20) + '...');
      console.log('Propietario data available:', !!data.propietario);

      // Store propietario info for later use
      if (data.propietario?.idPropietario) {
        localStorage.setItem('wms_idPropietario', data.propietario.idPropietario.toString());
        console.log('💾 Propietario ID stored:', data.propietario.idPropietario);
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

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('500')) {
          throw new Error('Error interno del servidor. Intente nuevamente.');
        } else if (error.message.includes('401') || error.message.includes('403')) {
          throw new Error('Usuario o contraseña incorrectos');
        } else if (error.message.includes('Network')) {
          throw new Error('Error de conexión. Verifique su conexión a internet.');
        }
        throw new Error(error.message);
      }
      
      throw new Error('Error desconocido durante el login');
    }
  },
};

// Ingresos API
export const ingresosAPI = {
  listarDocumentos: async (filtro: DocumentoIngresoFiltro, token: string) => {
    try {
      const data = await apiRequest(`/sync/ingresos/documentos-ingreso/listar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
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
      const data = await apiRequest(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

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
      const data = await apiRequest(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

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
      const data = await apiRequest(`/sync/salidas/documentos-salida/listar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
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
      const data = await apiRequest(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

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
      const data = await apiRequest(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

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
      const data = await apiRequest(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return data;
    } catch (error) {
      console.error('Póliza API Error:', error);
      throw new Error('Failed to fetch poliza');
    }
  }
};

// Stock API (Existencias)
export const existenciasAPI = {
  resumen: async (filtro: { idBodega?: number; idPropietario: number }, token: string) => {
    try {
      // Build query parameters for GET request
      const params = new URLSearchParams({
        IdBodega: (filtro.idBodega || 0).toString(),
        IdPropietario: filtro.idPropietario.toString()
      });

      const endpoint = `/Stock/resumen?${params.toString()}`;

      console.log('=== RESUMEN EXISTENCIAS API REQUEST DEBUG ===');
      console.log('Endpoint:', endpoint);
      console.log('Full URL will be:', `/api${endpoint}`);
      console.log('Query Parameters:');
      console.log('  - IdBodega:', filtro.idBodega || 0);
      console.log('  - IdPropietario:', filtro.idPropietario);
      console.log('Token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
      console.log('Query String:', params.toString());
      console.log('===============================================');

      const data = await apiRequest(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('=== RESUMEN EXISTENCIAS API RESPONSE DEBUG ===');
      console.log('Response received:', data);
      console.log('Response type:', typeof data);
      console.log('Is array:', Array.isArray(data));
      if (data) {
        console.log('Response keys:', Object.keys(data));
        if (data.resumenProducto && Array.isArray(data.resumenProducto)) {
          console.log('ResumenProducto count:', data.resumenProducto.length);
        }
      }
      console.log('===============================================');

      // Return the resumenProducto array from the response
      return data?.resumenProducto || [];
    } catch (error) {
      console.error('=== RESUMEN EXISTENCIAS API ERROR ===');
      console.error('Error details:', error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('====================================');
      throw new Error('Failed to fetch resumen data');
    }
  },

  listar: async (filtro: { idBodega?: number; idPropietario: number; pagina: number; tamanoPagina: number }, token: string) => {
    try {
      // Build query parameters for GET request using the correct API parameter names
      const params = new URLSearchParams({
        IdBodega: (filtro.idBodega || 0).toString(),
        IdPropietario: filtro.idPropietario.toString(),
        page: filtro.pagina.toString(),
        pageSize: filtro.tamanoPagina.toString()
      });

      const endpoint = `/Stock/listar?${params.toString()}`;

      console.log('=== EXISTENCIAS API REQUEST DEBUG ===');
      console.log('Endpoint:', endpoint);
      console.log('Full URL will be:', `/api${endpoint}`);
      console.log('Request Parameters:');
      console.log('  - IdBodega:', filtro.idBodega || 0);
      console.log('  - IdPropietario:', filtro.idPropietario);
      console.log('  - page:', filtro.pagina);
      console.log('  - pageSize:', filtro.tamanoPagina);
      console.log('Token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
      console.log('Query String:', params.toString());
      console.log('=====================================');

      const data = await apiRequest(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

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
        const response = {
          existencias: data.data,
          totalRegistros: data.total || data.data.length,
          totalPaginas: Math.ceil((data.total || data.data.length) / filtro.tamanoPagina),
          paginaActual: filtro.pagina
        };
        console.log('Mapped response:', response);
        return response;
      }

      // Handle the response format - wrap in expected structure if needed
      if (Array.isArray(data)) {
        const response = {
          existencias: data,
          totalRegistros: data.length,
          totalPaginas: Math.ceil(data.length / filtro.tamanoPagina),
          paginaActual: filtro.pagina
        };
        console.log('Wrapped array response:', response);
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
      const data = await apiRequest(`/Bodegas/listar`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

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
      console.log('Full URL will be:', `/api${endpoint}`);
      console.log('Query Parameters:');
      console.log('  - IdPropietario:', filtro.idPropietario);
      console.log('  - IdBodega:', filtro.idBodega || 'All');
      console.log('  - FechaInicio:', filtro.fechaInicio || 'No filter');
      console.log('  - FechaFin:', filtro.fechaFin || 'No filter');
      console.log('Token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
      console.log('Query String:', params.toString());
      console.log('====================================');

      // Create the request promise and cache it
      const requestPromise = apiRequest(endpoint, {
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
      const data = await apiRequest(`/Productos/sincronizar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
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
      const data = await apiRequest(`/Auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      const data = await apiRequest(`/Auth/validate-reset-token?token=${encodeURIComponent(token)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
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

      const data = await apiRequest(`/Auth/update-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

export { apiRequest };