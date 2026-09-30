const express = require('express');
const path = require('path');
const routes = require('./routes');
const globalErrorHandler = require('./middlewares/error.middleware');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🟢 اضافه شدن این خط برای دسترسی عمومی به فایل‌های آپلودشده
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// سرو کردن فایل‌های استاتیک عمومی (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api', routes);

app.use((req, res, next) => {
    res.status(404).json({
        status: 'fail',
        message: `مسیر درخواست شده (${req.originalUrl}) در سرور یافت نشد.`
    });
});

app.use(globalErrorHandler);

module.exports = app;