const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AppError = require('../utils/appError');

// ۱. خواندن مقادیر از .env با مقادیر پیش‌فرض در صورت عدم وجود
const envUploadDir = process.env.UPLOAD_DIR || 'uploads';
const maxFileSizeMB = Number(process.env.MAX_FILE_SIZE_MB) || 5;

// تبدیل فرمت‌های مجاز از رشته کاما‌دار به آرایه
const allowedMimeTypes = process.env.ALLOWED_MIME_TYPES
    ? process.env.ALLOWED_MIME_TYPES.split(',').map(type => type.trim())
    : ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// ۲. محاسبه مسیر مطلق پوشه آپلود
const uploadDir = path.isAbsolute(envUploadDir)
    ? envUploadDir
    : path.join(__dirname, '../../', envUploadDir);

// ایجاد پوشه uploads در صورت عدم وجود
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// ۳. تنظیمات محل ذخیره و نام‌گذاری فایل
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `demand-${uniqueSuffix}${ext}`);
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