// Modal State Configuration
const categoriesConfig = {
    demands: {
        title: 'ثبت مطالبات و دغدغه‌های دانشجویی',
        subtitle: 'مشکلات و دغدغه‌های شما دسته‌بندی شده و جهت بررسی پیگیری می‌شود.',
        icon: 'fa-bullhorn',
        colorClass: 'bg-gradient-to-br from-brand-orange to-red-500',
        subjectPlaceholder: 'مثلاً: کیفیت غذای سلف مرکزی، مشکلات انتخاب واحد، یا سرویس خوابگاه...',
        placeholder: 'شرح کامل دغدغه خود را بنویسید (مثلاً: عدم هماهنگی سرویس‌های خوابگاه با کلاس‌های بعدازظهر دانشکده فنی، نامناسب بودن سیستم گرمایشی دانشکده...)'
    },
    stories: {
        title: 'ثبت خاطرات و تجربه‌های دانشجویی',
        subtitle: 'خاطرات ماندگار، طنز یا ارزشمند دوران دانشجویی خود را ثبت کنید.',
        icon: 'fa-book-bookmark',
        colorClass: 'bg-gradient-to-br from-amber-400 to-amber-600',
        subjectPlaceholder: 'مثلاً: روز اول ورود به دانشگاه، کلاس‌های آنلاین، یا صعود به قله تیم کوهنوردی...',
        placeholder: 'خاطره جذاب خود را با جزئیات بنویسید (مثلاً: ماجرای عجیب و خنده‌دار گم کردن سالن امتحانات در هفته اول ترم اول...)'
    }
};

// Open Modal Function
function openModal(categoryKey) {
    const config = categoriesConfig[categoryKey] || categoriesConfig.demands;

    document.getElementById('category-input').value = categoryKey;
    document.getElementById('modal-title').innerText = config.title;
    document.getElementById('modal-subtitle').innerText = config.subtitle;

    // Icon and styling
    const iconBg = document.getElementById('modal-icon-bg');
    iconBg.className = `w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg ${config.colorClass}`;
    document.getElementById('modal-icon').className = `fa-solid ${config.icon}`;

    // Placeholders
    const textarea = document.getElementById('content-field');
    const subjectInput = document.getElementById('subject-field');
    textarea.placeholder = config.placeholder;
    subjectInput.placeholder = config.subjectPlaceholder;
    textarea.value = '';
    subjectInput.value = '';

    // Reset image attachment
    removeImage();

    updateCharCount();

    // Display Modal with animation
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
function handleImagePreview(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        showToast('حجم عکس نباید بیشتر از ۵ مگابایت باشد.', 'error');
        removeImage();
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        document.getElementById('image-preview').src = e.target.result;
        document.getElementById('image-preview-container').classList.remove('hidden');
        document.getElementById('upload-label-text').innerText = file.name;
    };
    reader.readAsDataURL(file);
}

// Remove Attached Image
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

// Close Modal Function
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

// Live Character Counter
function updateCharCount() {
    const textarea = document.getElementById('content-field');
    const counter = document.getElementById('char-counter');
    const len = textarea.value.length;

    // Convert numbers to Persian
    const persianLen = len.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
    counter.innerText = `${persianLen} / 2۰۰۰`;
}

// Handle Form Submission
async function handleFormSubmit(event) {
    event.preventDefault();

    const submitBtn = document.getElementById('submit-btn');
    const category = document.getElementById('category-input').value; // demands یا stories
    const subject = document.getElementById('subject-field').value.trim();
    const content = document.getElementById('content-field').value.trim();
    const imageFile = document.getElementById('image-upload').files[0];

    if (!subject || !content) {
        showToast('عنوان و متن اصلی الزامی هستند.', 'error');
        return;
    }

    // Show Loading State
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
        <i class="fa-solid fa-circle-notch animate-spin text-xs"></i>
        <span>در حال ارسال...</span>
    `;

    try {
        const formData = new FormData();
        formData.append('title', subject);
        formData.append('description', content);
        
        if (imageFile) {
            formData.append('imageUrl', imageFile);
        }

        // ارسال درخواست به /api/demands یا /api/stories
        const response = await fetch(`/api/${category}`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            showToast(result.message || 'پیام شما با موفقیت ثبت شد و پس از بررسی قرار خواهد گرفت.', 'success');

            // Increment Local UI Counter
            const counterElem = document.getElementById(`counter-${category}`);
            if (counterElem) {
                let currentVal = parseInt(counterElem.innerText.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))) || 0;
                currentVal += 1;
                counterElem.innerText = currentVal.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
            }

            closeModal();
        } else {
            showToast(result.message || 'خطایی در ثبت اطلاعات رخ داد.', 'error');
        }
    } catch (err) {
        showToast('خطا در ارتباط با سرور. لطفا اتصال اینترنت را بررسی کنید.', 'error');
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

    // Animate In
    setTimeout(() => {
        toast.classList.remove('translate-y-4', 'opacity-0');
    }, 10);

    // Auto Remove after 4 seconds
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-4');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Close modal on pressing Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

// Close modal when clicking outside modal box
document.addEventListener('DOMContentLoaded', () => {
    const backdrop = document.getElementById('modal-backdrop');
    if (backdrop) {
        backdrop.addEventListener('click', (e) => {
            if (e.target.id === 'modal-backdrop') closeModal();
        });
    }
});