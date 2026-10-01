// شنودگرهای رویداد (فرم‌ها، دکمه‌های داینامیک، کلید Escape)

import { state } from './state.js';
import { $ } from './utils/dom.js';
import { handleLogin } from './features/auth.js';
import {
    handleCreateAdmin,
    handleUpdateAdmin,
    openEditAdminModal,
    deleteAdmin,
    closeAdminModal,
    closeEditAdminModal,
} from './features/admins.js';
import { handleUpdateProfile, handleChangePassword, closeProfileModal, closePasswordModal } from './features/profile.js';
import { deleteSubmission, toggleExportStatus, updateItemStatus } from './features/submissions.js';
import { openDetailModal, closeDetailModal } from './features/detail-modal.js';
import { closeFullPhoto } from './features/layout.js';

// اکشن‌های دکمه‌های ساخته‌شده به‌صورت داینامیک (data-action) — بدون onclick درون‌خطی
const ACTIONS = {
    'open-detail': ({ id, resource }) => openDetailModal(id, resource),
    'update-status': ({ id, resource, status }) => updateItemStatus(id, resource, status),
    'delete-submission': ({ id, resource }) => deleteSubmission(id, resource),
    'toggle-export': ({ id }) => toggleExportStatus(id),
    'edit-admin': ({ id }) => openEditAdminModal(id),
    'delete-admin': ({ id }) => deleteAdmin(id),
};

// مدال‌ها به ترتیب اولویت بسته شدن با Escape
const MODAL_CLOSERS = [
    { id: 'photo-lightbox', close: closeFullPhoto, closeOnBackdrop: false },
    { id: 'detail-modal-backdrop', close: closeDetailModal, closeOnBackdrop: true },
    { id: 'edit-admin-modal-backdrop', close: closeEditAdminModal, closeOnBackdrop: true },
    { id: 'admin-modal-backdrop', close: closeAdminModal, closeOnBackdrop: true },
    { id: 'profile-modal-backdrop', close: closeProfileModal, closeOnBackdrop: true },
    { id: 'password-modal-backdrop', close: closePasswordModal, closeOnBackdrop: true },
];

function setupForms() {
    const forms = {
        'login-form': handleLogin,
        'add-admin-form': handleCreateAdmin,
        'edit-admin-form': handleUpdateAdmin,
        'profile-form': handleUpdateProfile,
        'change-password-form': handleChangePassword,
    };
    Object.entries(forms).forEach(([id, handler]) => $(id)?.addEventListener('submit', handler));
}

function setupDelegatedActions() {
    document.addEventListener('click', (event) => {
        const element = event.target.closest('[data-action]');
        const action = element && ACTIONS[element.dataset.action];
        if (action) action(element.dataset);
    });
}

function setupModalDismissal() {
    MODAL_CLOSERS.forEach(({ id, close, closeOnBackdrop }) => {
        if (!closeOnBackdrop) return;
        const backdrop = $(id);
        backdrop?.addEventListener('click', (event) => {
            if (event.target === backdrop) close();
        });
    });

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        const open = MODAL_CLOSERS.find(({ id }) => {
            const el = $(id);
            return el && !el.classList.contains('hidden');
        });
        open?.close();
    });
}

// دکمه حذف داخل مدال جزئیات (جایگزین onclick قبلی به‌جای اتصال مجدد در هر بار باز شدن)
function setupDetailModalDelete() {
    const button = $('modal-btn-delete');
    if (!button) return;
    button.onclick = () => {
        const active = state.activeModalItem;
        if (active) deleteSubmission(active.id, active.resourceType);
    };
}

export function setupListeners() {
    setupForms();
    setupDelegatedActions();
    setupModalDismissal();
    setupDetailModalDelete();
}
