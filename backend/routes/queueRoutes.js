const express = require('express');
const {
    createQueue,
    getAllQueues,
    getQueueById,
    updateQueue,
    deleteQueue,
    getQueuePosition
} = require('../controllers/QueueController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { auditMiddleware } = require('../middleware/auditMiddleware');

const router = express.Router();

// Public routes
router.get('/', getAllQueues);
router.get('/:id', getQueueById);
router.get('/:queueId/position', getQueuePosition);

// Protected routes (require authentication)
router.use(protect);

// Admin only routes
router.post('/', adminOnly, auditMiddleware('QUEUE_CREATED', 'Queue'), createQueue);
router.put('/:id', adminOnly, auditMiddleware('QUEUE_UPDATED', 'Queue'), updateQueue);
router.delete('/:id', adminOnly, auditMiddleware('QUEUE_DELETED', 'Queue'), deleteQueue);

module.exports = router;