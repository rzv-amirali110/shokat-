const AppError = require('../utils/appError');

/**
 * تابع کارخانه‌ای ساخت میدلور اعتبارسنجی ورودی‌ها
 * @param {Object} schema - شیء حاوی قوانین اعتبارسنجی برای body, params یا query
 */
const validate = (schema) => {
    return (req, res, next) => {
        const locations = ['body', 'params', 'query'];

        for (const location of locations) {
            if (schema[location]) {
                const rules = schema[location];
                const data = req[location] || {};

                for (const field of Object.keys(rules)) {
                    const rule = rules[field];
                    const value = data[field];
                    const label = rule.label || field;

                    // ۱. بررسی اجباری بودن فیلد (Required Check)
                    if (rule.required && (value === undefined || value === null || (typeof value === 'string' && value.trim() === ''))) {
                        return next(new AppError(`فیلد '${label}' الزامی است.`, 400));
                    }

                    // اگر فیلد اختیاری باشد و مقداری ارسال نشده باشد، بررسی‌های بعدی انجام نمی‌شوند
                    if (value === undefined || value === null || value === '') {
                        continue;
                    }

                    // ۲. بررسی نوع داده (Type Check)
                    if (rule.type && typeof value !== rule.type) {
                        return next(new AppError(`فیلد '${label}' باید از نوع ${rule.type} باشد.`, 400));
                    }

                    // ۳. بررسی حداقل طول برای رشته‌ها (Min Length Check)
                    if (rule.minLength && typeof value === 'string' && value.trim().length < rule.minLength) {
                        return next(new AppError(`فیلد '${label}' باید حداقل ${rule.minLength} کاراکتر باشد.`, 400));
                    }

                    // ۴. بررسی حداکثر طول برای رشته‌ها (Max Length Check)
                    if (rule.maxLength && typeof value === 'string' && value.trim().length > rule.maxLength) {
                        return next(new AppError(`فیلد '${label}' نمی‌تواند بیشتر از ${rule.maxLength} کاراکتر باشد.`, 400));
                    }

                    // ۵. بررسی مقادیر مجاز (Enum / Allowed Values Check)
                    if (rule.enum && Array.isArray(rule.enum) && !rule.enum.includes(value)) {
                        return next(new AppError(`مقدار انتخاب‌شده برای '${label}' نامعتبر است. مقادیر مجاز: ${rule.enum.join(', ')}`, 400));
                    }
                }
            }
        }

        next();
    };
};

// اعتبارسنجی فرم ثبت پیام (مطالبات، خاطرات، لینک‌ها)
const validateSubmission = validate({
    body: {
        category: {
            required: true,
            type: 'string',
            enum: ['demands', 'memories', 'links'],
            label: 'دسته‌بندی'
        },
        text: {
            required: true,
            type: 'string',
            minLength: 3,
            maxLength: 3000,
            label: 'متن پیام'
        }
    }
});

// اعتبارسنجی پارامتر category در URL (مثلاً برای دانلود گزارش‌ها)
const validateCategoryParam = validate({
    params: {
        category: {
            required: true,
            type: 'string',
            enum: ['demands', 'memories', 'links'],
            label: 'دسته‌بندی درخواست شده'
        }
    }
});

module.exports = {
    validate,
    validateSubmission,
    validateCategoryParam
};