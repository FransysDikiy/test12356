const RemindersService = require("../../../services/reminder.service")
const DeviceModel = require("../../../models/Device")
const ReminderLogModel = require("../../../models/ReminderLog")
const DevicesService = require("../../../services/device.service")

module.exports = class RemindersMqttGateway {
  #broker
  constructor(broker) {
    this.#broker = broker
    this.#broker.subscribe("test", this.#test.bind(this))
    this.#broker.subscribe("device/+/connect", this.#connected.bind(this))
    this.#broker.subscribe("device/+/button/press", this.#buttonPressed.bind(this))
    RemindersService.events.on("reminder.created", this.#reminderCreated.bind(this))
    RemindersService.events.on("reminder.updated", this.#reminderUpdated.bind(this))
    RemindersService.events.on("reminder.scheduled", this.#reminderScheduled.bind(this))
  }
  #test(req) {
    this.#broker.publish({
      clientId: req.clientId,
      topic: `test/response`,
      payload: req.payload,
      qos: 2
    })
  }
  async #connected(req) {
    const topicParts = req.topic.split("/")
    const deviceId = topicParts[1]
    const clientId = req.clientId
    const device = await DeviceModel.findOne({ serialNumber: deviceId })
    if (!device) {
        await DeviceModel.create({
          serialNumber: deviceId,
          lastMqttClientId: clientId,
        })
    } else {
        device.lastMqttClientId = clientId
        await device.save()
    }
    const reminder = await RemindersService.findFirstActiveReminder(deviceId)
    if (reminder) {
      this.#broker.publish({
        clientId: clientId,
        topic: `device/${deviceId}/buzzer/buzz`,
        payload: reminder._id.toString(),
        qos: 2
      })
    }
  }
  async #buttonPressed(req) {
    const topicParts = req.topic.split("/")
    const deviceId = topicParts[1]
    const clientId = req.clientId
    const reminderId = req.payload
    if (!reminderId) { return }
    const isReminderActive = await RemindersService.isReminderActive(reminderId)
    if (!isReminderActive) { return }
    const existingLog = await ReminderLogModel.findOne({ reminder: reminderId })
    if (!existingLog) {
      await ReminderLogModel.create({
        reminder: reminderId,
        status: "completed",
        executedAt: new Date()
      })
    } else {
      existingLog.status = "completed"
      existingLog.executedAt = new Date()
      await existingLog.save()
    }
    const reminder = await RemindersService.findFirstActiveReminder(deviceId)
    if (reminder) {
      this.#broker.publish({
        clientId: clientId,
        topic: `device/${deviceId}/buzzer/buzz`,
        payload: reminder._id.toString(),
        qos: 2
      })
    }
  }
  async #reminderCreated(reminder) {
    const isReminderActive = await RemindersService.isReminderActive(reminder._id.toString())
    const device = await DevicesService.getDeviceByReminderId(reminder._id.toString())
    if (!device) { return }
    const clientId = device.lastMqttClientId
    if (!isReminderActive || !clientId) { return }
    this.#broker.publish({
        clientId: clientId,
        topic: `device/${deviceId}/buzzer/buzz`,
        payload: reminder._id.toString(),
        qos: 2
    })
  }
  async #reminderUpdated(reminder) {
    const isReminderActive = await RemindersService.isReminderActive(reminder._id.toString())
    const device = await DevicesService.getDeviceByReminderId(reminder._id.toString())
    if (!device) { return }
    const clientId = device.lastMqttClientId
    if (!isReminderActive || !clientId) { return }
    this.#broker.publish({
        clientId: clientId,
        topic: `device/${deviceId}/buzzer/buzz`,
        payload: reminder._id.toString(),
        qos: 2
    })
  }
  async #reminderScheduled(reminder) {
    console.log(reminder)
    const device = await DevicesService.getDeviceByReminderId(reminder._id.toString())
    console.log(device)
    if (!device) { return }
    const clientId = device.lastMqttClientId
    const deviceId = device._id.toString()
    if (!clientId) { return }
    this.#broker.publish({
        clientId: clientId,
        topic: `device/${deviceId}/buzzer/buzz`,
        payload: reminder._id.toString(),
        qos: 2
    })
  }
}