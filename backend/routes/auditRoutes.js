const express = require('express');
const {
    getAuditLogs,
    getAuditStats,
    getAuditFilters,
    cleanupAuditLogs
} = require('../controllers/auditLogController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { auditMiddleware } = require('../middleware/auditMiddleware');

console.log('Audit routes file loaded');
const router = express.Router();

// All audit routes require authentication
router.use(protect);

// All audit routes require admin privileges
router.use(adminOnly);

// Get audit logs with filtering and pagination
router.get('/', getAuditLogs);

// Debug route (temporarily)
router.get('/debug', (req, res) => {
    console.log('Debug route hit');
    res.json({ message: 'Audit routes are working' });
});

// Get audit statistics
router.get('/stats', getAuditStats);

// Get filter options (no audit needed for this utility endpoint)
router.get('/filters', getAuditFilters);

// Cleanup old audit logs
router.delete('/cleanup', auditMiddleware('ADMIN_AUDIT_CLEANED'), cleanupAuditLogs);

module.exports = router;