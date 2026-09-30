const AppError = require('../utils/appError');

/**
 * تابع کارخانه‌ای ساخت محدودکننده نرخ درخواست‌ها (Rate Limiter)
 * بدون نیاز به پکیج‌های خارجی (مبتنی بر حافظه RAM)
 */
const createRateLimiter = (options = {}) => {
    const windowMs = options.windowMs || 15 * 60 * 1000; // بازه زمانی پیش‌فرض: ۱۵ دقیقه
    const max = options.max || 10;                       // حداکثر تعداد درخواست مجاز
    const message = options.message || 'تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً کمی بعد مجدداً تلاش کنید.';

    const requests = new Map();

    // پاک‌سازی حافظه هر چند دقیقه یک‌بار جهت جلوگیری از مصرف بی‌رویه RAM
    setInterval(() => {
        const now = Date.now();
        for (const [ip, data] of requests.entries()) {
            if (now > data.resetTime) {
                requests.delete(ip);
            }
        }
    }, windowMs);

    return (req, res, next) => {
        // دریافت آی‌پی کاربر (پشتیبانی از پروکسی و Nginx)
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
        const now = Date.now();

        if (!requests.has(ip)) {
            requests.set(ip, {
                count: 1,
                resetTime: now + windowMs
            });
            return next();
        }

        const userData = requests.get(ip);

        // بازنشانی شمارنده پس از اتمام زمان پنجره
        if (now > userData.resetTime) {
            userData.count = 1;
            userData.resetTime = now + windowMs;
            return next();
        }

        userData.count += 1;

        // بررسی عبور از حد مجاز
        if (userData.count > max) {
            return next(new AppError(message, 429));
        }

        next();
    };
};

// محدودکننده ثبت پیام جدید (حداکثر ۵ پیام در هر ۱۵ دقیقه برای هر IP)
const submissionLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'شما بیش از حد مجاز پیام ثبت کرده‌اید. لطفاً ۱۵ دقیقه دیگر دوباره تلاش کنید.'
});

// محدودکننده عمومی درخواست‌های API (حداکثر ۱۰۰ درخواست در ۱۵ دقیقه)
const generalLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'تعداد درخواست‌های شما در زمان کوتاه زیاد بوده است. لطفاً چند دقیقه دیگر تلاش کنید.'
});

module.exports = {
    submissionLimiter,
    generalLimiter
};