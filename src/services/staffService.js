import { apiRequest } from './apiClient.js';

export async function getStaff() {
  const result = await apiRequest('/staff');
  return Array.isArray(result) ? result : (result.items || []);
}
export const getStaffById = staffId => apiRequest(`/staff/${encodeURIComponent(staffId)}`);
export const createStaff = payload => apiRequest('/staff', { method: 'POST', body: JSON.stringify(payload) });
export const updateStaff = (staffId, payload) => apiRequest(`/staff/${encodeURIComponent(staffId)}`, { method: 'PUT', body: JSON.stringify(payload) });
export const deleteStaff = staffId => apiRequest(`/staff/${encodeURIComponent(staffId)}`, { method: 'DELETE' });
