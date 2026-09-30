const express = require('express');
const ResourceRouters = require("./resource.routes");
const adminRoutes = require('./admin.routes');

const router = express.Router();

// ۱. اولویت اول: روت‌های اختصاصی و مشخص (اصلاح ترتیب)
router.use('/admin', adminRoutes);

// ۲. اولویت دوم: روت‌های عمومی و دینامیک (پلی‌مورفیک)
router.use('/', ResourceRouters);

module.exports = router;