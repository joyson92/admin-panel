import { apiRequest } from './apiClient.js';
const qs = p => { const s = new URLSearchParams(p || {}).toString(); return s ? `?${s}` : ''; };
export const getTodayAttendance = p => apiRequest(`/attendance/today${qs(p)}`);
export const getEmployeeAttendance = (id,p) => apiRequest(`/attendance/employees/${encodeURIComponent(id)}${qs(p)}`);
export const getAttendanceSheet = p => apiRequest(`/attendance/sheet${qs(p)}`);

export const addAdminPunch = payload => apiRequest('/attendance/admin/punch', {
  method: 'POST',
  body: JSON.stringify(payload)
});
export const updateAdminPunch = (id, payload) => apiRequest(`/attendance/admin/punch/${encodeURIComponent(id)}`, {
  method: 'PUT',
  body: JSON.stringify(payload)
});