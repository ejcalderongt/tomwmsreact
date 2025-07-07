import { User } from "@shared/schema";

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  role: string;
  idPropietario?: number;
  nombrePropietario?: string;
}

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function setToken(token: string): void {
  localStorage.setItem("token", token);
}

export function getCurrentUser(): AuthUser | null {
  try {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    
    const user = JSON.parse(userStr);
    return user as AuthUser;
  } catch (error) {
    console.error("Error parsing user from localStorage:", error);
    return null;
  }
}

export function setCurrentUser(user: AuthUser, token?: string): void {
  localStorage.setItem("user", JSON.stringify(user));
  if (token) {
    setToken(token);
  }
}

export function logout(): void {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

export function hasRole(requiredRole: string): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  
  // Simple role hierarchy: admin > user
  if (user.role === "admin") return true;
  return user.role === requiredRole;
}

export function requireAuth(): AuthUser {
  const user = getCurrentUser();
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}
