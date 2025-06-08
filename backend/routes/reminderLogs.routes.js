const express = require('express');
const router = express.Router();
const controller = require('../controllers/reminderLogs.controller');
const auth = require('../middlewares/auth');
const schemas = require('../middlewares/schemas');
const validate = require('../middlewares/validate');

router.use(auth());

router.post("/", validate({ body: schemas.createReminderLogSchema }), controller.createLog)
router.get('/', controller.getAllLogs);
router.get('/:id', controller.getLogById);
router.delete('/:id', controller.deleteLog);

module.exports = router;
