"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const mail_1 = require("../config/mail");
const sendEmail = async ({ to, subject, html }) => {
    await mail_1.mailTransporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
    });
};
exports.sendEmail = sendEmail;
