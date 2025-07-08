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
  
  console.log('Authentication failed, clearing session and redirecting to login');
  
  // Clear localStorage
  if (typeof window !== 'undefined') {
    localStorage.removeItem('wms_token');
    localStorage.removeItem('wms_user');
    localStorage.removeItem('token'); // Also remove any legacy token
  }
  
  // Clear request cache
  requestCache.clear();
  
  // Only redirect if not already on login page
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    setTimeout(() => {
      window.location.href = '/login';
    }, 100);
  }
  
  // Reset redirecting flag after timeout
  setTimeout(() => {
    isRedirecting = false;
  }, 1000);
};

const apiRequest = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  // Create cache key for deduplication (exclude login requests)
  const isLoginRequest = endpoint.includes('/Auth/login-propietario');
  
  // For GET requests, create a simpler cache key based on URL only
  let cacheKey = null;
  if (!isLoginRequest) {
    if (options.method === 'GET' || !options.method) {
      cacheKey = `GET:${endpoint}`;
    } else {
      cacheKey = `${endpoint}:${JSON.stringify(options)}`;
    }
  }
  
  // Return existing promise if same request is already in progress
  if (cacheKey && requestCache.has(cacheKey)) {
    console.log('Returning cached request for:', endpoint);
    return requestCache.get(cacheKey);
  }

  const config: RequestInit = {
    ...options,
    credentials: 'omit', // Evita el popup de autenticación básica
    headers: {
      'Content-Type': 'application/json',
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

  const requestPromise = fetch(`/api${endpoint.startsWith('/api') ? endpoint.substring(4) : endpoint}`, config)
    .then(async (response) => {
      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        clearAuthAndRedirect();
        throw new Error(`Authentication failed: ${response.status}`);
      }

  if (!response.ok) {
        console.error(`API request failed for ${endpoint}:`, response.status, response.statusText);
        try {
            const errorBody = await response.json();
            console.error("Error details:", errorBody);
            throw new Error(errorBody.message || `Request failed with status ${response.status}`);
        } catch (parseError) {
            console.error("Failed to parse error body:", parseError);
            throw new Error(`Request failed with status ${response.status}`);
        }
      }

      try {
          const data = await response.json();
          return data;
      } catch (jsonError) {
          console.error("Failed to parse JSON response:", jsonError);
          throw new Error("Failed to parse JSON response");
      }
    })
    .finally(() => {
      // Remove from cache when request completes
      if (cacheKey) {
        requestCache.delete(cacheKey);
      }
    });

  // Cache the request promise (except for login)
  if (cacheKey) {
    requestCache.set(cacheKey, requestPromise);
  }

  return requestPromise;
};

// Auth API
export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<User> => {
    try {
      console.log('Attempting login with credentials:', { username: credentials.username });
      const data = await apiRequest(`/Auth/login-propietario`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      console.log('Login API Response:', data);
      
      // Ensure we return the expected format with propietario data
      const user = {
        username: credentials.username,
        token: data.token || data.accessToken || data,
        propietario: data.propietario
      };

      // Store propietario info for later use
      if (data.propietario?.idPropietario) {
        localStorage.setItem('wms_idPropietario', data.propietario.idPropietario.toString());
      }

      return user;
    } catch (error) {
      console.error('Login API Error:', error);
      throw new Error('Usuario o contraseña incorrectos');
    }
  },

  testAuth: async (token: string) => {
    try {
      // Instead of calling TestAuth, try a simple request to verify token
      const data = await apiRequest(`/Bodegas/listar`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return data;
    } catch (error) {
      console.error('Test Auth Error:', error);
      throw new Error('Auth test failed');
    }
  }
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

export { apiRequest };