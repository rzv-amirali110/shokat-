const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const routes = require('./routes');
const globalErrorHandler = require('./middlewares/error.middleware');

const app = express();

app.set('trust proxy', 1);

app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'same-origin' },
}));

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 429,
        error: 'تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً ۱۵ دقیقه دیگر دوباره تلاش کنید.'
    }
});

const corsOrigins = (env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
if (corsOrigins.length) {
    app.use(cors({ origin: corsOrigins, credentials: true }));
}

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// --- تغییرات جدید برای اتصال Vite (پوشه dist) ---
const isProduction = process.env.NODE_ENV === 'production';
const staticFolder = isProduction ? '../dist' : '../public';

// آپلودها همیشه ثابت هستند
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
// سرو کردن فرانت‌اند بر اساس محیط اجرا
app.use(express.static(path.join(__dirname, staticFolder)));
// ------------------------------------------------

app.use('/api', apiLimiter); 
app.use('/api', routes);
app.use(globalErrorHandler);

module.exports = app;