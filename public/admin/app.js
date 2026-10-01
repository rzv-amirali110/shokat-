// اسکریپت اصلی مدیریت پنل ادمین
document.head.insertAdjacentHTML("beforeend", `<style>
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>`);

// آدرس‌های پایه بک‌اند
const SERVER_URL = 'http://localhost:3000';
const API_BASE_URL = `${SERVER_URL}/api`;

let submissions = [];
let admins = [];
let currentAdminUser = null; 
let currentFilter = 'ALL';
let searchQuery = '';
let isLoggedIn = false;

// شناسه پیام‌هایی که خروجی گرفته شده‌اند
let exportedIds = JSON.parse(localStorage.getItem('exported_submissions') || '[]');

window.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

function saveExportedIds() {
    localStorage.setItem('exported_submissions', JSON.stringify(exportedIds));
}

function getImageUrl(imagePath) {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${SERVER_URL}${cleanPath}`;
}

// ==========================================
// ۱. احراز هویت و مدیریت نشست (Auth)
// ==========================================

async function checkAuth() {
    try {
        const res = await fetch(`${API_BASE_URL}/admin/me`, {
            method: 'GET',
            credentials: 'include' // ارسال کوکی HTTP-Only
        });

        if (res.ok) {
            const result = await res.json();
            currentAdminUser = result.data?.admin || null;

            isLoggedIn = true;
            document.getElementById('login-screen')?.classList.add('hidden');
            document.getElementById('admin-header')?.classList.remove('hidden');
            document.getElementById('admin-main')?.classList.remove('hidden');

            const badgeElem = document.getElementById('current-user-badge');
            if (badgeElem && currentAdminUser) {
                badgeElem.innerText = currentAdminUser.username;
            }

            fetchSubmissions();
            fetchAdmins();
        } else {
            showLoginScreen();
        }
    } catch (error) {
        console.error('خطا در بررسی وضعیت ورود:', error);
        showLoginScreen();
    }
}

function showLoginScreen() {
    isLoggedIn = false;
    currentAdminUser = null;
    document.getElementById('login-screen')?.classList.remove('hidden');
    document.getElementById('admin-header')?.classList.add('hidden');
    document.getElementById('admin-main')?.classList.add('hidden');
}

async function handleLogin(e) {
    e.preventDefault();
    const usernameInput = document.getElementById('admin-username')?.value.trim();
    const passwordInput = document.getElementById('admin-password')?.value;

    if (!usernameInput || !passwordInput) {
        showToast('لطفاً نام کاربری و رمز عبور را وارد کنید.', 'error');
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username: usernameInput, password: passwordInput })
        });

        const data = await res.json();

        if (res.ok) {
            showToast(data.message || 'با موفقیت وارد شدید.', 'success');
            checkAuth();
        } else {
            showToast(data.message || 'نام کاربری یا رمز عبور اشتباه است.', 'error');
        }
    } catch (error) {
        showToast('خطا در برقراری ارتباط با سرور', 'error');
    }
}

async function handleLogout() {
    try {
        await fetch(`${API_BASE_URL}/admin/logout`, {
            method: 'POST',
            credentials: 'include'
        });
    } catch (e) {
        console.error('خطا در خروج:', e);
    } finally {
        showToast('از حساب کاربری خارج شدید.', 'info');
        showLoginScreen();
    }
}

// ==========================================
// ۲. مدیریت ادمین‌ها (Register, GetList, Delete)
// ==========================================

async function fetchAdmins() {
    try {
        const res = await fetch(`${API_BASE_URL}/admin`, { credentials: 'include' });
        if (res.ok) {
            const result = await res.json();
            admins = result.data?.admins || result.admins || [];
            renderAdmins();
        }
    } catch (error) {
        console.error('خطا در دریافت لیست مدیران:', error);
    }
}

function renderAdmins() {
    const tbody = document.getElementById('admins-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    admins.forEach(admin => {
        const tr = document.createElement('tr');
        tr.className = "border-b border-white/5 hover:bg-white/5 transition-colors";
        
        const adminId = admin.id || admin._id;
        const isSelf = currentAdminUser && (currentAdminUser.id === adminId || currentAdminUser._id === adminId);

        tr.innerHTML = `
            <td class="p-2 sm:p-3 text-white font-medium">
                ${admin.username}
                ${isSelf ? '<span class="mr-2 text-[10px] text-amber-400 font-normal">(شما)</span>' : ''}
            </td>
            <td class="p-2 sm:p-3 text-gray-300 font-mono text-xs dir-ltr text-right">${admin.mobile || '-'}</td>
            <td class="p-2 sm:p-3 text-gray-400 hidden sm:table-cell text-[10px]">
                ${admin.createdAt ? new Date(admin.createdAt).toLocaleDateString('fa-IR') : '-'}
            </td>
            <td class="p-2 sm:p-3 text-center">
                ${!isSelf ? `
                    <button onclick="deleteAdmin('${adminId}')" class="text-rose-400 hover:text-rose-300 p-1 transition-colors cursor-pointer text-xs" title="حذف ادمین">
                        <i class="fa-solid fa-trash"></i> حذف
                    </button>
                ` : '<span class="text-gray-500 text-xs">-</span>'}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ایجاد ادمین جدید (مطابق با متد register در کنترلر)
async function handleCreateAdmin(e) {
    if (e) e.preventDefault();

    const username = document.getElementById('new-admin-username')?.value.trim();
    const mobile = document.getElementById('new-admin-mobile')?.value.trim();
    const password = document.getElementById('new-admin-password')?.value;

    if (!username || !mobile || !password) {
        showToast('نام کاربری، شماره موبایل و رمز عبور الزامی هستند.', 'error');
        return;
    }

    const mobileRegex = /^09\d{9}$/;
    if (!mobileRegex.test(mobile)) {
        showToast('شماره موبایل واردشده معتبر نیست (مثال: 09123456789).', 'error');
        return;
    }

    if (password.length < 6) {
        showToast('رمز عبور باید حداقل ۶ کاراکتر باشد.', 'error');
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/admin/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username, mobile, password })
        });

        const data = await res.json();

        if (res.ok) {
            showToast(data.message || 'حساب ادمین با موفقیت ایجاد شد.', 'success');
            document.getElementById('add-admin-form')?.reset();
            closeAdminModal();
            fetchAdmins();
        } else {
            showToast(data.message || 'خطا در ایجاد ادمین جدید', 'error');
        }
    } catch (error) {
        showToast('خطا در برقراری ارتباط با سرور', 'error');
    }
}
const handleAddAdmin = handleCreateAdmin;

