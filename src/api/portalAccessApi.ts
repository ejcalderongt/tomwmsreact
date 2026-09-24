import type { User } from '@/utils/auth';

export interface PortalUserRecord {
  idPortalUsuario: number;
  codigoAcceso: string;
  nombre: string;
  email: string | null;
  esAdministrador: boolean;
  activo: boolean;
  permisos: string[];
}

export interface PortalUserInput {
  codigoAcceso: string;
  nombre: string;
  email: string | null;
  password: string | null;
  esAdministrador: boolean;
  activo: boolean;
  permisos: string[];
}

export interface PortalModuleRecord {
  idPropietario: number;
  codigoModulo: string;
  habilitado: boolean;
}

const call = async <T>(path: string, token: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(`/api/PortalAcceso/${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.mensaje || `Error HTTP ${response.status}`);
  }
  return response.status === 204 ? undefined as T : response.json();
};

export const portalAccessApi = {
  internalLogin: async (username: string, password: string): Promise<User> => {
    const response = await fetch('/api/Auth/login-interno', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!response.ok) throw new Error('Credenciales internas incorrectas');
    const body = await response.json();
    return { username, token: body.token, isSystemAdmin: true, permissions: [], modules: [] };
  },
  catalog: (token: string) => call<Record<string, string[]>>('catalogo', token),
  users: (token: string) => call<PortalUserRecord[]>('usuarios', token),
  createUser: (token: string, input: PortalUserInput) =>
    call<PortalUserRecord>('usuarios', token, { method: 'POST', body: JSON.stringify(input) }),
  updateUser: (token: string, id: number, input: PortalUserInput) =>
    call<PortalUserRecord>(`usuarios/${id}`, token, { method: 'PUT', body: JSON.stringify(input) }),
  modules: (token: string, ownerId: number) =>
    call<PortalModuleRecord[]>(`modulos/${ownerId}`, token),
  setModule: (token: string, ownerId: number, code: string, enabled: boolean) =>
    call<void>(`modulos/${ownerId}/${code}`, token, {
      method: 'PUT', body: JSON.stringify({ habilitado: enabled }),
    }),
};
