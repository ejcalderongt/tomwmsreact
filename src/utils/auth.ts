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
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return false;
    }

    // Let the server validate the token - don't try to decode it client-side
    return true;
  } catch (error) {
    console.error('Error checking authentication:', error);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return false;
  }
};

export const logout = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    console.log('User logged out successfully');
  } catch (error) {
    console.error('Error during logout:', error);
  }
};