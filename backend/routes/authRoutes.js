const express = require('express');
const { registerUser, loginUser, updateUserProfile, getProfile, changePassword, verifyToken } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { auditMiddleware } = require('../middleware/auditMiddleware');
const router = express.Router();

router.post('/register', auditMiddleware('USER_CREATED', 'User'), registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, auditMiddleware('USER_PROFILE_UPDATED', 'User'), updateUserProfile);
router.post('/change-password', protect, auditMiddleware('USER_PASSWORD_CHANGED'), changePassword);
router.get('/verify', protect, verifyToken);

module.exports = router;