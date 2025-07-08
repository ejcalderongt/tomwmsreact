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
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found in localStorage');
      return false;
    }

    console.log('Token found, validating...');

    // Check if token has correct format
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('Invalid token format');
      localStorage.removeItem('token');
      return false;
    }

    // Check if token is expired
    const payload = JSON.parse(atob(parts[1]));
    const currentTime = Date.now() / 1000;

    console.log('Token expiry:', new Date(payload.exp * 1000));
    console.log('Current time:', new Date(currentTime * 1000));

    if (payload.exp < currentTime) {
      console.log('Token expired, removing from localStorage');
      localStorage.removeItem('token');
      return false;
    }

    console.log('Token is valid');
    return true;
  } catch (error) {
    console.error('Error checking authentication:', error);
    localStorage.removeItem('token');
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