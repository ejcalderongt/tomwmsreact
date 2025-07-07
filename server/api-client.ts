import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = 'http://52.41.114.122:8091';

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: {
    id: number;
    username: string;
    name: string;
    idPropietario?: number;
    nombrePropietario?: string;
    isActive: boolean;
  };
  message?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': this.token ? `Bearer ${this.token}` : undefined
    };
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const response: AxiosResponse<LoginResponse> = await axios.post(
        `${API_BASE_URL}/api/auth/login`,
        { username, password },
        { headers: this.getHeaders() }
      );
      
      if (response.data.success && response.data.token) {
        this.setToken(response.data.token);
      }
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Error de conexión con el servidor'
      };
    }
  }

  async getIncomingOrders(startDate?: string, endDate?: string): Promise<ApiResponse<any[]>> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response: AxiosResponse<ApiResponse<any[]>> = await axios.get(
        `${API_BASE_URL}/api/incoming-orders?${params.toString()}`,
        { headers: this.getHeaders() }
      );
      
      return response.data;
    } catch (error) {
      console.error('Get incoming orders error:', error);
      return {
        success: false,
        message: 'Error al obtener órdenes de ingreso'
      };
    }
  }

  async getOutgoingOrders(startDate?: string, endDate?: string): Promise<ApiResponse<any[]>> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response: AxiosResponse<ApiResponse<any[]>> = await axios.get(
        `${API_BASE_URL}/api/outgoing-orders?${params.toString()}`,
        { headers: this.getHeaders() }
      );
      
      return response.data;
    } catch (error) {
      console.error('Get outgoing orders error:', error);
      return {
        success: false,
        message: 'Error al obtener órdenes de salida'
      };
    }
  }

  async getInventory(): Promise<ApiResponse<any[]>> {
    try {
      const response: AxiosResponse<ApiResponse<any[]>> = await axios.get(
        `${API_BASE_URL}/api/inventory`,
        { headers: this.getHeaders() }
      );
      
      return response.data;
    } catch (error) {
      console.error('Get inventory error:', error);
      return {
        success: false,
        message: 'Error al obtener inventario'
      };
    }
  }

  async getDashboard(): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await axios.get(
        `${API_BASE_URL}/api/dashboard`,
        { headers: this.getHeaders() }
      );
      
      return response.data;
    } catch (error) {
      console.error('Get dashboard error:', error);
      return {
        success: false,
        message: 'Error al obtener datos del dashboard'
      };
    }
  }

  async validateToken(): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await axios.get(
        `${API_BASE_URL}/api/auth/validate`,
        { headers: this.getHeaders() }
      );
      
      return response.data;
    } catch (error) {
      console.error('Validate token error:', error);
      return {
        success: false,
        message: 'Token inválido'
      };
    }
  }
}

export const apiClient = new ApiClient();