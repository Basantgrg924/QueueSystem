const express = require('express');
const { registerUser, loginUser, updateUserProfile, getProfile, changePassword, verifyToken } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateUserProfile);
router.post('/change-password', protect, changePassword);
router.get('/verify', protect, verifyToken);

module.exports = router;