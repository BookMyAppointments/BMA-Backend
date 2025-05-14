// src/emails/emailService.ts
import nodemailer from 'nodemailer';
import { env } from '../utils/env';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: any[];
}

interface EmailResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: env.EMAIL_PORT,
  secure: env.EMAIL_USE_SSL,
  auth: {
    user: env.EMAIL_USERNAME,
    pass: env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
  pool: true, // Use pooled connections
  maxConnections: 5, // Max parallel connections
  rateDelta: 1000, // Rate limit delay in ms
  rateLimit: 5, // Max messages per rateDelta
});

/**
 * Core email sending function
 * @param options Email sending options
 * @returns Promise with send result
 */
export const sendEmail = async (options: EmailOptions): Promise<EmailResult> => {
  try {
    // Verify connection first
    await transporter.verify();

    // Prepare email options
    const mailOptions = {
      from: `"${env.EMAIL_FROM_NAME || 'App Team'}" <${env.EMAIL_FROM}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>?/gm, ''),
      attachments: options.attachments || [],
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('Email sending error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
};

/**
 * Test email connection
 */
export const testEmailConnection = async (): Promise<void> => {
  try {
    await transporter.verify();
    console.log('✅ Email server connection verified');
  } catch (error) {
    console.error('❌ Email server connection failed:', error);
    throw error;
  }
};

/**
 * Generate a beautiful HTML email template
 * @param title Email title
 * @param content Main content HTML
 * @param action Optional action button
 * @returns Complete HTML email
 */
export const generateEmailTemplate = (
  title: string,
  content: string,
  action?: { text: string; url: string }
): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .header {
      background-color: #4f46e5;
      color: white;
      padding: 25px;
      text-align: center;
    }
    .content {
      padding: 30px;
    }
    .footer {
      background-color: #f9fafb;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #4f46e5;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
      margin: 20px 0;
    }
    .code {
      font-size: 24px;
      font-weight: bold;
      text-align: center;
      margin: 25px 0;
      padding: 15px;
      background-color: #e0e7ff;
      color: #4f46e5;
      border-radius: 6px;
      letter-spacing: 2px;
    }
    .divider {
      border-top: 1px solid #e5e7eb;
      margin: 25px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${title}</h1>
    </div>
    <div class="content">
      ${content}
      ${action ? `<a href="${action.url}" class="button">${action.text}</a>` : ''}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${env.APP_NAME || 'Our Service'}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Send a test email
 */
export const sendTestEmail = async (to: string): Promise<EmailResult> => {
  const html = generateEmailTemplate(
    'Test Email',
    `
    <p>This is a test email sent from our application.</p>
    <p>If you received this email, your email service is configured correctly.</p>
    `
  );

  return sendEmail({
    to,
    subject: 'Test Email',
    html,
  });
};