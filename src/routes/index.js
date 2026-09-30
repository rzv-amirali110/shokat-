const express = require('express');
const submissionRoutes = require('./submission.routes');
const adminRoutes = require('./admin.routes');

const router = express.Router();

router.use('/', submissionRoutes);
router.use('/admin', adminRoutes);

module.exports = router;