// باز و بسته کردن مدال‌ها با انیمیشن

import { UI, MODAL_IDS } from '../config.js';
import { $ } from '../utils/dom.js';

const hideTimers = new WeakMap();

const getPanel = (backdrop, panelSelector) => (panelSelector ? backdrop.querySelector(panelSelector) : null);

export function openModal(backdropId, panelSelector = null) {
    const backdrop = $(backdropId);
    if (!backdrop) return null;

    // اگر هم‌زمان تایمر بستن فعال بود، لغو شود تا مدال تازه‌بازشده مخفی نشود
    clearTimeout(hideTimers.get(backdrop));

    backdrop.classList.remove('hidden');
    void backdrop.offsetWidth; // اجبار reflow برای اجرای transition
    backdrop.classList.remove('opacity-0');
    getPanel(backdrop, panelSelector)?.classList.remove('scale-95');
    return backdrop;
}

export function closeModal(backdropId, panelSelector = null) {
    const backdrop = $(backdropId);
    if (!backdrop) return;

    backdrop.classList.add('opacity-0');
    getPanel(backdrop, panelSelector)?.classList.add('scale-95');

    clearTimeout(hideTimers.get(backdrop));
    hideTimers.set(
        backdrop,
        setTimeout(() => backdrop.classList.add('hidden'), UI.MODAL_ANIMATION_MS)
    );
}

/** بستن فوری همه مدال‌ها (مثلاً هنگام خروج از حساب) */
export function closeAllModalsImmediately() {
    [...MODAL_IDS, 'photo-lightbox'].forEach((id) => {
        const backdrop = $(id);
        if (!backdrop) return;
        clearTimeout(hideTimers.get(backdrop));
        backdrop.classList.add('hidden');
    });
}
