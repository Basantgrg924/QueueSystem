const User = require('../models/User');
const Queue = require('../models/Queue');
const Token = require('../models/Token');

const getSystemStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const usersByRole = await User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);

        const roleStats = {};
        usersByRole.forEach(item => {
            roleStats[item._id] = item.count;
        });

        const totalQueues = await Queue.countDocuments();
        const activeQueues = await Queue.countDocuments({ isActive: true });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayTokens = await Token.countDocuments({
            createdAt: { $gte: today, $lt: tomorrow }
        });

        const activeTokens = await Token.countDocuments({
            status: { $in: ['waiting', 'called', 'serving'] }
        });

        const tokensByStatus = await Token.aggregate([
            {
                $match: {
                    createdAt: { $gte: today, $lt: tomorrow }
                }
            },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const statusStats = {};
        tokensByStatus.forEach(item => {
            statusStats[item._id] = item.count;
        });

        res.status(200).json({
            success: true,
            stats: {
                users: {
                    total: totalUsers,
                    byRole: roleStats
                },
                queues: {
                    total: totalQueues,
                    active: activeQueues
                },
                tokens: {
                    todayTotal: todayTokens,
                    active: activeTokens,
                    byStatus: statusStats
                }
            }
        });
    } catch (error) {
        console.error('Error fetching system stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching system statistics',
            error: error.message
        });
    }
};

// Get all users with filters and pagination
const getAllUsers = async (req, res) => {
    try {
        const { role, search, page = 1, limit = 20 } = req.query;

        let filter = {};

        if (role && role !== 'all') {
            filter.role = role;
        }

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;

        const users = await User.find(filter)
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const totalUsers = await User.countDocuments(filter);
        const totalPages = Math.ceil(totalUsers / limit);

        res.status(200).json({
            success: true,
            users,
            pagination: {
                current: parseInt(page),
                pages: totalPages,
                total: totalUsers,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
};

// Update user role
const updateUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        if (!['admin', 'staff', 'user'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role specified'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.role = role;
        await user.save();

        res.status(200).json({
            success: true,
            message: `User role updated to ${role}`,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating user role',
            error: error.message
        });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        // Check if user has active tokens
        const activeTokens = await Token.countDocuments({
            userId,
            status: { $in: ['waiting', 'called', 'serving'] }
        });

        if (activeTokens > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete user with active tokens'
            });
        }

        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting user',
            error: error.message
        });
    }
};

module.exports = {
    getSystemStats,
    getAllUsers,
    updateUserRole,
    deleteUser
};