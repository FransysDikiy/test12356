const Reminder = require('../models/Reminder');
const ReminderLog = require('../models/ReminderLog');
const Pet = require('../models/Pet');
const { success, fail } = require('../utils/response');
const logger = require('../utils/logger');
const NotificationService = require('../services/notification.service');
const ReminderLogService = require('../services/reminderlog.service');

exports.confirmFeeding = async (req, res) => {
    try {
        const { petId } = req.body;
        const userId = req.user.id;

        if (!petId) return fail(res, 400, 'Missing petId');

        const pet = await Pet.findById(petId);
        if (!pet || pet.owner.toString() !== userId) {
            return fail(res, 403, 'You do not have permission to feed this pet');
        }

        if (typeof pet.portions !== 'number' || pet.portions <= 0) {
            return fail(res, 409, 'Feeding is not possible. No food portions left.');
        }

        const now = new Date();
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        const THIRTY_MIN = 30 * 60 * 1000;

        const reminders = await Reminder.find({
            user: userId,
            pet: petId,
            lastExecutedAt: { $gte: start, $lte: end }
        }).sort({ lastExecutedAt: 1 });

        if (!reminders.length) {
            return fail(res, 404, 'No reminders found for today');
        }

        let selectedReminder = null;
        let reason = 'All reminders are either expired or already confirmed';

        for (const reminder of reminders) {
            const log = await ReminderLog.findOne({
                reminder: reminder._id,
                status: 'completed',
                executedAt: { $gte: start, $lte: end },
            });

            if (log) continue;

            const diff = now.getTime() - new Date(reminder.lastExecutedAt).getTime();

            if (diff <= THIRTY_MIN) {
                selectedReminder = reminder;
                break;
            }
        }

        if (!selectedReminder) {
            return fail(res, 409, reason);
        }

        await ReminderLogService.updateLogStatus(userId, selectedReminder._id.toString(), "completed");


        if (typeof pet.portions === 'number') {
            pet.portions = Math.max(0, pet.portions - 1);
            if (pet.portions <= 2) {
                await NotificationService.sendLowFoodLevelAlert(userId, pet.name);
            }
            await pet.save();
        }

        logger.log(`Feeding confirmed for pet ${petId} on reminder ${selectedReminder._id}`);
        return success(res, null, 'Feeding confirmed');
    } catch (err) {
        if (err.message.includes("No 'notified' log")) {
            return fail(res, 409, "Cannot confirm feeding — no pending reminder for today");
        }
        logger.error("Feeding confirm error:", err);
        return fail(res, 500, "Server error");
    }
};
