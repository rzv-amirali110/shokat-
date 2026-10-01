// نوتیفیکیشن‌ها (Toast)

import { UI } from '../config.js';
import { $ } from '../utils/dom.js';

const TOAST_BG = {
    success: 'bg-emerald-600',
    error: 'bg-rose-600',
    info: 'bg-amber-600',
};

function getContainer() {
    let container = $('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className =
            'fixed top-5 left-1/2 -translate-x-1/2 md:left-5 md:translate-x-0 z-[9999] flex flex-col gap-2 pointer-events-none w-11/12 max-w-sm';
        document.body.appendChild(container);
    }
    return container;
}

export function showToast(message, type = 'info') {
    const container = getContainer();

    const toast = document.createElement('div');
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
    toast.className = `${TOAST_BG[type] || TOAST_BG.info} text-white px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center justify-between transition-all duration-300 transform translate-y-2 opacity-0 pointer-events-auto border border-white/10`;

    const text = document.createElement('span');
    text.className = 'leading-relaxed';
    text.textContent = message;

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'mr-2 text-white/80 hover:text-white cursor-pointer text-base leading-none';
    closeButton.setAttribute('aria-label', 'بستن');
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => toast.remove());

    toast.append(text, closeButton);
    container.appendChild(toast);

    setTimeout(() => toast.classList.remove('translate-y-2', 'opacity-0'), 10);
    setTimeout(() => {
        toast.classList.add('opacity-0');
        setTimeout(() => toast.remove(), UI.MODAL_ANIMATION_MS);
    }, UI.TOAST_DURATION_MS);
}
