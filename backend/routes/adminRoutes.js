const express = require('express');
const {
    getSystemStats,
    getAllUsers,
    updateUserRole,
    deleteUser
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.use(adminOnly);

router.get('/stats', getSystemStats);

router.get('/users', getAllUsers);
router.put('/users/:userId/role', updateUserRole);
router.delete('/users/:userId', deleteUser);

module.exports = router;