const prisma = require('../config/database');


class DemandService {
    // ۱. ثبت یک مطالبه جدید
    static async create(data) {
        return await prisma.demand.create({
            data: {
                title: data.title,
                description: data.description,
                imageUrl: data.imageUrl || null,
            },
        });
    }

    // ۲. دریافت همه مطالبات (با فیلتر اختیاری status)
    static async getAll(status) {
        const whereClause = status ? { status } : {};
        return await prisma.demand.findMany({
            where: whereClause,
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    // ۳. دریافت یک مطالبه بر اساس ID
    static async getById(id) {
        return await prisma.demand.findUnique({
            where: { id },
        });
    }

    // ۴. به‌روزرسانی وضعیت مطالبه
    static async updateStatus(id, status) {
        return await prisma.demand.update({
            where: { id },
            data: { status },
        });
    }

    // ۵. حذف مطالبه
    static async delete(id) {
        return await prisma.demand.delete({
            where: { id },
        });
    }
    static async count(status) {
        const whereClause = status ? { status } : {};
        return await prisma.demand.count({
            where: whereClause,
        });
    }
}

module.exports = DemandService;