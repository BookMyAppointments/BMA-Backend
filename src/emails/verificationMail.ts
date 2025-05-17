import { EmailResult } from "../types/email";
import { transporter } from "../utils/nodemailer";
import { passwordResetTemplate, verificationEmailTemplate } from "./templates/auth.templates";

export const sendVerificationEmail = async (email: string, code: string, type : string): Promise<EmailResult> => {
    try {
        await transporter.verify();
        const username = email.split('@')[0];

        const info = await transporter.sendMail({
            from: `"Your App Name" <${process.env.EMAIL}>`,
            to: email,
            subject: 'Email Verification Code',
            html: type == 'signup' ? verificationEmailTemplate(code) : passwordResetTemplate(username, code),
            text: `Your verification code is: ${code}\n\nThis code will expire in 1 hour.`
        });

        console.log('Message sent: %s', info.messageId);
        return { success: true };
    } catch (error) {
        console.error('Email sending error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to send email'
        };
    }
};
