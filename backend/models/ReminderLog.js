const mongoose = require("mongoose");

const ReminderLogSchema = new mongoose.Schema({
    reminder: { type: mongoose.Schema.Types.ObjectId, ref: "Reminder", required: true },
    status: { type: String, enum: ["notified", "completed", "missed"], required: true },
    executedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model("ReminderLog", ReminderLogSchema);