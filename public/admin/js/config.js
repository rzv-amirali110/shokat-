// تنظیمات و ثابت‌های عمومی برنامه

export const SERVER_URL = window.location.origin;
export const API_BASE_URL = `${SERVER_URL}/api`;

export const STORAGE_KEYS = Object.freeze({
    EXPORTED_IDS: 'exported_submissions',
});

export const RESOURCE = Object.freeze({
    DEMANDS: 'demands',
    STORIES: 'stories',
});

export const RESOURCE_LABEL = Object.freeze({
    [RESOURCE.DEMANDS]: 'مطالبه',
    [RESOURCE.STORIES]: 'خاطره',
});

export const RESOURCE_LABEL_PLURAL = Object.freeze({
    [RESOURCE.DEMANDS]: 'مطالبات',
    [RESOURCE.STORIES]: 'خاطرات',
});

export const STATUS = Object.freeze({
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
});

export const FILTER = Object.freeze({
    ALL: 'ALL',
    DEMANDS: 'demands',
    STORIES: 'stories',
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    UNEXPORTED: 'unexported',
});

export const UI = Object.freeze({
    MODAL_ANIMATION_MS: 300,
    TOAST_DURATION_MS: 4000,
    SEARCH_DEBOUNCE_MS: 250,
});

export const EXPORT = Object.freeze({
    BATCH_LIMIT: 50,
    IMAGE_MAX_DISPLAY_WIDTH: 450,
    IMAGE_MAX_DISPLAY_HEIGHT: 320,
    IMAGE_MAX_SOURCE_SIDE: 1600,
});

export const MOBILE_REGEX = /^09\d{9}$/;

export const MESSAGES = Object.freeze({
    NETWORK_ERROR: 'خطا در برقراری ارتباط با سرور',
    MOBILE_INVALID: 'شماره موبایل واردشده معتبر نیست (مثال: 09123456789).',
    PASSWORD_RULE: 'رمز عبور باید حداقل ۸ کاراکتر و شامل ترکیبی از حروف، اعداد و علامت‌ها باشد.',
    SESSION_EXPIRED: 'نشست شما منقضی شده است. دوباره وارد شوید.',
});

export const MODAL_IDS = Object.freeze([
    'detail-modal-backdrop',
    'edit-admin-modal-backdrop',
    'admin-modal-backdrop',
    'profile-modal-backdrop',
    'password-modal-backdrop',
]);
