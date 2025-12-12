interface User {
  username: string;
  token: string;
  propietario?: any;
}

const TOKEN_KEY = 'wms_token';
const USER_KEY = 'wms_user';

export const saveUser = (user: User) => {
  localStorage.setItem(TOKEN_KEY, user.token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  console.log('💾 User saved');
};

export const getUser = (): User => {
  const userStr = localStorage.getItem(USER_KEY);
  const token = localStorage.getItem(TOKEN_KEY);

  if (userStr && token) {
    return { ...JSON.parse(userStr), token };
  }

  return { username: '', token: '' };
};

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem(TOKEN_KEY);
  const user = localStorage.getItem(USER_KEY);

  return !!(token && user && token !== 'null' && user !== 'null');
};

export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem('wms_idPropietario');
};

// Función para formatear fecha desde input (YYYY-MM-DD) a formato de visualización (DD/MM/YYYY)
export const formatDateFromInput = (dateString: string): string => {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateString;
};

// Función para formatear fecha a formato de visualización (DD/MM/YYYY)
export const formatDateToDisplay = (dateString: string): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
};