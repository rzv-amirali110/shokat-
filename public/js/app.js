// Modal State Configuration
const categoriesConfig = {
    demands: {
        title: 'ثبت مطالبات و دغدغه‌های دانشجویی',
        subtitle: 'مشکلات و دغدغه‌های شما دسته‌بندی شده و جهت بررسی پیگیری می‌شود.',
        icon: 'fa-bullhorn',
        colorClass: 'bg-gradient-to-br from-brand-orange to-red-500',
        subjectPlaceholder: 'مثلاً: کیفیت غذای سلف مرکزی...',
        placeholder: 'شرح کامل دغدغه خود را بنویسید...'
    },
    stories: {
        title: 'ثبت خاطرات و تجربه‌های دانشجویی',
        subtitle: 'خاطرات ماندگار، طنز یا ارزشمند دوران دانشجویی خود را ثبت کنید.',
        icon: 'fa-book-bookmark',
        colorClass: 'bg-gradient-to-br from-amber-400 to-amber-600',
        subjectPlaceholder: 'مثلاً: روز اول ورود به دانشگاه...',
        placeholder: 'خاطره جذاب خود را با جزئیات بنویسید...'
    }
};

// ==========================================
// 🛡️ توابع امنیتی و پردازش تصویر
// ==========================================

// 1. جلوگیری از XSS (تبدیل کاراکترهای خطرناک)
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, function (tag) {
        const charsToReplace = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        };
        return charsToReplace[tag] || tag;
    });
}

// 2. بررسی Magic Bytes (تایید هویت واقعی فایل)
function checkMagicBytes(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = function (e) {
            const arr = (new Uint8Array(e.target.result)).subarray(0, 4);
            let header = "";
            for (let i = 0; i < arr.length; i++) {
                header += arr[i].toString(16).toUpperCase();
            }
            // بررسی امضای فایل:
            // JPG/JPEG: شروع با FFD8FF
            // PNG: شروع با 89504E47
            if (header.startsWith("FFD8FF") || header === "89504E47") {
                resolve(true);
            } else {
                resolve(false);
            }
        };
        reader.onerror = () => reject(false);
        // فقط 4 بایت اول را برای سرعت بیشتر می‌خوانیم
        reader.readAsArrayBuffer(file.slice(0, 4));
    });
}

// 3. پاکسازی کامل عکس و کاهش حجم با Canvas (حذف EXIF و بدافزار)
function sanitizeAndCompressImage(file, maxMbSize = 2) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = event => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // محاسبه ریسایز برای کاهش حجم (مثلا حداکثر عرض 1200 پیکسل)
                const MAX_WIDTH = 1200;
                if (width > MAX_WIDTH) {
                    height = Math.round((height * MAX_WIDTH) / width);
                    width = MAX_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');

                // رسم تصویر روی بوم (این کار تمام کدهای مخفی و EXIF را نابود میکند)
                ctx.drawImage(img, 0, 0, width, height);

                // خروجی گرفتن به صورت فایل JPG با کیفیت 80%
                canvas.toBlob((blob) => {
                    if (blob) {
                        const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        });
                        resolve(newFile);
                    } else {
                        reject('خطا در پردازش تصویر');
                    }
                }, 'image/jpeg', 0.8);
            };
            img.onerror = () => reject('فرمت تصویر نامعتبر است');
        };
        reader.onerror = () => reject('خطا در خواندن فایل');
    });
}
// ==========================================

// Open Modal Function
function openModal(categoryKey) {
    const config = categoriesConfig[categoryKey] || categoriesConfig.demands;
    document.getElementById('category-input').value = categoryKey;
    document.getElementById('modal-title').innerText = config.title;
    document.getElementById('modal-subtitle').innerText = config.subtitle;

    const iconBg = document.getElementById('modal-icon-bg');
    iconBg.className = `w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg ${config.colorClass}`;
    document.getElementById('modal-icon').className = `fa-solid ${config.icon}`;

    const textarea = document.getElementById('content-field');
    const subjectInput = document.getElementById('subject-field');
    textarea.placeholder = config.placeholder;
    subjectInput.placeholder = config.subjectPlaceholder;
    textarea.value = '';
    subjectInput.value = '';

    removeImage();
    updateCharCount();

    const backdrop = document.getElementById('modal-backdrop');
    const container = document.getElementById('modal-container');
    backdrop.classList.remove('hidden');
    setTimeout(() => {
        backdrop.classList.remove('opacity-0');
        container.classList.remove('scale-95');
        container.classList.add('scale-100');
    }, 10);
}

// Image Selection Preview Handler
async function handleImagePreview(event) {
    let file = event.target.files[0];
    if (!file) return;

    // بررسی اولیه پسوند
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
        showToast('لطفاً فقط فایل تصویر (JPG یا PNG) انتخاب کنید.', 'error');
        removeImage();
        return;
    }

    // پیش‌نمایش تصویر
    const reader = new FileReader();
    reader.onload = function (e) {
        document.getElementById('image-preview').src = e.target.result;
        document.getElementById('image-preview-container').classList.remove('hidden');
        document.getElementById('upload-label-text').innerText = file.name;
    };
    reader.readAsDataURL(file);
}

function removeImage() {
    const fileInput = document.getElementById('image-upload');
    if (fileInput) fileInput.value = '';
    const previewContainer = document.getElementById('image-preview-container');
    if (previewContainer) previewContainer.classList.add('hidden');
    const previewImg = document.getElementById('image-preview');
    if (previewImg) previewImg.src = '';
    const labelText = document.getElementById('upload-label-text');
    if (labelText) labelText.innerText = 'انتخاب تصویر مرتبط (PNG, JPG)';
}

