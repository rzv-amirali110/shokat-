const express = require('express');
const router = express.Router({ mergeParams: true });
const ResourceController = require('../controllers/resource.controller');
const upload = require('../middlewares/upload.middleware');
const { protect } = require('../middlewares/auth.middleware');

// ثبت آیتم جدید (آدرس: /api/:resource)
router.post('/:resource', upload.single('imageUrl'), ResourceController.create);


router.use(protect)
// دریافت همه آیتم‌ها (آدرس: /api/:resource?status=APPROVED)
router.get('/:resource', ResourceController.getAll);

// دریافت یک آیتم (آدرس: /api/:resource/:id)
router.get('/:resource/:id', ResourceController.getById);

// تغییر وضعیت (آدرس: /api/:resource/:id/status)
router.patch('/:resource/:id/status', ResourceController.updateStatus);

// حذف (آدرس: /api/:resource/:id)
router.delete('/:resource/:id', ResourceController.delete);

module.exports = router;