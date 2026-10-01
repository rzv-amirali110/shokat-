// bindings.js - متصل‌کننده توابع ماژولار به پنجره عمومی (window)
import { 
    togglePasswordVisibility,
    openFullPhoto, 
    closeFullPhoto 
} from './features/layout.js';

// ۲. بخ
// ۱. بخش مدیریت ورود و خروج
import { 
    handleLogin, 
    handleLogout, 
} from './features/auth.js';

// ۲. بخش مدیریت مدیران
import { 
    openAdminModal, 
    closeAdminModal, 
    handleCreateAdmin, 
    openEditAdminModal, 
    closeEditAdminModal, 
    handleUpdateAdmin, 
    deleteAdmin 
} from './features/admins.js';

// ۳. بخش فیلترها و جدول پیام‌ها
import { 
    setFilter, 
    handleSearch 
} from './features/submissions.js';

// ۴. بخش نمایش جزئیات و لایت‌باکس عکس
import { 
    closeDetailModal
} from './features/detail-modal.js';

// ۵. بخش خروجی و صدور فایل Word
import { 
    exportBatchToWord 
} from './features/export.js';

// ۶. بخش لایه و منوی موبایل
import { 
    toggleMobileMenu 
} from './features/layout.js';


// ========================================================
// قرار دادن توابع روی window جهت دسترسی از طریق HTML
// ========================================================

// احراز هویت
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;
window.togglePasswordVisibility = togglePasswordVisibility;

// مدیریت مدیران
window.openAdminModal = openAdminModal;
window.closeAdminModal = closeAdminModal;
window.handleCreateAdmin = handleCreateAdmin;
window.openEditAdminModal = (id) => openEditAdminModal(id);
window.closeEditAdminModal = closeEditAdminModal;
window.handleUpdateAdmin = handleUpdateAdmin;
window.handleDeleteAdmin = (id) => deleteAdmin(id);

// فیلتر و جستجوی پیام‌ها
window.setFilter = setFilter;
window.handleSearch = handleSearch;

// مودال جزئیات و لایت‌باکس
window.closeDetailModal = closeDetailModal;
window.openFullPhoto = openFullPhoto;
window.closeFullPhoto = closeFullPhoto;

// دانلود و خروجی Word
window.exportBatchToWord = exportBatchToWord;

// منوی موبایل
window.toggleMobileMenu = toggleMobileMenu;