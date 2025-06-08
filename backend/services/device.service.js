const EventsEmitter = require("events")
const ReminderModel = require("../models/Reminder")

module.exports = class DeviceService {
    static events = new EventsEmitter()
    static startBuzzer(deviceId) {
        this.events.emit("startBuzzer", deviceId)
    }
    static async getDeviceByReminderId(reminderId) {
        const reminder = await ReminderModel.findById(reminderId).populate({
            path: "pet",
            populate: { path: "device" }
        })
        if (!reminder?.pet?.device?._id) { return }
        return reminder.pet.device
    }
}