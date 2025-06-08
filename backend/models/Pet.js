const mongoose = require("mongoose");

const PetSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    species: { type: String, required: true },

    ageValue: { type: Number, min: 0 },
    ageUnit: { type: String, enum: ["day", "month", "year"] },

    weightValue: { type: Number, min: 0 },
    weightUnit: { type: String, enum: ["kg", "gr"] },

    device: { type: mongoose.Schema.Types.ObjectId, ref: "Device" },
    portions: { type: Number, default: 0, min: 0 }
}, { timestamps: true });


module.exports = mongoose.model("Pet", PetSchema);
