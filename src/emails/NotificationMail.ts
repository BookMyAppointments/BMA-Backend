import { EmailResult } from "../types/email";
import { NotificationParams } from "../types/notification";
import { getEmailSubject, getHtmlContent, getPlainTextContent } from "../utils/EmailMapping";
import { transporter } from "../utils/nodemailer";

export const sendNotificationEmail = async (params: NotificationParams): Promise<EmailResult> => {
    try {
        await transporter.verify();

        const subject = getEmailSubject(params);
        const htmlContent = getHtmlContent(params);
        const textContent = getPlainTextContent(params);

        const info = await transporter.sendMail({
            from: `"${process.env.APP_NAME}" <${process.env.EMAIL}>`,
            to: params.email,
            subject: subject,
            html: htmlContent,
            text: textContent
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