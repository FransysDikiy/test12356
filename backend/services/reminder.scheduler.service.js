const Reminder = require('../models/Reminder');
const Pet = require('../models/Pet');
const RemindersService = require('./reminder.service');
const reminderEvents = RemindersService.events;

const runScheduler = async () => {
console.log("scanning...")
  const now = new Date();
  try {
    const reminders = await Reminder.find({ isActive: true });
    for (const reminder of reminders) {
      if (await RemindersService.isReminderActive(reminder._id.toString())) {
        reminderEvents.emit('reminder.scheduled', reminder);
      }
    }
  } catch (err) {
    console.error('Reminder Scheduler error:', err);
  }
};

const startReminderScheduler = () => {
  setInterval(runScheduler, 10000);
};

module.exports = { startReminderScheduler };