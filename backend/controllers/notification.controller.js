const Notification = require("../models/Notification");

exports.getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .populate("pet", "name");
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const notif = await Notification.findOne({ _id: req.params.id, user: req.user._id });
        if (!notif) return res.status(404).json({ error: "Notification not found" });

        notif.read = true;
        await notif.save();

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to update notification" });
    }
};

exports.clearExpired = async (req, res) => {
    const threshold = new Date(Date.now() - 30 * 60 * 1000);
    try {
        const result = await Notification.deleteMany({
            user: req.user._id,
            read: true,
            createdAt: { $lte: threshold },
        });
        res.json({ deleted: result.deletedCount });
    } catch (error) {
        res.status(500).json({ error: "Failed to clear expired notifications" });
    }
};
