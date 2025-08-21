const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Admin only access
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({
            message: 'Access denied. Admin privileges required.'
        });
    }
};

// User and above access (all roles)
const userOnly = (req, res, next) => {
    if (req.user) {
        next();
    } else {
        res.status(403).json({
            message: 'Access denied. Login required.'
        });
    }
};

// Staff and Admin access
const staffOnly = (req, res, next) => {
    if (req.user && (req.user.role === 'staff' || req.user.role === 'admin')) {
        next();
    } else {
        res.status(403).json({
            message: 'Access denied. Staff privileges required.'
        });
    }
};

// Check specific roles
const checkRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: 'Not authorized'
            });
        }

        if (roles.includes(req.user.role)) {
            next();
        } else {
            res.status(403).json({
                message: `Access denied. Required roles: ${roles.join(', ')}`
            });
        }
    };
};

module.exports = {
    protect,
    userOnly,
    adminOnly,
    staffOnly,
    checkRole
};