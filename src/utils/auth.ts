export interface User {
  username: string;
  token: string;
}

const TOKEN_KEY = 'wms_token';
const USER_KEY = 'wms_user';

export const saveUser = (user: User): void => {
  localStorage.setItem(TOKEN_KEY, user.token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getUser = (): User => {
  const userStr = localStorage.getItem(USER_KEY);
  const token = localStorage.getItem(TOKEN_KEY);

  if (userStr && token) {
    const user = JSON.parse(userStr);
    return { ...user, token };
  }

  return { username: '', token: '' };
};

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const isAuthenticated = (): boolean => {
  const token = getToken();
  return token !== null && token !== '';
};

export const logout = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};
// Token management
export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

export const setToken = (token: string): void => {
  localStorage.setItem('token', token);
};

export const removeToken = (): void => {
  localStorage.removeItem('token');
};

// User management
export const getUser = (): any => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const saveUser = (user: any): void => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const removeUser = (): void => {
  localStorage.removeItem('user');
};

// Authentication check
export const isAuthenticated = (): boolean => {
  const token = getToken();
  return !!token;
};

// Logout function
export const logout = (): void => {
  removeToken();
  removeUser();
  window.location.href = '/login';
};
