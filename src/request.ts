import { getUser } from "@/utils/auth";

export async function apiRequest(path: string, options: RequestInit = {}) {
  const user = getUser();
  const token = user?.token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };

  const response = await fetch(path, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      console.warn("Token inválido o expirado.");
    }
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}
