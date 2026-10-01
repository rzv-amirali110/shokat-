import { apiRequest } from './http.js';

export async function fetchCurrentAdmin() {
    const result = await apiRequest('/admin/me', { skipAuthRedirect: true });
    return result?.data?.admin || result?.admin || null;
}

export function login(username, password) {
    return apiRequest('/admin/login', {
        method: 'POST',
        body: { username, password },
        skipAuthRedirect: true,
    });
}

export function logout() {
    return apiRequest('/admin/logout', { method: 'POST', skipAuthRedirect: true });
}
