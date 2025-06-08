const Reminder = require("../models/Reminder");
const ReminderLog = require("../models/ReminderLog");
const mongoose = require("mongoose");

module.exports = class ReminderLogService {
    static async createLog(userId, reminderId, status) {
        if (!reminderId || typeof reminderId !== "string" || !mongoose.Types.ObjectId.isValid(reminderId)) {
            throw new Error(`Invalid reminder ID: "${reminderId}"`);
        }

        if (status !== "notified") {
            throw new Error(`Only logs with status 'notified' can be created`);
        }

        const reminder = await Reminder.findById(reminderId);
        if (!reminder) {
            throw new Error(`Reminder with ID "${reminderId}" does not exist`);
        }
        if (reminder.user.toString() !== userId.toString()) {
            throw new Error(`Reminder with ID "${reminderId}" does not belong to the current user`);
        }

        const todayString = new Date().toISOString().slice(0, 10);

        const existing = await ReminderLog.findOne({
            reminder: reminderId,
            status: "notified",
            $expr: {
                $eq: [
                    { $dateToString: { format: "%Y-%m-%d", date: "$executedAt" } },
                    { $literal: todayString }
                ]
            }
        });

        if (existing) {
            console.log("Notified log already exists for today:", existing._id);
            return existing;
        }

        return await ReminderLog.create({
            reminder: reminderId,
            status,
            executedAt: new Date()
        });
    }

    static async updateLogStatus(userId, reminderId, newStatus) {
        if (!["missed", "completed"].includes(newStatus)) {
            throw new Error(`Invalid status: ${newStatus}`);
        }

        const todayString = new Date().toISOString().slice(0, 10);

        const log = await ReminderLog.findOne({
            reminder: reminderId,
            status: "notified",
            $expr: {
                $eq: [
                    { $dateToString: { format: "%Y-%m-%d", date: "$executedAt" } },
                    { $literal: todayString }
                ]
            }
        });

        if (!log) {
            return null;
        }

        log.status = newStatus;
        log.executedAt = new Date();
        return await log.save();
    }
};
