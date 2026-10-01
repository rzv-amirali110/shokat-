// ذخیره‌سازی شناسه پیام‌های خروجی‌گرفته‌شده در localStorage

import { STORAGE_KEYS } from '../config.js';

function load() {
    try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPORTED_IDS) || '[]');
        return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
    } catch {
        return new Set(); // داده خراب یا localStorage در دسترس نیست
    }
}

const exportedIds = load();

function persist() {
    try {
        localStorage.setItem(STORAGE_KEYS.EXPORTED_IDS, JSON.stringify([...exportedIds]));
    } catch (error) {
        console.warn('ذخیره وضعیت خروجی‌ها ممکن نشد:', error);
    }
}

export const isExported = (id) => exportedIds.has(String(id));

export function markExported(ids) {
    ids.forEach((id) => exportedIds.add(String(id)));
    persist();
}

export function unmarkExported(id) {
    if (exportedIds.delete(String(id))) persist();
}

/** وضعیت را برعکس می‌کند و مقدار جدید را برمی‌گرداند */
export function toggleExported(id) {
    const key = String(id);
    if (exportedIds.has(key)) {
        exportedIds.delete(key);
    } else {
        exportedIds.add(key);
    }
    persist();
    return exportedIds.has(key);
}
