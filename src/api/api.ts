
import { apiRequest } from "@/request";

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

// Auth API
export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<User> => {
    try {
      const data = await apiRequest(`/api/Auth/login-propietario`, {
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
      const data = await apiRequest(`/api/TestAuth`, {
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
      const data = await apiRequest(`/api/sync/ingresos/documentos-ingreso/listar`, {
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
      const url = `/api/sync/ingresos/${idOrdenCompraEnc}/detalle-oc`;
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
      const url = `/api/sync/ingresos/${idOrdenCompraEnc}/recepciones`;
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
      const data = await apiRequest(`/api/sync/salidas/documentos-salida/listar`, {
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
  }
};

// Existencias API
export const existenciasAPI = {
  listar: async (filtro: { idBodega?: number; idPropietario: number; pagina: number; tamanoPagina: number }, token: string) => {
    try {
      const data = await apiRequest(`/api/Existencias/listar`, {
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
      const data = await apiRequest(`/api/Bodegas/listar`, {
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
      const data = await apiRequest(`/api/Productos/sincronizar`, {
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
