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
            // کد P2002 در پریزما مربوط به نقض یکتا بودن (Unique constraint)
            if (error.code === 'P2002') {
                const targetField = error.meta?.target?.[0] === 'mobile' ? 'شماره موبایل' : 'نام کاربری';
                return next(new AppError(`این ${targetField} قبلاً در سیستم ثبت شده است.`, 400));
            }
            next(error);
        }
    }

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

    // ورود ادمین (Login)
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

            const token = signToken(admin.id);

            const cookieExpiresInHours = Number(process.env.JWT_COOKIE_EXPIRES_IN || env.JWT_COOKIE_EXPIRES_IN || 1);

            const cookieOptions = {
                maxAge: cookieExpiresInHours * 60 * 60 * 1000,
                httpOnly: true,
                secure: true,        // الزام برای SameSite=None
                sameSite: 'none',    // اجازه ارسال در درخواست‌های Cross-Site
                partitioned: true,   // رفع هشدار CHIPS / Partitioned Cookies
            };

            res.cookie('jwt', token, cookieOptions);

            const { password: _, ...adminData } = admin;

            res.status(200).json({
                status: 'success',
                message: 'با موفقیت وارد شدید.',
                token,
                data: { admin: adminData },
            });
        } catch (error) {
            next(error);
        }
    }

    // دریافت اطلاعات ادمین جاری (پروفایل)
    static async getMe(req, res, next) {
        try {
            res.status(200).json({
                status: 'success',
                data: { admin: req.admin },
            });
        } catch (error) {
            next(error);
        }
    }

    // تغییر نام کاربری و/یا شماره موبایل ادمین جاری
    static async updateMe(req, res, next) {
        try {
            const { username, mobile } = req.body || {};

            if (!username && !mobile) {
                return next(new AppError('لطفاً حداقل یکی از فیلدهای نام کاربری یا شماره موبایل را برای ویرایش وارد کنید.', 400));
            }

            const updateData = {};

            // اعتبارسنجی نام کاربری در صورت ارسال
            if (username) {
                if (username.trim().length === 0) {
                    return next(new AppError('نام کاربری نمی‌تواند خالی باشد.', 400));
                }
                updateData.username = username.trim();
            }

            // اعتبارسنجی شماره موبایل در صورت ارسال
            if (mobile) {
                const mobileRegex = /^09\d{9}$/;
                if (!mobileRegex.test(mobile)) {
                    return next(new AppError('شماره موبایل واردشده معتبر نیست (مثال: 09123456789).', 400));
                }
                updateData.mobile = mobile;
            }

            const updatedAdmin = await AdminService.updateAdmin(req.admin.id, updateData);

            const { password: _, ...adminData } = updatedAdmin;

            res.status(200).json({
                status: 'success',
                message: 'اطلاعات پروفایل با موفقیت بروزرسانی شد.',
                data: { admin: adminData },
            });
        } catch (error) {
            if (error.code === 'P2002') {
                const targetField = error.meta?.target?.[0] === 'mobile' ? 'شماره موبایل' : 'نام کاربری';
                return next(new AppError(`این ${targetField} قبلاً در سیستم ثبت شده است.`, 400));
            }
            next(error);
        }
    }

    // تغییر رمز عبور ادمین جاری
    static async changePassword(req, res, next) {
        try {
            const { currentPassword, newPassword } = req.body || {};

            if (!currentPassword || !newPassword) {
                return next(new AppError('لطفاً رمز عبور فعلی و رمز عبور جدید را وارد کنید.', 400));
            }

            if (newPassword.length < 6) {
                return next(new AppError('رمز عبور جدید باید حداقل ۶ کاراکتر باشد.', 400));
            }

            // دریافت اطلاعات کامل ادمین (شامل هش رمز عبور)
            const admin = await AdminService.findById(req.admin.id);
            if (!admin) {
                return next(new AppError('حساب کاربری یافت نشد.', 404));
            }

            // بررسی صحت رمز عبور فعلی
            const isPasswordValid = await AdminService.verifyPassword(currentPassword, admin.password);
            if (!isPasswordValid) {
                return next(new AppError('رمز عبور فعلی نادرست است.', 401));
            }

            // بروزرسانی رمز عبور در دیتابیس (هشدارهای لازم باید در سرویس هندل شود)
            await AdminService.updatePassword(admin.id, newPassword);

            // صدور توکن جدید و بروزرسانی کوکی
            const token = signToken(admin.id);
            const cookieExpiresInHours = Number(process.env.JWT_COOKIE_EXPIRES_IN || env.JWT_COOKIE_EXPIRES_IN || 1);

            res.cookie('jwt', token, {
                maxAge: cookieExpiresInHours * 60 * 60 * 1000,
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                partitioned: true,
            });

            res.status(200).json({
                status: 'success',
                message: 'رمز عبور با موفقیت تغییر یافت.',
                token,
            });
        } catch (error) {
            next(error);
        }
    }

    static async deleteAdmin(req, res, next) {
        try {
            const { id } = req.params;

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
            if (req.admin?.id) {
                await AdminService.updateLastLogout(req.admin.id);
            }

            res.cookie('jwt', 'loggedout', {
                expires: new Date(Date.now() + 10 * 1000),
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                partitioned: true,
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