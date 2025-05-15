"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificationEmailTemplate = exports.sendVerificationEmail = void 0;
const nodemailer_1 = require("../utils/nodemailer");
const sendVerificationEmail = async (email, code) => {
    try {
        await nodemailer_1.transporter.verify();
        const info = await nodemailer_1.transporter.sendMail({
            from: `"Your App Name" <${process.env.EMAIL_FROM}>`,
            to: email,
            subject: 'Email Verification Code',
            html: (0, exports.verificationEmailTemplate)(code),
            text: `Your verification code is: ${code}\n\nThis code will expire in 1 hour.`
        });
        console.log('Message sent: %s', info.messageId);
        return { success: true };
    }
    catch (error) {
        console.error('Email sending error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to send email'
        };
    }
};
exports.sendVerificationEmail = sendVerificationEmail;
const verificationEmailTemplate = (code) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 10px; text-align: center; }
        .content { padding: 20px; }
        .code { 
            font-size: 24px; 
            font-weight: bold; 
            text-align: center; 
            margin: 20px 0;
            padding: 10px;
            background-color: #f4f4f4;
            border-radius: 5px;
        }
        .footer { margin-top: 20px; font-size: 12px; text-align: center; color: #777; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Email Verification</h1>
        </div>
        <div class="content">
            <p>Thank you for registering with our service. Please use the following verification code to complete your registration:</p>
            <div class="code">${code}</div>
            <p>This code will expire in 1 hour. If you didn't request this, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;
exports.verificationEmailTemplate = verificationEmailTemplate;
