const logger = require('../utils/logger');
const env = require('../config/env'); // فراخوانی تنظیمات

const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // اکنون logger.error بدون خطا کار خواهد کرد
    logger.error(`${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method}`);

    if (env.NODE_ENV === 'development') {
        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    }

    if (err.isOperational) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    }

    return res.status(500).json({
        status: 'error',
        message: 'خطایی در سمت سرور رخ داده است. لطفاً بعداً دوباره تلاش کنید.'
    });
};

module.exports = globalErrorHandler;