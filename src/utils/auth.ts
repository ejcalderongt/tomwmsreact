const TOKEN_KEY = 'wms_token';
const USER_KEY = 'wms_user';

export interface User {
  username: string;
  token: string;
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
    const token = getToken();
    return token !== null && token !== '' && token !== 'undefined';
  } catch (error) {
    console.error('Error checking authentication:', error);
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