const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit'); // اضافه شده: ایمپورت Rate Limit
const env = require('./config/env');
const routes = require('./routes');
const globalErrorHandler = require('./middlewares/error.middleware');

const app = express();

app.set('trust proxy', 1); // اگر پشت nginx/پروکسی هستی (برای secure cookie و IP صحیح Rate Limit)

// CSP را بعداً با لیست CDNهایت (Tailwind، FontAwesome، docx) تنظیم کن
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'same-origin' },
}));

// اضافه شده: تنظیمات Rate Limit برای جلوگیری از اسپم و حملات DoS
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // ۱۵ دقیقه
    max: 100, // حداکثر ۱۰۰ درخواست از هر IP در این بازه
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 429,
        error: 'تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً ۱۵ دقیقه دیگر دوباره تلاش کنید.'
    }
});

// CORS فقط وقتی فرانت جدا اجرا می‌شود (مثلاً توسعه روی پورت دیگر)
// در production متغیر CORS_ORIGINS را خالی بگذار
const corsOrigins = (env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
if (corsOrigins.length) {
    app.use(cors({ origin: corsOrigins, credentials: true })); // تطابق دقیق، نه includes
}

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../public')));

// اضافه شده: اعمال Rate Limit فقط روی مسیرهای API
app.use('/api', apiLimiter); 

app.use('/api', routes);
app.use(globalErrorHandler);

module.exports = app;