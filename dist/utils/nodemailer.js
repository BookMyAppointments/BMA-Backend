"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transporter = void 0;
const nodemailer = require('nodemailer');
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    tls: {
        ciphers: "SSLv3",
    },
    secure: false,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
    },
});
