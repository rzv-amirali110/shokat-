const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin.controller');
const { protect } = require('../middlewares/auth.middleware');

// ==========================================
// ۱. روت‌های عمومی (Public Routes)
// ==========================================
router.post('/login', AdminController.login);

// ==========================================
// ۲. روت‌های محافظت‌شده (Protected Routes)
// ==========================================
router.use(protect); // اعمال میدل‌ور protect روی تمام روت‌های زیر

router.post('/logout', AdminController.logout);
router.get('/me', AdminController.getMe);
router.post('/register', AdminController.register);

// روت‌های دریافت لیست و تک ادمین (جلوگیری از Fallthrough به resourceRoutes)
router.get('/', AdminController.getAllAdmins);
router.get('/:id', AdminController.getAdminById);
router.delete('/:id', AdminController.deleteAdmin);

module.exports = router;