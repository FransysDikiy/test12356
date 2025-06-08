const mqttPacket = require("mqtt-packet")
const mqttPattern = require("mqtt-pattern")
const { Writable } = require("stream")

module.exports = class MqttClient {
    constructor(socket) {
        this.socket = socket
        this.subscriptions = []
    }
    isSubscribed(topic) {
        return this.subscriptions.some(sub => mqttPattern.matches(sub.topic, topic))
    }
    generateV3Packet(topic, payload, qos, messageId) {
        const packet = {
            cmd: "publish",
            topic,
            payload: payload != null ? Buffer.from(JSON.stringify(payload)) : Buffer.alloc(0),
            qos,
            retain: false,
            dup: false,
        }
        if ((qos === 1 || qos === 2) && messageId !== undefined) {
            packet.messageId = messageId
        }
        this.socket.write(mqttPacket.generate(packet))
        console.log("MQTT Broker:", "MQTT v3 publish packet written successfully (QoS " + qos + ")")
    }
    generateV4Packet(topic, payload, qos, messageId) {
        this.generateV3Packet(topic, payload, qos, messageId)
    }
    generateV5Packet(topic, payload, qos, messageId) {
        const chunks = []
        const writable = new Writable({
            write(chunk, encoding, callback) {
                chunks.push(chunk)
                callback()
            }
        })
        writable.on("finish", () => {
            const finalPacket = Buffer.concat(chunks)
            this.socket.write(finalPacket)
            console.log("MQTT Broker:", "MQTT v5 publish packet written successfully (QoS " + qos + ")")
        })
        const packet = {
            cmd: "publish",
            topic,
            payload: payload != null ? Buffer.from(JSON.stringify(payload)) : Buffer.alloc(0),
            retain: false,
            dup: false,
            properties: {
                contentType: "application/json"
            }
        }
        if ((qos === 1 || qos === 2) && messageId !== undefined) {
            packet.messageId = messageId
        }
        mqttPacket.writeToStream(packet, writable, { protocolVersion: 5 })
        writable.end()
    }
    write(topic, payload, qos = 0, messageId) {
        const mqttVersionPacketGenerators = {
            3: this.generateV3Packet.bind(this),
            4: this.generateV4Packet.bind(this),
            5: this.generateV5Packet.bind(this),
          }          
        try {
            const mqttVersion = this.socket.mqttVersion
            const mqttPacketGenerator = mqttVersionPacketGenerators[mqttVersion]
            if (mqttPacketGenerator) {
                mqttPacketGenerator(topic, payload, qos, messageId)
            } else {
                console.error("MQTT Broker:", "unsupported MQTT version:", mqttVersion)
            }
        } catch (err) {
            console.error("MQTT Broker:", "failed to write MQTT publish packet,", err)
        }
    }
}