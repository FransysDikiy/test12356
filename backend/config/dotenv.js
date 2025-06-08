const dotenv = require("dotenv");

dotenv.config();

module.exports = {
    HTTP_PORT: process.env.HTTP_PORT || 5000,
    HTTP_HOST: process.env.HTTP_HOST || "127.0.0.1",
    MQTT_PORT: process.env.MQTT_PORT || 1884,
    MQTT_HOST: process.env.MQTT_HOST || "127.0.0.1",
    NODE_ENV: process.env.NODE_ENV || "development",
    MONGO_URI: process.env.MONGO_URI,
    SESSION_SECRET: process.env.SESSION_SECRET,
    JWT_SECRET: process.env.JWT_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
    EMAIL_USERNAME: process.env.EMAIL_USERNAME,
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
};