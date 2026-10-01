// عملکردهای عمومی رابط کاربری

import { $ } from '../utils/dom.js';

export function togglePasswordVisibility(inputId = 'admin-password', iconId = 'pass-eye-icon') {
    const input = $(inputId);
    const icon = $(iconId);
    if (!input) return;

    const showing = input.type === 'password';
    input.type = showing ? 'text' : 'password';
    icon?.classList.replace(showing ? 'fa-eye' : 'fa-eye-slash', showing ? 'fa-eye-slash' : 'fa-eye');
}

export function openFullPhoto() {
    const detailImg = $('detail-image');
    const lightbox = $('photo-lightbox');
    const lightboxImg = $('lightbox-img');
    if (!detailImg || !lightbox || !lightboxImg || !detailImg.getAttribute('src')) return;

    lightboxImg.src = detailImg.src;
    lightbox.classList.remove('hidden');
}

export function closeFullPhoto() {
    $('photo-lightbox')?.classList.add('hidden');
}

export function toggleMobileMenu() {
    $('header-actions')?.classList.toggle('hidden');
}
