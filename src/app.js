const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const routes = require('./routes');
const globalErrorHandler = require('./middlewares/error.middleware');

const app = express();

// 🟢 ۱. اصلاح تنظیمات CORS
app.use(cors({
    origin: function (origin, callback) {
        // اجازه دسترسی به تمام درخواست‌های لوکال (localhost و 127.0.0.1)
        if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 🟢 ۲. هدر CORP برای تصاویر
// نمونه کد Express برای هدر تصاویر
app.use('/uploads', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
}, express.static('uploads')); // نام پوشه‌ای که عکس‌ها توش ذخیره میشن;
// سرو فایل‌های استاتیک
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