const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const controller = require("../controllers/notification.controller");

router.use(authMiddleware());

router.get("/", controller.getMyNotifications);
router.patch("/:id", controller.markAsRead);
router.delete("/expired", controller.clearExpired);

router.post("/test", async (req, res) => {
    const Notification = require("../models/Notification");
    try {
        const notif = await Notification.create({
            user: req.user._id,
            pet: req.body.petId || req.user._id,
            message: req.body.message || "Test notification",
            read: false,
        });
        res.json(notif);
    } catch (err) {
        res.status(500).json({ error: "Failed to create test notification" });
    }
});


module.exports = router;