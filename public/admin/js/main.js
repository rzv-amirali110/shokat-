// main.js - نقطه ورود اصلی برنامه

import './bindings.js';
import { state } from './state.js';
import { MESSAGES } from './config.js';
import { injectStyles } from './utils/dom.js';
import { setUnauthorizedHandler } from './services/http.js';
import { showToast } from './ui/toast.js';
import { checkAuth, showLoginScreen } from './features/auth.js';
import { setupListeners } from './listeners.js';

/**
 * تابع راه‌اندازی اولیه برنامه
 */
function init() {
    // ۱. تزریق استایل‌های پویا و سفارشی به DOM
    injectStyles();

    // ۲. تعریف هندلر انقضای نشست کاربری (401)
    // در صورتی که توکن منقضی شود، کاربر به صفحه ورود هدایت می‌شود
    setUnauthorizedHandler(() => {
        if (!state.isLoggedIn) return;
        
        showLoginScreen();
        showToast(MESSAGES.SESSION_EXPIRED || 'نشست کاربری شما منقضی شده است. لطفاً مجدداً وارد شوید.', 'error');
    });

    // ۳. راه اندازی Event Listenerها
    setupListeners();

    // ۴. بررسی وضعیت احراز هویت کاربر و لود داده‌های اولیه
    checkAuth();
}

// اطمینان از بارگذاری کامل DOM قبل از اجرای init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
    init();
}