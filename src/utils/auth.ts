export interface User {
  username: string;
  token: string;
  idPropietario?: number;
}

const TOKEN_KEY = 'wms_token';
const USER_KEY = 'wms_user';

export const saveUser = (user: User): void => {
  localStorage.setItem(TOKEN_KEY, user.token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getUser = (): User => {
  const username = localStorage.getItem('wms_username') || '';
  const token = localStorage.getItem('wms_token') || '';
  const idPropietario = localStorage.getItem('wms_idPropietario') ? 
    parseInt(localStorage.getItem('wms_idPropietario') || '0') : undefined;

  return { username, token, idPropietario };
};

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('wms_token');
  return !!token;
};

export const clearInvalidToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const logout = (): void => {
  localStorage.removeItem('wms_username');
  localStorage.removeItem('wms_token');
  localStorage.removeItem('wms_idPropietario');
};