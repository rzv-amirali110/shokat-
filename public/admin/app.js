 // Utilities to fix horizontal scrollbars (hide-scrollbar)
        document.head.insertAdjacentHTML("beforeend", `<style>
            .hide-scrollbar::-webkit-scrollbar { display: none; }
            .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        </style>`);

        // Mock Initial Data
        const initialMockSubmissions = [
            { id: 'SUB-1001', category: 'demands', subject: 'کیفیت نازل غذای سلف مرکزی در روزهای سه‌شنبه', text: 'کیفیت برنج و چلو مرغ سلف مرکزی شوکت بسیار پایین است و چند بار توسط دانشجویان خوابگاهی گزارش شده اما رسیدگی نشده است.', imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60', isAnonymous: true, isExported: false, date: '۱۴۰۵/۰۷/۰۷ - ۱۴:۳۰' },
            { id: 'SUB-1002', category: 'memories', subject: 'خاطره اولین روز ورود به دانشکده مهندسی', text: 'ترم یک که وارد شوکت شدم کلاً کلاس ۳۰۲ رو گم کرده بودم و یک ساعت تمام دور دانشکده می‌چرخیدم! آخرش استاد نمره کلاسی رو ازم کم کرد!', imageUrl: '', isAnonymous: false, isExported: false, date: '۱۴۰۵/۰۷/۰۶ - ۰۹:۱۵' },
            { id: 'SUB-1003', category: 'demands', subject: 'خرابی سیستم گرمایشی خوابگاه صبا', text: 'با شروع فصل سرما هنوز پکیج‌ها و شوفاژهای طبقه سوم خوابگاه صبا خاموشه و بچه‌ها مجبورن از هیتر برقی شخصی استفاده کنن.', imageUrl: '', isAnonymous: true, isExported: true, date: '۱۴۰۵/۰۷/۰۵ - ۲۲:۱۰' },
            { id: 'SUB-1004', category: 'memories', subject: 'شب امتحان فیزیک ۲ در خوابگاه', text: 'یادش بخیر ترم قبل تا ساعت ۵ صبح با بچه‌ها خوابگاه فیزیک ۲ می‌خوندیم و چای کیسه‌ای می‌خوردیم. آخرشم همه‌مون ۱۴ شدیم!', imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=500&auto=format&fit=crop&q=60', isAnonymous: true, isExported: false, date: '۱۴۰۵/۰۷/۰۴ - ۱۱:۴۵' },
            { id: 'SUB-1005', category: 'demands', subject: 'نیاز به افزایش سرویس‌های رفت و آمد خوابگاه به دانشگاه', text: 'تعداد سرویس‌های اتوبوس برای مسیر خوابگاه به دانشگاه در ساعات پیک بسیار کم است و دانشجویان سرپا می‌ایستند.', imageUrl: '', isAnonymous: true, isExported: false, date: '۱۴۰۵/۰۷/۰۳ - ۰۸:۰۰' }
        ];

        let submissions = [];
        let admins = [];
        let currentFilter = 'ALL';
        let searchQuery = '';
        let isLoggedIn = false;

        const defaultAdmins = [
            { id: 'ADM-1001', username: 'admin', password: 'admin123', fullName: 'مدیر ارشد سیستم', role: 'superadmin', date: '۱۴۰۵/۰۱/۰۱' }
        ];

        window.addEventListener('DOMContentLoaded', () => {
            loadSubmissionsFromStorage();
            loadAdminsFromStorage();
            checkAuth();
        });

        function loadSubmissionsFromStorage() {
            const saved = localStorage.getItem('showkat_submissions');
            if (saved) {
                try { submissions = JSON.parse(saved); } catch(e) { submissions = [...initialMockSubmissions]; }
            } else {
                submissions = [...initialMockSubmissions];
                saveToStorage();
            }
        }

        function loadAdminsFromStorage() {
            const savedAdmins = localStorage.getItem('showkat_admins');
            if (savedAdmins) {
                try { admins = JSON.parse(savedAdmins); } catch(e) { admins = [...defaultAdmins]; }
            } else {
                admins = [...defaultAdmins];
                saveAdminsToStorage();
            }
        }

        function saveAdminsToStorage() { localStorage.setItem('showkat_admins', JSON.stringify(admins)); }
        function saveToStorage() { localStorage.setItem('showkat_submissions', JSON.stringify(submissions)); }

        function checkAuth() {
            const authState = sessionStorage.getItem('admin_logged_in');
            const currentUser = sessionStorage.getItem('admin_current_user');
            
            if (authState === 'true') {
                isLoggedIn = true;
                document.getElementById('login-screen').classList.add('hidden');
                document.getElementById('admin-header').classList.remove('hidden');
                document.getElementById('admin-main').classList.remove('hidden');

                if (currentUser) {
                    try {
                        const userObj = JSON.parse(currentUser);
                        const badgeElem = document.getElementById('current-user-badge');
                        if (badgeElem && userObj.fullName) {
                            badgeElem.innerText = `${userObj.fullName.split(' ')[0]} (${userObj.role === 'superadmin' ? 'ارشد' : 'اپراتور'})`;
                        }
                    } catch(e) {}
                }
                renderDashboard();
            }
        }

        function toggleMobileMenu() {
            const actions = document.getElementById('header-actions');
            const icon = document.getElementById('mobile-menu-icon');
            
            if (actions.classList.contains('hidden')) {
                actions.classList.remove('hidden');
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-xmark');
            } else {
                actions.classList.add('hidden');
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
            }
        }

        function handleLogin(e) {
            e.preventDefault();
            const user = document.getElementById('admin-username').value.trim();
            const pass = document.getElementById('admin-password').value.trim();
            const foundAdmin = admins.find(a => a.username.toLowerCase() === user.toLowerCase() && a.password === pass);

            if (foundAdmin) {
                sessionStorage.setItem('admin_logged_in', 'true');
                sessionStorage.setItem('admin_current_user', JSON.stringify(foundAdmin));
                showToast(`با موفقیت وارد شدید. خوش آمدید`, 'success');
                checkAuth();
            } else {
                showToast('نام کاربری یا کلمه عبور اشتباه است.', 'error');
            }
        }

        function handleLogout() {
            sessionStorage.removeItem('admin_logged_in');
            sessionStorage.removeItem('admin_current_user');
            location.reload();
        }

        function togglePasswordVisibility() {
            const passInput = document.getElementById('admin-password');
            const icon = document.getElementById('pass-eye-icon');
            if (passInput.type === 'password') {
                passInput.type = 'text';
                icon.className = 'fa-solid fa-eye-slash text-xs sm:text-sm';
            } else {
                passInput.type = 'password';
                icon.className = 'fa-solid fa-eye text-xs sm:text-sm';
            }
        }

        // Admin Management Logic
        function openAdminModal() {
            // Close mobile menu if open
            const actions = document.getElementById('header-actions');
            if (!actions.classList.contains('hidden') && window.innerWidth < 768) {
                toggleMobileMenu();
            }
            
            renderAdminsList();
            const backdrop = document.getElementById('admin-modal-backdrop');
            backdrop.classList.remove('hidden');
            setTimeout(() => backdrop.classList.remove('opacity-0'), 10);
        }

        function closeAdminModal() {
            const backdrop = document.getElementById('admin-modal-backdrop');
            backdrop.classList.add('opacity-0');
            setTimeout(() => backdrop.classList.add('hidden'), 300);
        }

        function handleAddAdmin(e) {
            e.preventDefault();
            const name = document.getElementById('new-admin-name').value.trim();
            const username = document.getElementById('new-admin-username').value.trim();
            const password = document.getElementById('new-admin-password').value.trim();
            const role = document.getElementById('new-admin-role').value;

            if (!name || !username || !password) return showToast('لطفاً تمامی فیلدها را تکمیل کنید.', 'error');
            if (admins.some(a => a.username.toLowerCase() === username.toLowerCase())) return showToast('این نام کاربری قبلاً ثبت شده است.', 'error');

            const newAdmin = {
                id: 'ADM-' + Math.floor(1000 + Math.random() * 9000),
                username, password, fullName: name, role,
                date: new Date().toLocaleDateString('fa-IR')
            };

            admins.push(newAdmin);
            saveAdminsToStorage();
            renderAdminsList();
            document.getElementById('add-admin-form').reset();
            showToast(`مدیر جدید با موفقیت افزوده شد.`, 'success');
        }

        function deleteAdmin(id) {
            const target = admins.find(a => a.id === id);
            if (target && target.username === 'admin') return showToast('امکان حذف مدیر اصلی وجود ندارد.', 'error');
            admins = admins.filter(a => a.id !== id);
            saveAdminsToStorage();
            renderAdminsList();
            showToast('مدیر مورد نظر حذف شد.', 'success');
        }

        function renderAdminsList() {
            const tbody = document.getElementById('admins-table-body');
            if (!tbody) return;
            tbody.innerHTML = '';

            admins.forEach(admin => {
                const tr = document.createElement('tr');
                tr.className = 'border-b border-white/5 hover:bg-white/5 transition-colors';
                const roleBadge = admin.role === 'superadmin' 
                    ? '<span class="px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold bg-amber-500/20 text-amber-300">مدیر ارشد</span>'
                    : '<span class="px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold bg-sky-500/20 text-sky-300">اپراتور</span>';

                tr.innerHTML = `
                    <td class="p-2 sm:p-3 text-white font-medium text-[10px] sm:text-xs">
                        <span class="block truncate max-w-[100px] sm:max-w-none">${admin.fullName}</span>
                        <span class="block text-[9px] sm:text-[10px] text-gray-400 font-mono mt-0.5">@${admin.username}</span>
                    </td>
                    <td class="p-2 sm:p-3">${roleBadge}</td>
                    <td class="p-2 sm:p-3 text-gray-400 text-[10px] sm:text-[11px] hidden sm:table-cell">${admin.date || '-'}</td>
                    <td class="p-2 sm:p-3 text-center">
                        ${admin.username === 'admin' ? '<span class="text-[9px] text-gray-500">پیش‌فرض</span>' : `
                            <button onclick="deleteAdmin('${admin.id}')" title="حذف مدیر" class="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white flex items-center justify-center transition-all mx-auto">
                                <i class="fa-solid fa-trash text-[10px] sm:text-xs"></i>
                            </button>
                        `}
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }

        // Dashboard & Table Logic
        function renderDashboard() { updateStats(); renderTable(); }

        function updateStats() {
            document.getElementById('stat-unexported-demands').innerText = submissions.filter(s => s.category === 'demands' && !s.isExported).length;
            document.getElementById('stat-unexported-memories').innerText = submissions.filter(s => s.category === 'memories' && !s.isExported).length;
            document.getElementById('stat-total-submissions').innerText = submissions.length;
            document.getElementById('stat-exported-batches').innerText = submissions.filter(s => s.isExported).length;
        }

        function renderTable() {
            const tbody = document.getElementById('submissions-table-body');
            const emptyState = document.getElementById('empty-state');
            tbody.innerHTML = '';

            let filtered = submissions.filter(item => {
                if (currentFilter === 'demands') return item.category === 'demands';
                if (currentFilter === 'memories') return item.category === 'memories';
                if (currentFilter === 'unexported') return !item.isExported;
                return true;
            });

            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                filtered = filtered.filter(i => (i.subject && i.subject.toLowerCase().includes(query)) || (i.text && i.text.toLowerCase().includes(query)) || (i.id && i.id.toLowerCase().includes(query)));
            }

            if (filtered.length === 0) {
                emptyState.classList.remove('hidden');
                document.querySelector('.table-container').classList.add('hidden');
            } else {
                emptyState.classList.add('hidden');
                document.querySelector('.table-container').classList.remove('hidden');
            }

            filtered.forEach(item => {
                const tr = document.createElement('tr');
                
                const catText = item.category === 'demands' ? 'مطالبه' : 'خاطره';
                const catColor = item.category === 'demands' ? 'bg-brand-orange/20 text-brand-orange' : 'bg-amber-500/20 text-amber-300';
                
                const statusText = item.isExported ? 'گرفته‌‌شد' : 'منتظر';
                const statusColor = item.isExported ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300';

                const photoIcon = item.imageUrl ? '<i class="fa-solid fa-image text-brand-orange ml-1"></i>' : '';

                tr.className = 'block md:table-row hover:bg-white/5 transition-colors border border-white/10 md:border-0 md:border-b md:border-white/5 bg-black/20 md:bg-transparent rounded-xl md:rounded-none mb-4 md:mb-0 shadow-lg md:shadow-none';

                tr.innerHTML = `
                    <td class="flex md:table-cell justify-between items-center p-3 md:p-4 align-middle border-b border-white/5 md:border-0">
                        <span class="md:hidden text-[10px] text-gray-400 font-bold">کد / تاریخ:</span>
                        <div class="text-left md:text-right">
                            <span class="block font-bold text-gray-200 text-[10px] sm:text-xs">${item.id}</span>
                            <span class="block text-[9px] sm:text-[10px] text-gray-500 mt-1 md:mt-0">${item.date.split(' - ')[0]}</span>
                        </div>
                    </td>
                    <td class="flex md:table-cell justify-between items-center p-3 md:p-4 align-middle border-b border-white/5 md:border-0">
                        <span class="md:hidden text-[10px] text-gray-400 font-bold">نوع پیام:</span>
                        <span class="px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold ${catColor}">${catText}</span>
                    </td>
                    <td class="flex md:table-cell justify-between items-center p-3 md:p-4 align-middle border-b border-white/5 md:border-0">
                        <span class="md:hidden text-[10px] text-gray-400 font-bold shrink-0 ml-2">موضوع:</span>
                        <div class="line-clamp-1 md:truncate max-w-[180px] text-left md:text-right leading-relaxed text-[11px] sm:text-xs font-medium text-gray-200">
                            ${photoIcon}${item.subject || 'بدون عنوان'}
                        </div>
                    </td>
                    <td class="hidden md:table-cell p-3 md:p-4 text-gray-400 text-[10px] sm:text-xs align-middle">
                        ${item.isAnonymous ? 'ناشناس' : 'عادی'}
                    </td>
                    <td class="flex md:table-cell justify-between items-center p-3 md:p-4 align-middle border-b border-white/5 md:border-0 text-center">
                        <span class="md:hidden text-[10px] text-gray-400 font-bold">وضعیت:</span>
                        <span class="px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] border border-transparent ${statusColor} bg-opacity-30 border-opacity-30">${statusText}</span>
                    </td>
                    <td class="flex md:table-cell justify-between items-center p-3 md:p-4 align-middle text-center">
                        <span class="md:hidden text-[10px] text-gray-400 font-bold">عملیات:</span>
                        <div class="flex items-center justify-end md:justify-center gap-1.5 sm:gap-2">
                            <button onclick="openDetailModal('${item.id}')" title="مشاهده" class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-white/10 hover:bg-brand-orange text-white flex items-center justify-center transition-all">
                                <i class="fa-solid fa-eye text-[10px] sm:text-xs"></i>
                            </button>
                            <button onclick="toggleExportStatus('${item.id}')" title="تغییر وضعیت" class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-white/10 hover:bg-amber-500 text-white flex items-center justify-center transition-all">
                                <i class="fa-solid fa-rotate text-[10px] sm:text-xs"></i>
                            </button>
                            <button onclick="deleteSubmission('${item.id}')" title="حذف" class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-white/10 hover:bg-rose-600 text-white flex items-center justify-center transition-all">
                                <i class="fa-solid fa-trash text-[10px] sm:text-xs"></i>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }

        function setFilter(filter) {
            currentFilter = filter;
            ['ALL', 'demands', 'memories', 'unexported'].forEach(f => {
                const btn = document.getElementById(`tab-${f}`);
                if (f === filter) {
                    btn.className = 'px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold transition-all bg-brand-orange text-white shrink-0';
                } else {
                    btn.className = 'px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold transition-all text-gray-400 hover:text-white shrink-0';
                }
            });
            renderTable();
        }

        function handleSearch() { searchQuery = document.getElementById('search-input').value.trim(); renderTable(); }

        // Detail Modal Logic
        function openDetailModal(id) {
            const item = submissions.find(s => s.id === id);
            if (!item) return;

            document.getElementById('detail-category-badge').innerText = item.category === 'demands' ? 'مطالبه' : 'خاطره';
            document.getElementById('detail-date').innerText = item.date;
            document.getElementById('detail-id').innerText = item.id;
            document.getElementById('detail-subject').innerText = item.subject || 'بدون عنوان';
            document.getElementById('detail-text').innerText = item.text;
            document.getElementById('detail-sender').innerText = `فرستنده: ${item.isAnonymous ? 'ناشناس' : 'عادی'}`;
            
            const expStatus = document.getElementById('detail-export-status');
            expStatus.innerText = `خروجی: ${item.isExported ? 'گرفته‌شد' : 'منتظر'}`;
            expStatus.className = `px-2 py-1 rounded text-[10px] sm:text-[11px] ${item.isExported ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`;

            const imgBox = document.getElementById('detail-image-box');
            const imgElem = document.getElementById('detail-image');
            if (item.imageUrl) { imgElem.src = item.imageUrl; imgBox.classList.remove('hidden'); } 
            else { imgBox.classList.add('hidden'); }

            const backdrop = document.getElementById('detail-modal-backdrop');
            backdrop.classList.remove('hidden');
            setTimeout(() => backdrop.classList.remove('opacity-0'), 10);
        }

        function closeDetailModal() {
            const backdrop = document.getElementById('detail-modal-backdrop');
            backdrop.classList.add('opacity-0');
            setTimeout(() => backdrop.classList.add('hidden'), 300);
        }

        function toggleExportStatus(id) {
            const item = submissions.find(s => s.id === id);
            if (item) {
                item.isExported = !item.isExported;
                saveToStorage(); renderDashboard(); showToast('وضعیت بروزرسانی شد.', 'success');
            }
        }

        function deleteSubmission(id) {
            if(confirm('آیا از حذف این پیام اطمینان دارید؟')) {
                submissions = submissions.filter(s => s.id !== id);
                saveToStorage(); renderDashboard(); showToast('پیام حذف شد.', 'success');
            }
        }

        function openFullPhoto() {
            document.getElementById('lightbox-img').src = document.getElementById('detail-image').src;
            document.getElementById('photo-lightbox').classList.remove('hidden');
        }
        function closeFullPhoto() { document.getElementById('photo-lightbox').classList.add('hidden'); }

        // Custom Toast Notification System (Mobile Adjusted)
        function showToast(message, type = 'success') {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');
            const isSuccess = type === 'success';
            const bgColor = isSuccess ? 'bg-emerald-900/95 border-emerald-500/50 text-emerald-100' : 'bg-rose-900/95 border-rose-500/50 text-rose-100';
            const icon = isSuccess ? 'fa-circle-check text-emerald-400' : 'fa-triangle-exclamation text-rose-400';

            toast.className = `pointer-events-auto flex items-center gap-2.5 sm:gap-3 px-4 py-3 sm:px-5 sm:py-3.5 rounded-xl sm:rounded-2xl border backdrop-blur-lg shadow-xl text-[11px] sm:text-xs font-medium transition-all duration-300 transform translate-y-4 sm:translate-y-0 sm:translate-x-4 opacity-0 ${bgColor} w-full sm:w-auto mx-auto max-w-[90vw] sm:max-w-none`;
            toast.innerHTML = `<i class="fa-solid ${icon} text-sm sm:text-base shrink-0"></i><span>${message}</span>`;
            
            container.appendChild(toast);
            setTimeout(() => toast.classList.remove('translate-y-4', 'sm:translate-x-4', 'opacity-0'), 10);
            setTimeout(() => {
                toast.classList.add('opacity-0', 'translate-y-4', 'sm:translate-x-4', 'sm:translate-y-0');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }

        // Word Export Logic
        async function exportBatchToWord(categoryTarget) {
            if (typeof docx === 'undefined') return showToast('کتابخانه docx هنوز بارگذاری نشده است.', 'error');
            let itemsToExport = submissions.filter(s => s.category === categoryTarget && !s.isExported).slice(0, 50);
            if (itemsToExport.length === 0) return showToast('هیچ پیام خروجی‌نگرفته‌ای وجود ندارد.', 'error');

            const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = docx;
            const titleText = categoryTarget === 'demands' ? 'گزارش مطالبات' : 'گزارش خاطرات';
            const paragraphs = [
                new Paragraph({ text: titleText, heading: HeadingLevel.TITLE, alignment: AlignmentType.RIGHT, bidirectional: true, spacing: { after: 300 } }),
                new Paragraph({ text: `تاریخ صدور: ${new Date().toLocaleDateString('fa-IR')} | تعداد: ${itemsToExport.length}`, alignment: AlignmentType.RIGHT, bidirectional: true, spacing: { after: 400 } })
            ];

            itemsToExport.forEach((item, index) => {
                paragraphs.push(
                    new Paragraph({ children: [new TextRun({ text: `#${index + 1} - [کد: ${item.id}] - عنوان: ${item.subject || 'بدون عنوان'}`, bold: true, color: "E65100", size: 24 })], alignment: AlignmentType.RIGHT, bidirectional: true, spacing: { before: 200, after: 100 } }),
                    new Paragraph({ children: [new TextRun({ text: `تاریخ ثبت: ${item.date} | فرستنده: ${item.isAnonymous ? 'ناشناس' : 'عادی'}`, size: 18, color: "666666" })], alignment: AlignmentType.RIGHT, bidirectional: true, spacing: { after: 100 } }),
                    new Paragraph({ children: [new TextRun({ text: item.text, size: 22 })], alignment: AlignmentType.RIGHT, bidirectional: true, spacing: { after: 200 } }),
                    new Paragraph({ text: "------------------------------------------------------------", alignment: AlignmentType.CENTER, spacing: { after: 300 } })
                );
            });

            try {
                const doc = new Document({ sections: [{ properties: {}, children: paragraphs }] });
                const blob = await Packer.toBlob(doc);
                itemsToExport.forEach(item => item.isExported = true);
                saveToStorage(); renderDashboard();
                
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `ShowkatNews_${categoryTarget}_${Date.now()}.docx`;
                document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
                showToast(`فایل ورد تولید و دانلود شد.`, 'success');
            } catch(err) {
                console.error(err);
                showToast('خطا در تولید فایل Word.', 'error');
            }
        }