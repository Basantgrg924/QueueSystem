const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
        trim: true
    },
    description: { 
        type: String, 
        trim: true 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    maxCapacity: { 
        type: Number, 
        default: 100 
    },
    currentCount: { 
        type: Number, 
        default: 0 
    },
    estimatedWaitTime: { 
        type: Number, 
        default: 0 // in minutes
    },
    avgServiceTime: { 
        type: Number, 
        default: 10 // in minutes
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Update current count before saving
queueSchema.pre('save', async function(next) {
    if (this.isModified('currentCount')) {
        // Calculate estimated wait time based on current count and average service time
        this.estimatedWaitTime = this.currentCount * this.avgServiceTime;
    }
    next();
});

module.exports = mongoose.model('Queue', queueSchema);