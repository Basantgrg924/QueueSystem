const AuditLog = require('../models/AuditLog');

// Get all audit logs with filtering and pagination
const getAuditLogs = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            action,
            userId,
            targetType,
            status,
            startDate,
            endDate,
            search
        } = req.query;

        // Build filter object
        const filter = {};

        if (action) {
            filter.action = action;
        }

        if (userId) {
            filter.userId = userId;
        }

        if (targetType) {
            filter.targetType = targetType;
        }

        if (status) {
            filter.status = status;
        }

        // Date range filter
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                filter.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                const endDateTime = new Date(endDate);
                endDateTime.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = endDateTime;
            }
        }

        // Search filter (description or user name)
        if (search) {
            filter.$or = [
                { description: { $regex: search, $options: 'i' } },
                { 'user.name': { $regex: search, $options: 'i' } }
            ];
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Get audit logs with user information
        const auditLogs = await AuditLog.find(filter)
            .populate('userId', 'name email role')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        // Get total count for pagination
        const totalLogs = await AuditLog.countDocuments(filter);
        const totalPages = Math.ceil(totalLogs / limit);

        // Format response data
        const formattedLogs = auditLogs.map(log => ({
            id: log._id,
            action: log.action,
            description: log.description,
            user: {
                id: log.userId?._id,
                name: log.userId?.name || 'Unknown User',
                email: log.userId?.email,
                role: log.userId?.role
            },
            targetType: log.targetType,
            targetId: log.targetId,
            status: log.status,
            errorMessage: log.errorMessage,
            ipAddress: log.ipAddress,
            userAgent: log.userAgent,
            metadata: log.metadata,
            createdAt: log.createdAt,
            formattedDate: log.formattedDate,
            actionIcon: log.getActionIcon(),
            actionColor: log.getActionColor()
        }));

        res.status(200).json({
            success: true,
            data: {
                logs: formattedLogs,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalLogs,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1,
                    limit: parseInt(limit)
                },
                filters: {
                    action,
                    userId,
                    targetType,
                    status,
                    startDate,
                    endDate,
                    search
                }
            }
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching audit logs',
            error: error.message
        });
    }
};

// Get audit log statistics
const getAuditStats = async (req, res) => {
    try {
        const { timeRange = '7d' } = req.query;

        // Calculate date range
        const now = new Date();
        let startDate;

        switch (timeRange) {
            case '24h':
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        const filter = { createdAt: { $gte: startDate } };

        // Get total count
        const totalActions = await AuditLog.countDocuments(filter);

        // Get actions by type
        const actionsByType = await AuditLog.aggregate([
            { $match: filter },
            { $group: { _id: '$action', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Get actions by user
        const actionsByUser = await AuditLog.aggregate([
            { $match: filter },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: '$userId',
                    userName: { $first: '$user.name' },
                    userRole: { $first: '$user.role' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Get success vs failure rate
        const statusStats = await AuditLog.aggregate([
            { $match: filter },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Get activity by day (for charts)
        const activityByDay = await AuditLog.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$createdAt'
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Get recent failed actions
        const recentFailures = await AuditLog.find({
            ...filter,
            status: 'FAILED'
        })
            .populate('userId', 'name email role')
            .sort({ createdAt: -1 })
            .limit(5)
            .select('action description userId createdAt errorMessage');

        res.status(200).json({
            success: true,
            data: {
                totalActions,
                timeRange,
                actionsByType: actionsByType.map(item => ({
                    action: item._id,
                    count: item.count,
                    percentage: Math.round((item.count / totalActions) * 100)
                })),
                actionsByUser: actionsByUser.map(item => ({
                    userId: item._id,
                    userName: item.userName || 'Unknown User',
                    userRole: item.userRole,
                    count: item.count,
                    percentage: Math.round((item.count / totalActions) * 100)
                })),
                statusStats: statusStats.reduce((acc, item) => {
                    acc[item._id.toLowerCase()] = item.count;
                    return acc;
                }, {}),
                activityByDay: activityByDay.map(item => ({
                    date: item._id,
                    count: item.count
                })),
                recentFailures: recentFailures.map(failure => ({
                    id: failure._id,
                    action: failure.action,
                    description: failure.description,
                    user: failure.userId?.name || 'Unknown User',
                    createdAt: failure.createdAt,
                    errorMessage: failure.errorMessage
                }))
            }
        });
    } catch (error) {
        console.error('Error fetching audit statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching audit statistics',
            error: error.message
        });
    }
};

// Get available filter options
const getAuditFilters = async (req, res) => {
    try {
        // Get unique actions
        const actions = await AuditLog.distinct('action');

        // Get unique target types
        const targetTypes = await AuditLog.distinct('targetType');

        // Get users who have performed actions
        const users = await AuditLog.aggregate([
            {
                $group: {
                    _id: '$userId'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            {
                $project: {
                    _id: '$user._id',
                    name: '$user.name',
                    email: '$user.email',
                    role: '$user.role'
                }
            },
            { $sort: { name: 1 } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                actions: actions.sort(),
                targetTypes: targetTypes.filter(Boolean).sort(),
                users,
                statuses: ['SUCCESS', 'FAILED', 'PARTIAL']
            }
        });
    } catch (error) {
        console.error('Error fetching audit filters:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching audit filters',
            error: error.message
        });
    }
};

// Delete old audit logs (admin only)
const cleanupAuditLogs = async (req, res) => {
    try {
        const { retentionDays = 90 } = req.body;

        if (retentionDays < 30) {
            return res.status(400).json({
                success: false,
                message: 'Retention period must be at least 30 days'
            });
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        const result = await AuditLog.deleteMany({
            createdAt: { $lt: cutoffDate }
        });

        res.status(200).json({
            success: true,
            message: `Cleaned up audit logs older than ${retentionDays} days`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Error cleaning up audit logs:', error);
        res.status(500).json({
            success: false,
            message: 'Error cleaning up audit logs',
            error: error.message
        });
    }
};

module.exports = {
    getAuditLogs,
    getAuditStats,
    getAuditFilters,
    cleanupAuditLogs
};