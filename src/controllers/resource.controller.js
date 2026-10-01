const fs = require('fs');
const path = require('path');
const getService = require('../services/resource.factory');
const AppError = require('../utils/appError');

const removeFile = (fileUrl) => {
    if (!fileUrl) return;
    const filePath = path.join(__dirname, '../../', fileUrl);
    if (fs.existsSync(filePath)) {
        fs.unlink(filePath, () => {});
    }
};

class ResourceController {
    // ۱. ایجاد آیپم جدید
    static async create(req, res, next) {
        try {
            const { resource } = req.params; // demands یا memories
            const service = getService(resource);

            const { title, description } = req.body || {};
            if (!title || !description) {
                if (req.file) removeFile(`/uploads/${req.file.filename}`);
                return next(new AppError('عنوان و توضیحات الزامی است.', 400));
            }

            const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
            const item = await service.create({ title, description, imageUrl });

            res.status(201).json({
                status: 'success',
                message: 'آیتم با موفقیت ثبت شد.',
                data: { item },
            });
        } catch (error) {
            if (req.file) removeFile(`/uploads/${req.file.filename}`);
            next(error);
        }
    }

    // ۲. دریافت همه آیتم‌ها
    static async getAll(req, res, next) {
        try {
            const { resource } = req.params;
            const service = getService(resource);

            const { status } = req.query;
            const items = await service.getAll(status);

            res.status(200).json({
                status: 'success',
                results: items.length,
                data: { items },
            });
        } catch (error) {
            next(error);
        }
    }

    // ۳. دریافت یک آیتم با ID
    static async getById(req, res, next) {
        try {
            const { resource, id } = req.params;
            const service = getService(resource);

            const item = await service.getById(id);
            if (!item) {
                return next(new AppError('آیتم مورد نظر یافت نشد.', 404));
            }

            res.status(200).json({
                status: 'success',
                data: { item },
            });
        } catch (error) {
            next(error);
        }
    }

    // ۴. تغییر وضعیت (تایید/رد)
    static async updateStatus(req, res, next) {
        try {
            const { resource, id } = req.params;
            const service = getService(resource);

            const { status } = req.body || {};
            const validStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
            if (!status || !validStatuses.includes(status)) {
                return next(new AppError('وضعیت نامعتبر است.', 400));
            }

            const updatedItem = await service.updateStatus(id, status);

            res.status(200).json({
                status: 'success',
                message: 'وضعیت با موفقیت به‌روزرسانی شد.',
                data: { item: updatedItem },
            });
        } catch (error) {
            next(error);
        }
    }

    // ۵. حذف آیتم
    static async delete(req, res, next) {
        try {
            const { resource, id } = req.params;
            const service = getService(resource);

            const item = await service.getById(id);
            if (!item) {
                return next(new AppError('آیتم مورد نظر یافت نشد.', 404));
            }

            removeFile(item.imageUrl);
            await service.delete(id);

            res.status(200).json({
                status: 'success',
                message: 'آیتم با موفقیت حذف شد.',
            });
        } catch (error) {
            next(error);
        }
    }

    static async getStats(req, res, next) {
        try {
            const demandService = getService('demands');
            const storyService = getService('stories');

            const demandsCount = await demandService.count();
            const storiesCount = await storyService.count();

            res.status(200).json({
                status: 'success',
                // این ساختار دقیقا همانی است که در کد فرانت‌اند قبلی نوشتیم
                demandsCount,
                storiesCount
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = ResourceController;