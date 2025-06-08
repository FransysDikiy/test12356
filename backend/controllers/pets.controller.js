const Pet = require("../models/Pet");
const {success, created, fail} = require("../utils/response");
const Reminder = require("../models/Reminder");
const ReminderLog = require("../models/ReminderLog");
const Device = require('../models/Device');


const createPet = async (req, res) => {
    try {
        const {
            name,
            species,
            ageValue,
            ageUnit,
            weightValue,
            weightUnit,
            device,
            portions = 0
        } = req.body;

        let deviceRef = null;
        if (device) {
            const foundDevice = await Device.findOne({ _id: device, owner: req.user.id });
            if (!foundDevice) return fail(res, 403, 'Device not found or not yours');

            const alreadyAssigned = await Pet.findOne({ device });
            if (alreadyAssigned) return fail(res, 409, 'Device already assigned to another pet');

            deviceRef = device;
        }

        const pet = await Pet.create({
            owner: req.user.id,
            name,
            species,
            ageValue,
            ageUnit,
            weightValue,
            weightUnit,
            device: deviceRef,
            portions
        });

        return created(res, pet, "Pet created successfully");
    } catch (err) {
        console.error("Failed to create pet:", err.message);
        return fail(res, 500, 'Failed to create pet');
    }
};



const getPets = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const pets = await Pet.find({ owner: req.user.id })
            .limit(limit)
            .skip((page - 1) * limit)
            .exec();
        const count = await Pet.countDocuments({ owner: req.user.id });

        return success(res, {
            pets,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (err) {
        return fail(res, 500, 'Failed to load pets');
    }
};

const updatePet = async (req, res) => {
    try {
        const {
            name,
            species,
            ageValue,
            ageUnit,
            weightValue,
            weightUnit,
            device,
            portions,
        } = req.body;

        const pet = await Pet.findOne({ _id: req.params.id, owner: req.user.id });
        if (!pet) return fail(res, 404, 'Pet not found');

        if (name) pet.name = name;
        if (species) pet.species = species;
        if (typeof ageValue === 'number') pet.ageValue = ageValue;
        if (ageUnit) pet.ageUnit = ageUnit;
        if (typeof weightValue === 'number') pet.weightValue = weightValue;
        if (weightUnit) pet.weightUnit = weightUnit;
        if (typeof portions === 'number') pet.portions = portions;

        if (device) {
            const foundDevice = await Device.findOne({ _id: device, owner: req.user.id });
            if (!foundDevice) return fail(res, 403, 'Device not found or not yours');

            const alreadyAssigned = await Pet.findOne({ device, _id: { $ne: pet._id } });
            if (alreadyAssigned) return fail(res, 409, 'Device already assigned to another pet');

            pet.device = device;
        }

        await pet.save();
        return success(res, pet, 'Pet updated successfully');
    } catch (err) {
        return fail(res, 500, err.message, 'Failed to update pet');
    }
};

const deletePet = async (req, res) => {
    try {
        const pet = await Pet.findOne({ _id: req.params.id, owner: req.user.id });
        if (!pet) return fail(res, 404, 'Pet not found');

        const reminders = await Reminder.find({ pet: pet._id });
        const reminderIds = reminders.map(r => r._id);

        await ReminderLog.deleteMany({ reminder: { $in: reminderIds } });

        await Reminder.deleteMany({ pet: pet._id });

        await Pet.findByIdAndDelete(pet._id);

        return success(res, null, 'Pet and related reminders deleted');
    } catch (err) {
        console.error("Failed to delete pet:", err.message);
        return fail(res, 500, 'Failed to delete pet');
    }

};

const getPetById = async (req, res) => {
    try {
        const pet = await Pet.findOne({ _id: req.params.id, owner: req.user.id });
        if (!pet) return fail(res, 404, 'Pet not found');
        return success(res, pet);
    } catch (err) {
        return fail(res, 500, 'Failed to load pet');
    }
}
module.exports = { createPet, getPets, updatePet, deletePet, getPetById };
