import { apiRequest } from './apiClient.js';
const qs = p => { const s = new URLSearchParams(p || {}).toString(); return s ? `?${s}` : ''; };
export const getTodayAttendance = p => apiRequest(`/attendance/today${qs(p)}`);
export const getEmployeeAttendance = (id,p) => apiRequest(`/attendance/employees/${encodeURIComponent(id)}${qs(p)}`);
export const getAttendanceSheet = p => apiRequest(`/attendance/sheet${qs(p)}`);
