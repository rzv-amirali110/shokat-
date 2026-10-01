// نقطه ورود پنل ادمین شوکت نیوز

import './bindings.js';
import { state } from './state.js';
import { MESSAGES } from './config.js';
import { injectStyles } from './utils/dom.js';
import { setUnauthorizedHandler } from './services/http.js';
import { showToast } from './ui/toast.js';
import { checkAuth, showLoginScreen } from './features/auth.js';
import { setupListeners } from './listeners.js';

function init() {
    injectStyles();

    // انقضای نشست در هر درخواست → بازگشت به صفحه ورود
    setUnauthorizedHandler(() => {
        if (!state.isLoggedIn) return;
        showLoginScreen();
        showToast(MESSAGES.SESSION_EXPIRED, 'error');
    });

    setupListeners();
    checkAuth();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
    init();
}
