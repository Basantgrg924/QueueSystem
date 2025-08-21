const express = require('express');
const {
    createQueue,
    getAllQueues,
    getQueueById,

} = require('../controllers/QueueController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/', getAllQueues);
router.get('/:id', getQueueById);

// Protected routes (require authentication)
router.use(protect);

// Admin only routes
router.post('/', adminOnly, createQueue);


module.exports = router;