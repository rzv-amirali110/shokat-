const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/appError');
const AdminService = require('../services/admin.service');

exports.protect = async (req, res, next) => {
    try {
        let token;

        if (req.cookies && req.cookies.jwt) {
            token = req.cookies.jwt;
        } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return next(new AppError('شما وارد حساب کاربری نشده‌اید. لطفاً ابتدا لاگین کنید.', 401));
        }

        // ۱. رمزگشایی توکن
        const decoded = jwt.verify(token, env.JWT_SECRET);

        // ۲. بررسی وجود ادمین در دیتابیس
        const currentAdmin = await AdminService.findById(decoded.id);
        if (!currentAdmin) {
            return next(new AppError('کاربر صاحب این توکن دیگر در دیتابیس وجود ندارد.', 401));
        }

        // 🟢 ۳. بررسی باطل شدن توکن پس از لاگ‌اوت (مهم)
        if (currentAdmin.lastLogoutAt) {
            // تبدیل زمان لاگ‌اوت به ثانیه (چون decoded.iat بر حسب ثانیه است)
            const logoutTimestamp = Math.floor(currentAdmin.lastLogoutAt.getTime() / 1000);

            // اگر توکن قبل از آخرین لاگ‌اوت صادر شده باشد، باطل است
            if (decoded.iat < logoutTimestamp) {
                return next(new AppError('این توکن به دلیل خروج از حساب باطل شده است. لطفاً مجدداً وارد شوید.', 401));
            }
        }

        req.admin = currentAdmin;
        next();
    } catch (error) {
        return next(new AppError('توکن معتبر نیست یا منقضی شده است.', 401));
    }
};