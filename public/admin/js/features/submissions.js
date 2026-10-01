// دریافت، نمایش، فیلتر و مدیریت مطالبات و خاطرات

import { state, findSubmission } from '../state.js';
import { FILTER, RESOURCE, RESOURCE_LABEL, STATUS, UI } from '../config.js';
import { $, escapeHTML, setText } from '../utils/dom.js';
import { getImageUrl, getItemId } from '../utils/format.js';
import { normalizeText } from '../utils/text.js';
import { getStatusBadgeClass, getStatusText } from '../utils/status.js';
import { errorMessage } from '../services/http.js';
import { fetchAllSubmissions, setSubmissionStatus, removeSubmission } from '../services/submission.service.js';
import { isExported, toggleExported, unmarkExported } from '../services/exported-store.js';
import { showToast } from '../ui/toast.js';
import {
    closeDetailModal,
    getActiveModalItem,
    isActiveModalItem,
    renderExportStatus,
    setActiveModalStatusButtons,
} from './detail-modal.js';

const ROW_STATUS_BUTTONS = [
    { status: STATUS.APPROVED, label: 'تایید', title: 'تایید پیام', active: 'bg-emerald-500 text-white', idle: 'text-emerald-400 hover:bg-emerald-500/20' },
    { status: STATUS.REJECTED, label: 'رد', title: 'رد پیام', active: 'bg-rose-500 text-white', idle: 'text-rose-400 hover:bg-rose-500/20' },
    { status: STATUS.PENDING, label: 'انتظار', title: 'در انتظار تایید', active: 'bg-amber-500 text-white', idle: 'text-amber-400 hover:bg-amber-500/20' },
];

// ---------- دریافت داده ----------

export async function fetchSubmissions() {
    try {
        const { items, failed } = await fetchAllSubmissions();

        // نشست منقضی شده؛ هندلر سراسری ۴۰۱ کار خروج را انجام داده است
        if (failed.some(({ error }) => error?.status === 401)) return;

        if (failed.length) {
            showToast('بخشی از اطلاعات از سرور دریافت نشد.', 'error');
        }

        // مواردی که دریافتشان شکست خورده، از داده قبلی حفظ می‌شوند
        const failedTypes = new Set(failed.map(({ resourceType }) => resourceType));
        const retained = state.submissions.filter((item) => failedTypes.has(item.resourceType));
        state.submissions = [...items, ...retained];

        updateStats();
        renderSubmissions();
    } catch (error) {
        console.error('Fetch error:', error);
        showToast('خطا در دریافت اطلاعات از سرور', 'error');
    }
}

// ---------- فیلتر و جست‌وجو ----------

function matchesFilter(item) {
    switch (state.currentFilter) {
        case FILTER.DEMANDS: return item.resourceType === RESOURCE.DEMANDS;
        case FILTER.STORIES: return item.resourceType === RESOURCE.STORIES;
        case FILTER.PENDING: return item.status === STATUS.PENDING;
        case FILTER.APPROVED: return item.status === STATUS.APPROVED;
        case FILTER.REJECTED: return item.status === STATUS.REJECTED;
        case FILTER.UNEXPORTED: return !isExported(getItemId(item));
        default: return true;
    }
}

function matchesSearch(item, query) {
    return normalizeText(item.title).includes(query) || normalizeText(item.description).includes(query);
}

export function setFilter(filter) {
    state.currentFilter = filter;
    document.querySelectorAll('[id^="tab-"]').forEach((button) => {
        const isActive = button.id === `tab-${filter}`;
        button.classList.toggle('bg-brand-orange', isActive);
        button.classList.toggle('text-white', isActive);
        button.classList.toggle('text-gray-400', !isActive);
        button.classList.toggle('hover:text-white', !isActive);
    });
    renderSubmissions();
}

let searchTimer = null;

export function handleSearch() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        state.searchQuery = $('search-input')?.value || '';
        renderSubmissions();
    }, UI.SEARCH_DEBOUNCE_MS);
}

// ---------- نمایش ----------

