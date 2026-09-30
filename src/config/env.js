// src/config/env.js

// فهرست متغیرهایی که وجودشان برای اجرای برنامه ۱۰۰٪ الزامی است
const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_EXPIRES_IN',
];

// بررسی وجود متغیرهای الزامی
for (const key of requiredEnvVars) {
    if (!process.env[key] || process.env[key].trim() === '') {
        console.error(`\n❌ [FATAL ERROR] متغیر محیطی "${key}" در فایل .env یافت نشد!\n`);
        process.exit(1); // متوقف کردن کامل سرور
    }
}

// خروجی گرفتن متغیرها
module.exports = {
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
    MAX_FILE_SIZE_MB: Number(process.env.MAX_FILE_SIZE_MB) || 0.75,
    ALLOWED_MIME_TYPES: process.env.ALLOWED_MIME_TYPES
        ? process.env.ALLOWED_MIME_TYPES.split(',')
        : ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
};