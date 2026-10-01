// وضعیت مشترک برنامه (Single source of truth)

import { FILTER } from './config.js';
import { getItemId } from './utils/format.js';

export const state = {
    submissions: [],
    admins: [],
    currentAdmin: null,
    currentFilter: FILTER.ALL,
    searchQuery: '',
    isLoggedIn: false,
    activeModalItem: null, // { id, resourceType }
};

/** پاک‌سازی اطلاعات نشست هنگام خروج یا انقضا */
export function resetSession() {
    state.submissions = [];
    state.admins = [];
    state.currentAdmin = null;
    state.isLoggedIn = false;
    state.activeModalItem = null;
}

export function findSubmission(id, resourceType) {
    const target = String(id);
    return state.submissions.find(
        (item) => getItemId(item) === target && (!resourceType || item.resourceType === resourceType)
    );
}

export function isCurrentAdmin(admin) {
    const currentId = getItemId(state.currentAdmin);
    return currentId !== '' && currentId === getItemId(admin);
}
