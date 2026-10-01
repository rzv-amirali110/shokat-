// توابع قالب‌بندی و استخراج داده

import { SERVER_URL } from '../config.js';

/** شناسه یکتای هر موجودیت (مدیر، مطلب و ...) به‌صورت رشته */
export function getItemId(entity) {
    return String(entity?._id || entity?.id || '');
}

export function getImageUrl(imagePath) {
    if (!imagePath) return null;
    if (/^https?:\/\//i.test(imagePath)) return imagePath;
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${SERVER_URL}${cleanPath}`;
}

export function formatDate(value) {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('fa-IR');
}
