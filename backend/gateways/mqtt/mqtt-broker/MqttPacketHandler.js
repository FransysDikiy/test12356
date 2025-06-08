const MqttClient = require("./MqttClient")
const mqttPacket = require("mqtt-packet")

module.exports = class MqttPacketHandler {
    #broker
    #socket
    #packet
    #topic
    constructor(broker, socket, packet) {
        this.#broker = broker
        this.#socket = socket
        this.#packet = packet
        this.#topic = packet.topic?.trim()
    }
    connect() {
        this.#socket.mqttVersion = this.#packet.protocolVersion
        this.#socket.clientId = this.#packet.clientId
        this.#socket.username = this.#packet.username
        this.#socket.password = this.#packet.password
        this.#broker.clients.set(this.#socket.clientId, new MqttClient(this.#socket))
        this.#socket.write(
            mqttPacket.generate({
                cmd: "connack",
                returnCode: 0,
                sessionPresent: false,
            })
        )
        console.log("MQTT Broker:", "client connected with clientId", this.#socket.clientId, "with protocol version",  this.#socket.mqttVersion)
    }
    publish() {
        const handlers = this.#broker.getHandlersByTopic(this.#topic)
        if (handlers.length === 0) { return }
        const rawPayload = this.#packet.payload
        const contentType = this.#packet.properties?.contentType
        let parsed
        try {
            const payloadStr = Buffer.isBuffer(rawPayload) ? rawPayload.toString() : rawPayload
            if (contentType === "application/json" || (typeof payloadStr === "string" && payloadStr.trim().startsWith("{"))) {
                parsed = JSON.parse(payloadStr)
            } else if (contentType?.startsWith("text/")) {
                parsed = payloadStr
            } else {
                parsed = Buffer.isBuffer(rawPayload) ? rawPayload.toString() : rawPayload
            }
        } catch (err) {
            console.warn("MQTT Broker:", "invalid payload on", this.#topic, "from", this.#socket.clientId)
            return
        }
        console.log("MQTT Broker:", "client sent request to topic", this.#topic, "with payload", parsed)
        const req = {
            topic: this.#topic,
            payload: parsed,
            clientId: this.#socket.clientId,
            qos: this.#packet.qos,
            messageId: this.#packet.messageId,
            properties: this.#packet.properties
        }
        for (const handler of handlers) {
            handler(req)
        }
        if (req.qos === 1 && req.messageId) {
            this.#socket.write(mqttPacket.generate({ cmd: "puback", messageId: req.messageId }))
        }
        if (req.qos === 2 && req.messageId) {
            this.#socket.write(mqttPacket.generate({ cmd: "pubrec", messageId: req.messageId }))
        }
    }
    subscribe() {
        const client = this.#broker.clients.get(this.#socket.clientId)
        const newSubscriptions = this.#packet.subscriptions
        const updatedSubscriptions = client.subscriptions.filter(existing =>
            !newSubscriptions.some(newSub => newSub.topic === existing.topic)
        )
        client.subscriptions =  [...updatedSubscriptions, ...newSubscriptions]
        const grants = (newSubscriptions || []).map(() => 0)
        this.#socket.write(
          mqttPacket.generate({
            cmd: "suback",
            messageId: this.#packet.messageId,
            granted: grants,
          })
        )
        console.log("MQTT Broker:", "client", this.#socket.clientId, "subscribed to", newSubscriptions.map(subscription => subscription.topic))
    }
    unsubscribe() {
        const client = this.#broker.clients.get(this.#socket.clientId)
        const unsubscriptions  = this.#packet.unsubscriptions 
        client.subscriptions = client.subscriptions.filter(
            subscription => !unsubscriptions.includes(subscription.topic)
        )
        this.#socket.write(
            mqttPacket.generate({
                cmd: "unsuback",
                messageId: this.#packet.messageId
            })
        )
        console.log("MQTT Broker:", "client", this.#socket.clientId, "unsubscribed from", unsubscriptions)
    }
    pingreq() {
        this.#socket.write(mqttPacket.generate({ cmd: "pingresp" }))
    }
    pubrel() {
        const messageId = this.#packet.messageId
        if (!messageId) return
        this.#socket.write(
            mqttPacket.generate({
                cmd: "pubcomp",
                messageId
            })
        )
        console.log("MQTT Broker:", "PUBREL received, sent PUBCOMP for messageId", messageId)
    }    
    disconnect() {
        this.#socket.end()
        console.log("MQTT Broker:", "client disconnected with clientId", this.#socket.clientId)
    }
}