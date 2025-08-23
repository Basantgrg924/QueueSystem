const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
    tokenNumber: {
        type: String,
        required: true,
        unique: true
    },
    queueId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Queue',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    position: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['waiting', 'called', 'serving', 'completed', 'cancelled', 'no-show'],
        default: 'waiting'
    },
    calledAt: {
        type: Date
    },
    servedAt: {
        type: Date
    },
    completedAt: {
        type: Date
    },
    estimatedCallTime: {
        type: Date
    },
    notes: {
        type: String
    }
}, {
    timestamps: true
});

// Generate token number before saving
tokenSchema.pre('save', async function (next) {
    if (this.isNew && !this.tokenNumber) {
        try {
            // Get queue info to generate token number
            const Queue = mongoose.model('Queue');
            const queue = await Queue.findById(this.queueId);

            if (!queue) {
                return next(new Error('Queue not found'));
            }

            // Generate token number: QueuePrefix + Sequential Number
            const queuePrefix = queue.name.substring(0, 3).toUpperCase();
            const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');

            // Find the last token for today for this queue
            const lastToken = await mongoose.model('Token').findOne({
                queueId: this.queueId,
                tokenNumber: { $regex: `^${queuePrefix}${today}` }
            }).sort({ tokenNumber: -1 });

            let sequentialNumber = 1;
            if (lastToken && lastToken.tokenNumber) {
                const lastNum = parseInt(lastToken.tokenNumber.slice(-3));
                sequentialNumber = lastNum + 1;
            }

            this.tokenNumber = `${queuePrefix}${today}${sequentialNumber.toString().padStart(3, '0')}`;

            // Calculate estimated call time
            this.estimatedCallTime = new Date(Date.now() + (this.position * queue.avgServiceTime * 60000));

            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

module.exports = mongoose.model('Token', tokenSchema);