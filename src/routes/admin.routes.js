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

// مدیریت پروفایل ادمین جاری
router.get('/me', AdminController.getMe);
router.patch('/update-me', AdminController.updateMe);  
router.put('/:id', AdminController.updateAdmin);             // 🟢 تغییر نام کاربری و/یا شماره موبایل
router.patch('/change-password', AdminController.changePassword);   // 🟢 تغییر رمز عبور

router.post('/register', AdminController.register);

// روت‌های دریافت لیست و مدیریت ادمین‌ها با شناسه
router.get('/', AdminController.getAllAdmins);
router.get('/:id', AdminController.getAdminById);
router.delete('/:id', AdminController.deleteAdmin);

module.exports = router;