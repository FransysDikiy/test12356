//TODO: Implement the scheduler service that will run every minute and check for reminders that need to be sent out.
const Reminder = require('../models/Reminder');
const Pet = require('../models/Pet');
const ReminderLog = require('../models/ReminderLog');
const NotificationService = require('./notification.service');
const ReminderLogService = require('./reminderlog.service');
const Notification = require('../models/Notification');

const isSameDay = (date1, date2) =>
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();

const runScheduledReminders = async () => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const currentDay = now.getDay();

    try {
        const reminders = await Reminder.find({
            isActive: true,
            time: currentTime,
            $or: [
                { repeat: 'daily' },
                { repeat: 'weekly', customDays: currentDay },
                { repeat: 'custom', customDays: currentDay },
            ],
        });

        for (const reminder of reminders) {
            const latestLog = await ReminderLog.findOne({ reminder: reminder._id }).sort({ executedAt: -1 });

            if (latestLog && isSameDay(latestLog.executedAt, now)) {
                continue;
            }

            const pet = await Pet.findById(reminder.pet);
            const petName = pet?.name || 'your pet';
            const petId = pet?._id?.toString();

            await NotificationService.sendFeedingReminder(reminder.user, petName, petId);


            await ReminderLogService.createLog(reminder.user, reminder._id.toString(), 'notified');

            await Reminder.findByIdAndUpdate(reminder._id, {
                lastExecutedAt: now,
            });
        }

        await markMissedReminders();
        await checkLowPortions();
        await clearExpiredNotifications();
    } catch (error) {
        console.error('Scheduler error:', error);
    }
};


const markMissedReminders = async () => {
    const now = new Date();
    const THIRTY_MIN = 30 * 60 * 1000;
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const expiredReminders = await Reminder.find({
        lastExecutedAt: { $gte: start, $lte: end },
    });

    for (const reminder of expiredReminders) {
        if (now - new Date(reminder.lastExecutedAt) < THIRTY_MIN) {
            continue;
        }

        const alreadyCompleted = await ReminderLog.findOne({
            reminder: reminder._id,
            status: 'completed',
            executedAt: { $gte: start, $lte: end },
        });

        const alreadyMissed = await ReminderLog.findOne({
            reminder: reminder._id,
            status: 'missed',
            executedAt: { $gte: start, $lte: end },
        });

        if (!alreadyCompleted && !alreadyMissed) {
            const result = await ReminderLogService.updateLogStatus(
                reminder.user,
                reminder._id.toString(),
                'missed'
            );

            if (!result) {
                continue;
            }

            const pet = await Pet.findById(reminder.pet);
            const petName = pet?.name || 'your pet';
            const petId = pet?._id?.toString();

            await NotificationService.sendMissedFeedingWarning(reminder.user, petName, petId);
        }

    }
};

const recoverMissedNotifications = async () => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const currentDay = now.getDay();
    const start = new Date(now.setHours(0, 0, 0, 0));
    const end = new Date(now.setHours(23, 59, 59, 999));

    const allReminders = await Reminder.find({
        isActive: true,
        $or: [
            { repeat: 'daily' },
            { repeat: 'weekly', customDays: currentDay },
            { repeat: 'custom', customDays: currentDay },
        ]
    });

    for (const reminder of allReminders) {
        try {
            if (reminder.time >= currentTime) continue;

            const existingLog = await ReminderLog.findOne({
                reminder: reminder._id,
                status: 'notified',
                executedAt: { $gte: start, $lte: end },
            });

            if (existingLog) {
                console.log(`Reminder ${reminder._id} already notified`);
                continue;
            }

            const pet = await Pet.findById(reminder.pet);
            console.log("reminder.pet:", reminder.pet);
            const petName = pet?.name || 'your pet';
            const petId = pet?._id?.toString();

            console.log(`Sending recovered notification for reminder ${reminder._id} to user ${reminder.user}`);

            await NotificationService.sendFeedingReminder(reminder.user, petName, petId);

            await ReminderLogService.createLog(reminder.user, reminder._id.toString(), 'notified');

            await Reminder.findByIdAndUpdate(reminder._id, { lastExecutedAt: now });
        } catch (error) {
            console.error(`Error processing reminder ${reminder._id}:`, error.message);
        }
    }

    console.log('Recovered missed reminders after restart');
};

const clearExpiredNotifications = async () => {
    const threshold = new Date(Date.now() - 30 * 60 * 1000);
    try {
        const result = await Notification.deleteMany({
            read: true,
            createdAt: { $lte: threshold },
        });
        if (result.deletedCount > 0) {
            console.log(`Deleted ${result.deletedCount} expired notifications`);
        }
    } catch (err) {
        console.error("Failed to delete expired notifications:", err);
    }
};

const checkLowPortions = async () => {
    const pets = await Pet.find({ portions: { $lte: 2 } }).populate("owner");

    for (const pet of pets) {
        if (!pet.owner?._id) continue;

        const alreadyNotified = await Notification.findOne({
            user: pet.owner._id,
            pet: pet._id,
            message: /critically low/i,
            createdAt: { $gte: new Date().setHours(0, 0, 0, 0) },
        });

        if (alreadyNotified) continue;

        await NotificationService.sendLowFoodLevelAlert(
            pet.owner._id.toString(),
            pet.name,
            pet._id.toString()
        );
    }
};



module.exports = { runScheduledReminders, recoverMissedNotifications };

