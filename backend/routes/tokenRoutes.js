const express = require('express');
const {
    generateToken,
    getUserTokens,
    getTokenDetails,
    callNextToken,
    updateTokenStatus,
    cancelToken,
    getQueueHistory, getUserTokenHistory
} = require('../controllers/tokenController');
const { protect, staffOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// User routes
router.post('/generate', generateToken);
router.get('/my-tokens', getUserTokens);
router.patch('/:id/cancel', cancelToken);
router.get('/my-history', getUserTokenHistory); // Add this route
router.get('/:id', getTokenDetails);

// Staff only routes
router.post('/queue/:queueId/call-next', staffOnly, callNextToken);
router.patch('/:id/status', staffOnly, updateTokenStatus);
router.get('/queue/:queueId/history', staffOnly, getQueueHistory);

module.exports = router;