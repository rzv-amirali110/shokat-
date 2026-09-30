const SubmissionService = require('../services/submission.service');
const DocxService = require('../services/docx.service');
const AppError = require('../utils/appError');

class AdminController {
    static async downloadReport(req, res, next) {
        try {
            const { category } = req.params;
            const items = await SubmissionService.getSubmissionsByCategory(category);

            if (!items || items.length === 0) {
                throw new AppError('هیچ داده‌ای برای این دسته‌بندی ثبت نشده است.', 404);
            }

            const titles = {
                demands: 'مطالبات و دغدغه‌های دانشجویان',
                memories: 'خاطرات دانشجویان',
                links: 'لینک‌های کانال‌ها'
            };

            const title = titles[category] || 'گزارش';
            const buffer = await DocxService.generateCategoryReportBuffer(title, items);
            const fileName = `${category}_${Date.now()}.docx`;

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.setHeader('Content-Length', buffer.length);

            return res.send(buffer);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = AdminController;