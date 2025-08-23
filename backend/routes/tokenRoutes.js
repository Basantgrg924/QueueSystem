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
const { auditMiddleware } = require('../middleware/auditMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// User routes
router.post('/generate', auditMiddleware('TOKEN_GENERATED', 'Token'), generateToken);
router.get('/my-tokens', getUserTokens);
router.patch('/:id/cancel', auditMiddleware('TOKEN_CANCELLED', 'Token'), cancelToken);
router.get('/my-history', getUserTokenHistory);
router.get('/:id', getTokenDetails);

// Staff only routes
router.post('/queue/:queueId/call-next', staffOnly, auditMiddleware('STAFF_TOKEN_CALLED', 'Token'), callNextToken);
router.patch('/:id/status', staffOnly, auditMiddleware('STAFF_TOKEN_STATUS_CHANGED', 'Token'), updateTokenStatus);
router.get('/queue/:queueId/history', staffOnly, getQueueHistory);

module.exports = router;