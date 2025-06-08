const express = require('express');
const router = express.Router();
const feedingController = require('../controllers/feeding.controller');
const authMiddleware = require('../middlewares/auth');

router.post('/', authMiddleware(), feedingController.confirmFeeding);

module.exports = router;
