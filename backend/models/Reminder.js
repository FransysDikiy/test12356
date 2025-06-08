const mongoose = require("mongoose");

const ReminderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    pet: { type: mongoose.Schema.Types.ObjectId, ref: "Pet", required: true },
    time: { type: String, required: true },
    repeat: { type: String, enum: ["daily", "weekly", "custom"], default: "daily" },
    customDays: [{ type: Number }],
    isActive: { type: Boolean, default: true },
    syncWithGoogle: { type: Boolean, default: false },
    lastExecutedAt: Date,
    googleCalendarEventId: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("Reminder", ReminderSchema);