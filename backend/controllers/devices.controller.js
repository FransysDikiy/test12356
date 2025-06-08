const Device = require('../models/Device');
const { success, created, fail } = require('../utils/response');

const registerDevice = async (req, res) => {
    try {
        const device = await Device.create({
            ...req.body,
            owner: req.user.id,
        });
        return created(res, device, 'Device registered');
    } catch (err) {
        console.error(err)
        return fail(res, 500, 'Failed to register device');
    }
};

const getMyDevices = async (req, res) => {
    try {
        const devices = await Device.find({ owner: req.user.id });
        return success(res, devices, 'Devices loaded');
    } catch (err) {
        return fail(res, 500, 'Failed to load devices');
    }
};

const deleteDevices = async (req, res) => {
    try {
        const deleted = await Device.findOneAndDelete({
            _id: req.params.id,
            owner: req.user.id,
        });
        if (!deleted) return fail(res, 404, 'Device not found');
        return success(res, deleted, 'Device deleted');
    } catch (err) {
        return fail(res, 500, 'Failed to delete device');
    }
};

const getDeviceById = async (req, res) => {
    try {
        const device = await Device.findOne({
            _id: req.params.id,
            owner: req.user.id
        });

        if (!device) return fail(res, 404, 'Device not found');
        return success(res, device, 'Device loaded');
    } catch (err) {
        return fail(res, 500, 'Failed to load device');
    }
};

const updateDevice = async (req, res) => {
    try {
        const updated = await Device.findOneAndUpdate(
            { _id: req.params.id, owner: req.user.id },
            req.body,
            { new: true }
        );
        if (!updated) return fail(res, 404, 'Device not found');
        return success(res, updated, 'Device updated');
    } catch (err) {
        return fail(res, 500, 'Failed to update device');
    }
};


module.exports = {
    registerDevice,
    getMyDevices,
    deleteDevices,
    getDeviceById,
    updateDevice
};
