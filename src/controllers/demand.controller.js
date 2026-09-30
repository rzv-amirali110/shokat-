const fs = require('fs');
const DemandService = require('../services/demand.service');
const AppError = require('../utils/appError');

class DemandController {
    // ۱. ثبت مطالبه
    static async createDemand(req, res, next) {
        try {
            const { title, description } = req.body || {};

            // اعتبارسنجی ورودی‌های متنی
            if (!title || !description) {
                // اگر فایلی آپلود شده اما اطلاعات متنی ناقص است، فایل را پاک می‌کنیم
                if (req.file) {
                    fs.unlink(req.file.path, () => {});
                }
                return next(new AppError('عنوان و توضیحات مطلب الزامی است.', 400));
            }

            // آدرس نسبی تصویر برای دسترسی عمومی با مرورگر
            const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

            const demand = await DemandService.createDemand({ title, description, imageUrl });

            res.status(201).json({
                status: 'success',
                message: 'مطالبه با موفقیت ثبت شد.',
                data: { demand },
            });
        } catch (error) {
            // اگر در ثبت دیتابیس خطایی رخ داد، فایل آپلودشده را پاک می‌کنیم
            if (req.file) {
                fs.unlink(req.file.path, () => {});
            }
            next(error);
        }
    }

    // ۲. دریافت لیست مطالبات
    static async getAllDemands(req, res, next) {
        try {
            const { status } = req.query;
            const demands = await DemandService.getAllDemands(status);

            res.status(200).json({
                status: 'success',
                results: demands.length,
                data: { demands },
            });
        } catch (error) {
            next(error);
        }
    }

    // ۳. دریافت جزییات مطالبه
    static async getDemandById(req, res, next) {
        try {
            const { id } = req.params;
            const demand = await DemandService.getDemandById(id);

            if (!demand) {
                return next(new AppError('مطالبه‌ای با این شناسه یافت نشد.', 404));
            }

            res.status(200).json({
                status: 'success',
                data: { demand },
            });
        } catch (error) {
            next(error);
        }
    }

    // ۴. تغییر وضعیت مطالبه
    static async updateDemandStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const validStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
            if (!status || !validStatuses.includes(status)) {
                return next(
                    new AppError('وضعیت نامعتبر است. مقادیر مجاز: PENDING, APPROVED, REJECTED', 400)
                );
            }

            const existingDemand = await DemandService.getDemandById(id);
            if (!existingDemand) {
                return next(new AppError('مطالبه‌ای با این شناسه یافت نشد.', 404));
            }

            const updatedDemand = await DemandService.updateDemandStatus(id, status);

            res.status(200).json({
                status: 'success',
                message: 'وضعیت مطالبه با موفقیت به‌روزرسانی شد.',
                data: { demand: updatedDemand },
            });
        } catch (error) {
            next(error);
        }
    }

    // ۵. حذف مطالبه
    static async deleteDemand(req, res, next) {
        try {
            const { id } = req.params;

            const existingDemand = await DemandService.getDemandById(id);
            if (!existingDemand) {
                return next(new AppError('مطالبه‌ای با این شناسه یافت نشد.', 404));
            }

            await DemandService.deleteDemand(id);

            res.status(200).json({
                status: 'success',
                message: 'مطالبه با موفقیت حذف شد.',
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = DemandController;