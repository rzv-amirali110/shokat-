const prisma = require('../config/database');


class StoryService {
    // ۱. ایجاد داستان/خاطره جدید
    static async create(data) {
        return await prisma.story.create({
            data: {
                title: data.title,
                description: data.description,
                imageUrl: data.imageUrl || null,
                status: data.status || 'PENDING',
            },
        });
    }

    // ۲. دریافت همه داستان‌ها
    static async getAll(status) {
        const whereClause = status ? { status } : {};
        return await prisma.story.findMany({
            where: whereClause,
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    // ۳. دریافت یک داستان با ID
    static async getById(id) {
        return await prisma.story.findUnique({
            where: { id },
        });
    }

    // ۴. به‌روزرسانی وضعیت
    static async updateStatus(id, status) {
        return await prisma.story.update({
            where: { id },
            data: { status },
        });
    }

    // ۵. حذف داستان
    static async delete(id) {
        // ۱. پیدا کردن داستان برای دریافت آدرس عکس
        const story = await prisma.story.findUnique({
            where: { id },
        });

        if (!story) {
            throw new Error('داستان مورد نظر یافت نشد.');
        }

        // ۲. حذف فایل تصویر در صورت وجود
        if (story.imageUrl) {
            // تبدیل لینک/مسیر نسبی به مسیر مطلق روی سرور
            const filePath = path.join(__dirname, '..', story.imageUrl);

            // بررسی وجود فایل و حذف آن
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // ۳. حذف رکورد از دیتابیس
        return await prisma.story.delete({
            where: { id },
        });
    }
}

module.exports = StoryService;