// حذف ادمین (مطابق با متد deleteAdmin در کنترلر)
async function deleteAdmin(id) {
    if (currentAdminUser && (currentAdminUser.id === id || currentAdminUser._id === id)) {
        showToast('شما نمی‌توانید حساب کاربری جاری خود را حذف کنید.', 'error');
        return;
    }

    if (!confirm('آیا از حذف این مدیر اطمینان دارید؟')) return;

    try {
        const res = await fetch(`${API_BASE_URL}/admin/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const data = await res.json();

        if (res.ok) {
            showToast(data.message || 'مدیر با موفقیت حذف شد.', 'success');
            fetchAdmins();
        } else {
            showToast(data.message || 'خطا در حذف مدیر', 'error');
        }
    } catch (error) {
        showToast('خطا در برقراری ارتباط با سرور', 'error');
    }
}

// ==========================================
// ۳. دریافت و نمایش مطالبات و خاطرات (Submissions)
// ==========================================

async function fetchSubmissions() {
    try {
        const [demandsRes, storiesRes] = await Promise.all([
            fetch(`${API_BASE_URL}/demands`, { credentials: 'include' }),
            fetch(`${API_BASE_URL}/stories`, { credentials: 'include' })
        ]);

        let combinedData = [];

        if (demandsRes.ok) {
            const demandsJson = await demandsRes.json();
            const demandsList = demandsJson.data?.items || demandsJson.items || [];
            combinedData.push(...demandsList.map(item => ({ ...item, resourceType: 'demands' })));
        }

        if (storiesRes.ok) {
            const storiesJson = await storiesRes.json();
            const storiesList = storiesJson.data?.items || storiesJson.items || [];
            combinedData.push(...storiesList.map(item => ({ ...item, resourceType: 'stories' })));
        }

        submissions = combinedData;
        updateStats();
        renderSubmissions();
    } catch (error) {
        console.error('Fetch error:', error);
        showToast('خطا در دریافت اطلاعات از سرور', 'error');
    }
}

function renderSubmissions() {
    const tbody = document.getElementById('submissions-table-body');
    const emptyState = document.getElementById('empty-state');
    if (!tbody) return;

    tbody.innerHTML = '';

    let filtered = submissions.filter(item => {
        const itemId = String(item._id || item.id);
        if (currentFilter === 'demands') return item.resourceType === 'demands';
        if (currentFilter === 'stories') return item.resourceType === 'stories';
        if (currentFilter === 'pending') return item.status === 'PENDING';
        if (currentFilter === 'approved') return item.status === 'APPROVED';
        if (currentFilter === 'rejected') return item.status === 'REJECTED';
        if (currentFilter === 'unexported') return !exportedIds.includes(itemId);
        return true;
    });

    if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(item => 
            (item.title && item.title.toLowerCase().includes(q)) ||
            (item.description && item.description.toLowerCase().includes(q))
        );
    }

    if (filtered.length === 0) {
        emptyState?.classList.remove('hidden');
        return;
    }
    emptyState?.classList.add('hidden');

    filtered.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.className = "border-b border-white/5 hover:bg-white/5 transition-colors block md:table-row p-3 md:p-0 mb-3 md:mb-0 rounded-xl bg-white/5 md:bg-transparent";
        
        const fullImgUrl = getImageUrl(item.imageUrl);
        const itemId = String(item._id || item.id);
        const isExported = exportedIds.includes(itemId);

        tr.innerHTML = `
            <td class="p-2 md:p-4 text-gray-300 font-mono text-[11px]">${index + 1}</td>
            <td class="p-2 md:p-4">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${item.resourceType === 'demands' ? 'bg-brand-orange/20 text-brand-orange border border-brand-orange/30' : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'}">
                    ${item.resourceType === 'demands' ? 'مطالبه' : 'خاطره'}
                </span>
            </td>
            <td class="p-2 md:p-4 font-semibold text-white max-w-xs truncate">
                ${item.title || 'بدون عنوان'}
                ${fullImgUrl ? '<i class="fa-solid fa-paperclip text-amber-400 mr-2" title="دارای تصویر"></i>' : ''}
            </td>
            <td class="p-2 md:p-4 text-center">
                <div class="flex items-center justify-center gap-1">
                    <span class="px-2 py-0.5 rounded text-[10px] ${getStatusBadgeClass(item.status)}">
                        ${getStatusText(item.status)}
                    </span>
                    ${isExported ? `
                        <span class="px-2 py-0.5 rounded text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/30" title="خروجی Word گرفته شده">
                            <i class="fa-solid fa-file-word ml-1"></i>خروجی گرفته‌شده
                        </span>
                    ` : ''}
                </div>
            </td>
            <td class="p-2 md:p-4 text-center">
                <div class="flex items-center justify-center gap-2 flex-wrap">
                    <button onclick="openDetailModal('${itemId}', '${item.resourceType}')" class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-brand-orange text-white text-[11px] transition-all cursor-pointer">
                        مشاهده و جزئیات
                    </button>

                    <div class="inline-flex rounded-lg bg-white/5 p-0.5 border border-white/10">
                        <button onclick="updateItemStatus('${itemId}', '${item.resourceType}', 'APPROVED')" 
                                class="px-2 py-1 text-[10px] rounded transition-all cursor-pointer ${item.status === 'APPROVED' ? 'bg-emerald-500 text-white' : 'text-emerald-400 hover:bg-emerald-500/20'}"
                                title="تایید پیام">
                            تایید
                        </button>
                        <button onclick="updateItemStatus('${itemId}', '${item.resourceType}', 'REJECTED')" 
                                class="px-2 py-1 text-[10px] rounded transition-all cursor-pointer ${item.status === 'REJECTED' ? 'bg-rose-500 text-white' : 'text-rose-400 hover:bg-rose-500/20'}"
                                title="رد پیام">
                            رد
                        </button>
                        <button onclick="updateItemStatus('${itemId}', '${item.resourceType}', 'PENDING')" 
                                class="px-2 py-1 text-[10px] rounded transition-all cursor-pointer ${item.status === 'PENDING' ? 'bg-amber-500 text-white' : 'text-amber-400 hover:bg-amber-500/20'}"
                                title="در انتظار تایید">
                            انتظار
                        </button>
                    </div>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function updateItemStatus(id, resourceType, newStatus) {
    try {
        const res = await fetch(`${API_BASE_URL}/${resourceType}/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ status: newStatus })
        });

        const data = await res.json();

        if (res.ok) {
            showToast(`وضعیت با موفقیت به «${getStatusText(newStatus)}» تغییر یافت.`, 'success');
            
            const item = submissions.find(s => String(s._id || s.id) === String(id));
            if (item) item.status = newStatus;

            updateStats();
            renderSubmissions();

            if (window.currentActiveModalItem && String(window.currentActiveModalItem.id) === String(id)) {
                setActiveModalStatusButtons(newStatus);
            }
        } else {
            showToast(data.message || 'خطا در تغییر وضعیت', 'error');
        }
    } catch (error) {
        showToast('خطا در برقراری ارتباط با سرور', 'error');
    }
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'APPROVED': return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
        case 'REJECTED': return 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
        default: return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
    }
}

function getStatusText(status) {
    switch (status) {
        case 'APPROVED': return 'تایید شده';
        case 'REJECTED': return 'رد شده';
        default: return 'در انتظار تایید';
    }
}

function updateStats() {
    const unexportedDemands = submissions.filter(s => s.resourceType === 'demands' && s.status === 'APPROVED' && !exportedIds.includes(String(s._id || s.id))).length;
    const unexportedStories = submissions.filter(s => s.resourceType === 'stories' && s.status === 'APPROVED' && !exportedIds.includes(String(s._id || s.id))).length;
    const pendingCount = submissions.filter(s => s.status === 'PENDING').length;
    const totalExportedCount = submissions.filter(s => exportedIds.includes(String(s._id || s.id))).length;

    if (document.getElementById('stat-unexported-demands')) document.getElementById('stat-unexported-demands').innerText = unexportedDemands;
    if (document.getElementById('stat-unexported-memories')) document.getElementById('stat-unexported-memories').innerText = unexportedStories;
    if (document.getElementById('stat-total-submissions')) document.getElementById('stat-total-submissions').innerText = pendingCount;
    if (document.getElementById('stat-exported-batches')) document.getElementById('stat-exported-batches').innerText = totalExportedCount;
}

// ==========================================
// ۴. مدیریت مدال‌ها و خروجی Word
// ==========================================

function openDetailModal(id, resourceType) {
    const item = submissions.find(s => String(s._id || s.id) === String(id));
    if (!item) return;

    const itemId = String(item._id || item.id);

    document.getElementById('detail-subject').innerText = item.title || 'بدون عنوان';
    document.getElementById('detail-text').innerText = item.description || '';
    document.getElementById('detail-date').innerText = item.createdAt ? new Date(item.createdAt).toLocaleDateString('fa-IR') : '-';
    document.getElementById('detail-id').innerText = `ID: ${itemId}`;

    const categoryBadge = document.getElementById('detail-category-badge');
    if (categoryBadge) categoryBadge.innerText = item.resourceType === 'demands' ? 'مطالبه' : 'خاطره';

    const imageBox = document.getElementById('detail-image-box');
    const imgElem = document.getElementById('detail-image');
    const fullImageUrl = getImageUrl(item.imageUrl);

    if (fullImageUrl) {
        imgElem.src = fullImageUrl;
        imageBox.classList.remove('hidden');
    } else {
        imageBox.classList.add('hidden');
        imgElem.src = '';
    }

    window.currentActiveModalItem = { id: itemId, resourceType: item.resourceType };
    setActiveModalStatusButtons(item.status);

    const modalBackdrop = document.getElementById('detail-modal-backdrop');
    if (!modalBackdrop) return;
    modalBackdrop.classList.remove('hidden');
    setTimeout(() => {
        modalBackdrop.classList.remove('opacity-0');
        modalBackdrop.querySelector('div')?.classList.remove('scale-95');
    }, 10);
}

function setActiveModalStatusButtons(status) {
    const btnApproved = document.getElementById('modal-btn-approve');
    const btnRejected = document.getElementById('modal-btn-reject');
    const btnPending = document.getElementById('modal-btn-pending');

    if (btnApproved) btnApproved.className = `px-4 py-2 rounded-xl font-bold text-xs transition-all ${status === 'APPROVED' ? 'bg-emerald-600 text-white ring-2 ring-emerald-400' : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/40'}`;
    if (btnRejected) btnRejected.className = `px-4 py-2 rounded-xl font-bold text-xs transition-all ${status === 'REJECTED' ? 'bg-rose-600 text-white ring-2 ring-rose-400' : 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/40'}`;
    if (btnPending) btnPending.className = `px-4 py-2 rounded-xl font-bold text-xs transition-all ${status === 'PENDING' ? 'bg-amber-600 text-white ring-2 ring-amber-400' : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/40'}`;
}

function changeModalItemStatus(newStatus) {
    if (!window.currentActiveModalItem) return;
    const { id, resourceType } = window.currentActiveModalItem;
    updateItemStatus(id, resourceType, newStatus);
}

function closeDetailModal() {
    const modalBackdrop = document.getElementById('detail-modal-backdrop');
    if (!modalBackdrop) return;
    modalBackdrop.classList.add('opacity-0');
    modalBackdrop.querySelector('div')?.classList.add('scale-95');
    setTimeout(() => modalBackdrop.classList.add('hidden'), 300);
}

function setFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('[id^="tab-"]').forEach(btn => {
        const isActive = btn.id === `tab-${filter}`;
        btn.classList.toggle('bg-brand-orange', isActive);
        btn.classList.toggle('text-white', isActive);
        btn.classList.toggle('text-gray-400', !isActive);
        btn.classList.toggle('hover:text-white', !isActive);
    });
    renderSubmissions();
}

function handleSearch() {
    searchQuery = document.getElementById('search-input')?.value || '';
    renderSubmissions();
}

function openAdminModal() {
    const modal = document.getElementById('admin-modal-backdrop');
    if (!modal) return;
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.remove('opacity-0'), 10);
}

function closeAdminModal() {
    const modal = document.getElementById('admin-modal-backdrop');
    if (!modal) return;
    modal.classList.add('opacity-0');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const bgClass = type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-rose-600' : 'bg-amber-600';

    toast.className = `${bgClass} text-white px-4 py-3 rounded-xl shadow-lg text-xs font-semibold flex items-center justify-between transition-all duration-300 transform translate-y-2 opacity-0 pointer-events-auto`;
    toast.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" class="mr-2 text-white/80 hover:text-white cursor-pointer">&times;</button>
    `;

    container.appendChild(toast);
    setTimeout(() => toast.classList.remove('translate-y-2', 'opacity-0'), 10);
    setTimeout(() => {
        toast.classList.add('opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}