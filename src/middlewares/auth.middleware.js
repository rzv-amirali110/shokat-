const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/appError');
const AdminService = require('../services/admin.service');

const JWT_ERRORS = ['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'];

exports.protect = async (req, res, next) => {
    try {
        let token;

        if (req.cookies && req.cookies.jwt) {
            token = req.cookies.jwt;
        } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return next(new AppError('شما وارد حساب کاربری نشده‌اید. لطفاً ابتدا لاگین کنید.', 401));
        }

        // ۱. رمزگشایی توکن (الگوریتم صریحاً محدود شده است)
        const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });

        // ۲. بررسی وجود ادمین (شامل lastLogoutAt برای ابطال توکن)
        const currentAdmin = await AdminService.findAuthById(decoded.id);
        if (!currentAdmin) {
            return next(new AppError('کاربر صاحب این توکن دیگر در دیتابیس وجود ندارد.', 401));
        }

        // ۳. توکن‌های صادرشده قبل از آخرین خروج/تغییر رمز باطل هستند
        if (currentAdmin.lastLogoutAt) {
            const logoutTimestamp = Math.floor(currentAdmin.lastLogoutAt.getTime() / 1000);
            if (decoded.iat < logoutTimestamp) {
                return next(new AppError('این توکن به دلیل خروج از حساب باطل شده است. لطفاً مجدداً وارد شوید.', 401));
            }
        }

        // lastLogoutAt نباید به کنترلرها/کلاینت برسد
        const { lastLogoutAt, ...safeAdmin } = currentAdmin;
        req.admin = safeAdmin;
        next();
    } catch (error) {
        // فقط خطاهای توکن 401 هستند؛ خطای دیتابیس و ... نباید «توکن نامعتبر» نمایش داده شود
        if (JWT_ERRORS.includes(error.name)) {
            return next(new AppError('توکن معتبر نیست یا منقضی شده است.', 401));
        }
        return next(error);
    }
};