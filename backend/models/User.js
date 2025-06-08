const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    role: { type: String, default: 'User' },
    googleId: { type: String },
    googleTokens: {
        access_token: String,
        refresh_token: String,
        expiry_date: Number,
    },
    lastLoggedOutAt: {type: Date, default: null},
    avatar: { type: String },
    devices: [{ type: mongoose.Schema.Types.ObjectId, ref: "Device" }],
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);