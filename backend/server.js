const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const passport = require('./config/passportConfig');
const session = require('express-session');
const cors = require('cors');
const config = require('./config/dotenv');
const errorHandler = require('./middlewares/errorHandler');
const userRoutes = require('./routes/users.routes');
const petRoutes = require('./routes/pets.routes');
const reminderRoutes = require('./routes/reminders.routes');
const reminderLogsRoutes = require('./routes/reminderLogs.routes');
const deviceRoutes = require('./routes/devices.routes');
const cron = require('node-cron');
const { runScheduledReminders, recoverMissedNotifications } = require('./services/scheduler.service');
const feedingRoutes = require('./routes/feeding.routes');
const WsGatewayFactory = require("./gateways/ws/WsGatewayFactory")
const MqttGatewayFactory = require("./gateways/mqtt/MqttGatewayFactory")
const notificationRoutes = require('./routes/notification.routes');
const RemindersSchedulerService = require("./services/reminder.scheduler.service")


// init services
require("./services/device.service")
require("./services/notification.service")
require("./services/reminderlog.service")

const app = express();

connectDB();

app.use(cors({
    origin: config.CLIENT_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.options('*', cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use(
    session({
        secret: config.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
    })
);
app.use(passport.initialize());
app.use(passport.session());
app.use('/api/users', userRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/feeding', feedingRoutes);
app.use('/api/reminder-logs', reminderLogsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use(errorHandler)

let server;
if (config.NODE_ENV !== "test") {
    server = app.listen(config.HTTP_PORT, config.HTTP_HOST, () => {
        const address = server.address()
        console.log(`HTTP Server: running on ${address.address}:${address.port}`)
    });  
    server.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
            console.error(`HTTP Server: port ${port} is already in use.`)
          } else {
            console.error("HTTP Server: errored:", err)
          }
          process.exit(1)
    });  
    WsGatewayFactory.create(server)
    console.log("Initializing WebSocket gateways");
    MqttGatewayFactory.create(config.MQTT_PORT, config.MQTT_HOST)
    recoverMissedNotifications()
}

cron.schedule('* * * * *', runScheduledReminders);
RemindersSchedulerService.startReminderScheduler()

module.exports = { app, server };