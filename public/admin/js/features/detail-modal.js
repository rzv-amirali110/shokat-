// مدال جزئیات هر مورد

import { state, findSubmission } from '../state.js';
import { RESOURCE, RESOURCE_LABEL, STATUS } from '../config.js';
import { $, setText, escapeHTML } from '../utils/dom.js';
import { formatDate, getImageUrl, getItemId } from '../utils/format.js';
import { isExported } from '../services/exported-store.js';
import { openModal, closeModal } from '../ui/modal.js';

const MODAL_ID = 'detail-modal-backdrop';
const PANEL_SELECTOR = 'div';

const BASE_BUTTON_CLASS = 'px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer';

const STATUS_BUTTONS = [
    { id: 'modal-btn-approve', status: STATUS.APPROVED, active: 'bg-emerald-600 text-white ring-2 ring-emerald-400', idle: 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/40' },
    { id: 'modal-btn-reject', status: STATUS.REJECTED, active: 'bg-rose-600 text-white ring-2 ring-rose-400', idle: 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/40' },
    { id: 'modal-btn-pending', status: STATUS.PENDING, active: 'bg-amber-600 text-white ring-2 ring-amber-400', idle: 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/40' },
];

export const getActiveModalItem = () => state.activeModalItem;

export const isActiveModalItem = (id) =>
    Boolean(state.activeModalItem) && state.activeModalItem.id === String(id);

export function renderExportStatus(id) {
    const el = $('detail-export-status');
    if (!el) return;

    const exported = isExported(id);
    el.innerHTML = `
        <button type="button" data-action="toggle-export" data-id="${escapeHTML(id)}" class="hover:underline cursor-pointer">
            وضعیت خروجی: ${exported
                ? '<span class="text-sky-400 font-bold">گرفته‌شده (برای لغو کلیک کنید)</span>'
                : '<span class="text-gray-400">گرفته‌نشده</span>'}
        </button>
    `;
}

export function setActiveModalStatusButtons(status) {
    STATUS_BUTTONS.forEach(({ id, status: buttonStatus, active, idle }) => {
        const button = $(id);
        if (button) button.className = `${BASE_BUTTON_CLASS} ${status === buttonStatus ? active : idle}`;
    });
}

export function openDetailModal(id, resourceType) {
    const item = findSubmission(id, resourceType);
    if (!item) return;

    const itemId = getItemId(item);

    setText('detail-subject', item.title || 'بدون عنوان');
    setText('detail-text', item.description || '');
    setText('detail-date', formatDate(item.createdAt));
    setText('detail-id', `ID: ${itemId}`);
    setText('detail-sender', `فرستنده: ${item.senderName || item.mobile || 'ناشناس'}`);
    setText('detail-category-badge', RESOURCE_LABEL[item.resourceType] || RESOURCE_LABEL[RESOURCE.STORIES]);
    renderExportStatus(itemId);

    const imageBox = $('detail-image-box');
    const imageEl = $('detail-image');
    const imageUrl = getImageUrl(item.imageUrl);

    if (imageEl) {
        if (imageUrl) {
            imageEl.src = imageUrl;
        } else {
            imageEl.removeAttribute('src'); // src='' باعث درخواست اضافه به آدرس صفحه می‌شود
        }
    }
    imageBox?.classList.toggle('hidden', !imageUrl);

    state.activeModalItem = { id: itemId, resourceType: item.resourceType };
    setActiveModalStatusButtons(item.status);

    openModal(MODAL_ID, PANEL_SELECTOR);
}

export function closeDetailModal() {
    state.activeModalItem = null;
    closeModal(MODAL_ID, PANEL_SELECTOR);
}
