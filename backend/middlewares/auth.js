const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mongoose = require('mongoose');

const authMiddleware = (roles) => async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized: User not found' });
        }

        if (user.lastLoggedOutAt && decoded.iat * 1000 < new Date(user.lastLoggedOutAt).getTime()) {
            return res.status(401).json({ error: 'Unauthorized: Token expired after logout' });
        }

        req.user = user;

        const isAdminOnlyEndpoint = req.originalUrl.startsWith('/api/lists/admin');
        if (isAdminOnlyEndpoint && user.role !== 'Admin') {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }

        if (user.role === 'Admin') {
            req.user.isAdmin = true;
            return next();
        }

        req.user.isAdmin = false;

        if (roles && roles.length > 0) {
            const isListRelatedEndpoint = req.baseUrl.includes('/lists') || req.originalUrl.includes('/lists');

            if (isListRelatedEndpoint) {
                const listId = req.params.id || req.body.listId;

                if (!listId || !mongoose.Types.ObjectId.isValid(listId)) {
                    return res.status(400).json({ error: 'Bad Request: Invalid or missing List ID' });
                }

                const shoppingList = await ShoppingList.findById(listId);
                if (!shoppingList) {
                    return res.status(404).json({ error: 'Not Found: List not found' });
                }

                const member = shoppingList.members.find((m) => m.userId.toString() === user._id.toString());
                if (!member || !roles.includes(member.role)) {
                    return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
                }
            } else {
                return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
            }
        }

        next();
    } catch (error) {
        console.error('Authorization error:', error.message);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = authMiddleware;