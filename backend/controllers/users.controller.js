const User = require('../models/User');
const { success, fail } = require('../utils/response');
const bcrypt = require('bcrypt');
const Pet = require('../models/Pet');
const Reminder = require('../models/Reminder');
const ReminderLog = require('../models/ReminderLog');
const Device = require('../models/Device');

const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return fail(res, 404, 'User not found');
        return success(res, {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            googleTokens: user.googleTokens || null,
        }, 'User info loaded');
    } catch (err) {
        return fail(res, 500, 'Server error');
    }
};

const updateUser = async (req, res) => {
    try {
        const {username, email, password} = req.body;
        const user = await User.findById(req.user.id);

        if (!user) return fail(res, 404, 'User not found');

        if (username) user.username = username;
        if (email) user.email = email;
        if (password) (user).password = await bcrypt.hash(password, 10);

        await user.save();
        return success(res, user, 'User info updated');
    } catch (err) {
        if (err.code === 11000 && err.keyPattern?.email) {
            return fail(res, 400, 'Email is already in use');
        }
        return fail(res, 500, 'Server error');
    }
}

const deleteUser = async (req, res) => {
    try {
        const requesterId = req.user.id;
        const requesterRole = req.user.role;
        const targetUserId = req.params.id;

        if (requesterRole !== 'admin' && requesterId !== targetUserId) {
            return fail(res, 403, 'You can only delete your own account');
        }

        if (requesterRole === 'admin' && requesterId === targetUserId) {
            return fail(res, 403, 'Admins cannot delete their own account');
        }

        const pets = await Pet.find({ owner: targetUserId });
        const petIds = pets.map(p => p._id);

        const reminders = await Reminder.find({ user: targetUserId });
        const reminderIds = reminders.map(r => r._id);

        await ReminderLog.deleteMany({ reminder: { $in: reminderIds } });
        await Reminder.deleteMany({ user: targetUserId });
        await Pet.deleteMany({ owner: targetUserId });
        await Device.deleteMany({ owner: targetUserId });
        await User.findByIdAndDelete(targetUserId);

        return success(res, null, 'User account deleted');
    } catch (err) {
        return fail(res, 500, 'Failed to delete user');
    }
};

module.exports = {
    getCurrentUser,
    updateUser,
    deleteUser
};
