// مدیریت خطاهای غیرمنتظره در سطح پردازش (Uncaught Exceptions)
process.on('uncaughtException', (err) => {
    console.error('💥 UNCAUGHT EXCEPTION! در حال متوقف کردن سرور...');
    console.error(err.name, err.message);
    process.exit(1);
});

require('dotenv').config();
const env = require('./src/config/env');
const app = require('./src/app');
const prisma = require('./src/config/database');
const AdminService = require('./src/services/admin.service');

let server;

// ۲. تابع اصلی برای اجرای ترتیبی و امن سرور
const startServer = async () => {
    try {
        // اطمینان از برقرار بودن اتصال دیتابیس
        await prisma.$connect();
        console.log('📦 اتصال به دیتابیس Prisma با موفقیت برقرار شد.');

        // اجرای عملیات ساخت سوپر ادمین اولیه با await
        await AdminService.initSuperAdmin();

        // اجرای سرور HTTP پس از اطمینان از آمادگی کامل دیتابیس و سرویس‌ها
        server = app.listen(env.PORT, () => {
            console.log(`🚀 سرور با موفقیت روی پورت ${env.PORT} در حالت ${env.NODE_ENV} اجرا شد.`);
            console.log(`🌐 آدرس دسترسی: http://localhost:${env.PORT}`);
        });
    } catch (error) {
        console.error('💥 خطا در راه‌اندازی اولیه سرور:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
};

startServer();

// ۳. مدیریت وعده‌های رد شده (Unhandled Rejections)
process.on('unhandledRejection', (err) => {
    console.error('💥 UNHANDLED REJECTION! در حال بستن سرور...');
    console.error(err);
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
});

// ۴. مدیریت قطع اتصال ایمن (Graceful Shutdown)
const gracefulShutdown = async (signal) => {
    console.log(`\nسیگنال ${signal} دریافت شد. در حال قطع اتصال سرور...`);

    if (server) {
        server.close(async () => {
            console.log('سرور HTTP بسته شد.');
            try {
                await prisma.$disconnect();
                console.log('اتصال دیتابیس Prisma با موفقیت قطع شد.');
                process.exit(0);
            } catch (err) {
                console.error('خطا در زمان بستن اتصال دیتابیس:', err);
                process.exit(1);
            }
        });
    } else {
        await prisma.$disconnect();
        process.exit(0);
    }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));