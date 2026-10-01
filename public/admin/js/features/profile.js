// پروفایل مدیر جاری و تغییر رمز عبور

import { state } from '../state.js';
import { MESSAGES } from '../config.js';
import { $ } from '../utils/dom.js';
import { normalizeDigits } from '../utils/text.js';
import { isValidMobile, validatePassword } from '../utils/validators.js';
import { errorMessage } from '../services/http.js';
import * as adminService from '../services/admin.service.js';
import { openModal, closeModal } from '../ui/modal.js';
import { getForm, runExclusive } from '../ui/form.js';
import { renderCurrentUserBadge } from '../ui/header.js';
import { showToast } from '../ui/toast.js';
import { fetchAdmins } from './admins.js';

const PROFILE_MODAL = 'profile-modal-backdrop';
const PASSWORD_MODAL = 'password-modal-backdrop';

export function openProfileModal() {
    if (!$(PROFILE_MODAL)) return;

    if (state.currentAdmin) {
        const usernameInput = $('profile-username');
        const mobileInput = $('profile-mobile');
        if (usernameInput) usernameInput.value = state.currentAdmin.username || '';
        if (mobileInput) mobileInput.value = state.currentAdmin.mobile || '';
    }
    openModal(PROFILE_MODAL);
}

export const closeProfileModal = () => closeModal(PROFILE_MODAL);
export const openPasswordModal = () => openModal(PASSWORD_MODAL);
export const closePasswordModal = () => closeModal(PASSWORD_MODAL);

export function handleUpdateProfile(event) {
    event?.preventDefault?.();
    return runExclusive('update-profile', async () => {
        const username = $('profile-username')?.value.trim() || '';
        const mobile = normalizeDigits($('profile-mobile')?.value.trim() || '');

        if (!username && !mobile) {
            showToast('لطفاً حداقل یکی از فیلدها را وارد کنید.', 'error');
            return;
        }
        if (mobile && !isValidMobile(mobile)) {
            showToast(MESSAGES.MOBILE_INVALID, 'error');
            return;
        }

        // فقط فیلدهای پرشده ارسال می‌شوند تا مقدار خالی روی اطلاعات قبلی ننشیند
        const payload = {};
        if (username) payload.username = username;
        if (mobile) payload.mobile = mobile;

        let data;
        try {
            data = await adminService.updateMyProfile(payload);
            showToast(data?.message || 'اطلاعات پروفایل با موفقیت بروزرسانی شد.', 'success');
        } catch (error) {
            showToast(errorMessage(error, 'خطا در بروزرسانی پروفایل'), 'error');
            return;
        }

        state.currentAdmin = data?.data?.admin || data?.admin || { ...state.currentAdmin, ...payload };
        renderCurrentUserBadge();
        closeProfileModal();
        fetchAdmins();
    }, getForm(event));
}

export function handleChangePassword(event) {
    event?.preventDefault?.();
    return runExclusive('change-password', async () => {
        const currentPassword = $('current-password')?.value;
        const newPassword = $('new-password')?.value;

        if (!currentPassword || !newPassword) {
            showToast('لطفاً رمز عبور فعلی و جدید را وارد کنید.', 'error');
            return;
        }
        if (!validatePassword(newPassword)) {
            showToast(`رمز عبور جدید: ${MESSAGES.PASSWORD_RULE}`, 'error');
            return;
        }

        try {
            const data = await adminService.changePassword({ currentPassword, newPassword });
            showToast(data?.message || 'رمز عبور با موفقیت تغییر یافت.', 'success');
        } catch (error) {
            showToast(errorMessage(error, 'خطا در تغییر رمز عبور'), 'error');
            return;
        }

        $('change-password-form')?.reset();
        closePasswordModal();
    }, getForm(event));
}
