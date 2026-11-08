import { fetchAuthSession } from 'aws-amplify/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '');

export async function apiRequest(path, options = {}) {
  if (!API_BASE_URL) throw new Error('API is not configured. Set VITE_API_BASE_URL in .env.local.');
  const session = await fetchAuthSession();
  const accessToken = session.tokens?.accessToken?.toString();
  const headers = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) throw new Error('Your session has expired. Please sign in again.');
    if (response.status === 403) throw new Error('You do not have permission to perform this action.');
    throw new Error(body.message || `Request failed (${response.status})`);
  }
  return body;
}
