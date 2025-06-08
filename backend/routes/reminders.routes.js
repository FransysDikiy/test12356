const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminders.controller');
const authMiddleware = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { updateReminderDto } = require('../middlewares/schemas');

router.post('/', authMiddleware(), reminderController.createReminder);
router.get('/', authMiddleware(), reminderController.getReminders);
router.patch("/:id", authMiddleware(), validate(updateReminderDto), reminderController.updateReminder)
router.delete('/:id', authMiddleware(), reminderController.deleteReminder);
router.get('/:id', authMiddleware(), reminderController.getReminderById);
router.put('/:id', authMiddleware(), reminderController.updateReminder);


module.exports = router;