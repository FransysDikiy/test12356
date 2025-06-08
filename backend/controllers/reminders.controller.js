const { success, created, fail } = require('../utils/response');
const reminderService = require('../services/reminder.service');
const Reminder = require('../models/Reminder');

const createReminder = async (req, res) => {
    try {
        const reminder = await reminderService.createReminder(req.user.id, req.body);
        const populated = await Reminder.findById(reminder._id).populate("pet");
        return created(res, populated, 'Reminder created');
    } catch (err) {
        console.error('Reminder creation failed:', err.message);
        return fail(res, 400, err.message);
    }

};

const getReminders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 10
        const fromDate = req.query.fromDate?.trim();
        const reminders = await reminderService.getReminders(req.user.id, page, limit, fromDate)
        return success(res, reminders);
    } catch (err) {
        console.log(err)
        return fail(res, 500, 'Failed to load reminders')
    }
}

const updateReminder = async (req, res) => {
    try {
        const userId = req.user.id;
        const reminderId = req.params.id;
        const updateData = req.body;

        const updated = await reminderService.updateReminder(userId, reminderId, updateData);

        if (!updated) {
            return fail(res, 404, "Reminder not found");
        }

        return success(res, updated, "Reminder updated successfully");
    } catch (err) {
        console.error("Reminder update failed:", err.message);

        if (err.message.includes("not found")) {
            return fail(res, 404, err.message);
        }

        if (err.message.includes("do not own")) {
            return fail(res, 403, err.message);
        }

        return fail(res, 500, "Failed to update reminder");
    }
};


async function deleteReminder(req, res) {
    await reminderService.deleteReminder(req.user.id, req.params.id)
    return success(res)
}

const getReminderById = async (req, res) => {
    try {
        const reminder = await Reminder.findOne({ _id: req.params.id, user: req.user.id });
        if (!reminder) {
            return fail(res, 404, 'Reminder not found');
        }
        return success(res, reminder);
    } catch (err) {
        console.error('Failed to fetch reminder:', err.message);
        return fail(res, 500, 'Failed to fetch reminder');
    }
};

module.exports = {
    updateReminder,
    createReminder,
    getReminders,
    deleteReminder,
    getReminderById,
};