const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AdminService = require('../services/admin.service');
const AppError = require('../utils/appError');

// ==========================================
// ثابت‌ها و توابع کمکی
// ==========================================

// حداقل ۸ کاراکتر، شامل حرف انگلیسی، عدد و علامت
// (باید با validators.js فرانت‌اند یکی باشد)
const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>\-_+=\/\[\]~]).{8,}$/;
const passwordErrorMessage = 'رمز عبور باید حداقل ۸ کاراکتر و شامل حروف انگلیسی، عدد و علامت (مانند !@#$) باشد.';

const mobileRegex = /^09\d{9}$/;
const mobileErrorMessage = 'شماره موبایل واردشده معتبر نیست (مثال: 09123456789).';
const invalidInputMessage = 'ورودی نامعتبر است.';

const signToken = (id) =>
    jwt.sign({ id }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

// کوکی نشست: فرانت و بک هم‌مبدأ هستند، پس sameSite=strict (دفاع اصلی در برابر CSRF)
const getCookieOptions = () => {
    const hours = Number(process.env.JWT_COOKIE_EXPIRES_IN || env.JWT_COOKIE_EXPIRES_IN || 1);
    return {
        maxAge: hours * 60 * 60 * 1000,
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
    };
};

// برای clearCookie، گزینه‌ها باید یکسان باشند (بدون maxAge)
const getClearCookieOptions = () => {
    const { maxAge, ...options } = getCookieOptions();
    return options;
};

const isString = (value) => typeof value === 'string';

// فیلد اختیاری: undefined/null/رشته خالی = «ارسال نشده»
const optionalTrimmed = (value) => (isString(value) && value.trim() !== '' ? value.trim() : undefined);
const hasWrongType = (...values) => values.some((v) => v !== undefined && v !== null && !isString(v));

// تبدیل خطاهای شناخته‌شده پریزما به AppError؛ در غیر این صورت null
const mapPrismaError = (error) => {
    if (error?.code === 'P2002') {
        const field = error.meta?.target?.[0] === 'mobile' ? 'شماره موبایل' : 'نام کاربری';
        return new AppError(`این ${field} قبلاً در سیستم ثبت شده است.`, 400);
    }
    if (error?.code === 'P2025') {
        return new AppError('ادمینی با این شناسه یافت نشد.', 404);
    }
    return null;
};

const forwardError = (error, next) => next(mapPrismaError(error) || error);

// ==========================================
// کنترلر
// ==========================================

class AdminController {
    static async register(req, res, next) {
        try {
            const { username, mobile, password } = req.body || {};

            if (!username || !mobile || !password) {
                return next(new AppError('نام کاربری، شماره موبایل و رمز عبور الزامی هستند.', 400));
            }
            if (hasWrongType(username, mobile, password)) {
                return next(new AppError(invalidInputMessage, 400));
            }

            const cleanUsername = username.trim();
            if (!cleanUsername) {
                return next(new AppError('نام کاربری نمی‌تواند خالی باشد.', 400));
            }
            if (!mobileRegex.test(mobile)) {
                return next(new AppError(mobileErrorMessage, 400));
            }
            if (!passwordRegex.test(password)) {
                return next(new AppError(passwordErrorMessage, 400));
            }

            const admin = await AdminService.createAdmin({ username: cleanUsername, mobile, password });

            res.status(201).json({
                status: 'success',
                message: 'حساب ادمین با موفقیت ایجاد شد.',
                data: { admin },
            });
        } catch (error) {
            forwardError(error, next);
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

    // دریافت اطلاعات یک ادمین با شناسه
    static async getAdminById(req, res, next) {
        try {
            const admin = await AdminService.findById(req.params.id);
            if (!admin) {
                return next(new AppError('ادمینی با این شناسه یافت نشد.', 404));
            }

            res.status(200).json({ status: 'success', data: { admin } });
        } catch (error) {
            next(error);
        }
    }

    // ورود ادمین
    static async login(req, res, next) {
        try {
            const { username, password } = req.body || {};

            if (!username || !password) {
                return next(new AppError('لطفاً نام کاربری و رمز عبور را وارد کنید.', 400));
            }
            // جلوگیری از تزریق عملگر پریزما (مثلاً username = { "not": "" })
            if (!isString(username) || !isString(password)) {
                return next(new AppError(invalidInputMessage, 400));
            }

            const admin = await AdminService.findByUsername(username.trim());

            // مقایسه همیشه انجام می‌شود تا زمان پاسخ برای کاربر ناموجود لو نرود
            const isPasswordValid = await AdminService.verifyPassword(password, admin?.password);

            if (!admin || !isPasswordValid) {
                return next(new AppError('نام کاربری یا رمز عبور اشتباه است.', 401));
            }

            res.cookie('jwt', signToken(admin.id), getCookieOptions());

            // توکن فقط در کوکی httpOnly است و در بدنه پاسخ برنمی‌گردد
            res.status(200).json({
                status: 'success',
                message: 'با موفقیت وارد شدید.',
                data: { admin: { id: admin.id, username: admin.username, mobile: admin.mobile, createdAt: admin.createdAt } },
            });
        } catch (error) {
            next(error);
        }
    }

    // اطلاعات ادمین جاری (میدل‌ور protect فقط فیلدهای عمومی را روی req.admin می‌گذارد)
    static async getMe(req, res, next) {
        try {
            res.status(200).json({ status: 'success', data: { admin: req.admin } });
        } catch (error) {
            next(error);
        }
    }

    // تغییر نام کاربری و/یا موبایل ادمین جاری
    static async updateMe(req, res, next) {
        try {
            const { username, mobile } = req.body || {};

            if (hasWrongType(username, mobile)) {
                return next(new AppError(invalidInputMessage, 400));
            }

            const newUsername = optionalTrimmed(username);
            const newMobile = optionalTrimmed(mobile);

            if (!newUsername && !newMobile) {
                return next(new AppError('لطفاً حداقل یکی از فیلدهای نام کاربری یا شماره موبایل را برای ویرایش وارد کنید.', 400));
            }
            if (newMobile && !mobileRegex.test(newMobile)) {
                return next(new AppError(mobileErrorMessage, 400));
            }

            const updateData = {};
            if (newUsername) updateData.username = newUsername;
            if (newMobile) updateData.mobile = newMobile;

            const admin = await AdminService.updateAdmin(req.admin.id, updateData);

            res.status(200).json({
                status: 'success',
                message: 'اطلاعات پروفایل با موفقیت بروزرسانی شد.',
                data: { admin },
            });
        } catch (error) {
            forwardError(error, next);
        }
    }

    // ویرایش ادمین دیگر (PUT /admin/:id) — نام کاربری، موبایل و رمز اختیاری
    static async updateAdmin(req, res, next) {
        try {
            const { id } = req.params;
            const { username, mobile, password } = req.body || {};

            if (hasWrongType(username, mobile, password)) {
                return next(new AppError(invalidInputMessage, 400));
            }

            const newUsername = optionalTrimmed(username);
            if (!newUsername || !mobile) {
                return next(new AppError('نام کاربری و شماره موبایل الزامی هستند.', 400));
            }
            if (!mobileRegex.test(mobile)) {
                return next(new AppError(mobileErrorMessage, 400));
            }
            if (password && !passwordRegex.test(password)) {
                return next(new AppError(passwordErrorMessage, 400));
            }

            if (!(await AdminService.findById(id))) {
                return next(new AppError('ادمینی با این شناسه یافت نشد.', 404));
            }

            const admin = await AdminService.updateAdmin(id, { username: newUsername, mobile });

            if (password) {
                await AdminService.updatePassword(id, password);
                // نشست‌های آن مدیر باطل می‌شود؛ برای حساب خود، مسیر change-password را استفاده کنید
                if (String(req.admin.id) !== String(id)) {
                    await AdminService.updateLastLogout(id);
                }
            }

            res.status(200).json({
                status: 'success',
                message: 'اطلاعات مدیر با موفقیت به‌روزرسانی شد.',
                data: { admin },
            });
        } catch (error) {
            forwardError(error, next);
        }
    }

    // تغییر رمز عبور ادمین جاری
    static async changePassword(req, res, next) {
        try {
            const { currentPassword, newPassword } = req.body || {};

            if (!currentPassword || !newPassword) {
                return next(new AppError('لطفاً رمز عبور فعلی و رمز عبور جدید را وارد کنید.', 400));
            }
            if (hasWrongType(currentPassword, newPassword)) {
                return next(new AppError(invalidInputMessage, 400));
            }
            if (!passwordRegex.test(newPassword)) {
                return next(new AppError(passwordErrorMessage, 400));
            }
            if (currentPassword === newPassword) {
                return next(new AppError('رمز عبور جدید باید با رمز فعلی متفاوت باشد.', 400));
            }

            const currentHash = await AdminService.findPasswordHashById(req.admin.id);
            if (!currentHash) {
                return next(new AppError('حساب کاربری یافت نشد.', 404));
            }

            const isPasswordValid = await AdminService.verifyPassword(currentPassword, currentHash);
            if (!isPasswordValid) {
                return next(new AppError('رمز عبور فعلی نادرست است.', 401));
            }

            await AdminService.updatePassword(req.admin.id, newPassword);
            // ابطال همه توکن‌های قبلی؛ توکن جدید پس از این لحظه صادر می‌شود و معتبر است
            await AdminService.updateLastLogout(req.admin.id);

            res.cookie('jwt', signToken(req.admin.id), getCookieOptions());

            res.status(200).json({
                status: 'success',
                message: 'رمز عبور با موفقیت تغییر یافت.',
            });
        } catch (error) {
            next(error);
        }
    }

    static async deleteAdmin(req, res, next) {
        try {
            const { id } = req.params;

            if (String(req.admin.id) === String(id)) {
                return next(new AppError('شما نمی‌توانید حساب کاربری جاری خود را حذف کنید.', 400));
            }

            const admin = await AdminService.findById(id);
            if (!admin) {
                return next(new AppError('ادمینی با این شناسه یافت نشد.', 404));
            }

            await AdminService.deleteAdmin(id);

            res.status(200).json({
                status: 'success',
                message: `ادمین با نام کاربری "${admin.username}" با موفقیت حذف شد.`,
            });
        } catch (error) {
            forwardError(error, next);
        }
    }

    static async logout(req, res, next) {
        try {
            if (req.admin?.id) {
                await AdminService.updateLastLogout(req.admin.id);
            }

            res.clearCookie('jwt', getClearCookieOptions());

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