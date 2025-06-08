module.exports = class WsGateway {
    #handleConnection
    #handleDisconnect
    #messageHandlers = new Map()
    constructor(wss) {
        wss.on("connection", async (ws, req) => {
            ws.on("message", async (message) => {
                let data
                try {
                    data = JSON.parse(message)
                } catch (err) {
                    return ws.send(JSON.stringify({ type: "error", message: "Invalid JSON" }))
                }
                const messageHandler = this.#messageHandlers.get(data.type)
                if (messageHandler) {
                    try {
                        await messageHandler(ws, data)
                    } catch (err) {
                        ws.send(JSON.stringify({ type: "error", message: err.message }))
                    }
                } else {
                    ws.send(JSON.stringify({ type: "error", message: `Unknown type: ${data.type}` }))
                }
            })
            ws.on("close", async () => {
                await this.#handleDisconnect?.(ws)
            })
            await this.#handleConnection?.(ws, req)
        })
    }
    onConnection(handler) {
        this.#handleConnection = handler
    }
    onDisconnect(handler) {
        this.#handleDisconnect = handler
    }
    subscribeMessage(messageType, handler) {
        this.#messageHandlers.set(messageType, handler)
    }
}