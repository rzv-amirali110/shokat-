// دریافت و آماده‌سازی تصویر برای docx.js

import { EXPORT } from '../config.js';

/** دریافت تصویر به‌صورت Blob؛ در صورت خطا null برمی‌گرداند */
export async function fetchImageBlob(url) {
    if (!url) return null;
    try {
        const response = await fetch(url, { method: 'GET', mode: 'cors', credentials: 'same-origin' });
        if (!response.ok) {
            console.warn(`خطا در دریافت تصویر: status ${response.status}`);
            return null;
        }
        return await response.blob();
    } catch (error) {
        console.error('خطا در دریافت تصویر برای ورد (احتمالاً CORS):', error);
        return null;
    }
}

/**
 * تبدیل هر فرمت تصویری (jpg/png/webp/gif/...) به PNG سازگار با Word
 * و محاسبه ابعاد نمایش با حفظ نسبت تصویر.
 */
export async function convertImageForDocx(blob) {
    let bitmap = null;
    try {
        bitmap = await createImageBitmap(blob);

        const sourceScale = Math.min(1, EXPORT.IMAGE_MAX_SOURCE_SIDE / Math.max(bitmap.width, bitmap.height));
        const canvasWidth = Math.max(1, Math.round(bitmap.width * sourceScale));
        const canvasHeight = Math.max(1, Math.round(bitmap.height * sourceScale));

        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.drawImage(bitmap, 0, 0, canvasWidth, canvasHeight);

        const pngBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
        if (!pngBlob) return null;

        const displayScale = Math.min(
            1,
            EXPORT.IMAGE_MAX_DISPLAY_WIDTH / canvasWidth,
            EXPORT.IMAGE_MAX_DISPLAY_HEIGHT / canvasHeight
        );

        return {
            data: await pngBlob.arrayBuffer(),
            width: Math.max(1, Math.round(canvasWidth * displayScale)),
            height: Math.max(1, Math.round(canvasHeight * displayScale)),
        };
    } catch (error) {
        console.warn('تبدیل تصویر برای ورد ناموفق بود:', error);
        return null;
    } finally {
        bitmap?.close?.();
    }
}
