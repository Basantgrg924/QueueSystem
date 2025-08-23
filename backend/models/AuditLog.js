const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        enum: [
            // Queue actions
            'QUEUE_CREATED',
            'QUEUE_UPDATED',
            'QUEUE_DELETED',
            'QUEUE_ACTIVATED',
            'QUEUE_DEACTIVATED',
            
            // Token actions
            'TOKEN_GENERATED',
            'TOKEN_CALLED',
            'TOKEN_STATUS_UPDATED',
            'TOKEN_CANCELLED',
            
            // User actions
            'USER_CREATED',
            'USER_UPDATED',
            'USER_DELETED',
            'USER_ROLE_CHANGED',
            'USER_LOGIN',
            'USER_LOGOUT',
            
            // Admin actions
            'ADMIN_LOGIN',
            'ADMIN_SETTINGS_CHANGED',
            
            // System actions
            'SYSTEM_BACKUP',
            'SYSTEM_RESTORE',
            'DATA_EXPORT',
            'DATA_IMPORT'
        ]
    },
    
    // User who performed the action
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Target resource (if applicable)
    targetType: {
        type: String,
        enum: ['Queue', 'Token', 'User', 'System'],
        required: false
    },
    
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
    },
    
    // Details about the action
    description: {
        type: String,
        required: true
    },
    
    // Additional metadata
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    
    // IP address and user agent for security tracking
    ipAddress: {
        type: String,
        required: false
    },
    
    userAgent: {
        type: String,
        required: false
    },
    
    // Success/failure status
    status: {
        type: String,
        enum: ['SUCCESS', 'FAILED', 'PARTIAL'],
        default: 'SUCCESS'
    },
    
    // Error details if action failed
    errorMessage: {
        type: String,
        required: false
    }
}, {
    timestamps: true,
    // Add indexes for performance
    indexes: [
        { userId: 1, createdAt: -1 },
        { action: 1, createdAt: -1 },
        { targetType: 1, targetId: 1 },
        { createdAt: -1 }
    ]
});

// Virtual for formatted date
auditLogSchema.virtual('formattedDate').get(function() {
    return this.createdAt.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
});

// Static method to create audit log entry
auditLogSchema.statics.logAction = async function(logData) {
    try {
        const auditEntry = new this(logData);
        await auditEntry.save();
        return auditEntry;
    } catch (error) {
        console.error('Failed to create audit log entry:', error);
        // Don't throw error to prevent breaking the main operation
        return null;
    }
};

// Method to get action icon for frontend
auditLogSchema.methods.getActionIcon = function() {
    const iconMap = {
        // Queue actions
        'QUEUE_CREATED': 'plus-circle',
        'QUEUE_UPDATED': 'edit',
        'QUEUE_DELETED': 'trash-2',
        'QUEUE_ACTIVATED': 'play-circle',
        'QUEUE_DEACTIVATED': 'pause-circle',
        
        // Token actions
        'TOKEN_GENERATED': 'ticket',
        'TOKEN_CALLED': 'bell',
        'TOKEN_STATUS_UPDATED': 'refresh-cw',
        'TOKEN_CANCELLED': 'x-circle',
        
        // User actions
        'USER_CREATED': 'user-plus',
        'USER_UPDATED': 'user-check',
        'USER_DELETED': 'user-x',
        'USER_ROLE_CHANGED': 'shield',
        'USER_LOGIN': 'log-in',
        'USER_LOGOUT': 'log-out',
        
        // Admin actions
        'ADMIN_LOGIN': 'shield-check',
        'ADMIN_SETTINGS_CHANGED': 'settings',
        
        // System actions
        'SYSTEM_BACKUP': 'download',
        'SYSTEM_RESTORE': 'upload',
        'DATA_EXPORT': 'file-down',
        'DATA_IMPORT': 'file-up'
    };
    
    return iconMap[this.action] || 'activity';
};

// Method to get action color for frontend
auditLogSchema.methods.getActionColor = function() {
    const colorMap = {
        // Queue actions - blue
        'QUEUE_CREATED': 'blue',
        'QUEUE_UPDATED': 'blue',
        'QUEUE_DELETED': 'red',
        'QUEUE_ACTIVATED': 'green',
        'QUEUE_DEACTIVATED': 'yellow',
        
        // Token actions - green
        'TOKEN_GENERATED': 'green',
        'TOKEN_CALLED': 'blue',
        'TOKEN_STATUS_UPDATED': 'yellow',
        'TOKEN_CANCELLED': 'red',
        
        // User actions - purple
        'USER_CREATED': 'purple',
        'USER_UPDATED': 'purple',
        'USER_DELETED': 'red',
        'USER_ROLE_CHANGED': 'orange',
        'USER_LOGIN': 'green',
        'USER_LOGOUT': 'gray',
        
        // Admin actions - orange
        'ADMIN_LOGIN': 'orange',
        'ADMIN_SETTINGS_CHANGED': 'orange',
        
        // System actions - indigo
        'SYSTEM_BACKUP': 'indigo',
        'SYSTEM_RESTORE': 'indigo',
        'DATA_EXPORT': 'indigo',
        'DATA_IMPORT': 'indigo'
    };
    
    return colorMap[this.action] || 'gray';
};

module.exports = mongoose.model('AuditLog', auditLogSchema);