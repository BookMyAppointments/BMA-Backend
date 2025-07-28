import { EmailResult } from "../types/email";
import { ContactParams } from "../types/contact";
import { getContactEmailSubject, getContactHtmlContent, getContactPlainTextContent } from "./templates/contact.templates";
import { transporter } from "../utils/nodemailer";

export const sendContactEmail = async (params: ContactParams): Promise<EmailResult> => {
    try {
        await transporter.verify();

        const subject = getContactEmailSubject(params);
        const htmlContent = getContactHtmlContent(params);
        const textContent = getContactPlainTextContent(params);

        const adminEmail = process.env.ADMIN_EMAIL || 'ankushsingh.dev@gmail.com';

        const info = await transporter.sendMail({
            from: `"${process.env.APP_NAME}" <${process.env.EMAIL}>`,
            to: adminEmail,
            subject: subject,
            html: htmlContent,
            text: textContent
        });

        console.log('Contact form message sent: %s', info.messageId);
        return { success: true };
    } catch (error) {
        console.error('Contact email sending error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to send contact email'
        };
    }
};


// Optional: Send confirmation email to user
export const sendContactConfirmation = async (params: ContactParams): Promise<EmailResult> => {
    try {
        const confirmationHtml = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <style>
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; }
                  .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                  .content { background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-radius: 0 0 5px 5px; }
                  .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 12px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>Thank You for Contacting Us!</h1>
                  </div>
                  <div class="content">
                    <p>Hi <strong>${params.name}</strong>,</p>
                    <p>We have received your message and will get back to you as soon as possible.</p>
                    <p><strong>Subject:</strong> ${params.subject}</p>
                    <p>Our support team typically responds within 24 hours during business days.</p>
                  </div>
                  <div class="footer">
                    <p>This is an automated confirmation email.</p>
                    <p>&copy; ${new Date().getFullYear()} ${process.env.APP_NAME}. All rights reserved.</p>
                  </div>
                </div>
              </body>
            </html>
        `;

        await transporter.sendMail({
            from: `"${process.env.APP_NAME}" <${process.env.EMAIL}>`,
            to: params.email,
            subject: 'Message Received - Thank You for Contacting Us',
            html: confirmationHtml
        });

        return { success: true };
    } catch (error) {
        console.error('Contact confirmation email error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to send confirmation' };
    }
};