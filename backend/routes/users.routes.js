const express = require('express');
const router = express.Router();
const userController = require('../controllers/users.controller');
const authMiddleware = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const schemas = require('../middlewares/schemas');

router.get('/me', authMiddleware(), validate(schemas.updateUserSchema), userController.getCurrentUser);
router.put('/me', authMiddleware(), userController.updateUser);
router.delete('/:id', authMiddleware(), userController.deleteUser);

module.exports = router;
