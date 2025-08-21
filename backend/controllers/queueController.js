const Queue = require('../models/Queue');
const Token = require('../models/Token');

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

        // Get current queue statistics
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

module.exports = {
    createQueue,
    getAllQueues,
    getQueueById,
};
