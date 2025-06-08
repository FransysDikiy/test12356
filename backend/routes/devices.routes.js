const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/devices.controller');
const authMiddleware = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const schemas = require('../middlewares/schemas');

router.post('/', authMiddleware(), validate(schemas.registerDeviceSchema), deviceController.registerDevice);
router.get('/', authMiddleware(), deviceController.getMyDevices);
router.get('/:id', authMiddleware(), deviceController.getDeviceById);
router.delete('/:id', authMiddleware(), deviceController.deleteDevices);
router.patch('/:id', authMiddleware(), deviceController.updateDevice);

module.exports = router;
