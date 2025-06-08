const jwt = require("jsonwebtoken")
const User = require("../../../models/User")
const NotificationService = require("../../../services/notification.service")
const WsGateway = require("../WsGateway")
const WebSocket = require("ws")
const url = require("url")

module.exports = class NotificationWsGateway {
    #clients = new Map()
    #notificationService = NotificationService
    constructor() {
        this.wss = new WebSocket.Server({ noServer: true })
        this.WsGateway = new WsGateway(this.wss)
        this.WsGateway.onConnection(this.#onConnection.bind(this))
        this.WsGateway.onDisconnect(this.#onDisconnect.bind(this))
        this.#notificationService.events.on("notification.created", this.#notificationCreated.bind(this))
    }
    async #onConnection(ws, req) {
        const parsedUrl = url.parse(req.url, true)
        const token = parsedUrl.query.token
        if (!token) {
            ws.send(JSON.stringify({ type: "error", message: "Missing or invalid Authorization header" }))
            return ws.close()
        }
        let decoded
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET)
        } catch (err) {
            ws.send(JSON.stringify({ type: "error", message: "Invalid or expired token" }))
            return ws.close()
        }
        const user = await User.findById(decoded.id)
        if (!user) {
            ws.send(JSON.stringify({ type: "error", message: "User not found" }))
            return ws.close()
        }
        const userId = user._id.toString()
        this.#clients.set(ws, userId)
        this.#notificationService.addSocket(userId, ws)
        ws.send(JSON.stringify({ type: "connected", userId }))
    }
    async #onDisconnect(ws) {
        const userId = this.#clients.get(ws)
        if (userId) {
            this.#notificationService.removeSocket(userId, ws)
        }
        this.#clients.delete(ws)
    }
    #notificationCreated(userId, message) {
        const sockets = this.#notificationService.getSocketIds(userId)
        for (const ws of sockets) {
            try {
                ws.send(JSON.stringify({ type: "notification", message }))
            } catch (err) {
                ws.terminate()
            }
        }
    }
}