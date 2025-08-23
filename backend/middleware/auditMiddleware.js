const AuditLog = require('../models/AuditLog');

// Middleware to extract common request info
const auditMiddleware = (action, targetType = null) => {
    return async (req, res, next) => {
        // Store original res.json to intercept response
        const originalJson = res.json;
        
        // Override res.json to capture response
        res.json = function(data) {
            // Determine if the operation was successful
            const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
            
            // Create audit log entry
            const logEntry = {
                action,
                userId: req.user?.id,
                description: generateDescription(action, req, data),
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('User-Agent'),
                status: isSuccess ? 'SUCCESS' : 'FAILED',
                metadata: {
                    method: req.method,
                    url: req.originalUrl,
                    statusCode: res.statusCode,
                    requestBody: sanitizeRequestBody(req.body),
                    responseData: isSuccess ? sanitizeResponseData(data) : null
                }
            };
            
            // Only add targetType if it's provided and not null
            if (targetType) {
                logEntry.targetType = targetType;
            }
            
            // Add target ID if available and targetType is specified
            if (req.params.id && targetType) {
                logEntry.targetId = req.params.id;
            }
            
            // Add error message if failed
            if (!isSuccess && data?.message) {
                logEntry.errorMessage = data.message;
            }
            
            // Log the action (async, don't wait)
            AuditLog.logAction(logEntry);
            
            // Call original res.json
            return originalJson.call(this, data);
        };
        
        next();
    };
};

// Generate human-readable description based on action
const generateDescription = (action, req, responseData) => {
    const userName = req.user?.name || 'Unknown User';
    
    switch (action) {
        // Queue actions
        case 'QUEUE_CREATED':
            return `${userName} created queue "${responseData?.queue?.name || 'Unknown'}"`;
        case 'QUEUE_UPDATED':
            return `${userName} updated queue "${responseData?.queue?.name || req.body?.name || 'Unknown'}"`;
        case 'QUEUE_DELETED':
            return `${userName} deleted a queue`;
        case 'QUEUE_ACTIVATED':
            return `${userName} activated a queue`;
        case 'QUEUE_DEACTIVATED':
            return `${userName} deactivated a queue`;
            
        // Token actions
        case 'TOKEN_GENERATED':
            return `${userName} generated token "${responseData?.token?.tokenNumber || 'Unknown'}"`;
        case 'TOKEN_CALLED':
            return `${userName} called token "${responseData?.token?.tokenNumber || 'Unknown'}"`;
        case 'TOKEN_STATUS_UPDATED':
            const newStatus = req.body?.status || 'unknown';
            return `${userName} updated token status to "${newStatus}"`;
        case 'TOKEN_CANCELLED':
            return `${userName} cancelled a token`;
            
        // User actions
        case 'USER_CREATED':
            return `${userName} created user "${responseData?.user?.name || req.body?.name || 'Unknown'}"`;
        case 'USER_UPDATED':
            return `${userName} updated user "${responseData?.user?.name || req.body?.name || 'Unknown'}"`;
        case 'USER_DELETED':
            return `${userName} deleted a user`;
        case 'USER_ROLE_CHANGED':
            const newRole = req.body?.role || 'unknown';
            return `${userName} changed user role to "${newRole}"`;
        case 'USER_LOGIN':
            return `${userName} logged in`;
        case 'USER_LOGOUT':
            return `${userName} logged out`;
        case 'USER_PROFILE_UPDATED':
            return `${userName} updated their profile`;
        case 'USER_PASSWORD_CHANGED':
            return `${userName} changed their password`;
            
        // Staff actions
        case 'STAFF_LOGIN':
            return `Staff ${userName} logged in`;
        case 'STAFF_TOKEN_CALLED':
            return `Staff ${userName} called token "${responseData?.token?.tokenNumber || 'Unknown'}"`;
        case 'STAFF_TOKEN_STATUS_CHANGED':
            const staffNewStatus = req.body?.status || 'unknown';
            return `Staff ${userName} changed token status to "${staffNewStatus}"`;
            
        // Admin actions
        case 'ADMIN_LOGIN':
            return `Administrator ${userName} logged in`;
        case 'ADMIN_SETTINGS_CHANGED':
            return `${userName} changed system settings`;
        case 'ADMIN_USER_ROLE_CHANGED':
            const targetUserName = req.body?.userName || 'Unknown User';
            const adminNewRole = req.body?.role || 'unknown';
            return `${userName} changed ${targetUserName}'s role to "${adminNewRole}"`;
        case 'ADMIN_USER_DELETED':
            const deletedUserName = req.body?.userName || 'Unknown User';
            return `${userName} deleted user "${deletedUserName}"`;
        case 'ADMIN_AUDIT_CLEANED':
            const retentionDays = req.body?.retentionDays || 'unknown';
            return `${userName} cleaned audit logs older than ${retentionDays} days`;
            
        default:
            return `${userName} performed ${action.toLowerCase().replace('_', ' ')}`;
    }
};

// Sanitize request body to remove sensitive information
const sanitizeRequestBody = (body) => {
    if (!body) return {};
    
    const sanitized = { ...body };
    
    // Remove sensitive fields
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.secret;
    delete sanitized.key;
    
    return sanitized;
};

// Sanitize response data to remove sensitive information
const sanitizeResponseData = (data) => {
    if (!data) return {};
    
    // If it's a success response with data
    if (data.success && data.queue) {
        return {
            success: data.success,
            queue: {
                name: data.queue.name,
                id: data.queue._id
            }
        };
    }
    
    if (data.success && data.token) {
        return {
            success: data.success,
            token: {
                tokenNumber: data.token.tokenNumber,
                id: data.token.id
            }
        };
    }
    
    if (data.success && data.user) {
        return {
            success: data.success,
            user: {
                name: data.user.name,
                email: data.user.email,
                id: data.user._id
            }
        };
    }
    
    // Default: return only success status and message
    return {
        success: data.success,
        message: data.message
    };
};

// Helper function to log action manually
const logAction = async (action, userId, description, metadata = {}) => {
    try {
        await AuditLog.logAction({
            action,
            userId,
            description,
            metadata,
            status: 'SUCCESS'
        });
    } catch (error) {
        console.error('Failed to log action:', error);
    }
};

module.exports = {
    auditMiddleware,
    logAction
};