function closeModal() {
    const backdrop = document.getElementById('modal-backdrop');
    const container = document.getElementById('modal-container');
    backdrop.classList.add('opacity-0');
    container.classList.remove('scale-100');
    container.classList.add('scale-95');
    setTimeout(() => {
        backdrop.classList.add('hidden');
    }, 300);
}

function updateCharCount() {
    const textarea = document.getElementById('content-field');
    const counter = document.getElementById('char-counter');
    const len = textarea.value.length;
    const persianLen = len.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
    counter.innerText = `${persianLen} / ۲۰۰۰`;
}

// Handle Form Submission
async function handleFormSubmit(event) {
    event.preventDefault();
    const submitBtn = document.getElementById('submit-btn');
    const category = document.getElementById('category-input').value;

    // دریافت و Escape کردن ورودی‌ها برای جلوگیری از XSS
    let subject = document.getElementById('subject-field').value.trim();
    let content = document.getElementById('content-field').value.trim();
    subject = escapeHTML(subject);
    content = escapeHTML(content);

    let imageFile = document.getElementById('image-upload').files[0];

    if (!subject || !content) {
        showToast('عنوان و متن اصلی الزامی هستند.', 'error');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = `
        <i class="fa-solid fa-circle-notch animate-spin text-xs"></i>
        <span>در حال پردازش و ارسال...</span>
    `;

    try {
        // پردازش امنیتی تصویر در صورت وجود
        if (imageFile) {
            // ۱. بررسی مجیک بایت
            const isRealImage = await checkMagicBytes(imageFile);
            if (!isRealImage) {
                showToast('ساختار فایل تصویر نامعتبر است (احتمال فایل مخرب).', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = `<span>ثبت نهایی و ارسال</span><i class="fa-solid fa-paper-plane text-xs"></i>`;
                return;
            }

            // ۲. بازسازی تصویر روی بوم برای پاکسازی کدهای مخفی و کاهش حجم
            try {
                imageFile = await sanitizeAndCompressImage(imageFile);
            } catch (error) {
                showToast('خطا در پاکسازی و پردازش تصویر.', 'error');
                throw new Error(error);
            }
        }

        // ساخت فرم دیتا برای ارسال
        const formData = new FormData();
        formData.append('title', subject);
        formData.append('description', content);
        if (imageFile) {
            formData.append('imageUrl', imageFile);
        }

        const response = await fetch(`/api/${category}`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            showToast(result.message || 'پیام شما با موفقیت ثبت شد.', 'success');

            // Increment Local UI Counter
            const counterElem = document.getElementById(`counter-${category}`);
            if (counterElem) {
                let currentVal = parseInt(counterElem.innerText.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))) || 0;
                currentVal += 1;
                counterElem.innerText = toPersianDigits(currentVal);
            }
            closeModal();
        } else {
            showToast(result.message || 'خطایی در ثبت اطلاعات رخ داد.', 'error');
        }
    } catch (err) {
        showToast('خطا در ارتباط با سرور یا پردازش اطلاعات.', 'error');
        console.error(err);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
            <span>ثبت نهایی و ارسال</span>
            <i class="fa-solid fa-paper-plane text-xs"></i>
        `;
    }
}

// Custom Toast Notification System
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return; // اطمینان از وجود کانتینر

    const toast = document.createElement('div');
    const isSuccess = type === 'success';
    const bgColor = isSuccess ? 'bg-emerald-900/90 border-emerald-500/50 text-emerald-200' : 'bg-rose-900/90 border-rose-500/50 text-rose-200';
    const icon = isSuccess ? 'fa-circle-check text-emerald-400' : 'fa-triangle-exclamation text-rose-400';

    toast.className = `pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl border backdrop-blur-lg shadow-xl text-xs sm:text-sm font-medium transition-all duration-300 transform translate-y-4 opacity-0 ${bgColor}`;
    toast.innerHTML = `
        <i class="fa-solid ${icon} text-base"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => toast.classList.remove('translate-y-4', 'opacity-0'), 10);
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-4');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

document.addEventListener('DOMContentLoaded', () => {
    const backdrop = document.getElementById('modal-backdrop');
    if (backdrop) {
        backdrop.addEventListener('click', (e) => {
            if (e.target.id === 'modal-backdrop') closeModal();
        });
    }
    fetchRealStats()
});
// تابع کمکی برای تبدیل اعداد انگلیسی به فارسی
function toPersianDigits(num) {
    if (num === null || num === undefined) return '۰';
    return num.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
}
// دریافت آمار واقعی از سرور
async function fetchRealStats() {
    try {
        // فرض می‌کنیم بک‌اند شما یک روت /api/stats دارد که آمار را برمی‌گرداند
        // خروجی مورد انتظار از بک‌اند: { "demandsCount": 150, "storiesCount": 95 }
        const response = await fetch('/api/stats');

        if (response.ok) {
            const data = await response.json();

            const demandsCounter = document.getElementById('counter-demands');
            const storiesCounter = document.getElementById('counter-stories');

            if (demandsCounter && data.demandsCount !== undefined) {
                demandsCounter.innerText = toPersianDigits(data.demandsCount);
            }
            if (storiesCounter && data.storiesCount !== undefined) {
                storiesCounter.innerText = toPersianDigits(data.storiesCount);
            }
        }
    } catch (error) {
        console.error('خطا در دریافت آمار واقعی:', error);
        // در صورت بروز خطا، همان مقادیر پیش‌فرض HTML باقی می‌مانند
    }
}
// اتصال توابع به اسکوپ سراسری (Window) تا در رویدادهای onclick مستقیم HTML شناخته شوند
window.openModal = openModal;
window.closeModal = closeModal;
window.handleFormSubmit = handleFormSubmit;
window.updateCharCount = updateCharCount;
window.handleImagePreview = handleImagePreview;
window.removeImage = removeImage;