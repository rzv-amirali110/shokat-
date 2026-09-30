const express = require('express');
const router = express.Router();
const DemandController = require('../controllers/demand.controller');
const { protect } = require('../middlewares/auth.middleware');
const { submissionLimiter } = require('../middlewares/rateLimiter.middleware');
const upload = require('../middlewares/upload.middleware');

// --- روت‌های عمومی ---
// ثبت مطالبه جدید با دریافت فایل تصویر تحت کلید imageUrl
router.post('/', submissionLimiter, upload.single('imageUrl'), DemandController.createDemand);

router.get('/', DemandController.getAllDemands);
router.get('/:id', DemandController.getDemandById);

// --- روت‌های مدیریتی ---
router.patch('/:id/status', protect, DemandController.updateDemandStatus);
router.delete('/:id', protect, DemandController.deleteDemand);

module.exports = router;