function buildRow(item, index) {
    const itemId = escapeHTML(getItemId(item));
    const resource = escapeHTML(item.resourceType);
    const exported = isExported(getItemId(item));
    const isDemand = item.resourceType === RESOURCE.DEMANDS;
    const hasImage = Boolean(getImageUrl(item.imageUrl));

    const statusButtons = ROW_STATUS_BUTTONS.map(({ status, label, title, active, idle }) => `
        <button type="button" data-action="update-status" data-id="${itemId}" data-resource="${resource}" data-status="${status}"
                class="px-2 py-1 text-[10px] rounded transition-all cursor-pointer ${item.status === status ? active : idle}"
                title="${title}">
            ${label}
        </button>
    `).join('');

    return `
        <tr class="border-b border-white/5 hover:bg-white/5 transition-colors block md:table-row p-3 md:p-0 mb-3 md:mb-0 rounded-xl bg-white/5 md:bg-transparent">
            <td class="p-2 md:p-4 text-gray-300 font-mono text-[11px]">${index + 1}</td>
            <td class="p-2 md:p-4">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${isDemand ? 'bg-brand-orange/20 text-brand-orange border border-brand-orange/30' : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'}">
                    ${RESOURCE_LABEL[item.resourceType] || RESOURCE_LABEL[RESOURCE.STORIES]}
                </span>
            </td>
            <td class="p-2 md:p-4 font-semibold text-white max-w-xs truncate">
                ${escapeHTML(item.title || 'بدون عنوان')}
                ${hasImage ? '<i class="fa-solid fa-paperclip text-amber-400 mr-2" title="دارای تصویر"></i>' : ''}
            </td>
            <td class="p-2 md:p-4 text-center">
                <div class="flex items-center justify-center gap-1">
                    <span class="px-2 py-0.5 rounded text-[10px] ${getStatusBadgeClass(item.status)}">
                        ${getStatusText(item.status)}
                    </span>
                    ${exported ? `
                        <button type="button" data-action="toggle-export" data-id="${itemId}"
                                class="px-2 py-0.5 rounded text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/30 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30 transition-all cursor-pointer flex items-center gap-1"
                                title="برای لغو خروجی گرفته‌شده کلیک کنید">
                            <i class="fa-solid fa-file-word"></i>
                            <span>خروجی گرفته‌شده</span>
                            <i class="fa-solid fa-xmark text-[9px] mr-0.5"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
            <td class="p-2 md:p-4 text-center">
                <div class="flex items-center justify-center gap-2 flex-wrap">
                    <button type="button" data-action="open-detail" data-id="${itemId}" data-resource="${resource}"
                            class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-brand-orange text-white text-[11px] transition-all cursor-pointer">
                        مشاهده و جزئیات
                    </button>
                    <div class="inline-flex rounded-lg bg-white/5 p-0.5 border border-white/10">
                        ${statusButtons}
                    </div>
                    <button type="button" data-action="delete-submission" data-id="${itemId}" data-resource="${resource}"
                            class="px-2.5 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-600 hover:text-white text-[11px] transition-all cursor-pointer"
                            title="حذف این مورد">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

export function renderSubmissions() {
    const tbody = $('submissions-table-body');
    const emptyState = $('empty-state');
    if (!tbody) return;

    const query = normalizeText(state.searchQuery);
    const filtered = state.submissions
        .filter(matchesFilter)
        .filter((item) => !query || matchesSearch(item, query));

    tbody.innerHTML = filtered.map(buildRow).join('');
    emptyState?.classList.toggle('hidden', filtered.length > 0);
}

export function updateStats() {
    const unexported = state.submissions.filter((item) => !isExported(getItemId(item)));

    setText('stat-unexported-demands', unexported.filter((item) => item.resourceType === RESOURCE.DEMANDS).length);
    setText('stat-unexported-memories', unexported.filter((item) => item.resourceType === RESOURCE.STORIES).length);
    // این شمارنده تعداد «در انتظار تایید» را نشان می‌دهد (نام id از HTML موجود حفظ شده)
    setText('stat-total-submissions', state.submissions.filter((item) => item.status === STATUS.PENDING).length);
    setText('stat-exported-batches', state.submissions.length - unexported.length);
}

// ---------- عملیات ----------

export async function updateItemStatus(id, resourceType, newStatus) {
    try {
        await setSubmissionStatus(resourceType, id, newStatus);
    } catch (error) {
        showToast(errorMessage(error, 'خطا در تغییر وضعیت'), 'error');
        return;
    }

    showToast(`وضعیت با موفقیت به «${getStatusText(newStatus)}» تغییر یافت.`, 'success');

    const item = findSubmission(id, resourceType);
    if (item) item.status = newStatus;

    updateStats();
    renderSubmissions();

    if (isActiveModalItem(id)) setActiveModalStatusButtons(newStatus);
}

export function changeModalItemStatus(newStatus) {
    const active = getActiveModalItem();
    if (!active) return;
    return updateItemStatus(active.id, active.resourceType, newStatus);
}

export async function deleteSubmission(id, resourceType) {
    if (!confirm('آیا از حذف این مورد اطمینان دارید؟ این عملیات قابل بازگشت نیست.')) return;

    try {
        await removeSubmission(resourceType, id);
    } catch (error) {
        showToast(errorMessage(error, 'خطا در حذف مورد'), 'error');
        return;
    }

    showToast('با موفقیت حذف شد.', 'success');

    state.submissions = state.submissions.filter(
        (item) => !(getItemId(item) === String(id) && item.resourceType === resourceType)
    );
    unmarkExported(id);

    updateStats();
    renderSubmissions();

    if (isActiveModalItem(id)) closeDetailModal();
}

export function toggleExportStatus(id) {
    const nowExported = toggleExported(id);

    showToast(
        nowExported
            ? 'پیام به عنوان خروجی‌گرفته‌شده نشانه‌گذاری شد.'
            : 'پیام از حالت خروجی‌گرفته‌شده خارج شد و مجدداً آماده دانلود است.',
        nowExported ? 'success' : 'info'
    );

    updateStats();
    renderSubmissions();
    if (isActiveModalItem(id)) renderExportStatus(String(id));
}

