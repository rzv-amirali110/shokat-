const prisma = require('../config/database');
const AppError = require('../utils/appError');

class SubmissionService {
    static async createSubmission(category, text) {
        const validCategories = ['demands', 'memories', 'links'];
        if (!category || !validCategories.includes(category)) {
            throw new AppError('دسته‌بندی وارد شده معتبر نیست.', 400);
        }

        if (!text || text.trim().length === 0) {
            throw new AppError('متن پیام نمی‌تواند خالی باشد.', 400);
        }

        return await prisma.submission.create({
            data: {
                category,
                text: text.trim()
            }
        });
    }

    static async getSubmissionsByCategory(category) {
        const validCategories = ['demands', 'memories', 'links'];
        if (!validCategories.includes(category)) {
            throw new AppError('دسته‌بندی مورد نظر معتبر نیست.', 400);
        }

        return await prisma.submission.findMany({
            where: { category },
            orderBy: { createdAt: 'asc' }
        });
    }
}

module.exports = SubmissionService;