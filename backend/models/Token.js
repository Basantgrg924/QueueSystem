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

// Index for better query performance
tokenSchema.index({ queueId: 1, status: 1 });
tokenSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Token', tokenSchema);