
export async function apiRequest(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(path, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.warn("Token inválido o expirado.");
        throw new Error('Unauthorized');
      }
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
}
