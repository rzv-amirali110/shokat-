const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
        return await prisma.story.delete({
            where: { id },
        });
    }
}

module.exports = StoryService;