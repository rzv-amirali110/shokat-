const bcrypt = require('bcryptjs');
const env = require('../config/env');
const prisma = require('../config/database');

class AdminService {
    // ۱. ساخت سوپر ادمین اولیه در صورت خالی بودن جدول ادمین‌ها
    static async initSuperAdmin() {
        try {
            const count = await prisma.admin.count();

            // اگر هیچ ادمینی در دیتابیس وجود ندارد
            if (count === 0) {
                const hashedPassword = await bcrypt.hash(env.SUPER_ADMIN_PASSWORD, 10);

                await prisma.admin.create({
                    data: {
                        username: env.SUPER_ADMIN_USERNAME,
                        mobile: env.SUPER_ADMIN_MOBILE,
                        password: hashedPassword,
                    },
                });

                console.log(`✅ سوپر ادمین اولیه با نام کاربری "${env.SUPER_ADMIN_USERNAME}" ایجاد شد.`);
            }
        } catch (error) {
            console.error('❌ خطا در ایجاد سوپر ادمین اولیه:', error.message);
        }
    }

    // ۲. ساخت ادمین جدید دستی
    static async createAdmin({ username, mobile, password }) {
        const hashedPassword = await bcrypt.hash(password, 10);

        return await prisma.admin.create({
            data: {
                username,
                mobile,
                password: hashedPassword,
            },
            select: {
                id: true,
                username: true,
                mobile: true,
                createdAt: true,
            },
        });
    }

    // ۳. یافتن ادمین با یوزرنیم (برای لاگین)
    static async findByUsername(username) {
        return await prisma.admin.findUnique({
            where: { username },
        });
    }

    // ۴. یافتن ادمین با شناسه (ID)
    static async findById(id) {
        return await prisma.admin.findUnique({
            where: { id },
            select: {
                id: true,
                username: true,
                mobile: true,
                createdAt: true,
            },
        });
    }

    // ۵. مقایسه پسورد ورودی با پسورد هش‌شده دیتابیس
    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    // ۶. حذف ادمین با شناسه (ID)
    static async deleteAdmin(id) {
        return await prisma.admin.delete({
            where: { id },
            select: {
                id: true,
                username: true,
                mobile: true,
            },
        });
    }
    static async findAll() {
        return await prisma.admin.findMany({
            select: {
                id: true,
                username: true,
                mobile: true,
                lastLogoutAt: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }

    // 🟢 اگر متد findById هم وجود ندارد، مطمئن شوید اضافه شده است:
    static async findById(id) {
        return await prisma.admin.findUnique({
            where: { id },
        });
    }

    // 🟢 متد حذف ادمین
    static async deleteAdmin(id) {
        return await prisma.admin.delete({
            where: { id },
        });
    }
    static async updateLastLogout(id) {
        return await prisma.admin.update({
            where: { id },
            data: {
                lastLogoutAt: new Date(),
            },
        });
    }
}

module.exports = AdminService;