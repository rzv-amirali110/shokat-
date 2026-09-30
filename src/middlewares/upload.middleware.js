const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AppError = require('../utils/appError');
const env = require('../config/env'); // فراخوانی تنظیمات

// ۱. خواندن مقادیر از فایل تنظیمات
const envUploadDir = env.UPLOAD_DIR;
const maxFileSizeMB = Number(env.MAX_FILE_SIZE_MB);
const allowedMimeTypes = env.ALLOWED_MIME_TYPES;

// ۲. محاسبه مسیر مطلق پوشه آپلود
const uploadDir = path.isAbsolute(envUploadDir)
    ? envUploadDir
    : path.join(__dirname, '../../', envUploadDir);

// ایجاد پوشه uploads در صورت عدم وجود
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// ۳. تنظیمات محل ذخیره و نام‌گذاری پویا برای فایل‌ها
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

        // گرفتن نام منبع از URL (مثلاً demands یا stories)؛ در صورت عدم وجود از پیش‌فرض file استفاده می‌شود
        const resourcePrefix = req.params?.resource || req.body?.type || 'file';

        cb(null, `${resourcePrefix}-${uniqueSuffix}${ext}`);
    }
});

// ۴. فیلتر فایل بر اساس mime-type‌های مشخص‌شده در .env
const fileFilter = (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new AppError('فرمت فایل ارسالی مجاز نیست. فرمت‌های مجاز: JPG, PNG, WEBP, GIF', 400), false);
    }
};

// ۵. پیکربندی نهایی Multer
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: maxFileSizeMB * 1024 * 1024 // تبدیل مگابایت به بایت
    }
});

module.exports = upload;