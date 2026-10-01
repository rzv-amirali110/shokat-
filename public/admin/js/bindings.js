// توابعی که HTML ثابت صفحه با onclick="..." صدا می‌زند.
// ماژول‌ها به‌صورت پیش‌فرض سراسری نیستند، پس اینجا یک‌جا روی window قرار می‌گیرند.

import { handleLogout } from './features/auth.js';
import { openAdminModal, closeAdminModal, closeEditAdminModal } from './features/admins.js';
import {
    openProfileModal,
    closeProfileModal,
    openPasswordModal,
    closePasswordModal,
} from './features/profile.js';
import { setFilter, handleSearch, changeModalItemStatus } from './features/submissions.js';
import { closeDetailModal } from './features/detail-modal.js';
import { exportBatchToWord } from './features/export.js';
import {
    togglePasswordVisibility,
    openFullPhoto,
    closeFullPhoto,
    toggleMobileMenu,
} from './features/layout.js';

Object.assign(window, {
    handleLogout,
    openAdminModal,
    closeAdminModal,
    closeEditAdminModal,
    openProfileModal,
    closeProfileModal,
    openPasswordModal,
    closePasswordModal,
    setFilter,
    handleSearch,
    changeModalItemStatus,
    closeDetailModal,
    exportBatchToWord,
    togglePasswordVisibility,
    openFullPhoto,
    closeFullPhoto,
    toggleMobileMenu,
});
