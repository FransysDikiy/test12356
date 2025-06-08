const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
    const token = req.query.token;

    if (!token) return next();

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (user) {
            req.session = req.session || {};
            req.session.linkGoogleToUserId = user._id;
            console.log("🔗 Saved to session:", req.session.linkGoogleToUserId);
        }
    } catch (err) {
        console.warn("Token parsing failed in Google link:", err.message);
    }

    next();
};
