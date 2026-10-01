const express = require('express');
const path = require('path');
const cors = require('cors'); // 👈 اضافه شد
const cookieParser = require('cookie-parser');
const routes = require('./routes');
const globalErrorHandler = require('./middlewares/error.middleware');

const app = express();

// 🟢 ۱. تنظیمات CORS (ضروری برای فرانت‌اند و ارسال کوکی‌ها)
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000', // آدرس دقیق فرانت‌اند
    credentials: true, // اجازه ارسال و دریافت کوکی
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 🟢 ۲. اضافه شدن هدر CORP جهت اجازه بارگذاری تصاویر در فرانت‌اند
app.use('/uploads', (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
}, express.static(path.join(__dirname, '../uploads')));

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