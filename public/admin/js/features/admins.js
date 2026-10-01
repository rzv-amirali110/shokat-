// مدیریت ادمین‌ها

import { state, isCurrentAdmin } from '../state.js';
import { MESSAGES } from '../config.js';
import { $, escapeHTML } from '../utils/dom.js';
import { formatDate, getItemId } from '../utils/format.js';
import { normalizeDigits } from '../utils/text.js';
import { isValidMobile, validatePassword } from '../utils/validators.js';
import { errorMessage } from '../services/http.js';
import * as adminService from '../services/admin.service.js';
import { openModal, closeModal } from '../ui/modal.js';
import { getForm, runExclusive } from '../ui/form.js';
import { renderCurrentUserBadge } from '../ui/header.js';
import { showToast } from '../ui/toast.js';

const ADD_MODAL = 'admin-modal-backdrop';
const EDIT_MODAL = 'edit-admin-modal-backdrop';
const EDIT_PANEL = '.glass-modal';

// ---------- دریافت و نمایش ----------

export async function fetchAdmins() {
    try {
        state.admins = await adminService.listAdmins();
        renderAdmins();
    } catch (error) {
        if (error?.status !== 401) console.error('خطا در دریافت لیست مدیران:', error);
    }
}

export function renderAdmins() {
    const tbody = $('admins-table-body');
    if (!tbody) return;

    tbody.innerHTML = state.admins.map((admin) => {
        const id = escapeHTML(getItemId(admin));
        const isSelf = isCurrentAdmin(admin);

        return `
            <tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td class="p-2 sm:p-3 text-white font-medium">
                    ${escapeHTML(admin.username)}
                    ${isSelf ? '<span class="mr-2 text-[10px] text-amber-400 font-normal">(شما)</span>' : ''}
                </td>
                <td class="p-2 sm:p-3 text-gray-300 font-mono text-xs dir-ltr text-right">${escapeHTML(admin.mobile || '-')}</td>
                <td class="p-2 sm:p-3 text-gray-400 hidden sm:table-cell text-[10px]">${formatDate(admin.createdAt)}</td>
                <td class="p-2 sm:p-3 text-center">
                    <div class="flex items-center justify-center gap-2">
                        <button type="button" data-action="edit-admin" data-id="${id}"
                                class="text-amber-400 hover:text-amber-300 p-1 transition-colors cursor-pointer text-xs flex items-center gap-1" title="ویرایش مدیر">
                            <i class="fa-solid fa-user-pen"></i> ویرایش
                        </button>
                        ${isSelf ? '' : `
                            <button type="button" data-action="delete-admin" data-id="${id}"
                                    class="text-rose-400 hover:text-rose-300 p-1 transition-colors cursor-pointer text-xs flex items-center gap-1" title="حذف ادمین">
                                <i class="fa-solid fa-trash"></i> حذف
                            </button>
                        `}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ---------- افزودن ----------

export const openAdminModal = () => openModal(ADD_MODAL);
export const closeAdminModal = () => closeModal(ADD_MODAL);

export function handleCreateAdmin(event) {
    event?.preventDefault?.();
    return runExclusive('create-admin', async () => {
        const username = $('new-admin-username')?.value.trim();
        const mobile = normalizeDigits($('new-admin-mobile')?.value.trim() || '');
        const password = $('new-admin-password')?.value;

        if (!username || !mobile || !password) {
            showToast('نام کاربری، شماره موبایل و رمز عبور الزامی هستند.', 'error');
            return;
        }
        if (!isValidMobile(mobile)) {
            showToast(MESSAGES.MOBILE_INVALID, 'error');
            return;
        }
        if (!validatePassword(password)) {
            showToast(MESSAGES.PASSWORD_RULE, 'error');
            return;
        }

        try {
            const data = await adminService.createAdmin({ username, mobile, password });
            showToast(data?.message || 'حساب ادمین با موفقیت ایجاد شد.', 'success');
        } catch (error) {
            showToast(errorMessage(error, 'خطا در ایجاد ادمین جدید'), 'error');
            return;
        }

        $('add-admin-form')?.reset();
        closeAdminModal();
        fetchAdmins();
    }, getForm(event));
}

// ---------- ویرایش ----------

export function openEditAdminModal(id) {
    const target = String(id);
    const admin =
        state.admins.find((item) => getItemId(item) === target) ||
        (getItemId(state.currentAdmin) === target ? state.currentAdmin : null);

    if (!admin) {
        showToast('اطلاعات مدیر موردنظر یافت نشد.', 'error');
        return;
    }
    if (!$(EDIT_MODAL)) return;

    const fields = {
        'edit-admin-id': getItemId(admin),
        'edit-admin-username': admin.username || '',
        'edit-admin-mobile': admin.mobile || '',
        'edit-admin-password': '',
    };
    Object.entries(fields).forEach(([fieldId, value]) => {
        const input = $(fieldId);
        if (input) input.value = value;
    });

    openModal(EDIT_MODAL, EDIT_PANEL);
}

export const closeEditAdminModal = () => closeModal(EDIT_MODAL, EDIT_PANEL);

export function handleUpdateAdmin(event) {
    event?.preventDefault?.();
    return runExclusive('update-admin', async () => {
        const id = $('edit-admin-id')?.value;
        const username = $('edit-admin-username')?.value.trim();
        const mobile = normalizeDigits($('edit-admin-mobile')?.value.trim() || '');
        const password = $('edit-admin-password')?.value;

        if (!id) {
            showToast('شناسه مدیر مشخص نیست.', 'error');
            return;
        }
        if (!username || !mobile) {
            showToast('نام کاربری و شماره موبایل الزامی هستند.', 'error');
            return;
        }
        if (!isValidMobile(mobile)) {
            showToast(MESSAGES.MOBILE_INVALID, 'error');
            return;
        }
        if (password && !validatePassword(password)) {
            showToast(`رمز عبور جدید: ${MESSAGES.PASSWORD_RULE}`, 'error');
            return;
        }

        const payload = { username, mobile };
        if (password) payload.password = password;

        try {
            const data = await adminService.updateAdmin(id, payload);
            showToast(data?.message || 'اطلاعات مدیر با موفقیت به‌روزرسانی شد.', 'success');
        } catch (error) {
            showToast(errorMessage(error, 'خطا در به‌روزرسانی اطلاعات مدیر'), 'error');
            return;
        }

        if (getItemId(state.currentAdmin) === String(id)) {
            state.currentAdmin = { ...state.currentAdmin, username, mobile };
            renderCurrentUserBadge();
        }

        closeEditAdminModal();
        fetchAdmins();
    }, getForm(event));
}

// ---------- حذف ----------

export async function deleteAdmin(id) {
    if (getItemId(state.currentAdmin) === String(id)) {
        showToast('شما نمی‌توانید حساب کاربری جاری خود را حذف کنید.', 'error');
        return;
    }
    if (!confirm('آیا از حذف این مدیر اطمینان دارید؟')) return;

    try {
        const data = await adminService.deleteAdmin(id);
        showToast(data?.message || 'مدیر با موفقیت حذف شد.', 'success');
    } catch (error) {
        showToast(errorMessage(error, 'خطا در حذف مدیر'), 'error');
        return;
    }

    fetchAdmins();
}
