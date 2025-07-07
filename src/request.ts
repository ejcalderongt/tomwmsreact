
export async function apiRequest(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(path, {
      ...options,
      headers,
      // Prevent browser from showing basic auth dialog
      credentials: 'omit'
    });

    if (!response.ok) {
      // Clone response to read body for error details
      const responseClone = response.clone();
      let errorMessage = `API Error: ${response.status}`;
      
      try {
        const errorData = await responseClone.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }

      if (response.status === 401) {
        console.warn("Token inválido o expirado.");
        throw new Error('Unauthorized');
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
}
