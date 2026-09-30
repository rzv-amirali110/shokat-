const express = require('express');
const AdminController = require('../controllers/admin.controller');

const router = express.Router();

router.get('/download-word/:category', AdminController.downloadReport);

module.exports = router;