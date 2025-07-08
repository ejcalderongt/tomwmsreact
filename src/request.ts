
import { getUser } from "@/utils/auth";

export const apiRequest = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const user = getUser();

  const config: RequestInit = {
    ...options,
    credentials: 'omit', // Evita el popup de autenticación básica
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  // Solo agregar token si existe
  if (user.token) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${user.token}`,
    };
  }

  const response = await fetch(`/api${endpoint.startsWith('/api') ? endpoint.substring(4) : endpoint}`, config);

  if (!response.ok) {
    console.error(`API request failed for ${endpoint}:`, response.status, response.statusText);
    try {
        const errorBody = await response.json();
        console.error("Error details:", errorBody);
        throw new Error(errorBody.message || `Request failed with status ${response.status}`);
    } catch (parseError) {
        console.error("Failed to parse error body:", parseError);
        throw new Error(`Request failed with status ${response.status}`);
    }
  }
  
  try {
      const data = await response.json();
      return data;
  } catch (jsonError) {
      console.error("Failed to parse JSON response:", jsonError);
      throw new Error("Failed to parse JSON response");
  }
};
