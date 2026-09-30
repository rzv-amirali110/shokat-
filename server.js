require('dotenv').config();
const env = require('./src/config/env');
const app = require('./src/app');
const prisma = require('./src/config/database');

const PORT = process.env.PORT || 3000;

// مدیریت خطاهای غیرمنتظره در سطح پردازش (Uncaught Exceptions)
process.on('uncaughtException', (err) => {
    console.error('💥 UNCAUGHT EXCEPTION! در حال متوقف کردن سرور...');
    console.error(err.name, err.message);
    process.exit(1);
});

// اجرای سرور HTTP
const server = app.listen(PORT, () => {
    console.log(`🚀 سرور با موفقیت روی پورت ${PORT} در حالت ${env.NODE_ENV} اجرا شد.`);
    console.log(`🌐 آدرس دسترسی: http://localhost:${PORT}`);
});

// مدیریت وعده‌های (Promises) رد شده در سطح برنامه
process.on('unhandledRejection', (err) => {
    console.error('💥 UNHANDLED REJECTION! در حال بستن سرور...');
    console.error(err);
    server.close(() => {
        process.exit(1);
    });
});

// مدیریت قطع اتصال ایمن سرور و دیتابیس (Graceful Shutdown)
const gracefulShutdown = async (signal) => {
    console.log(`\nسیگنال ${signal} دریافت شد. در حال قطع اتصال سرور...`);
    
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
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));