
const API_BASE_URL = 'http://52.41.114.122:8091/api';

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
    const response = await fetch(`${API_BASE_URL}/Auth/login-propietario`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    if (!response.ok) {
      throw new Error('Login failed');
    }
    
    return response.json();
  },
  
  testAuth: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/TestAuth`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Auth test failed');
    }
    
    return response.json();
  }
};

// Ingresos API
export const ingresosAPI = {
  listarDocumentos: async (filtro: DocumentoIngresoFiltro, token: string) => {
    const response = await fetch(`${API_BASE_URL}/sync/ingresos/documentos-ingreso/listar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(filtro),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch documents');
    }
    
    return response.json();
  },
  
  obtenerDetalle: async (idOrdenCompraEnc: number, token: string) => {
    const response = await fetch(`${API_BASE_URL}/sync/ingresos/${idOrdenCompraEnc}/detalle-oc`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch detail');
    }
    
    return response.json();
  },
  
  obtenerRecepciones: async (idOrdenCompraEnc: number, token: string) => {
    const response = await fetch(`${API_BASE_URL}/sync/ingresos/${idOrdenCompraEnc}/recepciones`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch receptions');
    }
    
    return response.json();
  }
};

// Productos API
export const productosAPI = {
  sincronizar: async (productos: any[], token: string) => {
    const response = await fetch(`${API_BASE_URL}/Productos/sincronizar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(productos),
    });
    
    if (!response.ok) {
      throw new Error('Failed to sync products');
    }
    
    return response.json();
  }
};
