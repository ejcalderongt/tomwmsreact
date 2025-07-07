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

export const clearInvalidToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const logout = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};