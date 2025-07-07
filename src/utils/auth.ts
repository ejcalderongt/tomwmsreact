// src/utils/auth.ts

export interface AuthUser {
  idPropietario?: number;
  nombrePropietario?: string;
  username?: string;
}

const TOKEN_KEY = "token";
const USER_KEY = "user";
const TOKEN_EXP_KEY = "token_exp";

export const saveAuth = (token: string, propietario: any, username: string) => {
  const user: AuthUser = {
    idPropietario: propietario?.idPropietario,
    nombrePropietario: propietario?.nombre_comercial,
    username
  };

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_EXP_KEY, (Date.now() + 60 * 60 * 1000).toString()); // 1h
};

export const getToken = (): string | null => {
  const exp = localStorage.getItem(TOKEN_EXP_KEY);
  if (exp && Date.now() > parseInt(exp)) {
    logout();
    return null;
  }
  return localStorage.getItem(TOKEN_KEY);
};

export const getUser = (): AuthUser => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "{}");
  } catch {
    return {};
  }
};

export const getIdPropietario = (): number => {
  const user = getUser();
  return user?.idPropietario || 0;
};

export const logout = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_EXP_KEY);
};
