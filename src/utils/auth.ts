
// src/utils/auth.ts

const TOKEN_KEY = 'wms_token';
const USER_ID_KEY = 'wms_idPropietario';
const USERNAME_KEY = 'wms_username';

export interface User {
  token: string;
  idPropietario: number;
  username: string;
}

export const saveUser = (user: User): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, user.token);
    localStorage.setItem(USER_ID_KEY, user.idPropietario.toString());
    localStorage.setItem(USERNAME_KEY, user.username);
  }
};

export const getUser = (): User => {
  if (typeof window === 'undefined') {
    return {
      token: '',
      idPropietario: 0,
      username: ''
    };
  }
  
  return {
    token: localStorage.getItem(TOKEN_KEY) || '',
    idPropietario: parseInt(localStorage.getItem(USER_ID_KEY) || '0'),
    username: localStorage.getItem(USERNAME_KEY) || ''
  };
};

export const getToken = (): string => {
  if (typeof window === 'undefined') {
    return '';
  }
  return localStorage.getItem(TOKEN_KEY) || '';
};

export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  const token = getToken();
  return !!token && token.trim() !== '';
};

export const logout = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(USERNAME_KEY);
  }
};
