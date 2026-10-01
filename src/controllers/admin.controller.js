const jwt = require('jsonwebtoken');
const env = require('../config/env'); // فراخوانی تنظیمات
const AdminService = require('../services/admin.service');
const AppError = require('../utils/appError');

const signToken = (id) => {
    return jwt.sign(
        { id },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN }
    );
};
class AdminController {
    static async register(req, res, next) {
        try {
            const { username, mobile, password } = req.body || {};

            // اعتبارسنجی فیلدهای الزامی
            if (!username || !mobile || !password) {
                return next(new AppError('نام کاربری، شماره موبایل و رمز عبور الزامی هستند.', 400));
            }

            // اعتبارسنجی ساده فرمت موبایل ایران
            const mobileRegex = /^09\d{9}$/;
            if (!mobileRegex.test(mobile)) {
                return next(new AppError('شماره موبایل واردشده معتبر نیست (مثال: 09123456789).', 400));
            }

            // اعتبارسنجی طول رمز عبور
            if (password.length < 6) {
                return next(new AppError('رمز عبور باید حداقل ۶ کاراکتر باشد.', 400));
            }

            const admin = await AdminService.createAdmin({ username, mobile, password });

            res.status(201).json({
                status: 'success',
                message: 'حساب ادمین با موفقیت ایجاد شد.',
                data: { admin },
            });
        } catch (error) {
            // کد P2002 در پریزما مربوط به نقض یکتا بودن (Unique constraint) مثل username یا mobile تکراری است
            if (error.code === 'P2002') {
                const targetField = error.meta?.target?.[0] === 'mobile' ? 'شماره موبایل' : 'نام کاربری';
                return next(new AppError(`این ${targetField} قبلاً در سیستم ثبت شده است.`, 400));
            }
            next(error);
        }
    }
    // اضافه کردن این متدها به کلاس AdminController در src/controllers/admin.controller.js

    // دریافت لیست کامل ادمین‌ها
    static async getAllAdmins(req, res, next) {
        try {
            const admins = await AdminService.findAll();
            res.status(200).json({
                status: 'success',
                results: admins.length,
                data: { admins },
            });
        } catch (error) {
            next(error);
        }
    }

    // دریافت اطلاعات یک ادمین مشخص با شناسه
    static async getAdminById(req, res, next) {
        try {
            const { id } = req.params;
            const admin = await AdminService.findById(id);

            if (!admin) {
                return next(new AppError('ادامینی با این شناسه یافت نشد.', 404));
            }

            const { password: _, ...adminData } = admin;

            res.status(200).json({
                status: 'success',
                data: { admin: adminData },
            });
        } catch (error) {
            next(error);
        }
    }

    // ۲. ورود ادمین (Login)
    // ۲. ورود ادمین (Login)
static async login(req, res, next) {
    try {
        const { username, password } = req.body || {};

        if (!username || !password) {
            return next(new AppError('لطفاً نام کاربری و رمز عبور را وارد کنید.', 400));
        }

        // پیدا کردن ادمین بر اساس نام کاربری
        const admin = await AdminService.findByUsername(username);

        if (!admin) {
            return next(new AppError('نام کاربری یا رمز عبور اشتباه است.', 401));
        }

        // بررسی صحت رمز عبور
        const isPasswordValid = await AdminService.verifyPassword(password, admin.password);

        if (!isPasswordValid) {
            return next(new AppError('نام کاربری یا رمز عبور اشتباه است.', 401));
        }

        // 🟢 ۱. ساخت متغیر token (این خط حتماً باید اینجا باشد)
        const token = signToken(admin.id);

        // 🟢 ۲. تنظیمات کوکی بر اساس env
        const cookieExpiresInHours = Number(process.env.JWT_COOKIE_EXPIRES_IN || env.JWT_COOKIE_EXPIRES_IN || 1);

        const cookieOptions = {
            maxAge: cookieExpiresInHours * 60 * 60 * 1000, // تبدیل ساعت به میلی‌ثانیه
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        };

        // 🟢 ۳. ست کردن کوکی با استفاده از متغیر token
        res.cookie('jwt', token, cookieOptions);

        const { password: _, ...adminData } = admin;

        res.status(200).json({
            status: 'success',
            message: 'با موفقیت وارد شدید.',
            token, // ارسال توکن در پاسخ
            data: { admin: adminData },
        });
    } catch (error) {
        next(error);
    }
}
    // ۳. دریافت اطلاعات ادمین جاری (پروفایل)
    static async getMe(req, res, next) {
        try {
            // req.admin توسط میدل‌ور احراز هویت (Auth Middleware) پر می‌شود
            res.status(200).json({
                status: 'success',
                data: { admin: req.admin },
            });
        } catch (error) {
            next(error);
        }
    }
    // در فایل src/controllers/admin.controller.js

    static async deleteAdmin(req, res, next) {
        try {
            const { id } = req.params;

            // جلوگیری از حذف حساب کاربری خود ادمین جاری
            if (req.admin.id === id) {
                return next(new AppError('شما نمی‌توانید حساب کاربری جاری خود را حذف کنید.', 400));
            }

            const admin = await AdminService.findById(id);
            if (!admin) {
                return next(new AppError('ادامینی با این شناسه یافت نشد.', 404));
            }

            await AdminService.deleteAdmin(id);

            res.status(200).json({
                status: 'success',
                message: `ادمین با نام کاربری "${admin.username}" با موفقیت حذف شد.`,
            });
        } catch (error) {
            next(error);
        }
    }

    static async logout(req, res, next) {
        try {
            // ۱. ثبت زمان خروج در دیتابیس برای ادمین جاری
            if (req.admin?.id) {
                await AdminService.updateLastLogout(req.admin.id);
            }

            // ۲. پاک کردن کوکی در سمت کلاینت
            res.cookie('jwt', 'loggedout', {
                expires: new Date(Date.now() + 10 * 1000),
                httpOnly: true,
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
            });

            res.status(200).json({
                status: 'success',
                message: 'با موفقیت از حساب کاربری خارج شدید.',
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = AdminController;