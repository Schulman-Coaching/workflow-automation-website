const CORE_API_URL = process.env.NEXT_PUBLIC_CORE_API_URL || 'http://localhost:3001/api/v1';

export async function coreRequest(endpoint: string, options: RequestInit = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(`${CORE_API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}
