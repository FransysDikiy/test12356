const MqttBroker = require("./mqtt-broker/MqttBroker")
const DevicesMqttGateway = require("./gateways/DevicesMqttGateway.js")
const TestingMqttGateway = require("./gateways/TestingMqttGateway.js")

module.exports = class MqttGatewayFactory {
    static create(port, host) {
        const broker = new MqttBroker(port, host)
        new TestingMqttGateway(broker) 
        new DevicesMqttGateway(broker)
    }
}