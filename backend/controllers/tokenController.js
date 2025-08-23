const Token = require('../models/Token');
const Queue = require('../models/Queue');

// Helper function to generate token number
const generateTokenNumber = async (queueId, queueName) => {
    try {
        const queuePrefix = queueName.substring(0, 3).toUpperCase();
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');

        // Find the last token for today for this queue
        const lastToken = await Token.findOne({
            queueId,
            tokenNumber: { $regex: `^${queuePrefix}${today}` }
        }).sort({ createdAt: -1 });

        let sequentialNumber = 1;
        if (lastToken && lastToken.tokenNumber) {
            const lastSequence = lastToken.tokenNumber.slice(-3);
            sequentialNumber = parseInt(lastSequence) + 1;
        }

        return `${queuePrefix}${today}${sequentialNumber.toString().padStart(3, '0')}`;
    } catch (error) {
        throw new Error('Failed to generate token number');
    }
};

// Helper function to calculate current queue position based on token number
const calculateCurrentPosition = async (token) => {
    try {
        // If token is not waiting, return special positions
        if (token.status === 'serving') return 0; // Currently being served
        if (token.status === 'called') return 1; // Next to be served
        if (!['waiting'].includes(token.status)) return null; // Completed/cancelled tokens

        // For waiting tokens, count active tokens with lower token numbers
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

// Generate new token
const generateToken = async (req, res) => {
    try {
        console.log('Token generation started for user:', req.user?.id);
        console.log('Request body:', req.body);
        
        const { queueId } = req.body;

        if (!queueId) {
            console.log('Error: Queue ID missing');
            return res.status(400).json({
                success: false,
                message: 'Queue ID is required'
            });
        }

        console.log('Looking for queue with ID:', queueId);
        const queue = await Queue.findById(queueId);
        console.log('Queue found:', queue ? 'Yes' : 'No');
        console.log('Queue active:', queue?.isActive);
        
        if (!queue || !queue.isActive) {
            console.log('Error: Queue not found or inactive');
            return res.status(404).json({
                success: false,
                message: 'Queue not found or inactive'
            });
        }

        // Check if queue is at capacity
        const currentTokens = await Token.countDocuments({
            queueId,
            status: { $in: ['waiting', 'called', 'serving'] }
        });

        if (currentTokens >= queue.maxCapacity) {
            return res.status(400).json({
                success: false,
                message: 'Queue is at maximum capacity'
            });
        }

        // Check if user already has an active token in this queue
        const existingToken = await Token.findOne({
            queueId,
            userId: req.user.id,
            status: { $in: ['waiting', 'called', 'serving'] }
        });

        if (existingToken) {
            return res.status(400).json({
                success: false,
                message: 'You already have an active token in this queue',
                existingToken: {
                    tokenNumber: existingToken.tokenNumber,
                    status: existingToken.status
                }
            });
        }

        // Generate token number
        const tokenNumber = await generateTokenNumber(queueId, queue.name);

        // Calculate estimated call time based on active tokens ahead
        const tokensAhead = currentTokens;
        const estimatedCallTime = new Date(Date.now() + (tokensAhead * queue.avgServiceTime * 60000));

        // Create token
        const tokenData = {
            tokenNumber,
            queueId,
            userId: req.user.id,
            position: tokensAhead + 1,
            estimatedCallTime
        };

        const token = new Token(tokenData);
        await token.save();

        await token.populate('queueId', 'name avgServiceTime');
        await token.populate('userId', 'name email');

        // Calculate current position
        const currentPosition = await calculateCurrentPosition(token);

        // Update queue current count
        queue.currentCount = currentTokens + 1;
        await queue.save();

        res.status(201).json({
            success: true,
            message: 'Token generated successfully',
            token: {
                tokenNumber: token.tokenNumber,
                currentPosition,
                status: token.status,
                estimatedCallTime: token.estimatedCallTime,
                queueName: token.queueId.name
            }
        });
    } catch (error) {
        console.error('Token generation error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Error generating token',
            error: error.message
        });
    }
};

// Get user's tokens with current positions
const getUserTokens = async (req, res) => {
    try {
        const allTokens = await Token.find({
            userId: req.user.id
        }).populate('queueId', 'name avgServiceTime').sort({ createdAt: -1 });

        // Calculate current positions for all tokens
        const tokensWithPositions = await Promise.all(
            allTokens.map(async (token) => {
                const currentPosition = await calculateCurrentPosition(token);

                return {
                    id: token._id,
                    tokenNumber: token.tokenNumber,
                    queueName: token.queueId.name,
                    currentPosition,
                    status: token.status,
                    estimatedCallTime: token.estimatedCallTime,
                    createdAt: token.createdAt,
                    calledAt: token.calledAt,
                    servedAt: token.servedAt,
                    completedAt: token.completedAt
                };
            })
        );

        // Separate active and completed tokens
        const activeTokens = tokensWithPositions.filter(token =>
            ['waiting', 'called', 'serving'].includes(token.status)
        );
        const completedTokens = tokensWithPositions.filter(token =>
            ['completed', 'cancelled', 'no-show'].includes(token.status)
        );

        res.status(200).json({
            success: true,
            count: activeTokens.length,
            tokens: [...activeTokens, ...completedTokens]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user tokens',
            error: error.message
        });
    }
};

// Get token details with current position
const getTokenDetails = async (req, res) => {
    try {
        const token = await Token.findById(req.params.id)
            .populate('queueId', 'name avgServiceTime')
            .populate('userId', 'name email');

        if (!token) {
            return res.status(404).json({
                success: false,
                message: 'Token not found'
            });
        }

        // Check if user owns the token or is staff
        if (token.userId._id.toString() !== req.user.id && req.user.role !== 'staff' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Calculate current position
        const currentPosition = await calculateCurrentPosition(token);

        res.status(200).json({
            success: true,
            token: {
                id: token._id,
                tokenNumber: token.tokenNumber,
                queueName: token.queueId.name,
                currentPosition,
                status: token.status,
                estimatedCallTime: token.estimatedCallTime,
                calledAt: token.calledAt,
                servedAt: token.servedAt,
                completedAt: token.completedAt,
                notes: token.notes,
                createdAt: token.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching token details',
            error: error.message
        });
    }
};

// Call next token (Staff only)
const callNextToken = async (req, res) => {
    try {
        const { queueId } = req.params;

        // Find the next waiting token (lowest token number)
        const nextToken = await Token.findOne({
            queueId,
            status: 'waiting'
        }).sort({ tokenNumber: 1 }).populate('userId', 'name email');

        if (!nextToken) {
            return res.status(404).json({
                success: false,
                message: 'No tokens waiting in queue'
            });
        }

        // Update token status
        nextToken.status = 'called';
        nextToken.calledAt = new Date();
        await nextToken.save();

        res.status(200).json({
            success: true,
            message: 'Token called successfully',
            token: {
                tokenNumber: nextToken.tokenNumber,
                userName: nextToken.userId.name,
                userEmail: nextToken.userId.email,
                calledAt: nextToken.calledAt
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error calling next token',
            error: error.message
        });
    }
};

// Update token status (Staff only)
const updateTokenStatus = async (req, res) => {
    try {
        const { status, notes } = req.body;
        const tokenId = req.params.id;

        const token = await Token.findById(tokenId).populate('userId', 'name email');
        if (!token) {
            return res.status(404).json({
                success: false,
                message: 'Token not found'
            });
        }

        const validTransitions = {
            'waiting': ['called', 'cancelled'],
            'called': ['serving', 'completed', 'no-show', 'cancelled'],
            'serving': ['completed', 'cancelled']
        };

        if (!validTransitions[token.status]?.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status transition from ${token.status} to ${status}`
            });
        }

        token.status = status;
        token.notes = notes || token.notes;

        switch (status) {
            case 'serving':
                token.servedAt = new Date();
                break;
            case 'completed':
                token.completedAt = new Date();
                break;
        }

        await token.save();

        // Update queue current count if token is completed/cancelled
        if (['completed', 'cancelled', 'no-show'].includes(status)) {
            const queue = await Queue.findById(token.queueId);
            const activeCount = await Token.countDocuments({
                queueId: token.queueId,
                status: { $in: ['waiting', 'called', 'serving'] }
            });
            queue.currentCount = activeCount;
            await queue.save();
        }

        res.status(200).json({
            success: true,
            message: `Token status updated to ${status}`,
            token: {
                tokenNumber: token.tokenNumber,
                status: token.status,
                userName: token.userId.name,
                updatedAt: new Date()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating token status',
            error: error.message
        });
    }
};

// Cancel user's own token
const cancelToken = async (req, res) => {
    try {
        const tokenId = req.params.id;

        const token = await Token.findById(tokenId);
        if (!token) {
            return res.status(404).json({
                success: false,
                message: 'Token not found'
            });
        }

        // Check if user owns the token
        if (token.userId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You can only cancel your own tokens'
            });
        }

        // Check if token can be cancelled
        if (!['waiting', 'called'].includes(token.status)) {
            return res.status(400).json({
                success: false,
                message: 'Token cannot be cancelled in current status'
            });
        }

        token.status = 'cancelled';
        await token.save();

        // Update queue current count
        const queue = await Queue.findById(token.queueId);
        const activeCount = await Token.countDocuments({
            queueId: token.queueId,
            status: { $in: ['waiting', 'called', 'serving'] }
        });
        queue.currentCount = activeCount;
        await queue.save();

        res.status(200).json({
            success: true,
            message: 'Token cancelled successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error cancelling token',
            error: error.message
        });
    }
};

// Get queue history (Staff only)
const getQueueHistory = async (req, res) => {
    try {
        const { queueId } = req.params;
        const { date, status, page = 1, limit = 20 } = req.query;

        let filter = { queueId };

        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);
            filter.createdAt = { $gte: startDate, $lt: endDate };
        }

        if (status) {
            filter.status = status;
        }

        const tokens = await Token.find(filter)
            .populate('userId', 'name email')
            .sort({ tokenNumber: 1 }) // Sort by token number instead of createdAt
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Token.countDocuments(filter);

        res.status(200).json({
            success: true,
            tokens,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching queue history',
            error: error.message
        });
    }
};

// Get user's token history with filters and pagination
const getUserTokenHistory = async (req, res) => {
    try {
        const {
            status,
            queueId,
            dateFrom,
            dateTo,
            page = 1,
            limit = 20
        } = req.query;

        // Build filter object
        let filter = { userId: req.user.id };

        // Filter by status (completed, cancelled, no-show)
        if (status && status !== 'all') {
            filter.status = status;
        } else {
            // Default to completed/historical statuses only
            filter.status = { $in: ['completed', 'cancelled', 'no-show'] };
        }

        // Filter by queue
        if (queueId && queueId !== 'all') {
            filter.queueId = queueId;
        }

        // Filter by date range
        if (dateFrom || dateTo) {
            filter.createdAt = {};
            if (dateFrom) {
                filter.createdAt.$gte = new Date(dateFrom);
            }
            if (dateTo) {
                const endDate = new Date(dateTo);
                endDate.setHours(23, 59, 59, 999); // End of day
                filter.createdAt.$lte = endDate;
            }
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Fetch tokens with pagination
        const tokens = await Token.find(filter)
            .populate('queueId', 'name description')
            .sort({ createdAt: -1 }) // Most recent first
            .limit(parseInt(limit))
            .skip(skip);

        // Get total count for pagination
        const totalTokens = await Token.countDocuments(filter);
        const totalPages = Math.ceil(totalTokens / limit);

        // Format response data
        const formattedTokens = tokens.map(token => ({
            id: token._id,
            tokenNumber: token.tokenNumber,
            queueName: token.queueId.name,
            queueDescription: token.queueId.description,
            status: token.status,
            createdAt: token.createdAt,
            calledAt: token.calledAt,
            servedAt: token.servedAt,
            completedAt: token.completedAt,
            notes: token.notes,
            // Calculate service duration if available
            serviceDuration: token.servedAt && token.completedAt
                ? Math.round((new Date(token.completedAt) - new Date(token.servedAt)) / 60000)
                : null,
            // Calculate total wait time
            totalWaitTime: token.calledAt
                ? Math.round((new Date(token.calledAt) - new Date(token.createdAt)) / 60000)
                : null
        }));

        res.status(200).json({
            success: true,
            data: {
                tokens: formattedTokens,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalTokens,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1,
                    limit: parseInt(limit)
                },
                filters: {
                    status: status || 'all',
                    queueId: queueId || 'all',
                    dateFrom,
                    dateTo
                }
            }
        });
    } catch (error) {
        console.error('Error fetching user token history:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching token history',
            error: error.message
        });
    }
};

module.exports = {
    generateToken,
    getUserTokens,
    getTokenDetails,
    callNextToken,
    updateTokenStatus,
    cancelToken,
    getQueueHistory,
    getUserTokenHistory
};