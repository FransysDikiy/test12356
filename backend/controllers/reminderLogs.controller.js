const ReminderLog = require('../models/ReminderLog');
const { success, fail, created } = require('../utils/response');
const Reminder = require('../models/Reminder');
const ReminderLogService = require("../services/reminderlog.service")

exports.getAllLogs = async (req, res) => {
    try {
        const userReminders = await Reminder.find({ user: req.user.id }).select('_id');

        if (!userReminders.length) {
            return success(res, [], 'No logs found');
        }

        const reminderIds = userReminders.map(r => r._id);

        const logs = await ReminderLog.find({ reminder: { $in: reminderIds } })
            .populate({
                path: 'reminder',
                populate: { path: 'pet' }
            });

        return success(res, logs, 'Logs loaded');
    } catch (err) {
        console.error("Failed to load logs:", err.message);
        return fail(res, 500, err.message);
    }
};

exports.getLogById = async (req, res) => {
    try {
        const log = await ReminderLog.findById(req.params.id).populate('reminder');
        if (!log) return fail(res, 404, 'Log not found');
        return success(res, log, 'Log loaded');
    } catch (err) {
        return fail(res, 500, 'Failed to load log');
    }
};

exports.deleteLog = async (req, res) => {
    try {
        const log = await ReminderLog.findByIdAndDelete(req.params.id);
        if (!log) return fail(res, 404, 'Log not found');
        return success(res, null, 'Log deleted');
    } catch (err) {
        return fail(res, 500, 'Failed to delete log');
    }
};

exports.createLog = async(req, res) => {
    try {
        const createReminderDtoResponse = await ReminderLogService.createLog(req.user.id, req.body.reminder, req.body.status)
        return created(res, createReminderDtoResponse)
    } catch (err) {
        if (err.message.includes("does not exist")) {
            return fail(res, 404, err.message)
        }
        if (err.message.includes("already exists")) {
            return fail(res, 409, err.message)
        }
        if (err.message.includes("does not belong to the current user")) {
            return fail(res, 403, err.message)
        }
        return fail(res, 500, "Failed to submit log")
    }
}