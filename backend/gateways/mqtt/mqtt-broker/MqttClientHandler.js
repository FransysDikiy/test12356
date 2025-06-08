const mqttPacket = require("mqtt-packet")
const MqttPacketHandler = require("./MqttPacketHandler")

module.exports = class MqttClientHandler {
    #broker
    #socket
    #parser
    constructor(broker, socket) {
        this.#broker = broker
        this.#socket = socket
        this.#parser = mqttPacket.parser()
        this.#parser.on("packet", this.#onPacket.bind(this))
        this.#parser.on("error", this.#onError.bind(this))
        this.#socket.on("data", this.#onData.bind(this))
        this.#socket.on("close", this.#onClose.bind(this))
    }
    #onData(chunk) {
        this.#parser.parse(chunk)
    }
    #onPacket(packet) {
        const mqttPacketHandler = new MqttPacketHandler(this.#broker, this.#socket, packet)
        const packetCmds = {
            "connect": mqttPacketHandler.connect,
            "subscribe": mqttPacketHandler.subscribe,
            "unsubscribe": mqttPacketHandler.unsubscribe,
            "publish": mqttPacketHandler.publish,
            "pingreq": mqttPacketHandler.pingreq,
            "pubrel": mqttPacketHandler.pubrel,
            "disconnect": mqttPacketHandler.disconnect
        }
        const packetHandler = packetCmds[packet.cmd]
        if (packetHandler) {
            packetHandler.call(mqttPacketHandler)
        }
    }
    #onError(err) {
        console.error("MQTT Broker:", "parser error,", err)
        this.#socket.destroy()
    }
    #onClose() {
        const clientId = this.#socket.clientId
        if (clientId) {
            this.#broker.clients.delete(clientId)
        }
    }
}