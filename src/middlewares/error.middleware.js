const logger = require('../utils/logger');

/**
 * میدلور مرکزی مدیریت خطا در Express
 */
const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // ثبت خطا در کنسول / فایل لاگ
    logger.error(`${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method}`);

    // حالت توسعه (Dev Environment): نمایش جزئیات کامل و stack trace
    if (process.env.NODE_ENV === 'development') {
        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    }

    // خطاهای عملیاتی شناخته‌شده (مربوط به منطق برنامه)
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    }

    // خطاهای غیرمنتظره سرور (خطاهای ناشناخته ۵۰۰)
    return res.status(500).json({
        status: 'error',
        message: 'خطایی در سمت سرور رخ داده است. لطفاً بعداً دوباره تلاش کنید.'
    });
};

module.exports = globalErrorHandler;