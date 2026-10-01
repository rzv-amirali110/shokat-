// خروجی دسته‌ای Word (فقط موارد تاییدشده و خروجی‌نگرفته)

import { state } from '../state.js';
import { EXPORT, RESOURCE, STATUS } from '../config.js';
import { getItemId } from '../utils/format.js';
import { exportItemsToWord, isDocxAvailable } from '../services/word-export.service.js';
import { isExported, markExported } from '../services/exported-store.js';
import { runExclusive } from '../ui/form.js';
import { showToast } from '../ui/toast.js';
import { renderSubmissions, updateStats } from './submissions.js';

export function exportBatchToWord(resourceType) {
    return runExclusive('export-word', async () => {
        if (!Object.values(RESOURCE).includes(resourceType)) {
            showToast('نوع خروجی نامعتبر است.', 'error');
            return;
        }

        if (!isDocxAvailable()) {
            showToast('کتابخانه docx.js یافت نشد. لطفاً صفحه را رفرش کنید.', 'error');
            return;
        }

        const items = state.submissions
            .filter((item) =>
                item.resourceType === resourceType &&
                item.status === STATUS.APPROVED &&
                !isExported(getItemId(item)))
            .slice(0, EXPORT.BATCH_LIMIT);

        if (items.length === 0) {
            showToast('هیچ پیام تاییدشده و خروجی‌نگرفته‌ای برای این بخش وجود ندارد.', 'info');
            return;
        }

        showToast('در حال آماده‌سازی فایل ورد و بارگذاری تصاویر...', 'info');

        try {
            await exportItemsToWord(resourceType, items);
        } catch (error) {
            console.error('خطا در خروجی فایل Word:', error);
            showToast(`خطا در تولید فایل Word: ${error?.message || ''}`, 'error');
            return; // در صورت شکست، هیچ موردی «خروجی‌گرفته‌شده» علامت نمی‌خورد
        }

        markExported(items.map(getItemId));
        updateStats();
        renderSubmissions();
        showToast(`${items.length} پیام تاییدشده (به همراه تصویر) با موفقیت خروجی داده شد.`, 'success');
    });
}
