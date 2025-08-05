const TOKEN_KEY = 'wms_token';
const USER_KEY = 'wms_user';

export interface User {
  username: string;
  token: string;
  propietario?: {
    idPropietario: number;
    nombre_comercial: string;
    activo: boolean;
  };
}

export const saveUser = (user: User) => {
  try {
    localStorage.setItem(TOKEN_KEY, user.token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    console.log('User saved successfully');
  } catch (error) {
    console.error('Error saving user:', error);
  }
};

export const getUser = (): User => {
  try {
    const userStr = localStorage.getItem(USER_KEY);
    const token = localStorage.getItem(TOKEN_KEY);

    if (userStr && token) {
      return { ...JSON.parse(userStr), token };
    }
  } catch (error) {
    console.error('Error getting user:', error);
  }

  return { username: '', token: '' };
};

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token || token === 'undefined' || token === 'null') {
      return false;
    }

    // Basic token format check (JWT should have 3 parts)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};

export const logout = () => {
  localStorage.removeItem('wms_token');
  localStorage.removeItem('wms_user');
  localStorage.removeItem('wms_idPropietario');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// Funciones utilitarias para formato de fecha
export const formatDateToDisplay = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatDateToInput = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDateFromInput = (inputDate: string): string => {
  // Convierte de YYYY-MM-DD a DD/MM/YYYY para mostrar
  if (!inputDate) return '';
  const [year, month, day] = inputDate.split('-');
  return `${day}/${month}/${year}`;
};