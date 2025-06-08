const mongoose = require("mongoose");

const DeviceSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    serialNumber: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true },
    lastSynced: { type: Date, default: Date.now },
    lastMqttClientId: { type: String, default: null}
}, { timestamps: true });

module.exports = mongoose.model("Device", DeviceSchema);