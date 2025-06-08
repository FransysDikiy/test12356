const User = require("../models/User")
const { EventEmitter } = require("events")
const { sendEmail } = require('../services/email.service');


class NotificationService {
    static #userSocketsMap = new Map()
    static events = new EventEmitter()
    static waitForSocketConnection(userId, timeout = 5000) {
        userId = userId.toString();
        return new Promise((resolve) => {
            const check = () => {
                const sockets = this.#userSocketsMap.get(userId);
                if (sockets && sockets.size > 0) {
                    return resolve();
                }
                if (timeout <= 0) return resolve();
                setTimeout(() => {
                    timeout -= 200;
                    check();
                }, 200);
            };
            check();
        });
    }
    static async sendNotification(userId, uiMessage, petId, emailMessage = null) {
        userId = userId.toString();

        await this.waitForSocketConnection(userId);

        this.events.emit("notification.created", userId, { message: uiMessage, petId });

        try {
            const Notification = require("../models/Notification");
            await Notification.create({
                user: userId,
                pet: petId,
                message: uiMessage,
                read: false,
            });
        } catch (err) {
            console.error("Failed to save notification to DB:", err.message);
        }

        // send email
        const user = await User.findById(userId);
        if (!user || !user.email) return;

        try {
            await sendEmail(user.email, 'Pet Feeding Reminder', emailMessage || uiMessage);
        } catch (error) {
            console.error(`Failed to send email to ${user.email}:`, error.message);
        }
    }

    static addSocket(userId, ws) {
        if (!this.#userSocketsMap.has(userId)) {
            this.#userSocketsMap.set(userId, new Set())
            this.events.emit("userAdded", userId)
        }
        this.#userSocketsMap.get(userId).add(ws)
    }
    static removeSocket(userId, ws) {
        const sockets = this.#userSocketsMap.get(userId)
        if (sockets) {
            sockets.delete(ws)
            if (sockets.size === 0) {
                this.#userSocketsMap.delete(userId)
                this.events.emit("userRemoved", userId)
            }
        }
    }
    static getSocketIds(userId) {
        return this.#userSocketsMap.get(userId) || new Set()
    }
    static sendFeedingReminder(userId, petName, petId) {
        const baseUrl = process.env.CLIENT_ORIGIN || "http://localhost:3000";
        const link = `${baseUrl}/pets?petId=${petId}`;
        const emailMessage = `Time to feed ${petName}. View details: ${link}`;
        const uiMessage = `Time to feed ${petName}`;
        return NotificationService.sendNotification(userId, uiMessage, petId, emailMessage);
    }
    static sendMissedFeedingWarning(userId, petName, petId) {
        const baseUrl = process.env.CLIENT_ORIGIN || "http://localhost:3000";
        const link = `${baseUrl}/pets?petId=${petId}`;
        const uiMessage = `Feeding for ${petName} was missed!`;
        const emailMessage = `${uiMessage} View details: ${link}`;
        return NotificationService.sendNotification(userId, uiMessage, petId, emailMessage);
    }

    static sendLowFoodLevelAlert(userId, petName, petId) {
        const baseUrl = process.env.CLIENT_ORIGIN || "http://localhost:3000";
        const link = `${baseUrl}/pets?petId=${petId}`;
        const uiMessage = `Food for ${petName} is critically low!!`;
        const emailMessage = `${uiMessage} View details: ${link}`;
        return NotificationService.sendNotification(userId, uiMessage, petId, emailMessage);
    }

}

module.exports = NotificationService