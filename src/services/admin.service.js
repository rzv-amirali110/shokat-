const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const env = require('../config/env');
const prisma = require('../config/database');

const BCRYPT_ROUNDS = 12;

// هش تصادفی و غیرقابل‌حدس برای مقایسه «ساختگی» وقتی کاربر وجود ندارد؛
// زمان پاسخ login برای کاربر موجود و ناموجود یکسان می‌شود (جلوگیری از user enumeration)
const DUMMY_HASH = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), BCRYPT_ROUNDS);

// فیلدهایی که مجاز است به کلاینت برسند (هرگز password یا lastLogoutAt)
const PUBLIC_SELECT = {
    id: true,
    username: true,
    mobile: true,
    createdAt: true,
};

class AdminService {
    // ۱. ساخت سوپر ادمین اولیه در صورت خالی بودن جدول ادمین‌ها
    static async initSuperAdmin() {
        const { SUPER_ADMIN_USERNAME, SUPER_ADMIN_MOBILE, SUPER_ADMIN_PASSWORD } = env;

        const count = await prisma.admin.count();
        if (count > 0) return;

        // fail-fast: اگر تنظیمات ناقص باشد سرور بدون ادمین بالا نمی‌آید
        if (!SUPER_ADMIN_USERNAME || !SUPER_ADMIN_MOBILE || !SUPER_ADMIN_PASSWORD) {
            throw new Error('متغیرهای SUPER_ADMIN_USERNAME / MOBILE / PASSWORD در env تنظیم نشده‌اند.');
        }

        await prisma.admin.create({
            data: {
                username: SUPER_ADMIN_USERNAME,
                mobile: SUPER_ADMIN_MOBILE,
                password: await bcrypt.hash(SUPER_ADMIN_PASSWORD, BCRYPT_ROUNDS),
            },
        });

        console.log(`✅ سوپر ادمین اولیه با نام کاربری "${SUPER_ADMIN_USERNAME}" ایجاد شد.`);
    }

    // ۲. ساخت ادمین جدید
    static async createAdmin({ username, mobile, password }) {
        return prisma.admin.create({
            data: {
                username,
                mobile,
                password: await bcrypt.hash(password, BCRYPT_ROUNDS),
            },
            select: PUBLIC_SELECT,
        });
    }

    // ۳. فقط برای login: شامل هش رمز است؛ نتیجه را هرگز مستقیم به کلاینت نفرستید
    static async findByUsername(username) {
        return prisma.admin.findUnique({ where: { username } });
    }

    // ۴. اطلاعات عمومی ادمین (بدون رمز و بدون lastLogoutAt)
    static async findById(id) {
        return prisma.admin.findUnique({ where: { id }, select: PUBLIC_SELECT });
    }

    // ۵. فقط برای میدل‌ور protect: شامل lastLogoutAt برای ابطال توکن بعد از logout
    static async findAuthById(id) {
        return prisma.admin.findUnique({
            where: { id },
            select: { ...PUBLIC_SELECT, lastLogoutAt: true },
        });
    }

    // ۶. فقط برای تغییر رمز: هش رمز فعلی
    static async findPasswordHashById(id) {
        const admin = await prisma.admin.findUnique({ where: { id }, select: { password: true } });
        return admin?.password ?? null;
    }

    static async findAll() {
        return prisma.admin.findMany({
            select: { ...PUBLIC_SELECT, updatedAt: true },
            orderBy: { createdAt: 'asc' },
        });
    }

    /**
     * مقایسه رمز. اگر hash وجود نداشت (کاربر ناموجود) با هش ساختگی مقایسه می‌کند
     * تا زمان پاسخ یکسان بماند؛ در این حالت هرگز true برنمی‌گردد.
     */
    static async verifyPassword(plainPassword, hashedPassword) {
        const isRealHash = Boolean(hashedPassword);
        const matches = await bcrypt.compare(plainPassword, hashedPassword || DUMMY_HASH);
        return isRealHash && matches;
    }

    static async updateAdmin(id, updateData) {
        return prisma.admin.update({ where: { id }, data: updateData, select: PUBLIC_SELECT });
    }

    static async updatePassword(id, newPassword) {
        return prisma.admin.update({
            where: { id },
            data: { password: await bcrypt.hash(newPassword, BCRYPT_ROUNDS) },
            select: { id: true },
        });
    }

    static async updateLastLogout(id) {
        return prisma.admin.update({
            where: { id },
            data: { lastLogoutAt: new Date() },
            select: { id: true },
        });
    }

    static async deleteAdmin(id) {
        return prisma.admin.delete({
            where: { id },
            select: { id: true, username: true, mobile: true },
        });
    }
}

module.exports = AdminService;