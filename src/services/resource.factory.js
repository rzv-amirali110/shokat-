const DemandService = require('./demand.service');
const AppError = require('../utils/appError');

const services = {
    demands: DemandService,
};

const getService = (resource) => {
    const service = services[resource];
    if (!service) {
        throw new AppError(`منبع درخواست‌شده (${resource}) معتبر نیست.`, 404);
    }
    return service;
};

module.exports = getService;