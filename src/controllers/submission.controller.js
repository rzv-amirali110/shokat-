const SubmissionService = require('../services/submission.service');

class SubmissionController {
    static async submit(req, res, next) {
        try {
            const { category, text } = req.body;
            const newSubmission = await SubmissionService.createSubmission(category, text);

            return res.status(201).json({
                success: true,
                message: 'با موفقیت ثبت شد.',
                data: newSubmission
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = SubmissionController;