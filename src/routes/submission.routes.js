const express = require('express');
const SubmissionController = require('../controllers/submission.controller');

const router = express.Router();

router.post('/submit', SubmissionController.submit);

module.exports = router;