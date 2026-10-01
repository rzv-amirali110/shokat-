const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp'); // اضافه شده برای پاکسازی و فشرده‌سازی
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

// ۳. تنظیمات محل ذخیره و نام‌گذاری پویا (با محافظت در برابر XSS و Path Traversal)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // جلوگیری از حملات XSS و Path Traversal با فیلتر کردن پسوند و نام
        const originalExt = path.extname(file.originalname).toLowerCase();
        const safeExt = originalExt.replace(/[^a-z0-9.]/g, ''); // فقط حروف و اعداد

        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

        const resourcePrefix = req.params?.resource || req.body?.type || 'file';
        // پاکسازی نام ورودی از هرگونه کاراکتر غیرمجاز
        const safePrefix = String(resourcePrefix).replace(/[^a-zA-Z0-9_\-]/g, '');

        cb(null, `${safePrefix}-${uniqueSuffix}${safeExt}`);
    }
});

// ۴. فیلتر فایل بر اساس mime-type‌های مشخص‌شده در .env (بررسی اولیه)
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

// ۶. میدل‌ور امنیتی: بررسی مجیک بایت، کاهش حجم و نابودسازی بدافزارها (Sanitization)
upload.processImage = async (req, res, next) => {
    // پشتیبانی همزمان از upload.single (تک فایل) و upload.array (چند فایل)
    const files = req.file ? [req.file] : (req.files || []);
    if (files.length === 0) return next();

    try {
        for (const file of files) {
            const filePath = file.path;
            const ext = path.extname(filePath).toLowerCase();

            // الف) بررسی Magic Bytes (خواندن ۱۲ بایت اول فایل در مبنای 16)
            const buffer = Buffer.alloc(12);
            const fd = fs.openSync(filePath, 'r');
            fs.readSync(fd, buffer, 0, 12, 0);
            fs.closeSync(fd);
            const hex = buffer.toString('hex').toUpperCase();

            // امضاهای معتبر
            const isJpg = hex.startsWith('FFD8FF');
            const isPng = hex.startsWith('89504E47');
            const isGif = hex.startsWith('47494638'); // GIF8
            const isWebp = hex.startsWith('52494646') && hex.substring(16, 24) === '57454250'; // RIFF....WEBP

            if (!isJpg && !isPng && !isGif && !isWebp) {
                throw new Error(`محتوای فایل ${file.originalname} نامعتبر است (احتمال جعل پسوند).`);
            }

            // ب) کاهش حجم و پاکسازی (Sanitize) عکس با Sharp
            // Sharp با رندر مجدد عکس، تمام متادیتاها و کدهای مخرب (مثل اسکریپت در EXIF) را نابود میکند
            const tempOutputPath = `${filePath}-temp${ext}`;
            let sharpInstance = sharp(filePath).resize(1200, 1200, {
                fit: 'inside', // حفظ تناسب و جلوگیری از کشیدگی
                withoutEnlargement: true // عکس‌های کوچک را بزرگ نمی‌کند
            });

            // تنظیم کیفیت و فرمت خروجی بر اساس نوع فایل
            if (ext === '.png') {
                sharpInstance = sharpInstance.png({ quality: 80 });
            } else if (ext === '.webp') {
                sharpInstance = sharpInstance.webp({ quality: 80 });
            } else if (ext === '.gif') {
                sharpInstance = sharpInstance.gif(); // GIF فقط پاکسازی می‌شود
            } else {
                sharpInstance = sharpInstance.jpeg({ quality: 80 });
            }

            // ذخیره فایل پردازش شده
            await sharpInstance.toFile(tempOutputPath);

            // ج) جایگزینی فایل اصلی با فایل امن و سبک
            fs.unlinkSync(filePath); // حذف فایل اصلی (ناامن)
            fs.renameSync(tempOutputPath, filePath); // بازگرداندن فایل تمیز با نام قبلی
            
            // آپدیت کردن سایز جدید در شیء ریکوئست
            file.size = fs.statSync(filePath).size;
        }
        
        next();
    } catch (error) {
        // در صورت هرگونه خطا، تمام فایل‌های آپلودی پاک می‌شوند تا سرور آلوده نشود
        for (const file of files) {
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        }
        return next(new AppError('خطای امنیتی در پردازش فایل: ' + error.message, 400));
    }
};

module.exports = upload;