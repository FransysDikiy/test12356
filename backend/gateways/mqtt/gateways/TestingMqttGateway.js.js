module.exports = class TestingMqttGateway {
  #broker
  constructor(broker) {
    this.#broker = broker
    this.#broker.subscribe("test", this.#test.bind(this))
  }
  #test(req) {
    this.#broker.publish({
        clientId: req.clientId,
        topic: `test/response`,
        payload: req.payload,
        qos: 2
    })
  }
}