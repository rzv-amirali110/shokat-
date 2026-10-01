// لایه مرکزی ارتباط با بک‌اند

import { API_BASE_URL, MESSAGES } from '../config.js';

export class ApiError extends Error {
    constructor(message, { status = 0, data = null } = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

let unauthorizedHandler = null;

/** ثبت تابعی که هنگام دریافت 401 (نشست نامعتبر) اجرا می‌شود */
export function setUnauthorizedHandler(handler) {
    unauthorizedHandler = handler;
}

async function parseJson(response) {
    try {
        return await response.json();
    } catch {
        return null; // پاسخ خالی یا غیر JSON
    }
}

/**
 * ارسال درخواست JSON به API
 * @param {string} path مسیر نسبی، مثل '/admin/me'
 * @param {{method?: string, body?: object, skipAuthRedirect?: boolean}} options
 * @throws {ApiError}
 */
export async function apiRequest(path, { method = 'GET', body, skipAuthRedirect = false } = {}) {
    const init = { method, credentials: 'include', headers: {} };
    if (body !== undefined) {
        init.headers['Content-Type'] = 'application/json';
        init.body = JSON.stringify(body);
    }

    let response;
    try {
        response = await fetch(`${API_BASE_URL}${path}`, init);
    } catch (error) {
        console.error('Network error:', error);
        throw new ApiError(MESSAGES.NETWORK_ERROR, { status: 0 });
    }

    const data = await parseJson(response);

    if (!response.ok) {
        if (response.status === 401 && !skipAuthRedirect) unauthorizedHandler?.();
        throw new ApiError(data?.message || '', { status: response.status, data });
    }

    return data;
}

/** پیام مناسب نمایش به کاربر؛ خطاهای غیرمنتظره پیام عمومی می‌گیرند */
export function errorMessage(error, fallback) {
    if (error instanceof ApiError && error.message) return error.message;
    if (!(error instanceof ApiError)) console.error(error);
    return fallback;
}

/** استخراج آرایه از ساختارهای مختلف پاسخ سرور */
export function extractList(json, key) {
    return json?.data?.[key] || json?.[key] || (Array.isArray(json) ? json : []);
}
