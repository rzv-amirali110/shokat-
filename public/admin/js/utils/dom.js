// ابزارهای DOM

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export const $ = (id) => document.getElementById(id);

/** جلوگیری از XSS هنگام درج متن در innerHTML */
export function escapeHTML(value) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}

export function setText(id, value) {
    const el = $(id);
    if (el) el.textContent = value;
}

export function injectStyles() {
    if ($('admin-panel-styles')) return;
    const style = document.createElement('style');
    style.id = 'admin-panel-styles';
    style.textContent = `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    `;
    document.head.appendChild(style);
}
