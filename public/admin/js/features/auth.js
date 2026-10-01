// احراز هویت و مدیریت نشست

import { state, resetSession } from '../state.js';
import { $ } from '../utils/dom.js';
import { errorMessage } from '../services/http.js';
import * as authService from '../services/auth.service.js';
import { getForm, runExclusive } from '../ui/form.js';
import { closeAllModalsImmediately } from '../ui/modal.js';
import { renderCurrentUserBadge } from '../ui/header.js';
import { showToast } from '../ui/toast.js';
import { fetchSubmissions, renderSubmissions, updateStats } from './submissions.js';
import { fetchAdmins, renderAdmins } from './admins.js';

function setAppVisible(visible) {
    $('login-screen')?.classList.toggle('hidden', visible);
    $('admin-header')?.classList.toggle('hidden', !visible);
    $('admin-main')?.classList.toggle('hidden', !visible);
}

export function showLoginScreen() {
    resetSession();
    closeAllModalsImmediately();
    setAppVisible(false);

    // پاک‌سازی داده‌های نشست قبلی از صفحه
    const passwordInput = $('admin-password');
    if (passwordInput) passwordInput.value = '';
    renderSubmissions();
    renderAdmins();
    updateStats();
}

export async function checkAuth() {
    try {
        state.currentAdmin = await authService.fetchCurrentAdmin();
    } catch (error) {
        if (error?.status !== 401) console.error('خطا در بررسی وضعیت ورود:', error);
        showLoginScreen();
        return;
    }

    state.isLoggedIn = true;
    setAppVisible(true);
    renderCurrentUserBadge();

    await Promise.all([fetchSubmissions(), fetchAdmins()]);
}

export function handleLogin(event) {
    event?.preventDefault?.();
    return runExclusive('login', async () => {
        const username = $('admin-username')?.value.trim();
        const password = $('admin-password')?.value;

        if (!username || !password) {
            showToast('لطفاً نام کاربری و رمز عبور را وارد کنید.', 'error');
            return;
        }

        try {
            const data = await authService.login(username, password);
            showToast(data?.message || 'با موفقیت وارد شدید.', 'success');
        } catch (error) {
            showToast(errorMessage(error, 'نام کاربری یا رمز عبور اشتباه است.'), 'error');
            return;
        }

        const passwordInput = $('admin-password');
        if (passwordInput) passwordInput.value = '';

        await checkAuth();
    }, getForm(event));
}

export async function handleLogout() {
    try {
        await authService.logout();
    } catch (error) {
        console.error('خطا در خروج:', error);
    } finally {
        showToast('از حساب کاربری خارج شدید.', 'info');
        showLoginScreen();
    }
}
