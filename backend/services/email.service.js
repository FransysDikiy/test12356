const nodemailer = require('nodemailer');
const config = require('../config/dotenv');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: config.EMAIL_USERNAME,
        pass: config.EMAIL_PASSWORD,
    },
    tls: {
        rejectUnauthorized: false,
    },
});

const sendEmail = async (to, subject, text) => {
    try {
        await transporter.sendMail({
            from: `"Pet Reminder" <${process.env.EMAIL_USERNAME}>`,
            to,
            subject,
            text,
        });

        console.log(`Email sent to ${to}: ${subject}`);
    } catch (error) {
        console.error('Email sending failed:', error.message);
    }
};

module.exports = { sendEmail };
