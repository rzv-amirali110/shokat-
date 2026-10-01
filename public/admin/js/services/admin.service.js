import { apiRequest, extractList } from './http.js';

const adminPath = (id) => `/admin/${encodeURIComponent(id)}`;

export async function listAdmins() {
    const result = await apiRequest('/admin');
    return extractList(result, 'admins');
}

export const createAdmin = (payload) => apiRequest('/admin/register', { method: 'POST', body: payload });
export const updateAdmin = (id, payload) => apiRequest(adminPath(id), { method: 'PUT', body: payload });
export const deleteAdmin = (id) => apiRequest(adminPath(id), { method: 'DELETE' });
export const updateMyProfile = (payload) => apiRequest('/admin/update-me', { method: 'PATCH', body: payload });
export const changePassword = (payload) => apiRequest('/admin/change-password', { method: 'PATCH', body: payload });
