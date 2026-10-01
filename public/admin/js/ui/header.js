import { state } from '../state.js';
import { $ } from '../utils/dom.js';

export function renderCurrentUserBadge() {
    const badge = $('current-user-badge');
    if (badge && state.currentAdmin) {
        badge.textContent = state.currentAdmin.username || 'مدیر ارشد';
    }
}
