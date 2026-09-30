const express = require('express');
const ResourceRouters = require("./resource.routes")
const adminRoutes = require('./admin.routes');

const router = express.Router();

router.use('/', ResourceRouters);
router.use('/admin', adminRoutes);

module.exports = router;