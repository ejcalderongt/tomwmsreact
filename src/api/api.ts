import { getUser } from "@/utils/auth";

export interface LoginCredentials {
  username: string;
  password: string;
}

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
    localStorage.removeItem('wms_idPropietario');
    localStorage.removeItem('wms_username');
  }
  
  // Clear request cache
  requestCache.clear();
  
  // Redirect to login
  setTimeout(() => {
    window.location.href = '/login';
  }, 100);
};

const apiRequest = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  // Create cache key for deduplication (exclude login requests)
  const isLoginRequest = endpoint.includes('/Auth/login-propietario');
  const cacheKey = !isLoginRequest ? `${endpoint}:${JSON.stringify(options)}` : null;
  
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
      const data = await apiRequest(`/Auth/login-propietario`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      console.log('API Response:', data);
      return data;
    } catch (error) {
      console.error('Login API Error:', error);
      throw new Error('Login failed');
    }
  },

  testAuth: async (token: string) => {
    try {
      const data = await apiRequest(`/TestAuth`, {
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

// Existencias API
export const existenciasAPI = {
  listar: async (filtro: { idBodega?: number; idPropietario: number; pagina: number; tamanoPagina: number }, token: string) => {
    try {
      const data = await apiRequest(`/Existencias/listar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(filtro),
      });

      return data;
    } catch (error) {
      console.error('Existencias API Error:', error);
      throw new Error('Failed to fetch existencias');
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