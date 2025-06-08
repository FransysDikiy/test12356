const Reminder = require('../models/Reminder');
const ReminderLog = require('../models/ReminderLog');
const Pet = require('../models/Pet');
const User = require('../models/User');
const { sendFeedingReminder } = require('./notification.service');
const { addEventToCalendar, deleteCalendarEvent, updateEventInCalendar } = require('./googleCalendar.service');
const EventEmitter = require("events");

const reminderEvents = new EventEmitter();

const createReminder = async (userId, data) => {
    const pet = await Pet.findById(data.pet);
    if (!pet || pet.owner.toString() !== userId) {
        throw new Error('You cannot create reminders for a pet you do not own');
    }

    const timeValue = data.time;
    let normalizedTime;
    if (typeof timeValue === 'string' && /^\d{2}:\d{2}$/.test(timeValue)) {
        normalizedTime = timeValue;
    } else {
        const dateObj = new Date(timeValue);
        if (isNaN(dateObj.getTime())) {
            throw new Error('Invalid time value');
        }
        normalizedTime = dateObj.toISOString();
    }

    const reminder = await Reminder.create({
        ...data,
        user: userId,
        time: normalizedTime
    });

    if (data.syncWithGoogle) {
        const user = await User.findById(userId);
        const eventId = await addEventToCalendar(user, reminder, pet?.name || 'your pet');
        if (eventId) {
            reminder.googleCalendarEventId = eventId;
            await reminder.save();
        }
    }

    await sendFeedingReminder(userId, pet?.name || 'your pet');
    reminderEvents.emit("reminder.created", reminder);
    return reminder;
};

const logReminderStatus = async (reminderId, status) => {
    return await ReminderLog.create({
        reminder: reminderId,
        status,
        executedAt: new Date(),
    });
};

async function getReminders(userId, page = 1, limit = 10, fromDate = null) {
    const skip = (page - 1) * limit;
    const query = {
        user: userId,
        isActive: true
    };

    if (fromDate) {
        const dateObj = new Date(fromDate);
        if (isNaN(dateObj.getTime())) {
            throw new Error('Invalid fromDate value');
        }
        query.time = { $gte: dateObj.toISOString() };
    }

    const [reminders, totalItems] = await Promise.all([
        Reminder.find(query).populate("pet").skip(skip).limit(limit),
        Reminder.countDocuments(query)
    ]);

    return {
        reminders,
        page,
        limit,
        totalPages: Math.ceil(totalItems / limit),
        totalItems
    };
}

async function updateReminder(userId, reminderId, updateData) {
    const reminder = await Reminder.findOne({ _id: reminderId, user: userId }).populate("pet");
    if (!reminder) {
        throw new Error("Reminder not found or does not belong to user");
    }

    const prevSync = reminder.syncWithGoogle;
    const prevEventId = reminder.googleCalendarEventId;

    if (updateData.pet) {
        const pet = await Pet.findById(updateData.pet);
        if (!pet || pet.owner.toString() !== userId) {
            throw new Error('You cannot assign this reminder to a pet you do not own');
        }
    }

    if (updateData.time) {
        const timeValue = updateData.time;
        if (typeof timeValue === 'string' && /^\d{2}:\d{2}$/.test(timeValue)) {
            updateData.time = timeValue;
        } else {
            const dateObj = new Date(timeValue);
            if (isNaN(dateObj.getTime())) {
                throw new Error('Invalid time value');
            }
            updateData.time = dateObj.toISOString();
        }
    }

    Object.assign(reminder, updateData);
    await reminder.save();

    const user = await User.findById(userId);
    const petName = reminder.pet?.name || 'your pet';

    if (updateData.syncWithGoogle) {
        if (prevEventId) {
            await updateEventInCalendar(user, prevEventId, reminder, petName);
        } else {
            const eventId = await addEventToCalendar(user, reminder, petName);
            if (eventId) {
                reminder.googleCalendarEventId = eventId;
                await reminder.save();
            }
        }
    } else if (!updateData.syncWithGoogle && prevEventId) {
        await deleteCalendarEvent(user, prevEventId);
        reminder.googleCalendarEventId = undefined;
        await reminder.save();
    }

    reminderEvents.emit("reminder.updated", reminder);
    return reminder;
}

async function deleteReminder(userId, reminderId) {
    const reminder = await Reminder.findOne({ _id: reminderId, user: userId });
    if (!reminder) {
        throw new Error('Reminder not found or does not belong to user');
    }

    if (reminder.googleCalendarEventId) {
        const user = await User.findById(userId);
        await deleteCalendarEvent(user, reminder.googleCalendarEventId);
    }

    await reminder.deleteOne();
    reminderEvents.emit("reminder.deleted", reminder);
    return reminder;
}

async function isReminderActive(reminderId) {
    const now = new Date();
    const currentDay = now.getDay();
    const reminder = await Reminder.findById(reminderId);
    if (!reminder || !reminder.isActive) return false;

    let start;
    const timeValue = reminder.time;

    if (typeof timeValue === 'string') {
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(timeValue)) {
            start = new Date(timeValue);
        } else if (/^\d{2}:\d{2}$/.test(timeValue)) {
            const [hours, minutes] = timeValue.split(':').map(Number);
            start = new Date(now);
            start.setHours(hours, minutes, 0, 0);
        }
    }

    if (!start || isNaN(start.getTime())) return false;

    const end = new Date(start.getTime() + 30 * 60 * 1000);
    if (now < start || now > end) return false;

    if (reminder.repeat === "daily") return true;
    if ((reminder.repeat === "weekly" || reminder.repeat === "custom") &&
        reminder.customDays?.includes(currentDay)) return true;

    return false;
}

async function findFirstActiveReminder(deviceId) {
    const now = new Date();
    const currentDay = now.getDay();
    const pet = await Pet.findOne({ serialNumber: deviceId });
    if (!pet) return null;

    const reminders = await Reminder.find({
        pet: pet._id,
        isActive: true
    });

    for (const reminder of reminders) {
        let start;
        const timeValue = reminder.time;

        if (typeof timeValue === 'string') {
            if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(timeValue)) {
                start = new Date(timeValue);
            } else if (/^\d{2}:\d{2}$/.test(timeValue)) {
                const [hours, minutes] = timeValue.split(':').map(Number);
                start = new Date(now);
                start.setHours(hours, minutes, 0, 0);
            }
        }

        if (!start || isNaN(start.getTime())) continue;

        const end = new Date(start.getTime() + 30 * 60 * 1000);
        if (now < start || now > end) continue;

        if (reminder.repeat === "daily") return reminder;
        if ((reminder.repeat === "weekly" || reminder.repeat === "custom") &&
            reminder.customDays?.includes(currentDay)) return reminder;
    }

    return null;
}

module.exports = {
    events: reminderEvents,
    createReminder,
    updateReminder,
    deleteReminder,
    logReminderStatus,
    getReminders,
    isReminderActive,
    findFirstActiveReminder
};
