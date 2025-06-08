const NotificationsWsGateway = require("./gateways/NotificationsWsGateway")

module.exports = class WsGatewayFactory {
    static #handleHttpServerUpgrade(httpServer, wsGatewaysMap) {
        httpServer.on("upgrade", (req, socket, head) => {
            const pathname = new URL(req.url, `http://${req.headers.host}`).pathname
            const wsGateway = wsGatewaysMap.get(pathname)
            if (!wsGateway) {
                socket.destroy()
                return
            }
            wsGateway.wss.handleUpgrade(req, socket, head, (ws) => {
                wsGateway.wss.emit("connection", ws, req)
            })
        })
    }
    static create(httpServer) {
        const wsGatewaysMap = new Map()
        wsGatewaysMap.set("/notifications", new NotificationsWsGateway())
        this.#handleHttpServerUpgrade(httpServer, wsGatewaysMap)
    }
}