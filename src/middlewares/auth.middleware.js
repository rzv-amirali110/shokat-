const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');

const protect = async (req, res, next) => {
    try {
        let token;

        // دریافت توکن از Header (Bearer Token) یا Query Parameter (برای لینک‌های دانلود)
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.query && req.query.token) {
            token = req.query.token;
        }

        // بررسی وجود توکن
        if (!token) {
            return next(new AppError('شما احراز هویت نشده‌اید. لطفاً ابتدا وارد حساب کاربری خود شوید.', 401));
        }

        // اعتبارسنجی توکن
        const secret = process.env.JWT_SECRET || 'default_jwt_secret_key';
        const decoded = jwt.verify(token, secret);

        // ذخیره اطلاعات ادمین در درخواست
        req.admin = decoded;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return next(new AppError('توکن امنیتی نامعتبر است. لطفاً مجدداً وارد شوید.', 401));
        }
        if (error.name === 'TokenExpiredError') {
            return next(new AppError('اعتبار نشست شما به پایان رسیده است. لطفاً مجدداً وارد شوید.', 401));
        }
        next(error);
    }
};

module.exports = { protect };