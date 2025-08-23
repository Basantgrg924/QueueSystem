const express = require('express');
const {
    getSystemStats,
    getAllUsers,
    updateUserRole,
    deleteUser
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { auditMiddleware } = require('../middleware/auditMiddleware');

const router = express.Router();

router.use(protect);
router.use(adminOnly);

router.get('/stats', getSystemStats);

router.get('/users', getAllUsers);
router.put('/users/:userId/role', auditMiddleware('ADMIN_USER_ROLE_CHANGED', 'User'), updateUserRole);
router.delete('/users/:userId', auditMiddleware('ADMIN_USER_DELETED', 'User'), deleteUser);

module.exports = router;