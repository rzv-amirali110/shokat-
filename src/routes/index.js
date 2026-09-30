const express = require('express');
const demandRouters = require("./demand.routes")
const adminRoutes = require('./admin.routes');

const router = express.Router();

router.use('/demand', demandRouters);
router.use('/admin', adminRoutes);

module.exports = router;