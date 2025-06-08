const net = require("net")
const MqttClientHandler = require("./MqttClientHandler")
const mqttPattern = require("mqtt-pattern")
const assert = require("assert")

module.exports = class MqttBroker {
  #nextMessageId = 1
  constructor(port, host) {
    assert(port !== undefined, "MQTT Broker: port must be defined")
    assert(host !== undefined, "MQTT Broker: host must be defined")
    this.clients = new Map()
    this.topics = []
    this.retainedMessages = new Map()
    this.pendingQoS1 = new Map()
    this.server = net.createServer((socket) => new MqttClientHandler(this, socket))
    this.server.listen(port, host, () => {
      const address = this.server.address()
      console.log(`MQTT Broker: running on ${address.address}:${address.port}`)
    })
    this.server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(`MQTT Broker: port ${port} is already in use.`)
      } else {
        console.error("MQTT Broker: server error:", err)
      }
      process.exit(1)
    })
  }

  getNextMessageId() {
    const id = this.#nextMessageId++
    if (this.#nextMessageId > 65535) {
      this.#nextMessageId = 1
    }
    return id
  }

  getHandlersByTopic(topic) {
    const matched = []
    for (const { topic: pattern, handler } of this.topics) {
      if (mqttPattern.matches(pattern, topic)) {
        matched.push(handler)
      }
    }
    return matched
  }

  subscribe(topic, handler) {
    this.topics.push({ topic, handler })
  }

  retain(topic, payload) {
    this.retainedMessages.set(topic, payload)
  }

  getRetained(topic) {
    for (const [retainedTopic, payload] of this.retainedMessages.entries()) {
      if (mqttPattern.matches(retainedTopic, topic)) {
        return payload
      }
    }
    return undefined
  }

  publish({ topic, payload, qos = 0, retain = false }) {
    try {
      if (retain) {
        this.retain(topic, payload)
      }
      console.log("MQTT Broker:", "publishing...", { topic, payload })
      for (const [clientId, client] of this.clients.entries()) {
        const matching = client.subscriptions.some(sub => mqttPattern.matches(sub.topic, topic))
        if (!matching) continue
        try {
          const messageId = (qos === 1 || qos === 2) ? this.getNextMessageId() : undefined
          client.write(topic, payload, qos, messageId)
          if (qos === 1 && messageId) {
            const key = `${clientId}:${messageId}`
            this.pendingQoS1.set(key, {
              topic,
              payload,
              qos,
              clientId,
              messageId,
              retries: 0
            })
            setTimeout(() => this.retryQoS1(key), 5000)
          }
        } catch (err) {
          console.warn(`MQTT Broker: failed to deliver to ${clientId}`, err)
        }
      }
    } catch (err) {
      console.error("MQTT Broker:", "error while broker.publish()", err)
    }
  }

  confirmQoS1(clientId, messageId) {
    const key = `${clientId}:${messageId}`
    this.pendingQoS1.delete(key)
  }

  retryQoS1(key) {
    const entry = this.pendingQoS1.get(key)
    if (!entry) return
    const client = this.clients.get(entry.clientId)
    if (!client) {
      this.pendingQoS1.delete(key)
      return
    }
    if (entry.retries >= 3) {
      console.warn("MQTT Broker: QoS1 retry limit exceeded for", key)
      this.pendingQoS1.delete(key)
      return
    }
    console.log("MQTT Broker: retrying QoS1 message for", key)
    entry.retries++
    client.write(entry.topic, entry.payload, entry.qos, entry.messageId)
    setTimeout(() => this.retryQoS1(key), 5000)
  }
}