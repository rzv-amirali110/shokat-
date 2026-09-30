const express = require('express');
const path = require('path');
const routes = require('./routes');
const globalErrorHandler = require('./middlewares/error.middleware');

const app = express();

// پشتیبانی از بدنه درخواست‌های JSON
app.use(express.json());

// پشتیبانی از داده‌های ارسال‌شده از فرم‌ها (URL-encoded)
app.use(express.urlencoded({ extended: true }));

// سرو کردن فایل‌های استاتیک فرانت‌اند (HTML, CSS, JS) از پوشه public
app.use(express.static(path.join(__dirname, '../public')));

// اتصال تمامی مسیرهای برنامه به پیشوند /api
app.use('/api', routes);

// مدیریت مسیرهایی که در سرور تعریف نشده‌اند (404 Not Found)
app.use((req, res, next) => {
    res.status(404).json({
        status: 'fail',
        message: `مسیر درخواست شده (${req.originalUrl}) در سرور یافت نشد.`
    });
});

// میدلور مرکزی مدیریت خطاها
app.use(globalErrorHandler);

module.exports = app;