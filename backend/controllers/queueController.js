
const Queue = require('../models/Queue');
const Token = require('../models/Token');

const calculateCurrentPosition = async (token) => {
    try {
        if (token.status === 'serving') return 0;
        if (token.status === 'called') return 1;
        if (!['waiting'].includes(token.status)) return null;

        const tokensAhead = await Token.countDocuments({
            queueId: token.queueId,
            status: { $in: ['waiting', 'called', 'serving'] },
            tokenNumber: { $lt: token.tokenNumber }
        });

        return tokensAhead + 1;
    } catch (error) {
        console.error('Error calculating position:', error);
        return null;
    }
};

// Create new queue (Admin only)
const createQueue = async (req, res) => {
    try {
        const { name, description, maxCapacity, avgServiceTime } = req.body;

        const queue = await Queue.create({
            name,
            description,
            maxCapacity,
            avgServiceTime,
            createdBy: req.user.id
        });

        res.status(201).json({
            success: true,
            message: 'Queue created successfully',
            queue
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating queue',
            error: error.message
        });
    }
};

// Get all queues
const getAllQueues = async (req, res) => {
    try {
        const queues = await Queue.find({ isActive: true })
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: queues.length,
            queues
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching queues',
            error: error.message
        });
    }
};

// Get queue by ID with details
const getQueueById = async (req, res) => {
    try {
        const queue = await Queue.findById(req.params.id)
            .populate('createdBy', 'name email');

        if (!queue) {
            return res.status(404).json({
                success: false,
                message: 'Queue not found'
            });
        }

        const activeTokens = await Token.countDocuments({
            queueId: queue._id,
            status: { $in: ['waiting', 'called', 'serving'] }
        });

        const currentServing = await Token.findOne({
            queueId: queue._id,
            status: 'serving'
        }).populate('userId', 'name email');

        queue.currentCount = activeTokens;
        await queue.save();

        res.status(200).json({
            success: true,
            queue,
            currentServing,
            statistics: {
                activeTokens,
                completedToday: await Token.countDocuments({
                    queueId: queue._id,
                    status: 'completed',
                    createdAt: {
                        $gte: new Date(new Date().setHours(0, 0, 0, 0))
                    }
                })
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching queue',
            error: error.message
        });
    }
};

// Update queue details (Admin only)
const updateQueue = async (req, res) => {
    try {
        const { name, description, maxCapacity, avgServiceTime, isActive } = req.body;

        const queue = await Queue.findById(req.params.id);
        if (!queue) {
            return res.status(404).json({
                success: false,
                message: 'Queue not found'
            });
        }

        queue.name = name || queue.name;
        queue.description = description || queue.description;
        queue.maxCapacity = maxCapacity || queue.maxCapacity;
        queue.avgServiceTime = avgServiceTime || queue.avgServiceTime;
        if (isActive !== undefined) queue.isActive = isActive;

        const updatedQueue = await queue.save();

        res.status(200).json({
            success: true,
            message: 'Queue updated successfully',
            queue: updatedQueue
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating queue',
            error: error.message
        });
    }
};

// Delete queue (Admin only)
const deleteQueue = async (req, res) => {
    try {
        const queue = await Queue.findById(req.params.id);
        if (!queue) {
            return res.status(404).json({
                success: false,
                message: 'Queue not found'
            });
        }

        const activeTokens = await Token.countDocuments({
            queueId: queue._id,
            status: { $in: ['waiting', 'called', 'serving'] }
        });

        if (activeTokens > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete queue with active tokens'
            });
        }

        await Queue.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Queue deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting queue',
            error: error.message
        });
    }
};

// Get queue position and wait time
const getQueuePosition = async (req, res) => {
    try {
        const { queueId } = req.params;

        const queue = await Queue.findById(queueId);
        if (!queue || !queue.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Queue not found or inactive'
            });
        }

        // Get waiting tokens sorted by token number
        const waitingTokens = await Token.find({
            queueId,
            status: 'waiting'
        }).sort({ tokenNumber: 1 });

        const currentServing = await Token.findOne({
            queueId,
            status: 'serving'
        }).populate('userId', 'name');

        const waitingTokensWithPositions = await Promise.all(
            waitingTokens.map(async (token) => {
                const currentPosition = await calculateCurrentPosition(token);
                return {
                    tokenNumber: token.tokenNumber,
                    position: currentPosition,
                    estimatedCallTime: token.estimatedCallTime
                };
            })
        );

        res.status(200).json({
            success: true,
            queueInfo: {
                name: queue.name,
                currentCount: waitingTokens.length,
                estimatedWaitTime: waitingTokens.length * queue.avgServiceTime,
                currentServing: currentServing ? {
                    tokenNumber: currentServing.tokenNumber,
                    userName: currentServing.userId.name
                } : null
            },
            waitingTokens: waitingTokensWithPositions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching queue position',
            error: error.message
        });
    }
};

module.exports = {
    createQueue,
    getAllQueues,
    getQueueById,
    updateQueue,
    deleteQueue,
    getQueuePosition
};